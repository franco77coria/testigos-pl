export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, fetchAllRows } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const cedulaAnalista = searchParams.get('cedula_analista') || ''
    const cedulaLider = searchParams.get('cedula_lider') || ''

    // Si hay cedula_lider → drill-down a testigos de ese lider
    if (cedulaLider) {
      return await getTestigosDelLider(supabase, cedulaLider)
    }

    // Vista principal: lista de lideres para este analista
    // Si no hay cedula_analista, devolver todos (para super admin)
    const testigosFilters = cedulaAnalista ? { eq: { cedula_analista: cedulaAnalista } } : undefined
    const testigosData = await fetchAllRows(
      supabase, 'testigos',
      'cedula, nombre_completo, celular, correo, municipio, puesto, cedula_lider',
      testigosFilters
    )
    if (testigosData.length === 0) {
      return NextResponse.json({
        exito: true,
        lideres: [],
        resumen: { total_lideres: 0, total_testigos: 0, total_mesas: 0, mesas_completadas: 0 },
      })
    }

    // Obtener info de lideres
    const cedulasLideres = [...new Set(testigosData.map(t => t.cedula_lider).filter(Boolean))]
    const { data: lideresData } = await supabase
      .from('lideres')
      .select('cedula, nombre, telefono')
      .in('cedula', cedulasLideres)
      .limit(10000)

    const lideresInfo: Record<string, { nombre: string; telefono: string | null }> = {}
    for (const l of (lideresData || [])) {
      lideresInfo[l.cedula] = { nombre: l.nombre, telefono: l.telefono }
    }

    // Obtener asignaciones para todos los testigos (batched)
    const cedulasTestigos = testigosData.map(t => t.cedula as string)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asignaciones: any[] = []
    for (let i = 0; i < cedulasTestigos.length; i += 500) {
      const batch = cedulasTestigos.slice(i, i + 500)
      const { data } = await supabase
        .from('mesa_asignaciones')
        .select('testigo_cedula, mesa_numero')
        .in('testigo_cedula', batch)
        .limit(10000)
      if (data) asignaciones.push(...data)
    }

    // Obtener resultados (solo flags, batched)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultados: any[] = []
    for (let i = 0; i < cedulasTestigos.length; i += 500) {
      const batch = cedulasTestigos.slice(i, i + 500)
      const { data } = await supabase
        .from('resultados')
        .select('testigo_cedula, mesa_numero, datos_camara_guardados, datos_senado_guardados, datos_finales_guardados')
        .in('testigo_cedula', batch)
        .limit(10000)
      if (data) resultados.push(...data)
    }

    const resMap: Record<string, any> = {}
    for (const r of resultados) {
      resMap[`${r.testigo_cedula}__${r.mesa_numero}`] = r
    }

    // Contar mesas por testigo
    const testigoMesas: Record<string, { total: number; completadas: number; numeros: number[] }> = {}
    for (const a of asignaciones) {
      if (!testigoMesas[a.testigo_cedula]) {
        testigoMesas[a.testigo_cedula] = { total: 0, completadas: 0, numeros: [] }
      }
      testigoMesas[a.testigo_cedula].total++
      testigoMesas[a.testigo_cedula].numeros.push(a.mesa_numero)
      const r = resMap[`${a.testigo_cedula}__${a.mesa_numero}`]
      if (r?.datos_finales_guardados === true || (r?.datos_camara_guardados === true && r?.datos_senado_guardados === true)) {
        testigoMesas[a.testigo_cedula].completadas++
      }
    }

    // Agrupar por lider
    const lideresAgg: Record<string, {
      cedula: string
      nombre: string
      telefono: string | null
      total_testigos: number
      total_mesas: number
      mesas_completadas: number
      mesa_numeros: number[]
    }> = {}

    for (const t of testigosData) {
      const cl = t.cedula_lider || 'SIN_LIDER'
      if (!lideresAgg[cl]) {
        const info = lideresInfo[cl]
        lideresAgg[cl] = {
          cedula: cl,
          nombre: info?.nombre || cl,
          telefono: info?.telefono || null,
          total_testigos: 0,
          total_mesas: 0,
          mesas_completadas: 0,
          mesa_numeros: [],
        }
      }
      lideresAgg[cl].total_testigos++
      const tm = testigoMesas[t.cedula]
      if (tm) {
        lideresAgg[cl].total_mesas += tm.total
        lideresAgg[cl].mesas_completadas += tm.completadas
        lideresAgg[cl].mesa_numeros.push(...tm.numeros)
      }
    }

    const lideres = Object.values(lideresAgg).map(l => ({
      ...l,
      mesa_numeros: [...new Set(l.mesa_numeros)].sort((a, b) => a - b),
      porcentaje: l.total_mesas > 0 ? Math.round((l.mesas_completadas / l.total_mesas) * 100) : 0,
    }))

    lideres.sort((a, b) => a.porcentaje - b.porcentaje)

    return NextResponse.json({
      exito: true,
      lideres,
      resumen: {
        total_lideres: lideres.length,
        total_testigos: testigosData.length,
        total_mesas: lideres.reduce((s, l) => s + l.total_mesas, 0),
        mesas_completadas: lideres.reduce((s, l) => s + l.mesas_completadas, 0),
      },
    })
  } catch (error: any) {
    console.error('Error en analysis center:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error al cargar datos.' }, { status: 500 })
  }
}

