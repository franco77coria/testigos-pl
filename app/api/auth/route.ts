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
    // 3. Check if testigo already has mesa assignments
    const { data: asignaciones } = await supabase
      .from('mesa_asignaciones')
      .select('mesa_numero, municipio, puesto')
      .eq('testigo_cedula', cedulaClean)

    let mesas: any[] = []

    if (asignaciones && asignaciones.length > 0) {
      // Load resultados for assigned mesas
      const mesaNums = asignaciones.map(a => a.mesa_numero)
      const { data: resultados } = await supabase
        .from('resultados')
        .select('*')
        .eq('testigo_cedula', cedulaClean)
        .in('mesa_numero', mesaNums)

      mesas = asignaciones.map(a => {
        const resultado = resultados?.find(r => r.mesa_numero === a.mesa_numero) || {}
        return {
          mesa_numero: a.mesa_numero,
          municipio: a.municipio,
          puesto: a.puesto,
          ...resultado,
        }
      })
    }

    return NextResponse.json({
      exito: true,
      esCoordinador: false,
      sesion: {
        cedula: cedulaClean,
        testigo,
        mesas,
      },
    })
  } catch (error) {
    console.error('Error en auth:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
