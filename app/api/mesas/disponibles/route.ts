export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// GET: Get available mesas for a testigo's puesto
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const cedula = searchParams.get('cedula')

        if (!cedula) {
            return NextResponse.json({ exito: false, mensaje: 'Cédula requerida.' })
        }

        const supabase = getServiceClient()
        const cedulaClean = String(cedula).trim()

        // Get testigo's puesto
        const { data: testigo } = await supabase
            .from('testigos')
            .select('municipio, puesto')
            .eq('cedula', cedulaClean)
            .single()

        if (!testigo) {
            return NextResponse.json({ exito: false, mensaje: 'Testigo no encontrado.' })
        }

        // Get total mesas for this puesto
        const { data: puestoData } = await supabase
            .from('municipios')
            .select('mesas')
            .eq('municipio', testigo.municipio)
            .eq('puesto', testigo.puesto)
            .single()

        const totalMesas = puestoData?.mesas || 0

        // Get already claimed mesas for this puesto
        const { data: claimed } = await supabase
            .from('mesa_asignaciones')
            .select('mesa_numero, testigo_cedula')
            .eq('municipio', testigo.municipio)
            .eq('puesto', testigo.puesto)

        const claimedMap: Record<number, string> = {}
        if (claimed) {
            for (const c of claimed) {
                claimedMap[c.mesa_numero] = c.testigo_cedula
            }
        }

        // Build list of all mesas with availability status
        const mesas = []
        for (let i = 1; i <= totalMesas; i++) {
            const owner = claimedMap[i] || null
            mesas.push({
                mesa_numero: i,
                disponible: !owner,
                mia: owner === cedulaClean,
                ocupada_por: owner,
            })
        }

        return NextResponse.json({
            exito: true,
            municipio: testigo.municipio,
            puesto: testigo.puesto,
            totalMesas,
            mesas,
        })
    } catch (error) {
        console.error('Error en mesas/disponibles:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}

// POST: Claim a mesa
export async function POST(request: NextRequest) {
    try {
        const { cedula, mesa_numero } = await request.json()

        if (!cedula || !mesa_numero) {
            return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
        }

        const supabase = getServiceClient()
        const cedulaClean = String(cedula).trim()
        const mesaNum = parseInt(mesa_numero)

        // Get testigo info
        const { data: testigo } = await supabase
            .from('testigos')
            .select('municipio, puesto')
            .eq('cedula', cedulaClean)
            .single()

        if (!testigo) {
            return NextResponse.json({ exito: false, mensaje: 'Testigo no encontrado.' })
        }

        // Check if mesa is already claimed by someone else
        const { data: existing } = await supabase
            .from('mesa_asignaciones')
            .select('testigo_cedula')
            .eq('municipio', testigo.municipio)
            .eq('puesto', testigo.puesto)
            .eq('mesa_numero', mesaNum)
            .single()

        if (existing && existing.testigo_cedula !== cedulaClean) {
            return NextResponse.json({
                exito: false,
                mensaje: 'Esta mesa ya fue tomada por otro testigo.',
            })
        }

        if (existing && existing.testigo_cedula === cedulaClean) {
            return NextResponse.json({
                exito: true,
                mensaje: 'Ya tienes esta mesa asignada.',
            })
        }

        // Claim the mesa
        const { error: asigError } = await supabase
            .from('mesa_asignaciones')
            .insert({
                testigo_cedula: cedulaClean,
                mesa_numero: mesaNum,
                municipio: testigo.municipio,
                puesto: testigo.puesto,
            })

        if (asigError) {
            console.error('Error claiming mesa:', asigError)
            return NextResponse.json({ exito: false, mensaje: 'Error al reservar la mesa.' })
        }

        // Also create a resultados entry for this mesa
        await supabase
            .from('resultados')
            .upsert({
                testigo_cedula: cedulaClean,
                mesa_numero: mesaNum,
                municipio: testigo.municipio,
                puesto: testigo.puesto,
                estado: 'pendiente',
            }, { onConflict: 'testigo_cedula,mesa_numero' })

        return NextResponse.json({
            exito: true,
            mensaje: `Mesa ${mesaNum} reservada exitosamente.`,
        })
    } catch (error) {
        console.error('Error en claim mesa:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
