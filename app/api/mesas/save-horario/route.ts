import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { cedula, mesa_numero, franja, votantes } = await request.json()

        if (!cedula || !mesa_numero || !franja || votantes == null) {
            return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
        }

        const franjasValidas = ['8am', '11am', '1pm', '4pm']
        if (!franjasValidas.includes(franja)) {
            return NextResponse.json({ exito: false, mensaje: 'Franja horaria inválida.' })
        }

        const supabase = getServiceClient()

        // Verificar configuración de franjas
        const { data: configData } = await supabase
            .from('configuracion')
            .select('valor')
            .eq('clave', 'franjas_habilitadas')
            .single()

        const franjasConfig = configData ? JSON.parse(configData.valor) : { '8am': true, '11am': false, '1pm': false, '4pm': false, senado: false, camara: false }

        // Si votación (senado+camara) está activa, bloquear franjas horarias (excepto 4pm)
        if (franjasConfig.senado === true && franjasConfig.camara === true && franja !== '4pm') {
            return NextResponse.json({ exito: false, mensaje: 'El registro de votación está activo. Las franjas horarias están bloqueadas.' })
        }

        // Verificar si la franja específica está habilitada
        if (!franjasConfig[franja]) {
            return NextResponse.json({ exito: false, mensaje: `El registro de las ${franja} no está habilitado en este momento.` })
        }

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
        // 4pm no requiere dependencia secuencial - se habilita directamente desde el admin

        // Validar que 11am y 1pm no superen los electores habilitados (8am)
        const votantesNum = typeof votantes === 'number' ? votantes : parseInt(votantes) || 0
        if ((franja === '11am' || franja === '1pm') && resultado.votantes_8am != null) {
            if (votantesNum > resultado.votantes_8am) {
                return NextResponse.json({ exito: false, mensaje: `El valor no puede superar los electores habilitados (${resultado.votantes_8am}).` })
            }
        }

        // Guardar el dato y marcar como guardado
        const votantesField = `votantes_${franja}`
        const updateData: Record<string, unknown> = {
            [votantesField]: votantesNum,
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
