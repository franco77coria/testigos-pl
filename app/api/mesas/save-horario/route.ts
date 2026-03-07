import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { cedula, mesa_numero, franja, votantes } = await request.json()

        if (!cedula || !mesa_numero || !franja || votantes == null) {
            return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
        }

        const franjasValidas = ['8am', '11am', '1pm']
        if (!franjasValidas.includes(franja)) {
            return NextResponse.json({ exito: false, mensaje: 'Franja horaria inválida.' })
        }

        const supabase = getServiceClient()

        // Verificar que la mesa existe
        const { data: resultado, error } = await supabase
            .from('resultados')
            .select('*')
            .eq('testigo_cedula', String(cedula).trim())
            .eq('mesa_numero', mesa_numero)
            .single()

        if (error || !resultado) {
            return NextResponse.json({ exito: false, mensaje: 'Mesa no encontrada.' })
        }

        // Verificar que no se haya guardado ya (una sola vez)
        const flagField = `datos_${franja}_guardados`
        if (resultado[flagField] === true) {
            return NextResponse.json({ exito: false, mensaje: `El conteo de las ${franja} ya fue registrado. No se puede modificar.` })
        }

        // Verificar secuencia: no puedes guardar 11am sin haber guardado 8am, etc.
        if (franja === '11am' && !resultado.datos_8am_guardados) {
            return NextResponse.json({ exito: false, mensaje: 'Primero debe registrar el conteo de las 8:00 AM.' })
        }
        if (franja === '1pm' && !resultado.datos_11am_guardados) {
            return NextResponse.json({ exito: false, mensaje: 'Primero debe registrar el conteo de las 11:00 AM.' })
        }

        // Guardar el dato y marcar como guardado
        const votantesField = `votantes_${franja}`
        const updateData: Record<string, unknown> = {
            [votantesField]: typeof votantes === 'number' ? votantes : parseInt(votantes) || 0,
            [flagField]: true,
            updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
            .from('resultados')
            .update(updateData)
            .eq('testigo_cedula', String(cedula).trim())
            .eq('mesa_numero', mesa_numero)

        if (updateError) {
            console.error('Error guardando conteo horario:', updateError)
            return NextResponse.json({ exito: false, mensaje: 'Error al guardar.' })
        }

        return NextResponse.json({
            exito: true,
            mensaje: `Conteo de las ${franja} para Mesa ${mesa_numero} guardado.`,
        })
    } catch (error) {
        console.error('Error guardando conteo horario:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
