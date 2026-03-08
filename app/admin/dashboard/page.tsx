'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'

// =================== ANIMATED COUNTER ===================
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0)
    const prev = useRef(0)

    useEffect(() => {
        const start = prev.current
        const diff = value - start
        if (diff === 0) return
        const startTime = performance.now()

        function animate(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(start + diff * eased))
            if (progress < 1) requestAnimationFrame(animate)
            else prev.current = value
        }
        requestAnimationFrame(animate)
    }, [value, duration])

    return <>{display}</>
}

// =================== TYPES ===================
interface MesaResult {
    mesa_numero: number
    testigo_nombre: string
    camara_guardado: boolean
    senado_guardado: boolean
    conteo_8am: boolean
    conteo_11am: boolean
    conteo_1pm: boolean
    conteo_4pm: boolean
    foto_camara: boolean
    foto_senado: boolean
    foto_camara_url: string | null
    foto_senado_url: string | null
    foto_camara_2_url: string | null
    foto_senado_2_url: string | null
    estado: string
    updated_at: string | null
}

interface PuestoResult {
    puesto: string
    totalMesas: number
    completadas: number
    r8am: number
    r11am: number
    r1pm: number
    r4pm: number
    mesas: MesaResult[]
}

interface MunicipioResult {
    municipio: string
    totalMesas: number
    completadas: number
    r8am: number
    r11am: number
    r1pm: number
    r4pm: number
    puestos: PuestoResult[]
}

interface DashboardData {
    municipios: MunicipioResult[]
    resumen: {
        totalMunicipios: number
        totalPuestos: number
        totalMesas: number
        completadas: number
    }
}

interface ConteoDash {
    progreso: { asignadas: number; pendientes: number; enProgreso: number; completadas: number; porcentajeTotal: number; conFotoTotal: number }
    horarios: { habilitados8am: number; conteo11am: number; conteo1pm: number; conteo4pm: number; reportes8am: number; reportes11am: number; reportes1pm: number; reportes4pm: number }
    votos: { camara: Record<string, number>; senado: Record<string, number> }
}

