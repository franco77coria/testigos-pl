export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
    try {
        const supabase = getServiceClient()

        // 1. Fetch Global Data
        const { count: totalTestigos } = await supabase.from('testigos').select('*', { count: 'exact', head: true })
        const { count: totalMesas } = await supabase.from('mesa_asignaciones').select('*', { count: 'exact', head: true })
        const { count: totalMunicipios } = await supabase.from('municipios').select('*', { count: 'exact', head: true })

        // 2. Fetch Progress Metrics
        const { data: resultados, error: resError } = await supabase.from('resultados').select('*')
        if (resError) throw resError

        let mesasPendientes = 0
        let mesasEnProgreso = 0
        let mesasCompletadas = 0

        let sumVotantesHabilitados = 0
        let sumVotantes10am = 0
        let sumVotantes1pm = 0

        let votosAlexP = 0
        let votosSenado = 0
        let votosOscar = 0
        let votosCamara = 0

        const progressByMunicipio: Record<string, { total: number; completadas: number }> = {}

        // 3. Aggregate Results
        if (resultados) {
            for (const res of resultados) {
                if (res.estado === 'completada') mesasCompletadas++
                else if (res.estado === 'en_progreso') mesasEnProgreso++
                else mesasPendientes++

                sumVotantesHabilitados += Number(res.cantidad_votantes_mesa) || 0
                sumVotantes10am += Number(res.votantes_10am) || 0
                sumVotantes1pm += Number(res.votantes_1pm) || 0

                votosAlexP += Number(res.votos_alex_p) || 0
                votosSenado += Number(res.votos_senado_pl) || 0
                votosOscar += Number(res.votos_oscar_sanchez_senado) || 0
                votosCamara += Number(res.votos_camara_cun_pl) || 0

                if (!progressByMunicipio[res.municipio]) {
                    progressByMunicipio[res.municipio] = { total: 0, completadas: 0 }
                }
                progressByMunicipio[res.municipio].total++
                if (res.estado === 'completada') {
                    progressByMunicipio[res.municipio].completadas++
                }
            }
        }

        const municipiosData = Object.entries(progressByMunicipio)
            .map(([name, data]) => ({
                nombre: name,
                asignadas: data.total,
                completadas: data.completadas,
                progreso: data.total > 0 ? Math.round((data.completadas / data.total) * 100) : 0
            }))
            .sort((a, b) => b.progreso - a.progreso)

        return NextResponse.json({
            exito: true,
            data: {
                global: {
                    testigos: totalTestigos || 0,
                    mesasAsignadas: totalMesas || 0,
                    municipiosActivos: totalMunicipios || 0
                },
                progreso: {
                    pendientes: mesasPendientes,
                    enProgreso: mesasEnProgreso,
                    completadas: mesasCompletadas,
                    porcentajeTotal: totalMesas ? Math.round((mesasCompletadas / (totalMesas as number)) * 100) : 0
                },
                conteo: {
                    habilitados: sumVotantesHabilitados,
                    reporte10am: sumVotantes10am,
                    reporte1pm: sumVotantes1pm,
                    alexP: votosAlexP,
                    senadoPl: votosSenado,
                    oscarSanchez: votosOscar,
                    camaraCun: votosCamara
                },
                municipios: municipiosData
            }
        })

    } catch (error: any) {
        console.error('Error fetching admin dashboard stats:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error al recuperar estadísticas.' }, { status: 500 })
    }
}
