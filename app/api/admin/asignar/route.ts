import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()

    // 1. Get all puestos with their mesa count (from municipios table / Cundinamarca CSV)
    const { data: puestos } = await supabase
      .from('municipios')
      .select('*')
      .order('municipio, puesto')

    if (!puestos || puestos.length === 0) {
      return NextResponse.json({
        exito: false,
        mensaje: 'No hay puestos cargados. Suba el semáforo municipal primero.',
      })
    }

    // 2. Get all testigos
    const { data: testigos } = await supabase
      .from('testigos')
      .select('*')
      .order('municipio, puesto, cedula')

    if (!testigos || testigos.length === 0) {
      return NextResponse.json({
        exito: false,
        mensaje: 'No hay testigos cargados. Suba el listado primero.',
      })
    }

    // 3. Build a map of puesto -> mesas count
    // Key: "MUNICIPIO||PUESTO" -> mesas count
    const mesasPorPuesto = new Map<string, number>()
    for (const p of puestos) {
      const key = `${(p.municipio || '').toUpperCase().trim()}||${(p.puesto || '').toUpperCase().trim()}`
      mesasPorPuesto.set(key, p.mesas || 0)
    }

    // 4. Group testigos by puesto
    const testigosPorPuesto = new Map<string, typeof testigos>()
    for (const t of testigos) {
      if (!t.cedula) continue // skip empty rows
      const key = `${(t.municipio || '').toUpperCase().trim()}||${(t.puesto || '').toUpperCase().trim()}`
      if (!testigosPorPuesto.has(key)) {
        testigosPorPuesto.set(key, [])
      }
      testigosPorPuesto.get(key)!.push(t)
    }

    // 5. Clean existing assignments and resultados
    await supabase.from('mesa_asignaciones').delete().gte('created_at', '1970-01-01')
    await supabase.from('resultados').delete().gte('created_at', '1970-01-01')

    // 6. Cross-reference: for each puesto, assign all mesas to the testigos
    const todasAsignaciones: Record<string, unknown>[] = []
    const estadisticas = {
      totalTestigos: 0,
      totalAsignaciones: 0,
      puestosProcesados: 0,
      puestosSinTestigos: 0,
      testigosSinPuesto: 0,
    }

    for (const [puestoKey, totalMesas] of mesasPorPuesto) {
      if (totalMesas === 0) continue

      const testigosDelPuesto = testigosPorPuesto.get(puestoKey) || []

      if (testigosDelPuesto.length === 0) {
        estadisticas.puestosSinTestigos++
        continue
      }

      estadisticas.puestosProcesados++
      estadisticas.totalTestigos += testigosDelPuesto.length

      // Distribute mesas among testigos in this puesto
      const mesasPorTestigo = Math.max(1, Math.ceil(totalMesas / testigosDelPuesto.length))
      let mesaActual = 1

      for (const testigo of testigosDelPuesto) {
        for (let i = 0; i < mesasPorTestigo && mesaActual <= totalMesas; i++) {
          todasAsignaciones.push({
            testigo_cedula: testigo.cedula,
            mesa_numero: mesaActual,
            municipio: testigo.municipio,
            puesto: testigo.puesto,
          })
          mesaActual++
        }
      }

      // If mesas remain, distribute round-robin
      if (mesaActual <= totalMesas) {
        let idx = 0
        while (mesaActual <= totalMesas) {
          const testigo = testigosDelPuesto[idx % testigosDelPuesto.length]
          todasAsignaciones.push({
            testigo_cedula: testigo.cedula,
            mesa_numero: mesaActual,
            municipio: testigo.municipio,
            puesto: testigo.puesto,
          })
          mesaActual++
          idx++
        }
      }
    }

    // Check for testigos that don't match any puesto
    for (const [key, testigosGroup] of testigosPorPuesto) {
      if (!mesasPorPuesto.has(key)) {
        estadisticas.testigosSinPuesto += testigosGroup.length
      }
    }

    estadisticas.totalAsignaciones = todasAsignaciones.length

    // 7. Insert in batches
    for (let i = 0; i < todasAsignaciones.length; i += 500) {
      const batch = todasAsignaciones.slice(i, i + 500)
      const { error } = await supabase.from('mesa_asignaciones').insert(batch)
      if (error) {
        console.error('Error insertando asignaciones:', error)
        return NextResponse.json({
          exito: false,
          mensaje: `Error en lote ${i / 500 + 1}: ${error.message}`,
        })
      }
    }

    return NextResponse.json({
      exito: true,
      mensaje: `Asignación completada: ${estadisticas.totalAsignaciones} asignaciones para ${estadisticas.totalTestigos} testigos en ${estadisticas.puestosProcesados} puestos.${estadisticas.puestosSinTestigos > 0 ? ` ⚠️ ${estadisticas.puestosSinTestigos} puestos sin testigos.` : ''}${estadisticas.testigosSinPuesto > 0 ? ` ⚠️ ${estadisticas.testigosSinPuesto} testigos sin puesto válido.` : ''}`,
      estadisticas,
    })
  } catch (error) {
    console.error('Error en asignación:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
