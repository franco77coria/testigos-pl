import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { calcularEstado, CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'
import type { MesaDashboard } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesas } = await request.json()

    if (!cedula || !mesas || !Array.isArray(mesas) || mesas.length === 0) {
      return NextResponse.json({ exito: false, mensaje: 'Ingrese al menos una mesa.' })
    }

    const mesasNumeros = mesas
      .map((m: unknown) => parseInt(String(m)))
      .filter((n: number) => !isNaN(n) && n > 0)

    if (mesasNumeros.length === 0) {
      return NextResponse.json({ exito: false, mensaje: 'Los numeros de mesa no son validos.' })
    }

    if (mesasNumeros.length > 10) {
      return NextResponse.json({ exito: false, mensaje: 'Maximo 10 mesas por testigo.' })
    }

    const supabase = getServiceClient()
    const cedulaClean = String(cedula).trim()

    // Verificar que el testigo existe
    const { data: testigo, error: testigoError } = await supabase
      .from('testigos')
      .select('*')
      .eq('cedula', cedulaClean)
      .single()

    if (testigoError || !testigo) {
      return NextResponse.json({ exito: false, mensaje: 'Testigo no encontrado.' })
    }

    // Upsert resultados para cada mesa (ignorar duplicados para re-login seguro)
    const nuevosResultados = mesasNumeros.map((num: number) => ({
      testigo_cedula: cedulaClean,
      mesa_numero: num,
      municipio: testigo.municipio,
      puesto: testigo.puesto,
      estado: 'pendiente',
    }))

    await supabase
      .from('resultados')
      .upsert(nuevosResultados, { onConflict: 'testigo_cedula,mesa_numero', ignoreDuplicates: true })

    // Obtener todos los resultados del testigo (incluye mesas previas si re-login)
    const { data: resultados } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', cedulaClean)
      .order('mesa_numero', { ascending: true })

    const mesasDashboard: MesaDashboard[] = (resultados || []).map((r) => {
      const mesa: any = {
        mesa_numero: r.mesa_numero,
        municipio: r.municipio || testigo.municipio,
        puesto: r.puesto || testigo.puesto,
        foto_camara: r.foto_camara,
        foto_senado: r.foto_senado,
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

    return NextResponse.json({ exito: true, mesas: mesasDashboard })
  } catch (error) {
    console.error('Error en confirmar mesas:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
