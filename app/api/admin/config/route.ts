import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: Obtener configuración de candidatos senado
export async function GET() {
    try {
        const supabase = getServiceClient()
        const { data, error } = await supabase
            .from('configuracion')
            .select('*')
            .eq('clave', 'senado_candidatos')
            .single()

        if (error || !data) {
            // Return default values
            return NextResponse.json({
                exito: true,
                candidatos: [
                    { code: 'votos_senado_1', title: 'Senado Candidato 1' },
                    { code: 'votos_senado_2', title: 'Senado Candidato 2' },
                    { code: 'votos_senado_3', title: 'Senado Candidato 3' },
                    { code: 'votos_senado_4', title: 'Senado Candidato 4' },
                    { code: 'votos_senado_5', title: 'Senado Candidato 5' },
                ],
            })
        }

        return NextResponse.json({
            exito: true,
            candidatos: JSON.parse(data.valor),
        })
    } catch (error) {
        console.error('Error obteniendo config:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}

// POST: Guardar configuración de candidatos senado
export async function POST(request: NextRequest) {
    try {
        const { candidatos } = await request.json()

        if (!candidatos || !Array.isArray(candidatos) || candidatos.length !== 5) {
            return NextResponse.json({ exito: false, mensaje: 'Debe enviar exactamente 5 candidatos.' })
        }

        const supabase = getServiceClient()

        // Upsert the config
        const { error } = await supabase
            .from('configuracion')
            .upsert(
                { clave: 'senado_candidatos', valor: JSON.stringify(candidatos) },
                { onConflict: 'clave' }
            )

        if (error) {
            console.error('Error guardando config:', error)
            return NextResponse.json({ exito: false, mensaje: error.message })
        }

        return NextResponse.json({
            exito: true,
            mensaje: 'Candidatos de Senado actualizados correctamente.',
        })
    } catch (error) {
        console.error('Error en config POST:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
