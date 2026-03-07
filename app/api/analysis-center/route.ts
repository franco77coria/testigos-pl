export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const filtroMunicipio = searchParams.get('municipio') || ''

    // 1. Todas las asignaciones con nombre del testigo
    let asigQuery = supabase
      .from('mesa_asignaciones')
      .select('*, testigos!inner(nombre1, apellido1)')

    if (filtroMunicipio) {
      asigQuery = asigQuery.eq('municipio', filtroMunicipio)
    }

    const { data: asignaciones, error: asigError } = await asigQuery
    if (asigError) throw asigError

    // 2. Todos los resultados (solo campos de cumplimiento, sin votos)
    let resQuery = supabase
      .from('resultados')
      .select(
        'testigo_cedula, mesa_numero, datos_8am_guardados, datos_11am_guardados, datos_1pm_guardados, foto_camara, datos_camara_guardados, foto_senado, datos_senado_guardados, datos_finales_guardados'
      )

    if (filtroMunicipio) {
      resQuery = resQuery.eq('municipio', filtroMunicipio)
    }

    const { data: resultados } = await resQuery

    // Lookup rápido por cedula+mesa
    const resMap: Record<string, any> = {}
    for (const r of (resultados || [])) {
      resMap[`${r.testigo_cedula}__${r.mesa_numero}`] = r
    }

    // 3. Municipios para el filtro
    const { data: allMunicipios } = await supabase
      .from('mesa_asignaciones')
      .select('municipio')

    const municipioSet = new Set<string>()
    allMunicipios?.forEach(m => municipioSet.add(m.municipio))

    // 4. Agrupar por testigo
    const testigosMap: Record<string, {
      cedula: string
      nombre: string
      municipio: string
      puesto: string
      mesas: {
        mesa_numero: number
        conteo_8am: boolean
        conteo_11am: boolean
        conteo_1pm: boolean
        foto_camara: boolean
        datos_camara: boolean
        foto_senado: boolean
        datos_senado: boolean
        completada: boolean
      }[]
    }> = {}

    for (const a of (asignaciones || [])) {
      const cedula = a.testigo_cedula
      const td = (a as any).testigos
      const nombre = td ? `${td.nombre1 || ''} ${td.apellido1 || ''}`.trim() : cedula

      if (!testigosMap[cedula]) {
        testigosMap[cedula] = {
          cedula, nombre,
          municipio: a.municipio,
          puesto: a.puesto,
          mesas: [],
        }
      }

      const r = resMap[`${cedula}__${a.mesa_numero}`]

      testigosMap[cedula].mesas.push({
        mesa_numero: a.mesa_numero,
        conteo_8am: r?.datos_8am_guardados === true,
        conteo_11am: r?.datos_11am_guardados === true,
        conteo_1pm: r?.datos_1pm_guardados === true,
        foto_camara: !!r?.foto_camara,
        datos_camara: r?.datos_camara_guardados === true,
        foto_senado: !!r?.foto_senado,
        datos_senado: r?.datos_senado_guardados === true,
        completada: r?.datos_finales_guardados === true ||
          (r?.datos_camara_guardados === true && r?.datos_senado_guardados === true),
      })
    }

    // 5. Calcular totales por testigo
    const testigos = Object.values(testigosMap).map(t => {
      const totalTareas = t.mesas.length * 7 // 7 tareas por mesa
      const tareasDone = t.mesas.reduce((sum, m) => sum + [
        m.conteo_8am, m.conteo_11am, m.conteo_1pm,
        m.foto_camara, m.datos_camara,
        m.foto_senado, m.datos_senado,
      ].filter(Boolean).length, 0)

      return {
        ...t,
        mesas_completadas: t.mesas.filter(m => m.completada).length,
        total_mesas: t.mesas.length,
        tareas_hechas: tareasDone,
        total_tareas: totalTareas,
        porcentaje: totalTareas > 0 ? Math.round((tareasDone / totalTareas) * 100) : 0,
      }
    })

    // Ordenar: menos cumplimiento primero (los que faltan, arriba)
    testigos.sort((a, b) => a.porcentaje - b.porcentaje)

    return NextResponse.json({
      exito: true,
      testigos,
      municipios: Array.from(municipioSet).sort(),
      resumen: {
        total_testigos: testigos.length,
        testigos_al_dia: testigos.filter(t => t.mesas_completadas === t.total_mesas && t.total_mesas > 0).length,
        total_mesas: testigos.reduce((s, t) => s + t.total_mesas, 0),
        mesas_completadas: testigos.reduce((s, t) => s + t.mesas_completadas, 0),
      },
    })
  } catch (error: any) {
    console.error('Error en analysis center:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error al cargar datos.' }, { status: 500 })
  }
}
