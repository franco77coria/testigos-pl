export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const cedula = searchParams.get('cedula') || ''

    if (!cedula) {
      return NextResponse.json({ exito: false, mensaje: 'Cédula requerida.' })
    }

    const isAll = cedula === '__all__'

    // 1. Verificar que es lider (o modo admin)
    let lider: { cedula: string; nombre: string; telefono: string | null } | null = null

    if (!isAll) {
      const { data } = await supabase
        .from('lideres')
        .select('cedula, nombre, telefono')
        .eq('cedula', cedula)
        .single()

      if (!data) {
        return NextResponse.json({ exito: false, mensaje: 'Líder no encontrado.' })
      }
      lider = data
    } else {
      lider = { cedula: '__all__', nombre: 'Todos', telefono: null }
    }

    // 2. Obtener testigos
    let testigosQuery = supabase
      .from('testigos')
      .select('cedula, nombre_completo, celular, correo, municipio, puesto')
    if (!isAll) {
      testigosQuery = testigosQuery.eq('cedula_lider', cedula)
    }
    const { data: testigosData } = await testigosQuery.limit(10000)

    if (!testigosData || testigosData.length === 0) {
      return NextResponse.json({
        exito: true,
        lider,
        testigos: [],
        resumen: { total_testigos: 0, total_mesas: 0, mesas_completadas: 0, testigos_al_dia: 0 },
      })
    }

    const cedulasTestigos = testigosData.map(t => t.cedula)

    // 3. Obtener asignaciones
    const { data: asignaciones } = await supabase
      .from('mesa_asignaciones')
      .select('testigo_cedula, mesa_numero, municipio, puesto')
      .in('testigo_cedula', cedulasTestigos)
      .limit(10000)

    // 4. Obtener resultados (solo flags, NO votos)
    const { data: resultados } = await supabase
      .from('resultados')
      .select(
        'testigo_cedula, mesa_numero, datos_8am_guardados, datos_11am_guardados, datos_1pm_guardados, foto_camara, datos_camara_guardados, foto_senado, datos_senado_guardados, datos_finales_guardados'
      )
      .in('testigo_cedula', cedulasTestigos)
      .limit(10000)

    // Lookup rápido
    const resMap: Record<string, any> = {}
    for (const r of (resultados || [])) {
      resMap[`${r.testigo_cedula}__${r.mesa_numero}`] = r
    }

    // 5. Agrupar por testigo
    const testigosMap: Record<string, {
      cedula: string
      nombre: string
      celular: string | null
      correo: string | null
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

    // Inicializar desde testigos
    for (const t of testigosData) {
      testigosMap[t.cedula] = {
        cedula: t.cedula,
        nombre: t.nombre_completo,
        celular: t.celular,
        correo: t.correo,
        municipio: t.municipio,
        puesto: t.puesto,
        mesas: [],
      }
    }

    // Agregar mesas desde asignaciones
    for (const a of (asignaciones || [])) {
      const entry = testigosMap[a.testigo_cedula]
      if (!entry) continue

      const r = resMap[`${a.testigo_cedula}__${a.mesa_numero}`]

      entry.mesas.push({
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

    // 6. Calcular totales
    const testigos = Object.values(testigosMap).map(t => {
      const totalTareas = t.mesas.length * 7
      const tareasDone = t.mesas.reduce((sum, m) => sum + [
        m.conteo_8am, m.conteo_11am, m.conteo_1pm,
        m.foto_camara, m.datos_camara,
        m.foto_senado, m.datos_senado,
      ].filter(Boolean).length, 0)

      return {
        ...t,
        mesas_completadas: t.mesas.filter(m => m.completada).length,
        total_mesas: t.mesas.length,
        porcentaje: totalTareas > 0 ? Math.round((tareasDone / totalTareas) * 100) : 0,
      }
    })

    testigos.sort((a, b) => a.porcentaje - b.porcentaje)

    return NextResponse.json({
      exito: true,
      lider,
      testigos,
      resumen: {
        total_testigos: testigos.length,
        testigos_al_dia: testigos.filter(t => t.mesas_completadas === t.total_mesas && t.total_mesas > 0).length,
        total_mesas: testigos.reduce((s, t) => s + t.total_mesas, 0),
        mesas_completadas: testigos.reduce((s, t) => s + t.mesas_completadas, 0),
      },
    })
  } catch (error: any) {
    console.error('Error en lider API:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error al cargar datos.' }, { status: 500 })
  }
}
