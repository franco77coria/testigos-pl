import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cedula } = await request.json()

    if (!cedula || String(cedula).trim() === '') {
      return NextResponse.json({ exito: false, mensaje: 'Ingrese su número de cédula.' })
    }

    const supabase = getServiceClient()
    const cedulaClean = String(cedula).trim()

    // 1. Verificar si es admin
    const { data: admin } = await supabase
      .from('admins')
      .select('cedula')
      .eq('cedula', cedulaClean)
      .single()

    if (admin) {
      return NextResponse.json({
        exito: true,
        esCoordinador: true,
        sesion: { cedula: cedulaClean, esAdmin: true },
      })
    }

    // 2. Buscar testigo — solo retorna ubicacion, sin mesas
    const { data: testigo, error: testigoError } = await supabase
      .from('testigos')
      .select('*')
      .eq('cedula', cedulaClean)
      .single()

    if (testigoError || !testigo) {
      return NextResponse.json({
        exito: false,
        mensaje: 'Cedula no encontrada. Verifique su numero o contacte al coordinador.',
      })
    }

    return NextResponse.json({
      exito: true,
      esCoordinador: false,
      sesion: {
        cedula: cedulaClean,
        testigo,
        mesas: [],
      },
    })
  } catch (error) {
    console.error('Error en auth:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
