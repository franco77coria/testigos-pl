import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { cedula_admin, nueva_cedula } = await request.json()

        if (!cedula_admin || !nueva_cedula || String(nueva_cedula).trim() === '') {
            return NextResponse.json({ exito: false, mensaje: 'Datos inválidos.' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // 1. Verify if the requester is actually an admin
        const { data: adminExists } = await supabase
            .from('admins')
            .select('cedula')
            .eq('cedula', String(cedula_admin).trim())
            .single()

        if (!adminExists) {
            return NextResponse.json({ exito: false, mensaje: 'No autorizado.' }, { status: 403 })
        }

        // 2. Insert the new admin
        const nuevaCedulaClean = String(nueva_cedula).trim()

        // Check if already exists
        const { data: alreadyAdmin } = await supabase
            .from('admins')
            .select('cedula')
            .eq('cedula', nuevaCedulaClean)
            .single()

        if (alreadyAdmin) {
            return NextResponse.json({ exito: false, mensaje: 'Esta cédula ya es administradora.' })
        }

        const { error: insertError } = await supabase
            .from('admins')
            .insert([{ cedula: nuevaCedulaClean }])

        if (insertError) {
            console.error('Error insertando admin:', insertError)
            return NextResponse.json({ exito: false, mensaje: 'Error al agregar el administrador.' }, { status: 500 })
        }

        return NextResponse.json({
            exito: true,
            mensaje: `Cédula ${nuevaCedulaClean} agregada como administrador con éxito.`,
        })
    } catch (error) {
        console.error('Error en admin API:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
