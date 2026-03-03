import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesa_numero, tipo, base64 } = await request.json()

    if (!cedula || !mesa_numero || !tipo || !base64) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    if (tipo !== 'camara' && tipo !== 'senado') {
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
    const updateField = tipo === 'camara' ? 'foto_camara' : 'foto_senado'
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
      const tieneTodo =
        resultado.cantidad_votantes_mesa != null &&
        resultado.votantes_10am != null &&
        resultado.votantes_1pm != null &&
        resultado.votos_alex_p != null &&
        resultado.votos_camara_cun_pl != null &&
        resultado.votos_oscar_sanchez_senado != null &&
        resultado.votos_senado_pl != null &&
        resultado.foto_camara &&
        resultado.foto_senado

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
