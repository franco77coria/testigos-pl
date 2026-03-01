import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MESAS_POR_TESTIGO_OPTIMO = 4

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()

    // Obtener municipios con su total de mesas
    const { data: municipios } = await supabase
      .from('municipios')
      .select('*')
      .order('municipio')

    if (!municipios || municipios.length === 0) {
      return NextResponse.json({
        exito: false,
        mensaje: 'No hay municipios cargados. Suba el semáforo primero.',
      })
    }

    // Obtener todos los testigos
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

    // Limpiar asignaciones existentes
    await supabase.from('mesa_asignaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Agrupar testigos por municipio y puesto
    const testigosPorMunPuesto = new Map<string, typeof testigos>()
    for (const t of testigos) {
      const key = `${t.municipio}||${t.puesto}`
      if (!testigosPorMunPuesto.has(key)) {
        testigosPorMunPuesto.set(key, [])
      }
      testigosPorMunPuesto.get(key)!.push(t)
    }

    // Crear mapa de mesas totales por municipio
    const mesasPorMunicipio = new Map<string, number>()
    for (const m of municipios) {
      mesasPorMunicipio.set(m.municipio.toUpperCase(), m.mesas)
    }

    const todasAsignaciones: Record<string, unknown>[] = []
    const estadisticas = {
      totalTestigos: 0,
      totalAsignaciones: 0,
      municipiosProcesados: 0,
    }

    // Para cada municipio, distribuir mesas entre puestos/testigos
    const testigosPorMunicipio = new Map<string, typeof testigos>()
    for (const t of testigos) {
      const mun = t.municipio.toUpperCase()
      if (!testigosPorMunicipio.has(mun)) {
        testigosPorMunicipio.set(mun, [])
      }
      testigosPorMunicipio.get(mun)!.push(t)
    }

    for (const [municipio, testigosDelMun] of testigosPorMunicipio) {
      const totalMesas = mesasPorMunicipio.get(municipio) || 0
      if (totalMesas === 0 || testigosDelMun.length === 0) continue

      estadisticas.municipiosProcesados++
      estadisticas.totalTestigos += testigosDelMun.length

      // Calcular cuántas mesas asignar por testigo
      const mesasPorTestigo = Math.max(1, Math.ceil(totalMesas / testigosDelMun.length))

      // Distribuir mesas: numerar del 1 al totalMesas
      let mesaActual = 1

      for (const testigo of testigosDelMun) {
        const mesasAsignadas: number[] = []
        for (let i = 0; i < mesasPorTestigo && mesaActual <= totalMesas; i++) {
          mesasAsignadas.push(mesaActual)
          mesaActual++
        }

        for (const mesaNum of mesasAsignadas) {
          todasAsignaciones.push({
            testigo_cedula: testigo.cedula,
            mesa_numero: mesaNum,
            municipio: testigo.municipio,
            puesto: testigo.puesto,
          })
        }
      }

      // Si quedan mesas sin asignar (más mesas que testigos*mesasPorTestigo),
      // distribuir las restantes round-robin
      if (mesaActual <= totalMesas) {
        let idx = 0
        while (mesaActual <= totalMesas) {
          const testigo = testigosDelMun[idx % testigosDelMun.length]
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

    estadisticas.totalAsignaciones = todasAsignaciones.length

    // Insertar en batches
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

    // También limpiar resultados viejos para re-crearlos al login
    await supabase.from('resultados').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({
      exito: true,
      mensaje: `Asignación completada: ${estadisticas.totalAsignaciones} asignaciones para ${estadisticas.totalTestigos} testigos en ${estadisticas.municipiosProcesados} municipios.`,
      estadisticas,
    })
  } catch (error) {
    console.error('Error en asignación:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
