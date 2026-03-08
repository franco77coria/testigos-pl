export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const CLAVE = 'franjas_habilitadas'
const DEFAULT_FRANJAS = { '8am': true, '11am': false, '1pm': false, '4pm': false, camara: false, senado: false }

// GET: Obtener estado de franjas habilitadas
export async function GET() {
    try {
        const supabase = getServiceClient()
        const { data, error } = await supabase
            .from('configuracion')
            .select('valor')
            .eq('clave', CLAVE)
            .single()

        if (error || !data) {
            return NextResponse.json({ exito: true, franjas: DEFAULT_FRANJAS })
        }

        return NextResponse.json({
            exito: true,
            franjas: JSON.parse(data.valor),
        })
    } catch (error) {
        console.error('Error obteniendo franjas:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}

// POST: Actualizar franjas habilitadas (solo super admin)
export async function POST(request: NextRequest) {
    try {
        const { franjas, cedula } = await request.json()

        if (!cedula) {
            return NextResponse.json({ exito: false, mensaje: 'Cédula requerida.' })
        }

        // Verificar super admin
        const supabase = getServiceClient()
        const { data: admin } = await supabase
            .from('admins')
            .select('cedula, es_super')
            .eq('cedula', String(cedula).trim())
            .single()

        if (!admin || !admin.es_super) {
            return NextResponse.json({ exito: false, mensaje: 'No autorizado.' })
        }

        if (!franjas || typeof franjas !== 'object') {
            return NextResponse.json({ exito: false, mensaje: 'Datos inválidos.' })
        }

        const valor = {
            '8am': franjas['8am'] === true,
            '11am': franjas['11am'] === true,
            '1pm': franjas['1pm'] === true,
            '4pm': franjas['4pm'] === true,
            camara: franjas['camara'] === true,
            senado: franjas['senado'] === true,
        }

        const { error } = await supabase
            .from('configuracion')
            .upsert(
                { clave: CLAVE, valor: JSON.stringify(valor) },
                { onConflict: 'clave' }
            )

        if (error) {
            console.error('Error guardando franjas:', error)
            return NextResponse.json({ exito: false, mensaje: error.message })
        }

        return NextResponse.json({
            exito: true,
            mensaje: 'Franjas horarias actualizadas.',
            franjas: valor,
        })
    } catch (error) {
        console.error('Error en franjas POST:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
