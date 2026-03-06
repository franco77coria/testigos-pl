export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { cedula } = await request.json()

        if (!cedula || String(cedula).trim() === '') {
            return NextResponse.json({ exito: false, mensaje: 'Ingrese su cédula.' })
        }

        const supabase = getServiceClient()
        const cedulaClean = String(cedula).trim()

        // Check if super admin
        const { data: admin } = await supabase
            .from('admins')
            .select('cedula, es_super')
            .eq('cedula', cedulaClean)
            .single()

        if (admin?.es_super) {
            return NextResponse.json({ exito: true, rol: 'super' })
        }

        // Check if has estadisticas access
        const { data: viewer } = await supabase
            .from('estadisticas_acceso')
            .select('cedula')
            .eq('cedula', cedulaClean)
            .single()

        if (viewer) {
            return NextResponse.json({ exito: true, rol: 'viewer' })
        }

        return NextResponse.json({ exito: false, mensaje: 'No tiene acceso a las estadísticas.' })
    } catch (error) {
        console.error('Error verificando acceso:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
