import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function cleanCedula(value: string): string {
  return value.replace(/\./g, '').replace(/\s/g, '').trim()
}

export async function POST(request: NextRequest) {
  try {
    const { cedula, forzarTestigo } = await request.json()

    if (!cedula || String(cedula).trim() === '') {
      return NextResponse.json({ exito: false, mensaje: 'Ingrese su número de cédula.' })
    }

    const supabase = getServiceClient()
    const cedulaClean = cleanCedula(String(cedula))

    // Si forzarTestigo, saltar directamente al check de testigo
    if (!forzarTestigo) {
      // ⚡ Queries en PARALELO en lugar de secuenciales
      const [adminRes, analistaRes, liderRes, testigoRes] = await Promise.all([
        supabase.from('admins').select('cedula').eq('cedula', cedulaClean).single(),
        supabase.from('analistas').select('cedula, nombre, telefono').eq('cedula', cedulaClean).single(),
        supabase.from('lideres').select('cedula, nombre, telefono').eq('cedula', cedulaClean).single(),
        supabase.from('testigos').select('*').eq('cedula', cedulaClean).single(),
      ])

      // 1. Es admin?
      if (adminRes.data) {
        return NextResponse.json({
          exito: true,
          esCoordinador: true,
          sesion: { cedula: cedulaClean, esAdmin: true },
        })
      }

      // 2. Es analista?
      if (analistaRes.data) {
        return NextResponse.json({
          exito: true,
          esAnalista: true,
          sesion: { cedula: analistaRes.data.cedula, nombre: analistaRes.data.nombre },
        })
      }

      // 3. Es líder?
      if (liderRes.data) {
        return NextResponse.json({
          exito: true,
          esLider: true,
          tambienEsTestigo: !!testigoRes.data,
          sesion: { cedula: liderRes.data.cedula, nombre: liderRes.data.nombre },
        })
      }

      // 4. Es testigo?
      if (testigoRes.data) {
        return await buildTestigoResponse(supabase, cedulaClean, testigoRes.data)
      }

      // No encontrado en ninguna tabla
      return NextResponse.json({
        exito: false,
        mensaje: 'Cedula no encontrada. Verifique su numero o contacte al coordinador.',
      })
    }

    // forzarTestigo = true: verificar como líder y/o testigo
    const [liderRes, testigoRes] = await Promise.all([
      supabase.from('lideres').select('cedula, nombre, telefono').eq('cedula', cedulaClean).single(),
      supabase.from('testigos').select('*').eq('cedula', cedulaClean).single(),
    ])

    if (liderRes.data && !forzarTestigo) {
      return NextResponse.json({
        exito: true,
        esLider: true,
        tambienEsTestigo: !!testigoRes.data,
        sesion: { cedula: liderRes.data.cedula, nombre: liderRes.data.nombre },
      })
    }

    if (testigoRes.data) {
      return await buildTestigoResponse(supabase, cedulaClean, testigoRes.data)
    }

    return NextResponse.json({
      exito: false,
      mensaje: 'Cedula no encontrada. Verifique su numero o contacte al coordinador.',
    })

  } catch (error) {
    console.error('Error en auth:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}

// Helper para construir la respuesta de testigo con mesas
async function buildTestigoResponse(supabase: ReturnType<typeof getServiceClient>, cedulaClean: string, testigo: any) {
  // ⚡ Asignaciones y resultados en paralelo
  const [asigRes, resRes] = await Promise.all([
    supabase.from('mesa_asignaciones').select('mesa_numero, municipio, puesto').eq('testigo_cedula', cedulaClean).limit(10000),
    supabase.from('resultados').select('*').eq('testigo_cedula', cedulaClean).limit(10000),
  ])

  const asignaciones = asigRes.data || []
  const resultados = resRes.data || []

  const mesas = asignaciones.map(a => {
    const resultado = resultados.find(r => r.mesa_numero === a.mesa_numero) || {}
    return {
      mesa_numero: a.mesa_numero,
      municipio: a.municipio,
      puesto: a.puesto,
      ...resultado,
    }
  })

  return NextResponse.json({
    exito: true,
    esCoordinador: false,
    sesion: {
      cedula: cedulaClean,
      testigo,
      mesas,
    },
  })
}
