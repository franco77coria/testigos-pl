export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/**
 * GET /api/lider/mesas-disponibles
 * - Sin params: devuelve municipios con sus puestos
 * - Con municipio + puesto: devuelve mesas disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const municipio = searchParams.get('municipio')
    const puesto = searchParams.get('puesto')

    // Si no hay municipio, devolver lista de municipios/puestos
    if (!municipio) {
      const { data, error } = await supabase
        .from('municipios')
        .select('municipio, puesto, mesas')
        .order('municipio')

      if (error) throw error

      // Agrupar por municipio
      const municipiosMap: Record<string, { municipio: string; puestos: { puesto: string; total_mesas: number }[] }> = {}
      for (const row of data || []) {
        if (!municipiosMap[row.municipio]) {
          municipiosMap[row.municipio] = { municipio: row.municipio, puestos: [] }
        }
        municipiosMap[row.municipio].puestos.push({
          puesto: row.puesto,
          total_mesas: row.mesas,
        })
      }

      return NextResponse.json({
        exito: true,
        municipios: Object.values(municipiosMap),
      })
    }

    // Con municipio + puesto: devolver mesas disponibles
    if (!puesto) {
      return NextResponse.json({ exito: false, mensaje: 'Puesto requerido.' })
    }

    // Total de mesas para este puesto
    const { data: puestoData } = await supabase
      .from('municipios')
      .select('mesas')
      .eq('municipio', municipio)
      .eq('puesto', puesto)
      .single()

    const totalMesas = puestoData?.mesas || 0

    // Mesas ya asignadas
    const { data: asignadas } = await supabase
      .from('mesa_asignaciones')
      .select('mesa_numero')
      .eq('municipio', municipio)
      .eq('puesto', puesto)
      .limit(10000)

    const ocupadas = new Set((asignadas || []).map(a => a.mesa_numero))

    // Generar lista de mesas disponibles
    const disponibles: number[] = []
    for (let i = 1; i <= totalMesas; i++) {
      if (!ocupadas.has(i)) {
        disponibles.push(i)
      }
    }

    return NextResponse.json({
      exito: true,
      municipio,
      puesto,
      total_mesas: totalMesas,
      disponibles,
    })
  } catch (error) {
    console.error('Error en lider/mesas-disponibles:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
