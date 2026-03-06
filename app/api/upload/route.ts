import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesa_numero, tipo, base64 } = await request.json()

    if (!cedula || !mesa_numero || !tipo || !base64) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const validTypes = ['camara', 'senado', 'camara_2', 'senado_2']
    if (!validTypes.includes(tipo)) {
      return NextResponse.json({ exito: false, mensaje: 'Tipo de foto inválido.' })
    }

    const supabase = getServiceClient()

    // Decodificar base64
    const cleanBase64 = base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    // Nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${cedula}/${tipo}_mesa${mesa_numero}_${timestamp}.jpg`

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-actas')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error subiendo foto:', uploadError)
      return NextResponse.json({ exito: false, mensaje: 'Error subiendo la foto.' })
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('fotos-actas')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Actualizar resultado con la URL
    const fieldMap: Record<string, string> = {
      camara: 'foto_camara',
      camara_2: 'foto_camara_2',
      senado: 'foto_senado',
      senado_2: 'foto_senado_2',
    }
    const updateField = fieldMap[tipo]
    const { error: updateError } = await supabase
      .from('resultados')
      .update({
        [updateField]: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)

    if (updateError) {
      console.error('Error actualizando URL:', updateError)
    }

    // Check if both photos are now uploaded to mark as completada
    const { data: resultado } = await supabase
      .from('resultados')
      .select('*')
      .eq('testigo_cedula', String(cedula).trim())
      .eq('mesa_numero', mesa_numero)
      .single()

    if (resultado) {
      const tieneVotosCamara = resultado.votos_camara_l101 != null && resultado.votos_camara_partido != null
      const tieneVotosSenado = resultado.votos_senado_1 != null && resultado.votos_senado_partido != null
      const tieneTodo = tieneVotosCamara && tieneVotosSenado &&
        resultado.foto_camara && resultado.foto_senado && resultado.confirmacion_e14

      if (tieneTodo) {
        await supabase
          .from('resultados')
          .update({ estado: 'completada' })
          .eq('testigo_cedula', String(cedula).trim())
          .eq('mesa_numero', mesa_numero)
      }
    }

    return NextResponse.json({
      exito: true,
      url: publicUrl,
      mensaje: 'Foto subida correctamente.',
    })
  } catch (error) {
    console.error('Error en upload:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
