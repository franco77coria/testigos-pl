import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { calcularSeccionActiva, calcularEstado } from '@/lib/types'
import type { MesaDashboard } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cedula = request.nextUrl.searchParams.get('cedula')

    if (!cedula) {
      return NextResponse.json({ exito: false, mensaje: 'Cédula requerida.' })
    }

    const supabase = getServiceClient()

    const { data: resultados } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', cedula.trim())
      .order('mesa_numero', { ascending: true })

    const mesas: MesaDashboard[] = (resultados || []).map((r) => {
      const mesa: MesaDashboard = {
        mesa_numero: r.mesa_numero,
        municipio: r.municipio || '',
        puesto: r.puesto || '',
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

    return NextResponse.json({ exito: true, mesas })
  } catch (error) {
    console.error('Error obteniendo mesas:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
