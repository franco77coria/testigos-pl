import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { SECCIONES } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula, mesa_numero, seccion, datos } = await request.json()

    if (!cedula || !mesa_numero || !seccion || !datos) {
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

    // Validar cascada: la sección anterior debe estar completa
    if (seccion > 1) {
      const seccionAnterior = SECCIONES.find((s) => s.id === seccion - 1)
      if (seccionAnterior) {
        const camposAnteriores = seccionAnterior.campos
        const faltante = camposAnteriores.some((c) => !resultado[c])
        if (faltante) {
          return NextResponse.json({
            exito: false,
            mensaje: 'Debe completar la sección anterior primero.',
          })
        }
      }
    }

    // Construir update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Solo permitir campos de la sección correspondiente
    const seccionDef = SECCIONES.find((s) => s.id === seccion)
    if (!seccionDef) {
      return NextResponse.json({ exito: false, mensaje: 'Sección inválida.' })
    }

    for (const campo of seccionDef.campos) {
      if (datos[campo] !== undefined) {
        updateData[campo] = parseInt(datos[campo]) || 0
      }
    }

    // Calcular estado
    const merged = { ...resultado, ...updateData }
    const tieneTodo =
      merged.cantidad_votantes_mesa &&
      merged.votantes_10am &&
      merged.votantes_1pm &&
      merged.votos_alex_p != null &&
      merged.votos_camara_cun_pl != null &&
      merged.votos_oscar_sanchez_senado != null &&
      merged.votos_senado_pl != null

    if (tieneTodo && merged.foto_camara && merged.foto_senado) {
      updateData.estado = 'completada'
    } else if (merged.cantidad_votantes_mesa) {
      updateData.estado = 'en_progreso'
    }

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
      mensaje: `Mesa ${mesa_numero} — ${seccionDef.nombre} guardado.`,
    })
  } catch (error) {
    console.error('Error guardando mesa:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
