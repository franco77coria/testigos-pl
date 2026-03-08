export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServiceClient, fetchAllRows } from '@/lib/supabase'

/**
 * GET /api/admin/mapa-kpi
 * Aggregates vote data from `resultados` by municipality.
 * Optionally joins with `municipio_kpi` for priority/meta data.
 *
 * Returns: { municipio, prioridad, camara_meta, camara_votos_partido,
 *            camara_votos_alex, camara_pct_votantes, senado_meta, senado_votos_oscar }[]
 */
/** Normalize: strip accents + uppercase + trim (same as frontend norm()) */
function norm(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
}

export async function GET() {
    try {
        const supabase = getServiceClient()

        // 1. Fetch all resultados + COTA detail in parallel
        const [resultados, cotaResult] = await Promise.all([
            fetchAllRows(
                supabase,
                'resultados',
                'municipio, votos_camara_partido, votos_camara_l101, votos_camara_l102, votos_camara_l103, votos_camara_l104, votos_camara_l105, votos_camara_l106, votos_camara_l107, votos_senado_1, datos_camara_guardados, datos_senado_guardados, votantes_4pm'
            ),
            supabase.from('resultados')
                .select('puesto, mesa_numero, votantes_8am, votantes_4pm, datos_4pm_guardados, foto_camara, foto_senado')
                .ilike('municipio', 'COTA')
        ])

        // Aggregate COTA by puesto
        const cotaByPuesto: Record<string, { puesto: string; votantes_8am: number; votantes_4pm: number; total_mesas: number; mesas_completadas: number }> = {}
        for (const r of (cotaResult.data || [])) {
            const p = String(r.puesto || '').trim()
            if (!p) continue
            if (!cotaByPuesto[p]) {
                cotaByPuesto[p] = { puesto: p, votantes_8am: 0, votantes_4pm: 0, total_mesas: 0, mesas_completadas: 0 }
            }
            cotaByPuesto[p].total_mesas++
            cotaByPuesto[p].votantes_8am += Number(r.votantes_8am) || 0
            cotaByPuesto[p].votantes_4pm += Number(r.votantes_4pm) || 0
            if (r.datos_4pm_guardados && r.foto_camara && r.foto_senado) {
                cotaByPuesto[p].mesas_completadas++
            }
        }
        const cotaData = Object.values(cotaByPuesto)

        // 2. Try to fetch municipio_kpi for priorities/metas (optional table)
        const kpiMap: Record<string, { prioridad: string; camara_meta: number; senado_meta: number; originalName: string }> = {}
        try {
            const { data: kpiRows } = await supabase
                .from('municipio_kpi')
                .select('municipio, prioridad, camara_meta, senado_meta')
            if (kpiRows && kpiRows.length > 0) {
                for (const row of kpiRows) {
                    kpiMap[norm(String(row.municipio))] = {
                        prioridad: row.prioridad || 'BAJA',
                        camara_meta: row.camara_meta || 0,
                        senado_meta: row.senado_meta || 0,
                        originalName: String(row.municipio).trim(),
                    }
                }
            }
        } catch {
            // Table doesn't exist yet — that's fine, we'll use defaults
        }

        // 3. Aggregate by municipality (using norm() to match regardless of accents)
        const agg: Record<string, {
            municipio: string
            camara_votos_partido: number
            camara_votos_alex: number
            senado_votos_oscar: number
            total_mesas: number
            mesas_con_camara: number
            total_votos_mesa: number
        }> = {}

        for (const r of resultados) {
            const muni = String(r.municipio || '').trim()
            if (!muni) continue
            const key = norm(muni)

            if (!agg[key]) {
                agg[key] = {
                    municipio: muni,
                    camara_votos_partido: 0,
                    camara_votos_alex: 0,
                    senado_votos_oscar: 0,
                    total_mesas: 0,
                    mesas_con_camara: 0,
                    total_votos_mesa: 0,
                }
            }

            agg[key].total_mesas++
            // Votos Partido Liberal = 7 listas + voto partido
            agg[key].camara_votos_partido += (Number(r.votos_camara_l101) || 0)
                + (Number(r.votos_camara_l102) || 0) + (Number(r.votos_camara_l103) || 0)
                + (Number(r.votos_camara_l104) || 0) + (Number(r.votos_camara_l105) || 0)
                + (Number(r.votos_camara_l106) || 0) + (Number(r.votos_camara_l107) || 0)
                + (Number(r.votos_camara_partido) || 0)
            agg[key].camara_votos_alex += Number(r.votos_camara_l101) || 0
            agg[key].senado_votos_oscar += Number(r.votos_senado_1) || 0
            agg[key].total_votos_mesa += Number(r.votantes_4pm) || 0
            if (r.datos_camara_guardados) agg[key].mesas_con_camara++
        }

        // 4. Build final response — start from municipio_kpi as base,
        //    then merge with aggregated resultados. This ensures municipalities
        //    without resultados still appear with their priority/meta.
        const seen = new Set<string>()
        const data: Record<string, unknown>[] = []

        // 4a. Municipalities that have resultados
        for (const m of Object.values(agg)) {
            const key = norm(m.municipio)
            seen.add(key)
            const kpi = kpiMap[key] || null
            data.push({
                municipio: m.municipio,
                prioridad: kpi?.prioridad || 'BAJA',
                total_votos_mesa: m.total_votos_mesa,
                camara_votos_partido: m.camara_votos_partido,
                camara_votos_alex: m.camara_votos_alex,
                camara_pct_votantes: m.total_mesas > 0
                    ? Math.round((m.mesas_con_camara / m.total_mesas) * 100)
                    : 0,
                senado_meta: kpi?.senado_meta || 0,
                senado_votos_oscar: m.senado_votos_oscar,
                total_mesas: m.total_mesas,
            })
        }

        // 4b. Municipalities from municipio_kpi that have NO resultados yet
        for (const [key, kpi] of Object.entries(kpiMap)) {
            if (seen.has(key)) continue
            data.push({
                municipio: kpi.originalName,
                prioridad: kpi.prioridad,
                total_votos_mesa: 0,
                camara_votos_partido: 0,
                camara_votos_alex: 0,
                camara_pct_votantes: 0,
                senado_meta: kpi.senado_meta,
                senado_votos_oscar: 0,
                total_mesas: 0,
            })
        }

        return NextResponse.json({ exito: true, data, cotaData })
    } catch (error) {
        console.error('Error en mapa-kpi:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
    }
}