export default function AdminStats() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(false)

    // Auth gate
    const [authorized, setAuthorized] = useState(false)
    const [rol, setRol] = useState<'super' | 'viewer'>('viewer')
    const [gateCedula, setGateCedula] = useState('')
    const [gateLoading, setGateLoading] = useState(false)
    const [gateError, setGateError] = useState('')

    // Filters
    const [filtroMunicipio, setFiltroMunicipio] = useState('')
    const [filtroLider, setFiltroLider] = useState('')
    const [municipiosList, setMunicipiosList] = useState<string[]>([])

    // UI states
    const [expandedMuni, setExpandedMuni] = useState<string | null>(null)
    const [photoModal, setPhotoModal] = useState<{ mesa: number; urls: string[] } | null>(null)
    const [countdown, setCountdown] = useState(30)

    // Conteo data (super admin only)
    const [conteo, setConteo] = useState<ConteoDash | null>(null)

    async function verifyCedula() {
        setGateLoading(true)
        setGateError('')
        try {
            const res = await fetch('/api/admin/verify-super', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: gateCedula }),
            })
            const json = await res.json()
            if (json.exito) {
                setAuthorized(true)
                setRol(json.rol || 'viewer')
                fetchStats()
            } else {
                setGateError(json.mensaje || 'Acceso denegado.')
            }
        } catch {
            setGateError('Error de conexión.')
        }
        setGateLoading(false)
    }

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filtroMunicipio) params.append('municipio', filtroMunicipio)
            if (filtroLider) params.append('cedula_lider', filtroLider)

            const q = params.toString() ? `?${params.toString()}` : ''
            const pMonitor = fetch(`/api/admin/monitor${q}`).then(r => r.json())
            const pDash = rol === 'super' ? fetch(`/api/admin/dashboard${q}`).then(r => r.json()) : Promise.resolve(null)

            const [json, jsonDash] = await Promise.all([pMonitor, pDash])

            if (json?.exito) {
                const muniMap = new Map<string, PuestoResult[]>()
                for (const p of json.puestos) {
                    if (!muniMap.has(p.municipio)) muniMap.set(p.municipio, [])
                    const mesas: MesaResult[] = p.mesas
                    muniMap.get(p.municipio)!.push({
                        puesto: p.puesto,
                        totalMesas: p.total,
                        completadas: p.completadas,
                        r8am: mesas.filter((m: MesaResult) => m.conteo_8am).length,
                        r11am: mesas.filter((m: MesaResult) => m.conteo_11am).length,
                        r1pm: mesas.filter((m: MesaResult) => m.conteo_1pm).length,
                        r4pm: mesas.filter((m: MesaResult) => m.conteo_4pm).length,
                        mesas,
                    })
                }

                const municipios: MunicipioResult[] = []
                for (const [muni, puestos] of muniMap) {
                    municipios.push({
                        municipio: muni,
                        totalMesas: puestos.reduce((s, p) => s + p.totalMesas, 0),
                        completadas: puestos.reduce((s, p) => s + p.completadas, 0),
                        r8am: puestos.reduce((s, p) => s + p.r8am, 0),
                        r11am: puestos.reduce((s, p) => s + p.r11am, 0),
                        r1pm: puestos.reduce((s, p) => s + p.r1pm, 0),
                        r4pm: puestos.reduce((s, p) => s + p.r4pm, 0),
                        puestos,
                    })
                }
                municipios.sort((a, b) => a.municipio.localeCompare(b.municipio))

                setData({
                    municipios,
                    resumen: {
                        totalMunicipios: municipios.length,
                        totalPuestos: json.resumen.puestos,
                        totalMesas: json.resumen.totalMesas,
                        completadas: json.resumen.completadas,
                    },
                })

                // Only update the filters list if not previously loaded
                if (json.municipios && municipiosList.length === 0) {
                    setMunicipiosList(json.municipios)
                }
            }

            // Process conteo data for super admin
            if (jsonDash?.exito && jsonDash.data) {
                setConteo(jsonDash.data)
            }
        } catch { /* silent */ }
        setLoading(false)
        setCountdown(30)
    }, [rol, filtroMunicipio, filtroLider, municipiosList.length])

    useEffect(() => {
        if (authorized) {
            const interval = setInterval(fetchStats, 30000)
            const ticker = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
            return () => { clearInterval(interval); clearInterval(ticker) }
        }
    }, [authorized, fetchStats])

    // =================== GATE ===================
    if (!authorized) {
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
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#CE1126' }}>monitoring</span>
                        </div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                            Estadísticas en Vivo
                        </h1>
                        <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                            Ingrese su cédula para acceder.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" inputMode="numeric" placeholder="Ingrese su cédula"
                            value={gateCedula} onChange={e => setGateCedula(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && verifyCedula()}
                            style={{
                                width: '100%', padding: '12px 14px', border: '1px solid #E5E7EB',
                                borderRadius: '10px', fontSize: '14px', fontWeight: 500, outline: 'none',
                                fontFamily: "'Inter', system-ui, sans-serif", textAlign: 'center', boxSizing: 'border-box',
                            }}
                        />
                        <button onClick={verifyCedula} disabled={gateLoading || !gateCedula.trim()}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                background: (!gateCedula.trim() || gateLoading) ? 'rgba(206,17,38,0.4)' : '#CE1126',
                                color: 'white', fontWeight: 700, fontSize: '14px',
                                cursor: (!gateCedula.trim() || gateLoading) ? 'not-allowed' : 'pointer',
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}>{gateLoading ? 'Verificando...' : 'Acceder'}</button>
                    </div>
                    {gateError && (
                        <div style={{
                            marginTop: '12px', padding: '10px', borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#EF4444', fontSize: '12px', fontWeight: 600, textAlign: 'center',
                        }}>{gateError}</div>
                    )}
                    <Link href="/admin" style={{
                        display: 'block', textAlign: 'center', marginTop: '16px',
                        fontSize: '12px', color: '#94A3B8', textDecoration: 'none', fontWeight: 500,
                    }}>Volver al panel</Link>
                </div>
            </div>
        )
    }

    // =================== PHOTO MODAL ===================
    const photoModalEl = photoModal && (
        <div onClick={() => setPhotoModal(null)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '16px', cursor: 'pointer',
        }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                Mesa {photoModal.mesa} — {photoModal.urls.length} foto{photoModal.urls.length !== 1 ? 's' : ''}
            </div>
            <div onClick={e => e.stopPropagation()} style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                maxHeight: '80vh', overflowY: 'auto', width: '100%', maxWidth: '600px',
            }}>
                {photoModal.urls.map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i + 1}`} style={{
                        width: '100%', borderRadius: '8px', objectFit: 'contain',
                        maxHeight: '60vh', background: '#000',
                    }} />
                ))}
            </div>
            <button onClick={() => setPhotoModal(null)} style={{
                marginTop: '12px', padding: '8px 20px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>Cerrar</button>
        </div>
    )

    // Derived percentages
    const pctCompletas = conteo ? conteo.progreso.porcentajeTotal : (data ? (data.resumen.totalMesas > 0 ? Math.round((data.resumen.completadas / data.resumen.totalMesas) * 100) : 0) : 0)

    // Participación: (Votos a la 1pm) / (Habilitados 8am)
    let participaciónPct = 0
    if (conteo && conteo.horarios.habilitados8am > 0) {
        participaciónPct = Math.round((conteo.horarios.conteo1pm / conteo.horarios.habilitados8am) * 100)
    }

    // =================== MAIN DASHBOARD ===================
    return (
        <div style={{
            minHeight: '100vh', background: '#F0F2F5',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            WebkitFontSmoothing: 'antialiased',
        }}>
            {photoModalEl}

            {/* Countdown bar */}
            <div style={{ height: '3px', background: '#E5E7EB', width: '100%', position: 'relative' }}>
                <div style={{
                    height: '100%', background: '#CE1126',
                    width: `${(countdown / 30) * 100}%`, transition: 'width 1s linear',
                }} />
            </div>

            {/* Header */}
            <header style={{
                background: '#FFFFFF', padding: 'clamp(8px, 1.5vw, 16px) clamp(12px, 2vw, 24px)',
                borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link href="/admin" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#F8F9FA', border: '1px solid #E5E7EB', textDecoration: 'none', color: '#94A3B8',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        </Link>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h1 style={{ fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 700, color: '#111827', margin: 0 }}>
                                    Control Central
                                </h1>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#10B981', animation: 'pulse 2s infinite',
                                }} />
                            </div>
                            <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                                {rol === 'super' ? 'Super Admin' : 'Viewer'} — actualiza en {countdown}s
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={fetchStats}
                            style={{
                                background: 'rgba(206,17,38,0.08)', border: 'none', color: '#CE1126',
                                padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                            }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
                        </button>
                        <button
                            onClick={() => { window.location.href = '/' }}
                            style={{
                                background: '#FEE2E2', border: 'none', color: '#DC2626',
                                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '11px', fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif",
                            }} title="Cerrar sesión">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span> Salir
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                        value={filtroMunicipio}
                        onChange={(e) => { setFiltroMunicipio(e.target.value); setTimeout(fetchStats, 100); }}
                        style={{
                            padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                            fontSize: '13px', color: '#111827', outline: 'none', minWidth: '150px',
                            background: '#FAFBFC', cursor: 'pointer'
                        }}
                    >
                        <option value="">TODOS LOS MUNICIPIOS</option>
                        {municipiosList.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FAFBFC', padding: '0 12px', minWidth: '200px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#94A3B8', marginRight: '6px' }}>person_search</span>
                        <input
                            type="text"
                            placeholder="Buscar por CC del Líder"
                            value={filtroLider}
                            onChange={(e) => setFiltroLider(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchStats()}
                            style={{
                                border: 'none', background: 'transparent', outline: 'none', fontSize: '13px',
                                color: '#111827', width: '100%', padding: '8px 0'
                            }}
                        />
                        {filtroLider && (
                            <button onClick={() => { setFiltroLider(''); setTimeout(fetchStats, 100); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94A3B8' }}>close</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <style>{`
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
                @media (max-width: 480px) {
                    .kpi-grid-dash { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>

            {loading && !conteo && !data && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ width: '30px', height: '30px', border: '3px solid #E5E7EB', borderTopColor: '#CE1126', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94A3B8', fontSize: '13px' }}>Cargando datos...</p>
                </div>
            )}

            {/* =================== SUPER ADMIN KPI DASHBOARD =================== */}
            {(rol === 'super' && conteo) && (
                <div style={{ padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Sección 1: Progreso Transmisión */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3B82F6' }}>analytics</span>
                            Progreso de Escrutinio (Mesas)
                        </div>
                        <div className="kpi-grid-dash" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                            {[
                                { label: 'Asignadas', val: conteo.progreso.asignadas, color: '#64748B' },
                                { label: 'Completadas', val: conteo.progreso.completadas, color: '#10B981' },
                                { label: 'En Progreso', val: conteo.progreso.enProgreso, color: '#F59E0B' },
                                { label: 'Pendientes', val: conteo.progreso.pendientes, color: '#EF4444' },
                                { label: 'Con Imágenes', val: conteo.progreso.conFotoTotal, color: '#3B82F6' },
                            ].map((k, i) => (
                                <div key={i} style={{ background: '#FAFBFC', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 800, color: k.color }}><AnimatedNumber value={k.val} /></div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{k.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección 2: Franjas Horarias y Participación */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10B981' }}>schedule</span>
                                Votantes por Franja
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                                <div style={{ background: '#FAFBFC', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}><AnimatedNumber value={conteo.horarios.habilitados8am} /></div>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Habilitados (8am)</div>
                                    <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>{conteo.horarios.reportes8am} reportes</div>
                                </div>
                                <div style={{ background: '#FAFBFC', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}><AnimatedNumber value={conteo.horarios.conteo11am} /></div>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Conteo (11am)</div>
                                    <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>{conteo.horarios.reportes11am} reportes</div>
                                </div>
                                <div style={{ background: '#FAFBFC', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#CE1126' }}><AnimatedNumber value={conteo.horarios.conteo1pm} /></div>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Conteo (1pm)</div>
                                    <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>{conteo.horarios.reportes1pm} reportes</div>
                                </div>
                                <div style={{ background: '#FAFBFC', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#8B5CF6' }}><AnimatedNumber value={conteo.horarios.conteo4pm} /></div>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Votos (4pm)</div>
                                    <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>{conteo.horarios.reportes4pm} reportes</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participación Real (1pm)</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                                <span style={{ fontSize: '64px', fontWeight: 800, color: participaciónPct > 50 ? '#10B981' : '#F59E0B', lineHeight: 1 }}>
                                    <AnimatedNumber value={participaciónPct} />%
                                </span>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                                Basado en {conteo.horarios.habilitados8am} electores.
                            </div>
                        </div>
                    </div>

                    {/* Votos: CÁMARA */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '2px solid rgba(220, 38, 38, 0.1)', padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#DC2626', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>how_to_vote</span>
                            Recuento de Votos — CÁMARA DE REPRESENTANTES
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            {CAMARA_CANDIDATOS.map(c => (
                                <div key={c.code} style={{ background: '#FEF2F2', padding: '12px', borderRadius: '10px', border: '1px solid #FECACA', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#B91C1C' }}><AnimatedNumber value={conteo.votos.camara[c.code] || 0} /></div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F1D1D', marginTop: '4px', textTransform: 'uppercase' }}>{c.title}</div>
                                </div>
                            ))}
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569' }}><AnimatedNumber value={conteo.votos.camara['votos_camara_partido'] || 0} /></div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginTop: '4px', textTransform: 'uppercase' }}>Solo Partido</div>
                            </div>
                        </div>
                    </div>

                    {/* Votos: SENADO */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '2px solid rgba(59, 130, 246, 0.1)', padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>how_to_vote</span>
                            Recuento de Votos — SENADO
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            {SENADO_CANDIDATOS.map(c => (
                                <div key={c.code} style={{ background: '#EFF6FF', padding: '12px', borderRadius: '10px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#1D4ED8' }}><AnimatedNumber value={conteo.votos.senado[c.code] || 0} /></div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E3A8A', marginTop: '4px', textTransform: 'uppercase' }}>{c.title}</div>
                                </div>
                            ))}
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569' }}><AnimatedNumber value={conteo.votos.senado['votos_senado_partido'] || 0} /></div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginTop: '4px', textTransform: 'uppercase' }}>Solo Partido</div>
                            </div>
                        </div>
                    </div>

                </div>
            )}


            {/* =================== DETALLE POR MUNICIPIO (VIEWER & SUPER) =================== */}
            {data && (
                <div style={{ padding: '0 clamp(10px, 2vw, 24px) 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '8px 0 12px', paddingLeft: '4px' }}>
                        Detalle de Mesas ({data.resumen.totalMesas} en total)
                    </div>

                    {data.municipios.map(muni => {
                        const muniExpanded = expandedMuni === muni.municipio
                        const muniPct = muni.totalMesas > 0 ? Math.round((muni.completadas / muni.totalMesas) * 100) : 0

                        return (
                            <div key={muni.municipio} style={{
                                background: '#FFFFFF', borderRadius: '12px',
                                border: '1px solid #E5E7EB', overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}>
                                <button onClick={() => setExpandedMuni(muniExpanded ? null : muni.municipio)}
                                    style={{
                                        width: '100%', padding: 'clamp(10px, 1.2vw, 16px) clamp(12px, 1.5vw, 20px)',
                                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px',
                                        background: muniExpanded ? '#FAFBFC' : '#FFFFFF',
                                        borderBottom: muniExpanded ? '1px solid #E5E7EB' : 'none',
                                        border: 'none', textAlign: 'left', fontFamily: "'Inter', system-ui, sans-serif",
                                    }}>
                                    {/* Row 1: Name + completion */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#94A3B8' }}>
                                                {muniExpanded ? 'expand_more' : 'chevron_right'}
                                            </span>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    fontSize: 'clamp(11px, 1.2vw, 16px)', fontWeight: 700, color: '#111827',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>{muni.municipio}</div>
                                                <div style={{ fontSize: 'clamp(9px, 0.8vw, 12px)', color: '#94A3B8', fontWeight: 500 }}>
                                                    {muni.puestos.length} puesto{muni.puestos.length !== 1 ? 's' : ''} — {muni.totalMesas} mesas
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 'clamp(9px, 0.9vw, 13px)', fontWeight: 700, padding: '2px 8px', borderRadius: '8px',
                                            background: muniPct === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                                            color: muniPct === 100 ? '#10B981' : '#F59E0B', flexShrink: 0,
                                        }}>{muni.completadas}/{muni.totalMesas}</span>
                                    </div>
                                    {/* Row 2: Franja badges */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '26px' }}>
                                        {[
                                            { label: '8am', val: muni.r8am, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                                            { label: '11am', val: muni.r11am, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                                            { label: '1pm', val: muni.r1pm, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                                            { label: '4pm', val: muni.r4pm, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                                        ].map(f => (
                                            <span key={f.label} style={{
                                                fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px',
                                                background: f.bg, color: f.color, whiteSpace: 'nowrap',
                                            }}>{f.label}: {f.val}/{muni.totalMesas}</span>
                                        ))}
                                    </div>
                                </button>

                                {muniExpanded && (
                                    <div style={{ padding: '8px' }}>
                                        {muni.puestos.map(puesto => (
                                            <div key={puesto.puesto} style={{ marginBottom: '8px' }}>
                                                <div style={{
                                                    fontSize: 'clamp(10px, 1vw, 13px)', fontWeight: 700, color: '#111827',
                                                    padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    flexWrap: 'wrap', gap: '4px',
                                                }}>
                                                    <span style={{ marginRight: 'auto' }}>{puesto.puesto}</span>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        {[
                                                            { label: '8am', val: puesto.r8am, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                                                            { label: '11am', val: puesto.r11am, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                                                            { label: '1pm', val: puesto.r1pm, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                                                            { label: '4pm', val: puesto.r4pm, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                                                        ].map(f => (
                                                            <span key={f.label} style={{
                                                                fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '6px',
                                                                background: f.bg, color: f.color, whiteSpace: 'nowrap',
                                                            }}>{f.label}: {f.val}/{puesto.totalMesas}</span>
                                                        ))}
                                                        <span style={{
                                                            color: puesto.completadas === puesto.totalMesas ? '#10B981' : '#F59E0B',
                                                            fontWeight: 700, fontSize: 'clamp(10px, 1vw, 13px)',
                                                        }}>{puesto.completadas}/{puesto.totalMesas}</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                    gap: '8px', padding: '0 4px',
                                                }}>
                                                    {puesto.mesas.map(mesa => {
                                                        const done = mesa.camara_guardado && mesa.senado_guardado
                                                        const hasPhotos = mesa.foto_camara_url || mesa.foto_senado_url
                                                        const photoUrls = [mesa.foto_camara_url, mesa.foto_senado_url, mesa.foto_camara_2_url, mesa.foto_senado_2_url].filter(Boolean) as string[]

                                                        return (
                                                            <div key={mesa.mesa_numero} style={{
                                                                padding: '8px 6px', borderRadius: '8px', textAlign: 'center',
                                                                background: done ? 'rgba(16,185,129,0.06)' : '#FFFFFF',
                                                                border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                                                                position: 'relative',
                                                            }}>
                                                                <div style={{
                                                                    fontSize: 'clamp(14px, 1.5vw, 22px)', fontWeight: 700,
                                                                    color: done ? '#10B981' : '#111827',
                                                                }}>{mesa.mesa_numero}</div>

                                                                {/* 7 micro indicators */}
                                                                <div style={{
                                                                    display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px', flexWrap: 'wrap',
                                                                }}>
                                                                    {[
                                                                        { v: mesa.conteo_8am, l: '8am' },
                                                                        { v: mesa.conteo_11am, l: '11am' },
                                                                        { v: mesa.conteo_1pm, l: '1pm' },
                                                                        { v: mesa.foto_senado, l: '📸 Sen' },
                                                                        { v: mesa.senado_guardado, l: '📝 Sen' },
                                                                        { v: mesa.foto_camara, l: '📸 Cám' },
                                                                        { v: mesa.camara_guardado, l: '📝 Cám' },
                                                                    ].map((item, i) => (
                                                                        <div key={i} style={{
                                                                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                                                                            padding: '3px 5px', borderRadius: '4px',
                                                                            color: item.v ? '#FFFFFF' : '#EF4444',
                                                                            background: item.v ? '#10B981' : '#FEE2E2',
                                                                            border: `1px solid ${item.v ? '#059669' : '#FCA5A5'}`,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            whiteSpace: 'nowrap'
                                                                        }} title={item.l}>
                                                                            {item.l}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {hasPhotos && (
                                                                    <button onClick={() => setPhotoModal({ mesa: mesa.mesa_numero, urls: photoUrls })}
                                                                        style={{
                                                                            position: 'absolute', top: '2px', right: '2px',
                                                                            background: '#3B82F6', border: 'none', borderRadius: '4px',
                                                                            padding: '1px 4px', cursor: 'pointer',
                                                                        }}>
                                                                        <span style={{ fontSize: '7px', fontWeight: 700, color: 'white' }}>{photoUrls.length}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {data.municipios.length === 0 && (
                        <div style={{
                            background: '#FFFFFF', borderRadius: '12px', padding: '40px',
                            textAlign: 'center', border: '1px solid #E5E7EB',
                        }}>
                            <p style={{ color: '#94A3B8', fontSize: '14px' }}>No hay datos de mesas con estos filtros.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
