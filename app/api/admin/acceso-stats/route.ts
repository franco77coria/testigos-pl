export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// GET: list people with access
export async function GET() {
    try {
        const supabase = getServiceClient()
        const { data } = await supabase
            .from('estadisticas_acceso')
            .select('*')
            .order('created_at', { ascending: false })

        return NextResponse.json({ exito: true, accesos: data || [] })
    } catch {
        return NextResponse.json({ exito: false }, { status: 500 })
    }
}

// POST: grant access
export async function POST(request: NextRequest) {
    try {
        const { super_cedula, cedula_nueva, nombre } = await request.json()

        const supabase = getServiceClient()

        // Verify requester is super admin
        const { data: admin } = await supabase
            .from('admins')
            .select('es_super')
            .eq('cedula', String(super_cedula).trim())
            .single()

        if (!admin?.es_super) {
            return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede dar acceso.' })
        }

        const { error } = await supabase
            .from('estadisticas_acceso')
            .upsert({
                cedula: String(cedula_nueva).trim(),
                nombre: (nombre || '').trim(),
            }, { onConflict: 'cedula' })

        if (error) {
            return NextResponse.json({ exito: false, mensaje: error.message })
        }

        return NextResponse.json({ exito: true, mensaje: 'Acceso concedido.' })
    } catch {
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}

// DELETE: revoke access
export async function DELETE(request: NextRequest) {
    try {
        const { super_cedula, cedula } = await request.json()

        const supabase = getServiceClient()

        const { data: admin } = await supabase
            .from('admins')
            .select('es_super')
            .eq('cedula', String(super_cedula).trim())
            .single()

        if (!admin?.es_super) {
            return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede revocar acceso.' })
        }

        await supabase
            .from('estadisticas_acceso')
            .delete()
            .eq('cedula', String(cedula).trim())

        return NextResponse.json({ exito: true, mensaje: 'Acceso revocado.' })
    } catch {
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
