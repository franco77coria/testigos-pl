export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const filtroMunicipio = searchParams.get('municipio') || ''

    let query = supabase
      .from('resultados')
      .select('mesa_numero, municipio, puesto, testigo_cedula, foto_camara, foto_camara_2, foto_senado, foto_senado_2')
      .limit(10000)

    if (filtroMunicipio) {
      query = query.eq('municipio', filtroMunicipio)
    }

    const { data: resultados, error } = await query
    if (error) throw error

    // Obtener nombres de testigos
    const cedulas = [...new Set((resultados || []).map(r => r.testigo_cedula))]
    const { data: testigosData } = await supabase
      .from('testigos')
      .select('cedula, nombre_completo')
      .in('cedula', cedulas)

    const nombresMap: Record<string, string> = {}
    for (const t of (testigosData || [])) {
      nombresMap[t.cedula] = t.nombre_completo
    }

    // Municipios para filtro
    const { data: allMunicipios } = await supabase
      .from('mesa_asignaciones')
      .select('municipio')
      .limit(10000)

    const municipioSet = new Set<string>()
    allMunicipios?.forEach(m => municipioSet.add(m.municipio))

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
