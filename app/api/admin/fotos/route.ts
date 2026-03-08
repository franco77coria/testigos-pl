export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, fetchAllRows } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const filtroMunicipio = searchParams.get('municipio') || ''

    const filters = filtroMunicipio ? { eq: { municipio: filtroMunicipio } } : undefined
    const resultados = await fetchAllRows(
      supabase, 'resultados',
      'mesa_numero, municipio, puesto, testigo_cedula, foto_camara, foto_camara_2, foto_senado, foto_senado_2',
      filters
    )

    // Obtener nombres de testigos (paginated by batches of .in())
    const cedulas = [...new Set(resultados.map(r => r.testigo_cedula as string))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testigosData: any[] = []
    for (let i = 0; i < cedulas.length; i += 500) {
      const batch = cedulas.slice(i, i + 500)
      const { data } = await supabase
        .from('testigos')
        .select('cedula, nombre_completo')
        .in('cedula', batch)
        .limit(10000)
      if (data) testigosData.push(...data)
    }

    const nombresMap: Record<string, string> = {}
    for (const t of (testigosData || [])) {
      nombresMap[t.cedula] = t.nombre_completo
    }

    // Municipios para filtro (paginated)
    const allMunicipios = await fetchAllRows(supabase, 'mesa_asignaciones', 'municipio')
    const municipioSet = new Set<string>()
    allMunicipios.forEach(m => municipioSet.add(m.municipio as string))

    const mesas = (resultados || []).map(r => ({
      mesa_numero: r.mesa_numero,
      municipio: r.municipio,
      puesto: r.puesto,
      testigo_cedula: r.testigo_cedula,
      testigo_nombre: nombresMap[r.testigo_cedula] || r.testigo_cedula,
      foto_camara: r.foto_camara || null,
      foto_camara_2: r.foto_camara_2 || null,
      foto_senado: r.foto_senado || null,
      foto_senado_2: r.foto_senado_2 || null,
      tiene_fotos: !!(r.foto_camara || r.foto_senado),
    }))

    mesas.sort((a, b) => a.municipio.localeCompare(b.municipio) || a.mesa_numero - b.mesa_numero)

    const conFoto = mesas.filter(m => m.tiene_fotos).length
    const sinFoto = mesas.length - conFoto

    return NextResponse.json({
      exito: true,
      mesas,
      municipios: Array.from(municipioSet).sort(),
      resumen: { total: mesas.length, con_foto: conFoto, sin_foto: sinFoto },
    })
  } catch (error: any) {
    console.error('Error en fotos API:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error al cargar fotos.' }, { status: 500 })
  }
}
