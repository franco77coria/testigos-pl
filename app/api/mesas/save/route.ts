import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesa_numero, datos } = await request.json()

    if (!cedula || !mesa_numero || !datos) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const supabase = getServiceClient()

    // Verificar que la mesa existe para este testigo
    const { data: resultado, error } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)
      .single()

    if (error || !resultado) {
      return NextResponse.json({ exito: false, mensaje: 'Mesa no encontrada.' })
    }

    // Verificar que no se hayan guardado ya los datos finales (una sola vez)
    if (resultado.datos_finales_guardados === true) {
      return NextResponse.json({ exito: false, mensaje: 'Los resultados finales ya fueron registrados. No se pueden modificar.' })
    }

    // Construir update con todos los campos numericos y validacion
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      confirmacion_e14: datos.confirmacion_e14 === true,
      datos_finales_guardados: true, // Marcar como guardado (una sola vez)
    }

    // Camara
    CAMARA_CANDIDATOS.forEach(c => { updateData[c.code] = typeof datos[c.code] === 'number' ? datos[c.code] : 0 })
    updateData.votos_camara_partido = typeof datos.votos_camara_partido === 'number' ? datos.votos_camara_partido : 0

    // Senado
    SENADO_CANDIDATOS.forEach(c => { updateData[c.code] = typeof datos[c.code] === 'number' ? datos[c.code] : 0 })
    updateData.votos_senado_partido = typeof datos.votos_senado_partido === 'number' ? datos.votos_senado_partido : 0

    // Datos finales guardados = siempre completada
    updateData.estado = 'completada'

    const { error: updateError } = await supabase
      .from('resultados')
      .update(updateData)
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)

    if (updateError) {
      console.error('Error actualizando:', updateError)
      return NextResponse.json({ exito: false, mensaje: 'Error al guardar.' })
    }

    return NextResponse.json({
      exito: true,
      mensaje: `Resultados de Mesa ${mesa_numero} guardados.`,
    })
  } catch (error) {
    console.error('Error guardando mesa:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
