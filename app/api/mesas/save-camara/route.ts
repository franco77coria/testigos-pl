import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { CAMARA_CANDIDATOS } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesa_numero, datos } = await request.json()

    if (!cedula || !mesa_numero || !datos) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const supabase = getServiceClient()

    const { data: resultado, error } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)
      .single()

    if (error || !resultado) {
      return NextResponse.json({ exito: false, mensaje: 'Mesa no encontrada.' })
    }

    if (resultado.datos_camara_guardados === true) {
      return NextResponse.json({ exito: false, mensaje: 'Los registros de Cámara ya fueron guardados.' })
    }

    if (!resultado.foto_camara) {
      return NextResponse.json({ exito: false, mensaje: 'Debe subir la foto del acta de Cámara antes de guardar.' })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      datos_camara_guardados: true,
    }

    CAMARA_CANDIDATOS.forEach(c => {
      updateData[c.code] = typeof datos[c.code] === 'number' ? datos[c.code] : 0
    })
    updateData.votos_camara_partido = typeof datos.votos_camara_partido === 'number' ? datos.votos_camara_partido : 0

    // Si Senado ya fue guardado, marcar mesa como completada
    if (resultado.datos_senado_guardados === true) {
      updateData.datos_finales_guardados = true
      updateData.estado = 'completada'
    }

    const { error: updateError } = await supabase
      .from('resultados')
      .update(updateData)
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)

    if (updateError) {
      console.error('Error actualizando cámara:', updateError)
      return NextResponse.json({ exito: false, mensaje: 'Error al guardar.' })
    }

    return NextResponse.json({
      exito: true,
      mensaje: `Registros de Cámara de Mesa ${mesa_numero} guardados.`,
    })
  } catch (error) {
    console.error('Error guardando cámara:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
