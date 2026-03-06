export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { cedula } = await request.json()

        if (!cedula || String(cedula).trim() === '') {
            return NextResponse.json({ exito: false, mensaje: 'Cédula requerida.' })
        }

        const supabase = getServiceClient()
        const cedulaClean = String(cedula).trim()

        // Verify super admin
        const { data: admin } = await supabase
            .from('admins')
            .select('cedula, es_super')
            .eq('cedula', cedulaClean)
            .single()

        if (!admin || !admin.es_super) {
            return NextResponse.json({
                exito: false,
                mensaje: 'Solo el super administrador puede realizar esta acción.',
            })
        }

        // Delete all resultados (vote data + photos)
        const { error: deleteError } = await supabase
            .from('resultados')
            .delete()
            .gte('created_at', '1970-01-01')

        if (deleteError) {
            console.error('Error borrando resultados:', deleteError)
            return NextResponse.json({ exito: false, mensaje: 'Error al borrar los datos.' })
        }

        // Delete all mesa assignments
        const { error: asigError } = await supabase
            .from('mesa_asignaciones')
            .delete()
            .gte('created_at', '1970-01-01')

        if (asigError) {
            console.error('Error borrando asignaciones:', asigError)
            return NextResponse.json({ exito: false, mensaje: 'Resultados borrados, pero error al borrar asignaciones.' })
        }

        // Count remaining to verify
        const { count: remaining } = await supabase
            .from('resultados')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            exito: true,
            mensaje: `Datos de elecciones borrados exitosamente. ${remaining || 0} registros restantes.`,
        })
    } catch (error) {
        console.error('Error en reset:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