/**
 * Drill-down: retorna testigos de un lider específico con detalle por mesa
 */
async function getTestigosDelLider(supabase: any, cedulaLider: string) {
  // Info del lider
  const { data: lider } = await supabase
    .from('lideres')
    .select('cedula, nombre, telefono')
    .eq('cedula', cedulaLider)
    .single()

  // Testigos de este lider (paginated)
  const testigosData = await fetchAllRows(supabase, 'testigos', 'cedula, nombre_completo, celular, correo, municipio, puesto', { eq: { cedula_lider: cedulaLider } })

  if (testigosData.length === 0) {
    return NextResponse.json({
      exito: true,
      lider: lider || { cedula: cedulaLider, nombre: cedulaLider },
      testigos: [],
      resumen: { total_testigos: 0, total_mesas: 0, mesas_completadas: 0, testigos_al_dia: 0 },
    })
  }

  const cedulasTestigos = testigosData.map((t: any) => t.cedula as string)

  // Batched fetch for asignaciones and resultados
  const asignaciones: any[] = []
  const resultados: any[] = []
  for (let i = 0; i < cedulasTestigos.length; i += 500) {
    const batch = cedulasTestigos.slice(i, i + 500)
    const [asigRes, resRes] = await Promise.all([
      supabase.from('mesa_asignaciones').select('testigo_cedula, mesa_numero, municipio, puesto').in('testigo_cedula', batch).limit(10000),
      supabase.from('resultados').select('testigo_cedula, mesa_numero, datos_8am_guardados, datos_11am_guardados, datos_1pm_guardados, datos_4pm_guardados, foto_camara, datos_camara_guardados, foto_senado, datos_senado_guardados, datos_finales_guardados').in('testigo_cedula', batch).limit(10000),
    ])
    if (asigRes.data) asignaciones.push(...asigRes.data)
    if (resRes.data) resultados.push(...resRes.data)
  }

  const resMap: Record<string, any> = {}
  for (const r of resultados) {
    resMap[`${r.testigo_cedula}__${r.mesa_numero}`] = r
  }

  const testigosMap: Record<string, any> = {}
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

  for (const a of asignaciones) {
    const entry = testigosMap[a.testigo_cedula]
    if (!entry) continue

    const r = resMap[`${a.testigo_cedula}__${a.mesa_numero}`]
    entry.mesas.push({
      mesa_numero: a.mesa_numero,
      conteo_8am: r?.datos_8am_guardados === true,
      conteo_11am: r?.datos_11am_guardados === true,
      conteo_1pm: r?.datos_1pm_guardados === true,
      conteo_4pm: r?.datos_4pm_guardados === true,
      foto_camara: !!r?.foto_camara,
      datos_camara: r?.datos_camara_guardados === true,
      foto_senado: !!r?.foto_senado,
      datos_senado: r?.datos_senado_guardados === true,
      completada: r?.datos_finales_guardados === true ||
        (r?.datos_camara_guardados === true && r?.datos_senado_guardados === true),
    })
  }

  const testigos = Object.values(testigosMap).map((t: any) => {
    const totalTareas = t.mesas.length * 8
    const tareasDone = t.mesas.reduce((sum: number, m: any) => sum + [
      m.conteo_8am, m.conteo_11am, m.conteo_1pm, m.conteo_4pm,
      m.foto_camara, m.datos_camara,
      m.foto_senado, m.datos_senado,
    ].filter(Boolean).length, 0)

    return {
      ...t,
      mesas_completadas: t.mesas.filter((m: any) => m.completada).length,
      total_mesas: t.mesas.length,
      porcentaje: totalTareas > 0 ? Math.round((tareasDone / totalTareas) * 100) : 0,
    }
  })

  testigos.sort((a: any, b: any) => a.porcentaje - b.porcentaje)

  return NextResponse.json({
    exito: true,
    lider: lider || { cedula: cedulaLider, nombre: cedulaLider },
    testigos,
    resumen: {
      total_testigos: testigos.length,
      testigos_al_dia: testigos.filter((t: any) => t.mesas_completadas === t.total_mesas && t.total_mesas > 0).length,
      total_mesas: testigos.reduce((s: number, t: any) => s + t.total_mesas, 0),
      mesas_completadas: testigos.reduce((s: number, t: any) => s + t.mesas_completadas, 0),
    },
  })
}
