'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import Link from 'next/link'

// =================== AUTH GATE (same as dashboard) ===================
function useAuthGate() {
    const [authorized, setAuthorized] = useState(false)
    const [cedula, setCedula] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function verify() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/verify-super', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula }),
            })
            const json = await res.json()
            if (json.exito && json.rol === 'super') {
                setAuthorized(true)
            } else {
                setError('Acceso denegado. Solo super admins.')
            }
        } catch {
            setError('Error de conexion.')
        }
        setLoading(false)
    }

    return { authorized, cedula, setCedula, loading, error, verify }
}

// =================== MUNICIPALITY-PROVINCE MAPPING ===================
const MP: Record<string, string> = {
    "Chocontá": "Almeidas", "Machetá": "Almeidas", "Manta": "Almeidas", "Sesquilé": "Almeidas", "Suesca": "Almeidas", "Tibirita": "Almeidas", "Villapinzón": "Almeidas",
    "Agua de Dios": "Alto Magdalena", "Girardot": "Alto Magdalena", "Guataquí": "Alto Magdalena", "Jerusalén": "Alto Magdalena", "Nariño": "Alto Magdalena", "Nilo": "Alto Magdalena", "Ricaurte": "Alto Magdalena", "Tocaima": "Alto Magdalena",
    "Caparrapí": "Bajo Magdalena", "Guaduas": "Bajo Magdalena", "Puerto Salgar": "Bajo Magdalena",
    "Albán": "Gualivá", "La Peña": "Gualivá", "La Vega": "Gualivá", "Nimaima": "Gualivá", "Nocaima": "Gualivá", "Quebradanegra": "Gualivá", "San Francisco": "Gualivá", "Sasaima": "Gualivá", "Supatá": "Gualivá", "Útica": "Gualivá", "Vergara": "Gualivá", "Villeta": "Gualivá",
    "Gachalá": "Guavio", "Gachetá": "Guavio", "Gama": "Guavio", "Guasca": "Guavio", "Guatavita": "Guavio", "Junín": "Guavio", "Ubalá": "Guavio",
    "Bituima": "Magdalena Centro", "Chaguaní": "Magdalena Centro", "Guayabal de Síquima": "Magdalena Centro", "Pulí": "Magdalena Centro", "San Juan de Rioseco": "Magdalena Centro", "Vianí": "Magdalena Centro",
    "Medina": "Medina", "Paratebueno": "Medina",
    "Cáqueza": "Oriente", "Chipaque": "Oriente", "Choachí": "Oriente", "Fómeque": "Oriente", "Fosca": "Oriente", "Guayabetal": "Oriente", "Gutiérrez": "Oriente", "Quetame": "Oriente", "Ubaque": "Oriente", "Une": "Oriente",
    "El Peñón": "Rionegro", "La Palma": "Rionegro", "Pacho": "Rionegro", "Paime": "Rionegro", "San Cayetano": "Rionegro", "Topaipí": "Rionegro", "Villagómez": "Rionegro", "Yacopí": "Rionegro",
    "Cajicá": "Sabana Centro", "Chía": "Sabana Centro", "Cogua": "Sabana Centro", "Cota": "Sabana Centro", "Gachancipá": "Sabana Centro", "Nemocón": "Sabana Centro", "Sopó": "Sabana Centro", "Tabio": "Sabana Centro", "Tenjo": "Sabana Centro", "Tocancipá": "Sabana Centro", "Zipaquirá": "Sabana Centro",
    "Bojacá": "Sabana Occidente", "El Rosal": "Sabana Occidente", "Facatativá": "Sabana Occidente", "Funza": "Sabana Occidente", "Madrid": "Sabana Occidente", "Mosquera": "Sabana Occidente", "Subachoque": "Sabana Occidente", "Zipacón": "Sabana Occidente",
    "Sibaté": "Soacha", "Soacha": "Soacha",
    "Arbeláez": "Sumapaz", "Cabrera": "Sumapaz", "Fusagasugá": "Sumapaz", "Granada": "Sumapaz", "Pandi": "Sumapaz", "Pasca": "Sumapaz", "San Bernardo": "Sumapaz", "Silvania": "Sumapaz", "Tibacuy": "Sumapaz", "Venecia": "Sumapaz",
    "Anapoima": "Tequendama", "Anolaima": "Tequendama", "Apulo": "Tequendama", "Cachipay": "Tequendama", "El Colegio": "Tequendama", "La Mesa": "Tequendama", "Quipile": "Tequendama", "San Antonio del Tequendama": "Tequendama", "Tena": "Tequendama", "Viotá": "Tequendama",
    "Carmen de Carupa": "Ubaté", "Cucunubá": "Ubaté", "Fúquene": "Ubaté", "Guachetá": "Ubaté", "Lenguazaque": "Ubaté", "Simijaca": "Ubaté", "Susa": "Ubaté", "Sutatausa": "Ubaté", "Tausa": "Ubaté", "Ubaté": "Ubaté",
    "Beltrán": "Magdalena Centro", "La Calera": "Guavio"
}

function norm(s: string) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() }
function normId(s: string) { return norm(s).replace(/\s+/g, '-') }
const NM: Record<string, string> = {}
for (const m in MP) NM[norm(m)] = MP[m]
function getProv(n: string) { return MP[n] || NM[norm(n)] || 'Sin Provincia' }
function fmt(n: number) { return new Intl.NumberFormat('es-CO').format(n) }

interface KPIRow {
    municipio: string
    prioridad: string
    total_votos_mesa: number
    camara_votos_partido: number
    camara_votos_alex: number
    camara_pct_votantes: number
    senado_meta: number
    senado_votos_oscar: number
}

interface CotaPuesto {
    puesto: string
    votantes_4pm: number
    total_mesas: number
    mesas_completadas: number
    votos_alex: number
    votos_partido: number
    votos_senado: number
}

const CPriority: Record<string, string> = {
    ALTA: '#e32117',
    MEDIA: '#f0746e',
    BAJA: '#f9c2c0',
    ND: '#E2E8F0',
}

const TOPO_URL = 'https://gist.githubusercontent.com/john-guerra/727e8992e9599b9d9f1dbfdc4c8e479e/raw/colombia-municipios.json'

