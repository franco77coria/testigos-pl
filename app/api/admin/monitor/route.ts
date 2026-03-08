export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const supabase = getServiceClient()

        const { searchParams } = new URL(request.url)
        const filtroMunicipio = searchParams.get('municipio') || ''
        const filtroLider = searchParams.get('cedula_lider') || ''

        // Si filtramos por lider, primero obtener las cedulas de sus testigos
        let cedulasTestigos: string[] | null = null
        if (filtroLider) {
            const { data: testigosLider } = await supabase
                .from('testigos')
                .select('cedula')
                .eq('cedula_lider', filtroLider)
                .limit(10000)
            if (testigosLider && testigosLider.length > 0) {
                cedulasTestigos = testigosLider.map(t => t.cedula)
            } else {
                return NextResponse.json({
                    exito: true,
                    puestos: [],
                    municipios: [],
                    resumen: { totalMesas: 0, completadas: 0, puestos: 0 },
                })
            }
        }

        // 1. Get resultados
        let query = supabase
            .from('resultados')
            .select('*')
            .limit(10000)

        if (filtroMunicipio) {
            query = query.eq('municipio', filtroMunicipio)
        }
        if (cedulasTestigos) {
            query = query.in('testigo_cedula', cedulasTestigos)
        }

        const { data: resultados, error } = await query
        if (error) throw error

        // 2. Get asignaciones
        let asigQuery = supabase
            .from('mesa_asignaciones')
            .select('testigo_cedula, mesa_numero, municipio, puesto')
            .limit(10000)

        if (filtroMunicipio) {
            asigQuery = asigQuery.eq('municipio', filtroMunicipio)
        }
        if (cedulasTestigos) {
            asigQuery = asigQuery.in('testigo_cedula', cedulasTestigos)
        }

        const { data: asignaciones } = await asigQuery

        // 3. Get testigo info (nombre, celular, correo)
        const allCedulas = new Set<string>()
        resultados?.forEach(r => allCedulas.add(r.testigo_cedula))
        asignaciones?.forEach(a => allCedulas.add(a.testigo_cedula))

        const testigoInfoMap: Record<string, { nombre: string; celular: string | null; correo: string | null }> = {}
        if (allCedulas.size > 0) {
            const { data: testigosData } = await supabase
                .from('testigos')
                .select('cedula, nombre_completo, celular, correo')
                .in('cedula', Array.from(allCedulas))
                .limit(10000)

            for (const t of (testigosData || [])) {
                testigoInfoMap[t.cedula] = {
                    nombre: t.nombre_completo || t.cedula,
                    celular: t.celular || null,
                    correo: t.correo || null,
                }
            }
        }

        // 4. Get unique municipios for filter dropdown
        const { data: allMunicipios } = await supabase
            .from('mesa_asignaciones')
            .select('municipio')
            .limit(10000)

        const municipioSet = new Set<string>()
        allMunicipios?.forEach(m => municipioSet.add(m.municipio))

        // 5. Group by municipio > puesto > mesa
        const grouped: Record<string, Record<string, {
            mesa_numero: number
            testigo_nombre: string
            testigo_cedula: string
            testigo_celular: string | null
            testigo_correo: string | null
            votos_camara: boolean
            votos_senado: boolean
            camara_guardado: boolean
            senado_guardado: boolean
            conteo_8am: boolean
            conteo_11am: boolean
            conteo_1pm: boolean
            foto_camara: boolean
            foto_senado: boolean
            foto_camara_url: string | null
            foto_senado_url: string | null
            foto_camara_2_url: string | null
            foto_senado_2_url: string | null
            estado: string
            updated_at: string | null
        }[]>> = {}

        if (resultados) {
            for (const r of resultados) {
                const muni = r.municipio || 'SIN MUNICIPIO'
                const puesto = r.puesto || 'SIN PUESTO'

                if (!grouped[muni]) grouped[muni] = {}
                if (!grouped[muni][puesto]) grouped[muni][puesto] = []

                const hasCamaraVotes = !!(
                    r.votos_camara_l101 || r.votos_camara_l102 || r.votos_camara_l103 ||
                    r.votos_camara_l104 || r.votos_camara_l105 || r.votos_camara_l106 ||
                    r.votos_camara_l107 || r.votos_camara_partido
                )
                const hasSenadoVotes = !!(
                    r.votos_senado_1 || r.votos_senado_2 || r.votos_senado_3 ||
                    r.votos_senado_4 || r.votos_senado_5 || r.votos_senado_partido
                )

                const info = testigoInfoMap[r.testigo_cedula]

                grouped[muni][puesto].push({
                    mesa_numero: r.mesa_numero,
                    testigo_nombre: info?.nombre || '',
                    testigo_cedula: r.testigo_cedula,
                    testigo_celular: info?.celular || null,
                    testigo_correo: info?.correo || null,
                    votos_camara: hasCamaraVotes,
                    votos_senado: hasSenadoVotes,
                    camara_guardado: r.datos_camara_guardados === true,
                    senado_guardado: r.datos_senado_guardados === true,
                    conteo_8am: r.datos_8am_guardados === true,
                    conteo_11am: r.datos_11am_guardados === true,
                    conteo_1pm: r.datos_1pm_guardados === true,
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

        // 6. Build response
        const puestos: {
            municipio: string
            puesto: string
            mesas: typeof grouped[string][string]
            total: number
            completadas: number
        }[] = []

        for (const [muni, puestosMap] of Object.entries(grouped)) {
            for (const [puesto, mesas] of Object.entries(puestosMap)) {
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
