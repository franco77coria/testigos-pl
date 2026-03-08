import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, fetchAllRows } from '@/lib/supabase'
import { CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'

// Cache: 5s fresh, 30s stale-while-revalidate
const CACHE_HEADERS = {
    'Cache-Control': 's-maxage=5, stale-while-revalidate=30',
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getServiceClient()

        const { searchParams } = new URL(request.url)
        const filtroMunicipio = searchParams.get('municipio') || ''
        const filtroLider = searchParams.get('cedula_lider') || ''

        // 1. Filtrar por líder (si aplica)
        let cedulasTestigos: string[] | null = null
        if (filtroLider) {
            const testigos = await fetchAllRows(supabase, 'testigos', 'cedula', { eq: { cedula_lider: filtroLider } })
            if (testigos.length > 0) cedulasTestigos = testigos.map(t => t.cedula)
            else return NextResponse.json({ exito: true, data: getEmptyDashboardData() }, { headers: CACHE_HEADERS })
        }

        // 2. Traer resultados paginados
        const resFilters: { eq?: Record<string, string>; in?: { column: string; values: string[] } } = {}
        if (filtroMunicipio) resFilters.eq = { municipio: filtroMunicipio }
        if (cedulasTestigos) resFilters.in = { column: 'testigo_cedula', values: cedulasTestigos }

        const resultados = await fetchAllRows(supabase, 'resultados', '*', Object.keys(resFilters).length > 0 ? resFilters : undefined)

        // 3. Traer asignaciones paginadas para calcular totales de mesas (los resultados pueden estar incompletos)
        const asigFilters: { eq?: Record<string, string>; in?: { column: string; values: string[] } } = {}
        if (filtroMunicipio) asigFilters.eq = { municipio: filtroMunicipio }
        if (cedulasTestigos) asigFilters.in = { column: 'testigo_cedula', values: cedulasTestigos }

        const asignaciones = await fetchAllRows(supabase, 'mesa_asignaciones', 'mesa_numero, municipio', Object.keys(asigFilters).length > 0 ? asigFilters : undefined)

        let totalMesas = asignaciones.length
        let mesasCompletadas = 0
        let mesasPendientes = 0
        let mesasEnProgreso = 0

        // Fotos
        let conFotoCamara = 0
        let conFotoSenado = 0

        // Horarios
        let sumHabilitados8am = 0
        let sumVotantes11am = 0
        let sumVotantes1pm = 0

        let reporte8amCount = 0
        let reporte11amCount = 0
        let reporte1pmCount = 0

        // Votos (Dinámico)
        const votosCamara: Record<string, number> = { votos_camara_partido: 0 }
        CAMARA_CANDIDATOS.forEach(c => votosCamara[c.code] = 0)

        const votosSenado: Record<string, number> = { votos_senado_partido: 0 }
        SENADO_CANDIDATOS.forEach(c => votosSenado[c.code] = 0)

        const progressByMunicipio: Record<string, { asignadas: number; completadas: number }> = {}

        // Inicializar municipios desde asignaciones
        asignaciones.forEach(a => {
            const muni = String(a.municipio)
            if (!progressByMunicipio[muni]) progressByMunicipio[muni] = { asignadas: 0, completadas: 0 }
            progressByMunicipio[muni].asignadas++
        })

        // Agregar resultados
        if (resultados.length > 0) {
            for (const res of resultados) {
                // Estado
                if (res.estado === 'completada') {
                    mesasCompletadas++
                    if (progressByMunicipio[res.municipio]) progressByMunicipio[res.municipio].completadas++
                } else if (res.estado === 'en_progreso') {
                    mesasEnProgreso++
                } else {
                    mesasPendientes++
                }

                // Evidencia
                if (res.foto_camara) conFotoCamara++
                if (res.foto_senado) conFotoSenado++

                // Franjas Horarias
                if (res.datos_8am_guardados) {
                    reporte8amCount++
                    sumHabilitados8am += Number(res.votantes_8am) || 0
                }
                if (res.datos_11am_guardados) {
                    reporte11amCount++
                    sumVotantes11am += Number(res.votantes_11am) || 0
                }
                if (res.datos_1pm_guardados) {
                    reporte1pmCount++
                    sumVotantes1pm += Number(res.votantes_1pm) || 0
                }

                // Votos Camara
                if (res.datos_camara_guardados) {
                    votosCamara.votos_camara_partido += Number(res.votos_camara_partido) || 0
                    CAMARA_CANDIDATOS.forEach(c => votosCamara[c.code] += Number(res[c.code]) || 0)
                }

                // Votos Senado
                if (res.datos_senado_guardados) {
                    votosSenado.votos_senado_partido += Number(res.votos_senado_partido) || 0
                    SENADO_CANDIDATOS.forEach(c => votosSenado[c.code] += Number(res[c.code]) || 0)
                }
            }
        }

        // Si hay resultados faltantes vs asignaciones, se consideran pendientes
        mesasPendientes = totalMesas - mesasCompletadas - mesasEnProgreso

        const municipiosData = Object.entries(progressByMunicipio)
            .map(([nombre, data]) => ({
                nombre,
                asignadas: data.asignadas,
                completadas: data.completadas,
                progreso: data.asignadas > 0 ? Math.round((data.completadas / data.asignadas) * 100) : 0
            }))
            .sort((a, b) => b.progreso - a.progreso)

        return NextResponse.json({
            exito: true,
            data: {
                progreso: {
                    asignadas: totalMesas,
                    pendientes: mesasPendientes,
                    enProgreso: mesasEnProgreso,
                    completadas: mesasCompletadas,
                    porcentajeTotal: totalMesas > 0 ? Math.round((mesasCompletadas / totalMesas) * 100) : 0,
                    conFotoTotal: Math.max(conFotoCamara, conFotoSenado)
                },
                horarios: {
                    habilitados8am: sumHabilitados8am,
                    conteo11am: sumVotantes11am,
                    conteo1pm: sumVotantes1pm,
                    reportes8am: reporte8amCount,
                    reportes11am: reporte11amCount,
                    reportes1pm: reporte1pmCount
                },
                votos: {
                    camara: votosCamara,
                    senado: votosSenado
                },
                municipios: municipiosData
            }
        }, { headers: CACHE_HEADERS })

    } catch (error: any) {
        console.error('Error fetching admin dashboard stats:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error al recuperar estadísticas.' }, { status: 500, headers: CACHE_HEADERS })
    }
}

function getEmptyDashboardData() {
    return {
        progreso: { asignadas: 0, pendientes: 0, enProgreso: 0, completadas: 0, porcentajeTotal: 0, conFotoTotal: 0 },
        horarios: { habilitados8am: 0, conteo11am: 0, conteo1pm: 0, reportes8am: 0, reportes11am: 0, reportes1pm: 0 },
        votos: { camara: {}, senado: {} },
        municipios: []
    }
}
