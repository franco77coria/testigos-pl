import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { calcularEstado, CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'
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
      const mesa: any = {
        mesa_numero: r.mesa_numero,
        municipio: r.municipio || '',
        puesto: r.puesto || '',
        foto_camara: r.foto_camara,
        foto_camara_2: r.foto_camara_2,
        foto_senado: r.foto_senado,
        foto_senado_2: r.foto_senado_2,
        confirmacion_e14: r.confirmacion_e14,
        votos_camara_partido: r.votos_camara_partido,
        votos_senado_partido: r.votos_senado_partido,
        estado: r.estado || 'pendiente',
      }
      CAMARA_CANDIDATOS.forEach(c => { mesa[c.code] = r[c.code] })
      SENADO_CANDIDATOS.forEach(c => { mesa[c.code] = r[c.code] })

      mesa.estado = calcularEstado(mesa as MesaDashboard)
      return mesa as MesaDashboard
    })

    return NextResponse.json({ exito: true, mesas })
  } catch (error) {
    console.error('Error obteniendo mesas:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