export default function MapaInteractivo() {
    const auth = useAuthGate()
    const [d3Ready, setD3Ready] = useState(false)
    const [topoReady, setTopoReady] = useState(false)
    const [mapLoading, setMapLoading] = useState(true)
    const [legendOpen, setLegendOpen] = useState(true)
    const [tablesOpen, setTablesOpen] = useState(true)
    const mapInitialized = useRef(false)
    const kpiData = useRef<KPIRow[]>([])
    const cotaData = useRef<CotaPuesto[]>([])

    const scriptsReady = d3Ready && topoReady

    // Fetch KPI data
    const fetchKPI = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/mapa-kpi')
            const json = await res.json()
            if (json.exito && json.data) {
                kpiData.current = json.data
                if (json.cotaData) cotaData.current = json.cotaData
            }
        } catch (e) {
            console.error('Error fetching KPI:', e)
        }
    }, [])

    // Initialize map after scripts + auth
    useEffect(() => {
        if (!auth.authorized || !scriptsReady || mapInitialized.current) return
        mapInitialized.current = true

        fetchKPI().then(() => {
            initMap()
        })
    }, [auth.authorized, scriptsReady, fetchKPI])

    function initMap() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d3 = (window as any).d3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topojson = (window as any).topojson
        if (!d3 || !topojson) return

        const kpiIdx: Record<string, KPIRow> = {}
        let provStats: Record<string, { muns: number; vC: number; vA: number; vS: number; tvm: number; al: number; md: number; bj: number; muniList: { name: string; vA: number; vC: number; vS: number; tvm: number }[] }> = {}
        let filterPrio = 'ALL', filterProv = 'ALL', filterMuni = 'ALL'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let allGeoFeatures: any[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let gPath: any = null

        const mapEl = document.getElementById('map')!
        const W = mapEl.clientWidth, H = mapEl.clientHeight
        const svg = d3.select('#mapSvg').attr('width', W).attr('height', H)

        const defs = svg.append('defs')
        const filt = defs.append('filter').attr('id', 'sh').attr('x', '-8%').attr('y', '-8%').attr('width', '116%').attr('height', '116%')
        filt.append('feDropShadow').attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4).attr('flood-color', 'rgba(0,0,0,.15)')

        const gMap = svg.append('g').attr('id', 'gMap')
        const gLbl = svg.append('g').attr('id', 'gLbl')

        // Set date
        const dateEl = document.getElementById('dateLabel')
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()

        d3.json(TOPO_URL).then(function (topo: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const geoms = topo.objects.mpios.geometries.filter((g: any) => g.properties.dpt === 'CUNDINAMARCA') // eslint-disable-line @typescript-eslint/no-explicit-any
            const cundiObj = { type: 'GeometryCollection', geometries: geoms }
            const cundiGeo = topojson.feature(topo, cundiObj)

            const proj = d3.geoMercator().fitExtent([[30, 20], [W - 30, H - 20]], cundiGeo)
            const path = d3.geoPath().projection(proj)
            gPath = path
            allGeoFeatures = cundiGeo.features

            // Municipality paths
            gMap.selectAll('.muni')
                .data(cundiGeo.features)
                .join('path')
                .attr('class', 'muni')
                .attr('id', (d: any) => 'm-' + normId(d.properties.name)) // eslint-disable-line @typescript-eslint/no-explicit-any
                .attr('d', path)
                .attr('fill', '#E2E8F0')
                .attr('stroke', 'rgba(255,255,255,0.4)')
                .attr('stroke-width', 0.4)
                .attr('stroke-linejoin', 'round')
                .on('mouseover', function (this: SVGPathElement, ev: MouseEvent, d: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                    d3.select(this).raise().attr('stroke', 'rgba(255,255,255,0.9)').attr('stroke-width', 1.2).attr('filter', 'url(#sh)')
                    const provMesh = gMap.select('.prov-border').node()
                    if (provMesh) provMesh.parentNode.appendChild(provMesh)
                    const deptMesh = gMap.select('.dept-border').node()
                    if (deptMesh) deptMesh.parentNode.appendChild(deptMesh)
                    showTT(ev, d.properties.name || '')
                })
                .on('mousemove', function (ev: MouseEvent) { moveTT(ev) })
                .on('mouseout', function (this: SVGPathElement) {
                    d3.select(this).attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 0.4).attr('filter', null)
                    hideTT()
                })
                .on('click', function (_: unknown, d: any) { openPanel(d.properties.name || '') }) // eslint-disable-line @typescript-eslint/no-explicit-any

            // Province borders
            const provMesh = topojson.mesh(topo, cundiObj, (a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (a === b) return false
                return getProv(a.properties.name) !== getProv(b.properties.name)
            })
            gMap.append('path').datum(provMesh)
                .attr('class', 'prov-border').attr('d', path)
                .attr('stroke', 'rgba(255,255,255,0.5)').attr('stroke-width', 1).attr('stroke-linejoin', 'round')

            // Department border
            const deptBorder = topojson.merge(topo, geoms)
            gMap.append('path').datum(deptBorder)
                .attr('class', 'dept-border').attr('d', path)
                .attr('stroke', '#ffffff').attr('stroke-width', 1.5)
                .attr('stroke-linejoin', 'round').attr('filter', 'url(#sh)')

            // Province labels
            const provGroups: Record<string, any[]> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
            cundiGeo.features.forEach((f: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const p = getProv(f.properties.name)
                if (!p) return
                if (!provGroups[p]) provGroups[p] = []
                provGroups[p].push(f)
            })
            Object.entries(provGroups).forEach(([prov, feats]) => {
                const xs: number[] = [], ys: number[] = []
                feats.forEach((f: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const c = path.centroid(f)
                    if (c && !isNaN(c[0])) { xs.push(c[0]); ys.push(c[1]) }
                })
                if (!xs.length) return
                const cx = xs.reduce((a: number, b: number) => a + b, 0) / xs.length
                const cy = ys.reduce((a: number, b: number) => a + b, 0) / ys.length
                const fs = Math.max(7, Math.min(11, feats.length * 1.2))
                gLbl.append('text').attr('class', 'prov-label')
                    .attr('x', cx).attr('y', cy)
                    .attr('text-anchor', 'middle').attr('font-size', fs)
                    .text(prov)
            })

            setMapLoading(false)
            onKPIs(kpiData.current)

        }).catch((err: Error) => {
            const lt = document.getElementById('loadText')
            if (lt) lt.textContent = 'Error al cargar mapa: ' + err.message
            console.error(err)
        })

        // ── Data Handlers ──
        function onKPIs(data: KPIRow[]) {
            if (!data || !data.length) return

            data.forEach(d => {
                const key = norm(d.municipio)
                kpiIdx[key] = d
                const prio = (d.prioridad || 'BAJA').toUpperCase()
                const pColor = CPriority[prio] || CPriority.ND
                d3.select('#m-' + normId(d.municipio)).attr('fill', pColor)
            })

            populateFilters()
            renderKPIStats(data)
            renderCotaTable()
        }

        function renderKPIStats(dataset: KPIRow[]) {
            provStats = {}
            let cAlta = 0, cMedia = 0, cBaja = 0
            const prioStats: Record<string, { muns: number; metaC: number; votC: number; votA: number; metaS: number; votS: number; color: string }> = {
                ALTA: { muns: 0, metaC: 0, votC: 0, votA: 0, metaS: 0, votS: 0, color: '#e32117' },
                MEDIA: { muns: 0, metaC: 0, votC: 0, votA: 0, metaS: 0, votS: 0, color: '#f0746e' },
                BAJA: { muns: 0, metaC: 0, votC: 0, votA: 0, metaS: 0, votS: 0, color: '#f9c2c0' },
                TOTAL: { muns: 0, metaC: 0, votC: 0, votA: 0, metaS: 0, votS: 0, color: '#1E293B' },
            }

            dataset.forEach(d => {
                const prio = (d.prioridad || 'BAJA').toUpperCase()
                if (prio === 'ALTA') cAlta++
                else if (prio === 'MEDIA') cMedia++
                else cBaja++

                const st = prioStats[prio] || prioStats.BAJA
                st.muns++
                st.metaC += d.total_votos_mesa || 0
                st.votC += d.camara_votos_partido || 0
                st.votA += d.camara_votos_alex || 0
                st.metaS += d.senado_meta || 0
                st.votS += d.senado_votos_oscar || 0

                prioStats.TOTAL.muns++
                prioStats.TOTAL.metaC += d.total_votos_mesa || 0
                prioStats.TOTAL.votC += d.camara_votos_partido || 0
                prioStats.TOTAL.votA += d.camara_votos_alex || 0
                prioStats.TOTAL.metaS += d.senado_meta || 0
                prioStats.TOTAL.votS += d.senado_votos_oscar || 0

                const prov = getProv(d.municipio)
                if (!provStats[prov]) provStats[prov] = { muns: 0, vC: 0, vA: 0, vS: 0, tvm: 0, al: 0, md: 0, bj: 0, muniList: [] }
                provStats[prov].muns++
                provStats[prov].vC += d.camara_votos_partido || 0
                provStats[prov].vA += d.camara_votos_alex || 0
                provStats[prov].vS += d.senado_votos_oscar || 0
                provStats[prov].tvm += d.total_votos_mesa || 0
                provStats[prov].muniList.push({ name: d.municipio, vA: d.camara_votos_alex || 0, vC: d.camara_votos_partido || 0, vS: d.senado_votos_oscar || 0, tvm: d.total_votos_mesa || 0 })
                if (prio === 'ALTA') provStats[prov].al++
                else if (prio === 'MEDIA') provStats[prov].md++
                else provStats[prov].bj++
            })

            // Camara table
            const tbodyC = document.getElementById('summaryTableBodyCamara')
            if (tbodyC) {
                tbodyC.innerHTML = '';
                ['ALTA', 'MEDIA', 'BAJA', 'TOTAL'].forEach(p => {
                    const s = prioStats[p]
                    const pctC = s.metaC > 0 ? ((s.votA / s.metaC) * 100).toFixed(1) : '0'
                    const pctPartido = s.metaC > 0 ? ((s.votC / s.metaC) * 100).toFixed(1) : '0'
                    const colorC = Number(pctC) >= 100 ? '#10b981' : (Number(pctC) > 70 ? '#f59e0b' : '#e32117')
                    const colorPartido = Number(pctPartido) >= 100 ? '#10b981' : (Number(pctPartido) > 70 ? '#f59e0b' : '#e32117')
                    const badge = p === 'TOTAL' ? '<span style="font-weight:900;color:#1E293B">TOTAL</span>' : `<span class="prio-badge" style="background:${s.color}">${p}</span>`
                    const tr = document.createElement('tr')
                    if (p === 'TOTAL') tr.style.background = '#F8FAFC'
                    tr.innerHTML = `<td>${badge}</td><td class="val" style="text-align:center">${s.muns}</td><td class="val">${fmt(s.metaC)}</td><td class="val" style="color:#d97706;font-weight:700;">${fmt(s.votA)}</td><td class="val">${fmt(s.votC)}</td><td class="pct" style="color:${colorC}">${pctC}%</td><td class="pct" style="color:${colorPartido}">${pctPartido}%</td>`
                    tbodyC.appendChild(tr)
                })
            }

            // Senado table
            const senGoal = 100000
            const senVotos = prioStats.TOTAL.votS
            const senPct = ((senVotos / senGoal) * 100).toFixed(1)
            const senColor = Number(senPct) >= 100 ? '#10b981' : (Number(senPct) > 70 ? '#f59e0b' : '#e32117')
            const stSenVotos = document.getElementById('stSenVotos')
            const stSenPct = document.getElementById('stSenPct')
            if (stSenVotos) stSenVotos.textContent = fmt(senVotos)
            if (stSenPct) { stSenPct.textContent = senPct + '%'; stSenPct.style.color = senColor }

            // Legend
            const setT = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t }
            setT('lAlta', cAlta + ' Mun.')
            setT('lMedia', cMedia + ' Mun.')
            setT('lBaja', cBaja + ' Mun.')
            setT('lAltaV', fmt(prioStats.ALTA.votC))
            setT('lAltaA', fmt(prioStats.ALTA.votA))
            setT('lMediaV', fmt(prioStats.MEDIA.votC))
            setT('lMediaA', fmt(prioStats.MEDIA.votA))
            setT('lBajaV', fmt(prioStats.BAJA.votC))
            setT('lBajaA', fmt(prioStats.BAJA.votA))

            // Header totals
            const totalTVM = prioStats.TOTAL.metaC
            const pctH = (v: number) => totalTVM > 0 ? ((v / totalTVM) * 100).toFixed(1) + '%' : '0%'
            setT('hCamPL', fmt(prioStats.TOTAL.votC))
            setT('hCamPLpct', pctH(prioStats.TOTAL.votC))
            setT('hAlex', fmt(prioStats.TOTAL.votA))
            setT('hAlexPct', pctH(prioStats.TOTAL.votA))
            setT('hOscar', fmt(prioStats.TOTAL.votS))
            setT('hOscarPct', pctH(prioStats.TOTAL.votS))

            renderSidebar()
        }

        function renderCotaTable() {
            const tbody = document.getElementById('cotaTableBody')
            if (!tbody) return
            const cota = cotaData.current
            if (!cota || cota.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;font-size:1.1rem">Sin datos de Cota</td></tr>'
                return
            }
            tbody.innerHTML = ''
            let totV4 = 0, totMesas = 0, totComp = 0, totAlex = 0, totPartido = 0, totSenado = 0

            cota.forEach(p => {
                totV4 += p.votantes_4pm
                totMesas += p.total_mesas
                totComp += p.mesas_completadas
                totAlex += p.votos_alex
                totPartido += p.votos_partido
                totSenado += p.votos_senado
                const pct = p.total_mesas > 0 ? ((p.mesas_completadas / p.total_mesas) * 100).toFixed(1) : '0'
                const color = Number(pct) >= 100 ? '#10b981' : (Number(pct) > 70 ? '#f59e0b' : '#e32117')
                const s = 'font-size:1.1rem'
                const tr = document.createElement('tr')
                tr.innerHTML = `<td style="text-align:left;font-weight:600;${s}">${p.puesto}</td><td class="val" style="${s}">${fmt(p.votantes_4pm)}</td><td class="val" style="${s}">${p.total_mesas}</td><td class="val" style="${s}">${p.mesas_completadas}</td><td class="pct" style="color:${color};${s}">${pct}%</td><td class="val" style="color:#d97706;font-weight:700;${s}">${fmt(p.votos_alex)}</td><td class="val" style="${s}">${fmt(p.votos_partido)}</td><td class="val" style="${s}">${fmt(p.votos_senado)}</td>`
                tbody.appendChild(tr)
            })

            const totalPct = totMesas > 0 ? ((totComp / totMesas) * 100).toFixed(1) : '0'
            const totalColor = Number(totalPct) >= 100 ? '#10b981' : (Number(totalPct) > 70 ? '#f59e0b' : '#e32117')
            const totalTr = document.createElement('tr')
            totalTr.style.background = '#F8FAFC'
            totalTr.style.borderTop = '2px solid #228B22'
            const sb = 'font-weight:900;font-size:1.1rem'
            totalTr.innerHTML = `<td style="text-align:left;${sb}"><span style="color:#1E293B">TOTAL</span></td><td class="val" style="${sb}">${fmt(totV4)}</td><td class="val" style="${sb}">${totMesas}</td><td class="val" style="${sb}">${totComp}</td><td class="pct" style="color:${totalColor};${sb}">${totalPct}%</td><td class="val" style="color:#d97706;${sb}">${fmt(totAlex)}</td><td class="val" style="${sb}">${fmt(totPartido)}</td><td class="val" style="${sb}">${fmt(totSenado)}</td>`
            tbody.appendChild(totalTr)
        }

        function renderSidebar() {
            const sb = document.getElementById('sbContent')
            if (!sb) return
            sb.innerHTML = ''

            const pctStr = (v: number, t: number) => t > 0 ? ((v / t) * 100).toFixed(1) + '%' : '0%'

            const pNames = Object.keys(provStats).sort((a, b) => (provStats[b].vC || 0) - (provStats[a].vC || 0))
            pNames.forEach(p => {
                const stat = provStats[p]
                const div = document.createElement('div')
                div.className = 'prov-card'
                const muniId = 'muniList_' + p.replace(/\s/g, '_')
                div.innerHTML = `
                    <div class="pc-head" style="cursor:pointer" data-toggle="${muniId}">
                        <div class="pc-name">${p} <span style="font-size:0.55rem;color:#94A3B8;">&#9660;</span></div>
                        <div class="pc-count">${stat.muns} Mun.</div>
                    </div>
                    <table style="width:100%;font-size:0.6rem;border-collapse:collapse;margin-bottom:8px;text-align:center;">
                        <thead><tr style="color:#94A3B8;font-weight:700;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.03em;">
                            <th style="text-align:left;padding:2px 0;"></th>
                            <th style="padding:2px 4px;">Votos</th>
                            <th style="padding:2px 4px;">%</th>
                        </tr></thead>
                        <tbody>
                            <tr style="color:#64748B;"><td style="text-align:left;padding:2px 0;">Partido Liberal</td><td style="padding:2px 4px;font-weight:700;">${fmt(stat.vC)}</td><td style="padding:2px 4px;">${pctStr(stat.vC, stat.tvm)}</td></tr>
                            <tr style="color:#e32117;background:rgba(227,33,23,0.04);border-radius:4px;"><td style="text-align:left;padding:2px 0;font-weight:700;">Alex Prieto</td><td style="padding:2px 4px;font-weight:800;font-size:0.7rem;">${fmt(stat.vA)}</td><td style="padding:2px 4px;font-weight:700;">${pctStr(stat.vA, stat.tvm)}</td></tr>
                            <tr style="color:#64748B;"><td style="text-align:left;padding:2px 0;">L10 Oscar S.</td><td style="padding:2px 4px;font-weight:700;">${fmt(stat.vS)}</td><td style="padding:2px 4px;">${pctStr(stat.vS, stat.tvm)}</td></tr>
                            <tr style="color:#94A3B8;border-top:1px solid #E2E8F0;"><td style="text-align:left;padding:2px 0;">Tot. Votos Mesa</td><td style="padding:2px 4px;font-weight:700;">${fmt(stat.tvm)}</td><td></td></tr>
                        </tbody>
                    </table>
                    <div class="pc-grid">
                        <div class="pc-stat" style="border-bottom: 2px solid #e32117"><div class="n" style="color:#e32117">${stat.al}</div><div class="l">Alta</div></div>
                        <div class="pc-stat" style="border-bottom: 2px solid #f0746e"><div class="n" style="color:#f0746e">${stat.md}</div><div class="l">Media</div></div>
                        <div class="pc-stat" style="border-bottom: 2px solid #f9c2c0"><div class="n" style="color:#f9c2c0">${stat.bj}</div><div class="l">Baja</div></div>
                    </div>
                    <div id="${muniId}" style="display:none;margin-top:6px;border-top:1px solid #E2E8F0;padding-top:6px;">
                        <table style="width:100%;font-size:0.55rem;border-collapse:collapse;text-align:center;">
                            <thead><tr style="color:#94A3B8;font-weight:700;font-size:0.5rem;text-transform:uppercase;letter-spacing:0.03em;">
                                <th style="text-align:left;padding:3px 0;">Municipio</th>
                                <th style="padding:3px 2px;">Partido</th>
                                <th style="padding:3px 2px;">Alex</th>
                                <th style="padding:3px 2px;">L10</th>
                                <th style="padding:3px 2px;">Tot.</th>
                            </tr></thead>
                            <tbody>
                                ${stat.muniList.sort((a, b) => b.vA - a.vA).map(m => `<tr style="border-bottom:1px solid #F1F5F9;">
                                    <td style="text-align:left;padding:3px 0;font-weight:600;color:#1E293B;">${m.name}</td>
                                    <td style="padding:3px 2px;color:#64748B;"><b>${fmt(m.vC)}</b><div style="color:#94A3B8;font-size:0.48rem;">${pctStr(m.vC, m.tvm)}</div></td>
                                    <td style="padding:3px 2px;color:#e32117;font-weight:700;"><b>${fmt(m.vA)}</b><div style="font-size:0.48rem;opacity:0.7;">${pctStr(m.vA, m.tvm)}</div></td>
                                    <td style="padding:3px 2px;color:#64748B;"><b>${fmt(m.vS)}</b><div style="color:#94A3B8;font-size:0.48rem;">${pctStr(m.vS, m.tvm)}</div></td>
                                    <td style="padding:3px 2px;color:#94A3B8;font-weight:700;">${fmt(m.tvm)}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`

                // Toggle click on header
                const head = div.querySelector('[data-toggle]') as HTMLElement
                if (head) {
                    head.addEventListener('click', () => {
                        const list = document.getElementById(muniId)
                        if (list) {
                            const open = list.style.display !== 'none'
                            list.style.display = open ? 'none' : 'block'
                            const arrow = head.querySelector('.pc-name span')
                            if (arrow) arrow.innerHTML = open ? '&#9660;' : '&#9650;'
                        }
                    })
                }

                sb.appendChild(div)
            })
        }

        // ── Tooltip ──
        const ttEl = document.getElementById('tooltip')!
        function showTT(ev: MouseEvent, name: string) {
            const key = norm(name)
            const kd = kpiIdx[key]
            const prov = getProv(name)

            const setT = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t }
            setT('ttName', name)
            setT('ttProv', prov)

            const prio = kd ? (kd.prioridad || 'ND').toUpperCase() : 'ND'
            const prioBadge = document.getElementById('ttPrio')
            if (prioBadge) {
                prioBadge.textContent = prio
                prioBadge.style.background = CPriority[prio] || CPriority.ND
                prioBadge.style.color = prio === 'ND' ? '#1E293B' : '#fff'
            }

            if (kd) {
                setT('ttCVT', fmt(kd.camara_votos_partido || 0))
                setT('ttCVA', fmt(kd.camara_votos_alex || 0))
                setT('ttCPV', (kd.camara_pct_votantes || 0) + '%')
                setT('ttSVO', fmt(kd.senado_votos_oscar || 0))
            } else {
                ['ttCVT', 'ttCVA', 'ttCPV', 'ttSVO'].forEach(id => setT(id, '—'))
            }

            moveTT(ev)
            ttEl.classList.add('v')
        }

        function moveTT(ev: MouseEvent) {
            const x = ev.clientX, y = ev.clientY, w = ttEl.offsetWidth, h = ttEl.offsetHeight
            let l = x + 16, t = y - 10
            if (l + w > window.innerWidth) l = x - w - 16
            if (t + h > window.innerHeight) t = window.innerHeight - h - 16
            ttEl.style.left = l + 'px'
            ttEl.style.top = Math.max(16, t) + 'px'
        }

        function hideTT() { ttEl.classList.remove('v') }

        // ── Detail Panel ──
        function openPanel(name: string) {
            const key = norm(name)
            const kd = kpiIdx[key]
            const prov = getProv(name)
            const setT = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t }

            setT('pMuni', name)
            setT('pProv', 'Provincia: ' + prov)

            const prio = kd ? (kd.prioridad || 'ND').toUpperCase() : 'ND'
            const prioColor = CPriority[prio] || CPriority.ND
            const pb = document.getElementById('pPrioBadge')
            if (pb) {
                pb.textContent = 'Prioridad ' + prio
                pb.style.background = prioColor + '40'
                pb.style.color = prioColor
                pb.style.border = '1px solid ' + prioColor
            }

            if (kd) {
                setT('pCVT', fmt(kd.camara_votos_partido || 0))
                setT('pCVA', fmt(kd.camara_votos_alex || 0))
                setT('pCPV', String(kd.camara_pct_votantes || 0))
                setT('pSVO', fmt(kd.senado_votos_oscar || 0))
            } else {
                ['pCVT', 'pCVA', 'pCPV', 'pSVO'].forEach(id => setT(id, '—'))
            }

            document.getElementById('panel')?.classList.add('open')
        }

        // Close panel
        const closeBtn = document.getElementById('panelCloseBtn')
        if (closeBtn) closeBtn.onclick = () => document.getElementById('panel')?.classList.remove('open')

        document.getElementById('map')?.addEventListener('mouseleave', () => {
            document.getElementById('panel')?.classList.remove('open')
            hideTT()
        })

        // ── Filters ──
        function populateFilters() {
            const pSel = document.getElementById('fProv') as HTMLSelectElement | null
            const mSel = document.getElementById('fMuni') as HTMLSelectElement | null
            if (!pSel || !mSel) return

            const curProv = pSel.value, curMuni = mSel.value
            pSel.innerHTML = '<option value="ALL">Todas</option>'
            mSel.innerHTML = '<option value="ALL">Todos</option>'

            const provs: Record<string, boolean> = {}
            const muns: string[] = []
            Object.keys(kpiIdx).forEach(key => {
                const d = kpiIdx[key]
                const p = (d.prioridad || 'BAJA').toUpperCase()
                const pr = getProv(d.municipio)
                if (filterPrio !== 'ALL' && p !== filterPrio) return
                provs[pr] = true
                if (filterProv === 'ALL' || pr === filterProv) muns.push(d.municipio)
            })

            Object.keys(provs).sort().forEach(pr => { pSel.innerHTML += `<option value="${pr}">${pr}</option>` })
            muns.sort().forEach(m => { mSel.innerHTML += `<option value="${norm(m)}">${m}</option>` })

            if (provs[curProv]) pSel.value = curProv; else filterProv = 'ALL'
            if (muns.find(m => norm(m) === curMuni)) mSel.value = curMuni; else filterMuni = 'ALL'
        }

        function applyFilters() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const matchedFeats: any[] = []
            const matchedData: KPIRow[] = []

            d3.selectAll('.muni').each(function (this: SVGPathElement, d: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                const n = norm(d.properties.name)
                const k = kpiIdx[n]
                const pr = getProv(d.properties.name)
                const p = k ? (k.prioridad || 'BAJA').toUpperCase() : 'ND'
                const match = (filterPrio === 'ALL' || p === filterPrio) && (filterProv === 'ALL' || pr === filterProv) && (filterMuni === 'ALL' || n === filterMuni)
                d3.select(this).classed('dimmed', !match)
                if (match) matchedFeats.push(d)
            })

            Object.values(kpiIdx).forEach(d => {
                const n = norm(d.municipio)
                const pr = getProv(d.municipio)
                const p = (d.prioridad || 'BAJA').toUpperCase()
                if ((filterPrio === 'ALL' || p === filterPrio) && (filterProv === 'ALL' || pr === filterProv) && (filterMuni === 'ALL' || n === filterMuni)) {
                    matchedData.push(d)
                }
            })
            renderKPIStats(matchedData)

            d3.selectAll('.prov-label').each(function (this: SVGTextElement) {
                const pr = d3.select(this).text()
                const matchProv = filterProv === 'ALL' || pr === filterProv
                const hasValid = matchedFeats.some((f: any) => getProv(f.properties.name) === pr) // eslint-disable-line @typescript-eslint/no-explicit-any
                d3.select(this).classed('dimmed', !(matchProv && hasValid))
            })

            // Zoom
            if (matchedFeats.length > 0 && matchedFeats.length < allGeoFeatures.length) {
                const pb = gPath.bounds({ type: 'FeatureCollection', features: matchedFeats })
                const dx = pb[1][0] - pb[0][0], dy = pb[1][1] - pb[0][1]
                const x = (pb[0][0] + pb[1][0]) / 2, y = (pb[0][1] + pb[1][1]) / 2
                const scale = Math.max(1, Math.min(6, 0.8 / Math.max(dx / W, dy / H)))
                const translate = [W / 2 - scale * x, H / 2 - scale * y]

                d3.select('#gMap').transition().duration(800).attr('transform', `translate(${translate[0]},${translate[1]}) scale(${scale})`)
                d3.select('#gLbl').transition().duration(800).attr('transform', `translate(${translate[0]},${translate[1]}) scale(${scale})`)
                    .on('end', () => { d3.selectAll('.prov-label').style('display', scale > 1.5 ? 'none' : '') })
                if (scale > 1.5) {
                    d3.selectAll('.prov-label').style('display', 'none')
                    document.getElementById('panel')?.classList.remove('open')
                }
            } else {
                d3.select('#gMap').transition().duration(800).attr('transform', '')
                d3.select('#gLbl').transition().duration(800).attr('transform', '')
                    .on('end', () => { d3.selectAll('.prov-label').style('display', '') })
            }
        }

        document.getElementById('fPrio')?.addEventListener('change', (e) => { filterPrio = (e.target as HTMLSelectElement).value; populateFilters(); applyFilters() })
        document.getElementById('fProv')?.addEventListener('change', (e) => { filterProv = (e.target as HTMLSelectElement).value; populateFilters(); applyFilters() })
        document.getElementById('fMuni')?.addEventListener('change', (e) => { filterMuni = (e.target as HTMLSelectElement).value; applyFilters() })

        const resetBtn = document.getElementById('btnReset')
        if (resetBtn) {
            resetBtn.onclick = () => {
                const fp = document.getElementById('fPrio') as HTMLSelectElement | null
                const fprov = document.getElementById('fProv') as HTMLSelectElement | null
                const fm = document.getElementById('fMuni') as HTMLSelectElement | null
                if (fp) fp.value = 'ALL'
                if (fprov) fprov.value = 'ALL'
                if (fm) fm.value = 'ALL'
                filterPrio = 'ALL'; filterProv = 'ALL'; filterMuni = 'ALL'
                populateFilters(); applyFilters()
            }
        }
    }

    // ── Auth Gate UI (same style as dashboard) ──
    if (!auth.authorized) {
        return (
            <div style={{
                minHeight: '100vh', background: '#F0F2F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{
                    background: '#FFFFFF', borderRadius: '16px', padding: '32px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB',
                    width: '100%', maxWidth: '380px',
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'rgba(206,17,38,0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                            fontSize: '24px', color: '#CE1126', fontWeight: 900, fontStyle: 'italic',
                        }}>L</div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                            Mapa Interactivo
                        </h1>
                        <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                            Ingrese su cedula de super admin para acceder.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" inputMode="numeric" placeholder="Ingrese su cedula"
                            value={auth.cedula} onChange={e => auth.setCedula(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && auth.verify()}
                            style={{
                                width: '100%', padding: '12px 14px', border: '1px solid #E5E7EB',
                                borderRadius: '10px', fontSize: '14px', fontWeight: 500, outline: 'none',
                                fontFamily: "'Inter', system-ui, sans-serif", textAlign: 'center', boxSizing: 'border-box',
                            }}
                        />
                        <button onClick={auth.verify} disabled={auth.loading || !auth.cedula.trim()}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                background: (!auth.cedula.trim() || auth.loading) ? 'rgba(206,17,38,0.4)' : '#CE1126',
                                color: 'white', fontWeight: 700, fontSize: '14px',
                                cursor: (!auth.cedula.trim() || auth.loading) ? 'not-allowed' : 'pointer',
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}>{auth.loading ? 'Verificando...' : 'Acceder'}</button>
                    </div>
                    {auth.error && (
                        <div style={{
                            marginTop: '12px', padding: '10px', borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#EF4444', fontSize: '12px', fontWeight: 600, textAlign: 'center',
                        }}>{auth.error}</div>
                    )}
                    <Link href="/admin" style={{
                        display: 'block', textAlign: 'center', marginTop: '16px',
                        fontSize: '12px', color: '#94A3B8', textDecoration: 'none', fontWeight: 500,
                    }}>Volver al panel</Link>
                </div>
            </div>
        )
    }

    // ── Main Map UI ──
    return (
        <>
            <Script src="https://d3js.org/d3.v7.min.js" strategy="afterInteractive" onLoad={() => setD3Ready(true)} />
            <Script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js" strategy="afterInteractive" onLoad={() => setTopoReady(true)} />

            <style jsx global>{`
                :root {
                    --bg: #EEF1F5; --card: rgba(255,255,255,.98); --glass: rgba(20,20,30,.92);
                    --pl-red: #e32117; --pl-red-d: #A61611; --pl-white: #FFFFFF;
                    --alta: #e32117; --media: #f0746e; --baja: #f9c2c0; --nd: #E2E8F0;
                    --s50: #F8FAFC; --s100: #F1F5F9; --s200: #E2E8F0; --s300: #CBD5E1; --s400: #94A3B8;
                    --s500: #64748B; --s600: #475569; --s700: #334155; --s800: #1E293B; --s900: #0F172A;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--s800); }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
                #panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }

                #loadScreen { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(145deg, var(--pl-red-d), #4a0805); transition: opacity .6s, visibility .6s; padding: 2rem; text-align: center; }
                #loadScreen.hide { opacity: 0; visibility: hidden; pointer-events: none; }
                .spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,.15); border-top: 4px solid #fff; border-radius: 50%; animation: spin .8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .load-text { color: #fff; margin-top: 1.5rem; font-weight: 600; font-size: 1rem; }
                .load-note { color: rgba(255,255,255,.6); margin-top: .5rem; font-size: .75rem; }

                .map-wrap { display: flex; flex-direction: column; }
                .header { background: linear-gradient(135deg, var(--pl-red) 0%, #b51a12 100%); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; color: #fff; position: relative; z-index: 500; box-shadow: 0 4px 15px rgba(227,33,23,0.2); overflow: hidden; }
                .header::after { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08)); pointer-events: none; }
                .hdr-left { display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1; }
                .pl-logo { width: 42px; height: 42px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.8rem; color: var(--pl-red); font-style: italic; letter-spacing: -2px; padding-right: 4px; line-height: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .header h1 { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; text-transform: uppercase; }
                .header .sub { font-size: .75rem; color: rgba(255,255,255,.8); font-weight: 500; letter-spacing: 0.02em; margin-top: 2px; }
                .hdr-center { display: flex; gap: 1.5rem; background: rgba(0,0,0,0.15); padding: 0.4rem 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); z-index: 1; }
                .hc-stat { display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 1.5rem; }
                .hc-stat:last-child { border-right: none; padding-right: 0; }
                .hc-row { display: flex; align-items: baseline; gap: 6px; justify-content: center; }
                .hc-val { font-size: 1.4rem; font-weight: 900; letter-spacing: -0.02em; line-height: 1.1; }
                .hc-pct { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.55); }
                .hc-lbl { font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
                .header-date { color: rgba(255,255,255,.7); font-size: .7rem; font-weight: 600; position: relative; z-index: 1; text-transform: uppercase; background: rgba(0,0,0,0.15); padding: 4px 10px; border-radius: 20px; }

                .table-summary-container { background: #fff; border-bottom: 1px solid var(--s200); z-index: 400; padding: 0.5rem 0.8rem; display: flex; align-items: flex-start; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); overflow-x: auto; gap: 1rem; }
                .summary-table { width: 100%; max-width: 1200px; border-collapse: collapse; font-size: .75rem; text-align: center; }
                .summary-table th, .summary-table td { padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--s100); white-space: nowrap; }
                .summary-table th { min-width: 0; }
                .summary-table th { font-weight: 800; color: var(--s500); text-transform: uppercase; letter-spacing: 0.05em; background: var(--s50); }
                .summary-table th:first-child, .summary-table td:first-child { text-align: left; }
                .summary-table .prio-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; color: #fff; font-weight: 800; font-size: 0.65rem; }
                .summary-table .val { font-weight: 700; color: var(--s800); font-variant-numeric: tabular-nums; }
                .summary-table .pct { font-weight: 800; }

                .main-body { position: relative; background: #e8e4da; height: calc(100vh - 80px); }
                #map { width: 100%; height: 100%; position: relative; }
                #mapSvg { width: 100%; height: 100%; display: block; }
                .muni { cursor: pointer; transition: opacity .12s; }
                .muni:hover { opacity: .75; }
                .muni.dimmed { fill: var(--s200) !important; opacity: 0.15; pointer-events: none; }
                .prov-border { fill: none; pointer-events: none; }
                .dept-border { fill: none; pointer-events: none; }
                .prov-label { font-family: 'Inter', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; pointer-events: none; paint-order: stroke; stroke: rgba(255,255,255,0.85); stroke-width: 3.5px; fill: #1a2540; }
                .prov-label.dimmed { opacity: 0.15; }

                #sidebar { background: var(--card); z-index: 100; padding: 1.5rem; }
                .sb-header { padding-bottom: 1rem; border-bottom: 1px solid var(--s200); background: #fff; margin-bottom: 1rem; }
                .sb-title { font-size: .85rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--pl-red); display: flex; align-items: center; gap: 8px; }
                .sb-title::before { content: ''; display: block; width: 4px; height: 14px; background: var(--pl-red); border-radius: 2px; }
                .sb-content { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
                .prov-card { background: var(--s50); border: 1px solid var(--s200); border-radius: 12px; padding: 1rem; transition: border-color 0.2s; }
                .prov-card:hover { border-color: var(--s300); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .pc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .8rem; }
                .pc-name { font-weight: 800; font-size: .95rem; color: var(--s800); }
                .pc-count { font-size: .65rem; font-weight: 700; color: var(--s500); background: var(--s200); padding: 2px 8px; border-radius: 10px; }
                .pc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
                .pc-stat { display: flex; flex-direction: column; align-items: center; background: #fff; border: 1px solid var(--s100); border-radius: 8px; padding: .6rem .2rem; }
                .pc-stat .n { font-size: 1.1rem; font-weight: 800; line-height: 1; margin-bottom: 3px; }
                .pc-stat .l { font-size: .55rem; font-weight: 700; text-transform: uppercase; color: var(--s400); }

                #tooltip { position: fixed; z-index: 1000; pointer-events: none; background: var(--glass); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: #fff; padding: 1rem; border-radius: 16px; font-size: .8rem; min-width: 250px; opacity: 0; transform: translateY(8px); transition: opacity .2s, transform .2s; border: 1px solid rgba(255,255,255,.08); box-shadow: 0 16px 40px rgba(0,0,0,.3); }
                #tooltip.v { opacity: 1; transform: translateY(0); }
                .tt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .tt-name { font-weight: 800; font-size: 1.1rem; line-height: 1.1; }
                .tt-prov { font-size: .65rem; color: rgba(255,255,255,.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
                .tt-prio { padding: 4px 10px; border-radius: 8px; font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #fff; }
                .tt-section { margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,.15); }
                .tt-stitle { font-size: .6rem; font-weight: 800; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px; }
                .tt-row { display: flex; justify-content: space-between; align-items: center; font-size: .75rem; margin-bottom: 6px; }
                .tt-row .lbl { color: rgba(255,255,255,.6); }
                .tt-row .val { font-weight: 800; font-variant-numeric: tabular-nums; }
                .tt-row.highlight .val { color: #fff; font-size: .85rem; }

                #panel { position: fixed; top: 0; right: 0; width: 380px; height: 100vh; background: var(--glass); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); z-index: 2000; transform: translateX(100%); transition: transform .4s cubic-bezier(.16,1,.3,1); border-left: 1px solid rgba(255,255,255,.1); box-shadow: -15px 0 50px rgba(0,0,0,.5); overflow-y: auto; color: #fff; }
                #panel.open { transform: translateX(0); }
                .ph { padding: 1.5rem; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); border-bottom: 1px solid rgba(255,255,255,.08); position: relative; }
                .pc-close { position: absolute; top: 1.2rem; right: 1.2rem; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.08); border: none; color: #fff; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
                .pc-close:hover { background: var(--pl-red); transform: rotate(90deg); }
                .p-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 12px; }
                .pm { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; line-height: 1.1; }
                .pp { font-size: .75rem; color: rgba(255,255,255,.5); font-weight: 500; }
                .ps { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,.05); }
                .ps-head { display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem; }
                .ps-icon { width: 28px; height: 28px; border-radius: 6px; background: rgba(218,37,29,0.15); color: var(--pl-red); display: flex; align-items: center; justify-content: center; font-size: .9rem; font-weight: 900; }
                .ps h3 { font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.9); margin: 0; }
                .data-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
                .data-box { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 1.2rem; position: relative; overflow: hidden; }
                .data-box::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--pl-red); border-radius: 4px 0 0 4px; }
                .db-label { font-size: .65rem; color: rgba(255,255,255,.5); text-transform: uppercase; font-weight: 700; letter-spacing: .05em; margin-bottom: 6px; }
                .db-val { font-size: 1.8rem; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; }
                .db-sub { font-size: .7rem; color: rgba(255,255,255,.4); font-weight: 500; margin-top: 6px; }
                .data-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
                .data-subbox { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); border-radius: 10px; padding: 1rem; }
                .data-subbox .db-val { font-size: 1.3rem; }

                #legend { position: fixed; bottom: 20px; right: 20px; z-index: 800; background: var(--card); border-radius: 16px; padding: 1rem 1.2rem; border: 1px solid rgba(0,0,0,.08); box-shadow: 0 10px 30px rgba(0,0,0,.1); width: 260px; transition: all .3s ease; }
                #legend.collapsed { width: auto; padding: 0; }
                .legend-toggle { position: fixed; bottom: 20px; right: 20px; z-index: 801; width: 40px; height: 40px; border-radius: 50%; background: var(--card); border: 1px solid rgba(0,0,0,.08); box-shadow: 0 4px 12px rgba(0,0,0,.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 800; color: var(--s600); transition: all .2s; }
                .legend-toggle:hover { background: var(--pl-red); color: #fff; transform: scale(1.05); }
                #legend h4 { font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--s500); margin-bottom: .8rem; }
                .li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 4px 0; font-size: .75rem; font-weight: 600; color: var(--s800); }
                .li-left { display: flex; align-items: center; gap: 8px; }
                .ls { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,0.8) inset; }
                .l-count { font-size: .7rem; font-weight: 800; color: var(--s500); background: var(--s100); padding: 2px 8px; border-radius: 10px; }

                .filter-bar { display: flex; gap: 1rem; padding: .6rem 1.5rem; background: #fff; border-bottom: 1px solid var(--s200); z-index: 390; align-items: center; justify-content: flex-start; }
                .filter-group { display: flex; align-items: center; gap: .5rem; }
                .filter-label { font-size: .65rem; font-weight: 700; color: var(--s500); text-transform: uppercase; letter-spacing: .05em; }
                .filter-select { padding: .4rem .8rem; border-radius: 8px; border: 1px solid var(--s300); background: var(--s50); font-family: inherit; font-size: .75rem; font-weight: 600; color: var(--s800); outline: none; cursor: pointer; transition: .2s; min-width: 140px; }
                .filter-select:hover { border-color: var(--s400); }
                .filter-select:focus { border-color: var(--pl-red); }
                .btn-reset { margin-left: auto; padding: .5rem 1rem; border: none; background: rgba(227,33,23,0.1); font-size: .75rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: .2s; color: var(--pl-red); display: flex; align-items: center; gap: 6px; }
                .btn-reset:hover { background: var(--pl-red); color: #fff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(227,33,23,0.2); }

                .toggle-tables-btn { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border: 1px solid var(--s300); background: var(--s50); border-radius: 8px; font-size: .7rem; font-weight: 700; color: var(--s600); cursor: pointer; transition: all .2s; white-space: nowrap; }
                .toggle-tables-btn:hover { background: var(--pl-red); color: #fff; border-color: var(--pl-red); }
                .toggle-tables-btn svg { flex-shrink: 0; }

                @media(max-width:800px) {
                    .main-body { height: calc(100vh - 70px); }
                    #panel { width: 100%; }
                    .header h1 { font-size: 1.1rem; }
                    .table-summary-container { justify-content: flex-start; padding: .5rem 1rem; }
                    .hdr-center { display: none; }
                    .sb-content { grid-template-columns: 1fr; }
                }
            `}</style>

            {/* LOADER */}
            <div id="loadScreen" className={mapLoading ? '' : 'hide'}>
                <div className="spinner"></div>
                <div className="load-text" id="loadText">Inicializando Dashboard Electoral...</div>
                <div className="load-note">Cargando limites politicos y datos del Partido Liberal</div>
            </div>

            <div className="map-wrap">
                {/* HEADER */}
                <header className="header">
                    <div className="hdr-left">
                        <div className="pl-logo">L</div>
                        <div>
                            <h1>Dashboard Electoral — Cundinamarca</h1>
                            <div className="sub">Partido Liberal Colombiano · Analisis de Prioridad Municipal</div>
                        </div>
                    </div>
                    <div className="hdr-center">
                        <div className="hc-stat">
                            <div className="hc-lbl">Partido Liberal (Cam)</div>
                            <div className="hc-row"><span className="hc-val" id="hCamPL">—</span><span className="hc-pct" id="hCamPLpct">—</span></div>
                        </div>
                        <div className="hc-stat" style={{ color: '#ffd700' }}>
                            <div className="hc-lbl" style={{ color: 'rgba(255,215,0,0.7)' }}>Alex Prieto</div>
                            <div className="hc-row"><span className="hc-val" id="hAlex">—</span><span className="hc-pct" id="hAlexPct" style={{ color: 'rgba(255,215,0,0.6)' }}>—</span></div>
                        </div>
                        <div className="hc-stat">
                            <div className="hc-lbl">Oscar Sanchez (Sen)</div>
                            <div className="hc-row"><span className="hc-val" id="hOscar">—</span><span className="hc-pct" id="hOscarPct">—</span></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 1 }}>
                        <button className="toggle-tables-btn" onClick={() => setTablesOpen(!tablesOpen)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {tablesOpen
                                    ? <><path d="M18 15l-6-6-6 6" /></>
                                    : <><path d="M6 9l6 6 6-6" /></>
                                }
                            </svg>
                            {tablesOpen ? 'Ocultar tablas' : 'Mostrar tablas'}
                        </button>
                        <span className="header-date" id="dateLabel"></span>
                    </div>
                </header>

                {/* SUMMARY TABLES + FILTERS (collapsible) */}
                {tablesOpen && <>
                {/* ROW 1: CAMARA + SENADO side by side (original layout) */}
                <div className="table-summary-container">
                    <table className="summary-table" style={{ flex: 1 }}>
                        <thead>
                            <tr>
                                <th colSpan={7} style={{ textAlign: 'center', background: 'rgba(227,33,23,0.1)', color: '#e32117', borderBottom: '2px solid #e32117' }}>
                                    RESULTADOS CAMARA DE REPRESENTANTES
                                </th>
                            </tr>
                            <tr>
                                <th>Prio.</th>
                                <th style={{ textAlign: 'center' }}>Mun.</th>
                                <th>Tot. Votos</th>
                                <th style={{ color: '#d97706' }}>V. Alex</th>
                                <th>V. Partido</th>
                                <th>% Alex</th>
                                <th>% Partido</th>
                            </tr>
                        </thead>
                        <tbody id="summaryTableBodyCamara">
                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>Cargando datos Camara...</td></tr>
                        </tbody>
                    </table>
                    <table className="summary-table" style={{ maxWidth: 300 }}>
                        <thead>
                            <tr>
                                <th colSpan={3} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.05)', color: '#1E293B', borderBottom: '2px solid #1E293B' }}>
                                    RESULTADOS SENADO
                                </th>
                            </tr>
                            <tr>
                                <th>Meta</th>
                                <th>L10 Oscar S.</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody id="summaryTableBodySenado">
                            <tr>
                                <td className="val" style={{ fontSize: '1.1rem' }}>100,000</td>
                                <td className="val" id="stSenVotos" style={{ fontSize: '1.1rem', color: '#e32117' }}>—</td>
                                <td className="pct" id="stSenPct" style={{ fontSize: '1.1rem' }}>—</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* ROW 2: COTA full width */}
                <div className="table-summary-container">
                    <table className="summary-table" style={{ flex: 1 }}>
                        <thead>
                            <tr>
                                <th colSpan={8} style={{ textAlign: 'center', background: 'rgba(34,139,34,0.1)', color: '#228B22', borderBottom: '2px solid #228B22' }}>
                                    RESULTADOS DE COTA
                                </th>
                            </tr>
                            <tr>
                                <th>Puesto</th>
                                <th>Total Votos</th>
                                <th>Mesas</th>
                                <th>Completadas</th>
                                <th>% Comp.</th>
                                <th style={{ color: '#d97706' }}>Votos Alex</th>
                                <th>Votos Partido</th>
                                <th>Votos Senado</th>
                            </tr>
                        </thead>
                        <tbody id="cotaTableBody">
                            <tr><td colSpan={8} style={{ textAlign: 'center' }}>Cargando datos Cota...</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* FILTERS */}
                <div className="filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">Prioridad</span>
                        <select id="fPrio" className="filter-select">
                            <option value="ALL">Todas</option>
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Media</option>
                            <option value="BAJA">Baja</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Provincia</span>
                        <select id="fProv" className="filter-select">
                            <option value="ALL">Todas</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Municipio</span>
                        <select id="fMuni" className="filter-select">
                            <option value="ALL">Todos</option>
                        </select>
                    </div>
                    <button className="btn-reset" id="btnReset">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Ver Todo Cundinamarca
                    </button>
                </div>
                </>}

                {/* MAIN BODY — map takes full width */}
                <div className="main-body">
                    <div id="map"><svg id="mapSvg"></svg></div>
                </div>
            </div>

            {/* PROVINCE SUMMARY — grid below the map */}
            <div id="sidebar">
                <div className="sb-header">
                    <div className="sb-title">Resumen por Provincia</div>
                </div>
                <div className="sb-content" id="sbContent"></div>
            </div>

            {/* TOOLTIP */}
            <div id="tooltip">
                <div className="tt-header">
                    <div>
                        <div className="tt-name" id="ttName"></div>
                        <div className="tt-prov" id="ttProv"></div>
                    </div>
                    <div className="tt-prio" id="ttPrio"></div>
                </div>
                <div className="tt-section">
                    <div className="tt-stitle">Camara (Partido Liberal)</div>
                    <div className="tt-row"><span className="lbl">Votos del Partido</span><span className="val" id="ttCVT">—</span></div>
                    <div className="tt-row highlight"><span className="lbl" style={{ color: '#fff' }}>Votos Alex Prieto</span><span className="val" id="ttCVA" style={{ color: '#e32117' }}>—</span></div>
                    <div className="tt-row"><span className="lbl">% del Total Votantes</span><span className="val" id="ttCPV">—</span></div>
                </div>
                <div className="tt-section">
                    <div className="tt-stitle">Senado</div>
                    <div className="tt-row highlight"><span className="lbl" style={{ color: '#fff' }}>Votos Oscar Sanchez</span><span className="val" id="ttSVO" style={{ color: '#e32117' }}>—</span></div>
                </div>
            </div>

            {/* DETAIL PANEL */}
            <div id="panel">
                <div className="ph">
                    <button className="pc-close" id="panelCloseBtn">&#10005;</button>
                    <div className="p-badge" id="pPrioBadge"></div>
                    <div className="pm" id="pMuni"></div>
                    <div className="pp" id="pProv"></div>
                </div>
                <div className="ps">
                    <div className="ps-head">
                        <div className="ps-icon">L</div>
                        <h3>Camara de Representantes</h3>
                    </div>
                    <div className="data-grid">
                        <div className="data-box">
                            <div className="db-label">Votos Totales Partido Liberal</div>
                            <div className="db-val" id="pCVT">—</div>
                        </div>
                        <div className="data-row">
                            <div className="data-subbox">
                                <div className="db-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Votos Alex Prieto</div>
                                <div className="db-val" id="pCVA" style={{ color: '#e32117' }}>—</div>
                            </div>
                            <div className="data-subbox">
                                <div className="db-label">Participacion</div>
                                <div className="db-val" id="pCPV">—</div>
                                <div className="db-sub">% de votantes total</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ps">
                    <div className="ps-head">
                        <div className="ps-icon" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>S</div>
                        <h3>Senado de la Republica</h3>
                    </div>
                    <div className="data-grid">
                        <div className="data-box" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="db-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Votos Oscar Sanchez</div>
                            <div className="db-val" id="pSVO" style={{ color: '#fff' }}>—</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEGEND TOGGLE */}
            {!legendOpen && (
                <button className="legend-toggle" onClick={() => setLegendOpen(true)} title="Mostrar totales">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
            )}

            {/* LEGEND */}
            <div id="legend" style={{ display: legendOpen ? 'block' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: '0.8rem', margin: 0 }}>Totales Estrategicos</h4>
                    <button onClick={() => setLegendOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem', padding: '2px 6px', borderRadius: 4, lineHeight: 1 }} title="Ocultar">&#10005;</button>
                </div>
                <div className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 10, background: 'rgba(227,33,23,0.08)', border: '1px solid rgba(227,33,23,0.2)', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                        <div className="li-left" style={{ fontWeight: 800, color: '#e32117' }}><div className="ls" style={{ background: '#e32117' }}></div>PRIORIDAD ALTA</div>
                        <div className="l-count" id="lAlta" style={{ color: '#e32117' }}>—</div>
                    </div>
                    <div style={{ width: '100%', fontSize: '0.65rem', color: '#334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span>Votos Partido:</span> <b id="lAltaV">—</b></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: '#e32117', color: '#fff', borderRadius: 4 }}><span>Votos Alex Prieto:</span> <b id="lAltaA">—</b></div>
                    </div>
                </div>
                <div className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 10, background: 'rgba(240,116,110,0.08)', border: '1px solid rgba(240,116,110,0.2)', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                        <div className="li-left" style={{ fontWeight: 800, color: '#f0746e' }}><div className="ls" style={{ background: '#f0746e' }}></div>PRIORIDAD MEDIA</div>
                        <div className="l-count" id="lMedia" style={{ color: '#f0746e' }}>—</div>
                    </div>
                    <div style={{ width: '100%', fontSize: '0.65rem', color: '#334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span>Votos Partido:</span> <b id="lMediaV">—</b></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: '#f0746e', color: '#fff', borderRadius: 4 }}><span>Votos Alex Prieto:</span> <b id="lMediaA">—</b></div>
                    </div>
                </div>
                <div className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 10, background: 'rgba(249,194,192,0.15)', border: '1px solid rgba(249,194,192,0.4)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                        <div className="li-left" style={{ fontWeight: 800, color: '#f9c2c0' }}><div className="ls" style={{ background: '#f9c2c0' }}></div>PRIORIDAD BAJA</div>
                        <div className="l-count" id="lBaja" style={{ color: '#f9c2c0' }}>—</div>
                    </div>
                    <div style={{ width: '100%', fontSize: '0.65rem', color: '#334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span>Votos Partido:</span> <b id="lBajaV">—</b></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: '#f9c2c0', color: '#0F172A', borderRadius: 4 }}><span>Votos Alex Prieto:</span> <b id="lBajaA">—</b></div>
                    </div>
                </div>
            </div>
        </>
    )
}
