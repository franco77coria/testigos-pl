import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { calcularSeccionActiva, calcularEstado } from '@/lib/types'
import type { MesaDashboard } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula } = await request.json()

    if (!cedula || String(cedula).trim() === '') {
      return NextResponse.json({ exito: false, mensaje: 'Ingrese su número de cédula.' })
    }

    const supabase = getServiceClient()
    const cedulaClean = String(cedula).trim()

    // Buscar testigo
    const { data: testigo, error: testigoError } = await supabase
      .from('testigos')
      .select('*')
      .eq('cedula', cedulaClean)
      .single()

    if (testigoError || !testigo) {
      return NextResponse.json({
        exito: false,
        mensaje: 'Cédula no encontrada. Verifique su número o contacte al coordinador.',
      })
    }

    // Buscar asignaciones de mesas
    const { data: asignaciones } = await supabase
      .from('mesa_asignaciones')
      .select('*')
      .eq('testigo_cedula', cedulaClean)
      .order('mesa_numero', { ascending: true })

    if (!asignaciones || asignaciones.length === 0) {
      return NextResponse.json({
        exito: false,
        mensaje: 'No tiene mesas asignadas. Contacte al coordinador.',
      })
    }

    // Buscar o crear resultados para cada mesa
    const { data: resultadosExistentes } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', cedulaClean)

    const resultadosMap = new Map(
      (resultadosExistentes || []).map((r) => [r.mesa_numero, r])
    )

    // Crear resultados faltantes
    const faltantes = asignaciones.filter((a) => !resultadosMap.has(a.mesa_numero))
    if (faltantes.length > 0) {
      const nuevosResultados = faltantes.map((a) => ({
        testigo_cedula: cedulaClean,
        mesa_numero: a.mesa_numero,
        municipio: a.municipio,
        puesto: a.puesto,
        estado: 'pendiente',
      }))
      await supabase.from('resultados').insert(nuevosResultados)
    }

    // Obtener resultados finales
    const { data: resultados } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', cedulaClean)
      .order('mesa_numero', { ascending: true })

    const mesas: MesaDashboard[] = (resultados || []).map((r) => {
      const mesa: MesaDashboard = {
        mesa_numero: r.mesa_numero,
        municipio: r.municipio || testigo.municipio,
        puesto: r.puesto || testigo.puesto,
        cantidad_votantes_mesa: r.cantidad_votantes_mesa,
        votantes_10am: r.votantes_10am,
        votantes_1pm: r.votantes_1pm,
        votos_alex_p: r.votos_alex_p,
        votos_camara_cun_pl: r.votos_camara_cun_pl,
        votos_oscar_sanchez_senado: r.votos_oscar_sanchez_senado,
        votos_senado_pl: r.votos_senado_pl,
        foto_camara: r.foto_camara,
        foto_senado: r.foto_senado,
        estado: r.estado || 'pendiente',
        seccion_activa: 1,
      }
      mesa.seccion_activa = calcularSeccionActiva(mesa)
      mesa.estado = calcularEstado(mesa)
      return mesa
    })

    return NextResponse.json({
      exito: true,
      sesion: {
        cedula: cedulaClean,
        testigo,
        mesas,
      },
    })
  } catch (error) {
    console.error('Error en auth:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
