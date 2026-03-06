export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const supabase = getServiceClient()

        // Optional filter by municipio
        const { searchParams } = new URL(request.url)
        const filtroMunicipio = searchParams.get('municipio') || ''

        // 1. Get all resultados with testigo info
        let query = supabase
            .from('resultados')
            .select('*')

        if (filtroMunicipio) {
            query = query.eq('municipio', filtroMunicipio)
        }

        const { data: resultados, error } = await query
        if (error) throw error

        // 2. Get all asignaciones to know which mesas exist
        let asigQuery = supabase
            .from('mesa_asignaciones')
            .select('*, testigos!inner(nombre1, apellido1)')

        if (filtroMunicipio) {
            asigQuery = asigQuery.eq('municipio', filtroMunicipio)
        }

        const { data: asignaciones } = await asigQuery

        // 3. Get unique municipios from both sources
        const { data: allMunicipios } = await supabase
            .from('mesa_asignaciones')
            .select('municipio')

        const municipioSet = new Set<string>()
        allMunicipios?.forEach(m => municipioSet.add(m.municipio))

        // 4. Group by municipio > puesto > mesa
        const grouped: Record<string, Record<string, {
            mesa_numero: number
            testigo_nombre: string
            testigo_cedula: string
            votos_camara: boolean
            votos_senado: boolean
            foto_camara: boolean
            foto_senado: boolean
            foto_camara_url: string | null
            foto_senado_url: string | null
            foto_camara_2_url: string | null
            foto_senado_2_url: string | null
            estado: string
            updated_at: string | null
        }[]>> = {}

        // Build from resultados
        if (resultados) {
            for (const r of resultados) {
                const muni = r.municipio || 'SIN MUNICIPIO'
                const puesto = r.puesto || 'SIN PUESTO'

                if (!grouped[muni]) grouped[muni] = {}
                if (!grouped[muni][puesto]) grouped[muni][puesto] = []

                // Check if votes have been filled (any non-zero value)
                const hasCamaraVotes = !!(
                    r.votos_camara_l101 || r.votos_camara_l102 || r.votos_camara_l103 ||
                    r.votos_camara_l104 || r.votos_camara_l105 || r.votos_camara_l106 ||
                    r.votos_camara_l107 || r.votos_camara_partido
                )
                const hasSenadoVotes = !!(
                    r.votos_senado_1 || r.votos_senado_2 || r.votos_senado_3 ||
                    r.votos_senado_4 || r.votos_senado_5 || r.votos_senado_partido
                )

                grouped[muni][puesto].push({
                    mesa_numero: r.mesa_numero,
                    testigo_nombre: '',  // will fill from asignaciones
                    testigo_cedula: r.testigo_cedula,
                    votos_camara: hasCamaraVotes,
                    votos_senado: hasSenadoVotes,
                    foto_camara: !!r.foto_camara,
                    foto_senado: !!r.foto_senado,
                    foto_camara_url: r.foto_camara || null,
                    foto_senado_url: r.foto_senado || null,
                    foto_camara_2_url: r.foto_camara_2 || null,
                    foto_senado_2_url: r.foto_senado_2 || null,
                    estado: r.estado || 'pendiente',
                    updated_at: r.updated_at || r.created_at || null,
                })
            }
        }

        // Fill testigo names from asignaciones
        if (asignaciones) {
            for (const a of asignaciones) {
                const muni = a.municipio || 'SIN MUNICIPIO'
                const puesto = a.puesto || 'SIN PUESTO'
                const testigoData = (a as any).testigos
                const nombre = testigoData
                    ? `${testigoData.nombre1 || ''} ${testigoData.apellido1 || ''}`.trim()
                    : ''

                if (grouped[muni]?.[puesto]) {
                    const mesa = grouped[muni][puesto].find(
                        m => m.mesa_numero === a.mesa_numero && m.testigo_cedula === a.testigo_cedula
                    )
                    if (mesa) {
                        mesa.testigo_nombre = nombre
                    }
                }
            }
        }

        // 5. Build response with stats
        const puestos: {
            municipio: string
            puesto: string
            mesas: typeof grouped[string][string]
            total: number
            completadas: number
        }[] = []

        for (const [muni, puestosMap] of Object.entries(grouped)) {
            for (const [puesto, mesas] of Object.entries(puestosMap)) {
                // Sort mesas by number
                mesas.sort((a, b) => a.mesa_numero - b.mesa_numero)
                puestos.push({
                    municipio: muni,
                    puesto,
                    mesas,
                    total: mesas.length,
                    completadas: mesas.filter(m => m.estado === 'completada').length,
                })
            }
        }

        // Sort by municipio name
        puestos.sort((a, b) => a.municipio.localeCompare(b.municipio))

        return NextResponse.json({
            exito: true,
            puestos,
            municipios: Array.from(municipioSet).sort(),
            resumen: {
                totalMesas: puestos.reduce((s, p) => s + p.total, 0),
                completadas: puestos.reduce((s, p) => s + p.completadas, 0),
                puestos: puestos.length,
            }
        })

    } catch (error: any) {
        console.error('Error en monitor:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error al cargar monitor.' }, { status: 500 })
    }
}
