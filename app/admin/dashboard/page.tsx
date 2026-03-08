'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

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
    mesas: MesaResult[]
}

interface MunicipioResult {
    municipio: string
    totalMesas: number
    completadas: number
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

export default function AdminStats() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(false)

    // Auth gate
    const [authorized, setAuthorized] = useState(false)
    const [rol, setRol] = useState<'super' | 'viewer'>('viewer')
    const [gateCedula, setGateCedula] = useState('')
    const [gateLoading, setGateLoading] = useState(false)
    const [gateError, setGateError] = useState('')

    // UI states
    const [expandedMuni, setExpandedMuni] = useState<string | null>(null)
    const [photoModal, setPhotoModal] = useState<{ mesa: number; urls: string[] } | null>(null)
    const [countdown, setCountdown] = useState(30)

    // Conteo data (super admin only)
    const [conteo, setConteo] = useState<{
        habilitados: number; reporte10am: number; reporte1pm: number
        alexP: number; senadoPl: number; oscarSanchez: number; camaraCun: number
    } | null>(null)

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
            const res = await fetch('/api/admin/monitor')
            const json = await res.json()
            if (json.exito) {
                const muniMap = new Map<string, PuestoResult[]>()
                for (const p of json.puestos) {
                    if (!muniMap.has(p.municipio)) muniMap.set(p.municipio, [])
                    muniMap.get(p.municipio)!.push({
                        puesto: p.puesto,
                        totalMesas: p.total,
                        completadas: p.completadas,
                        mesas: p.mesas,
                    })
                }

                const municipios: MunicipioResult[] = []
                for (const [muni, puestos] of muniMap) {
                    municipios.push({
                        municipio: muni,
                        totalMesas: puestos.reduce((s, p) => s + p.totalMesas, 0),
                        completadas: puestos.reduce((s, p) => s + p.completadas, 0),
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
            }

            // Fetch conteo data for super admin
            if (rol === 'super') {
                const resDash = await fetch('/api/admin/dashboard')
                const jsonDash = await resDash.json()
                if (jsonDash.exito && jsonDash.data?.conteo) {
                    setConteo(jsonDash.data.conteo)
                }
            }
        } catch { /* silent */ }
        setLoading(false)
        setCountdown(30)
    }, [rol])

    useEffect(() => {
        if (authorized) {
            const interval = setInterval(fetchStats, 30000)
            const ticker = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
            return () => { clearInterval(interval); clearInterval(ticker) }
        }
    }, [authorized, fetchStats])

    const pct = data ? (data.resumen.totalMesas > 0 ? Math.round((data.resumen.completadas / data.resumen.totalMesas) * 100) : 0) : 0

    // Contar mesas con foto
    const mesasConFoto = data ? data.municipios.reduce((sum, m) =>
        sum + m.puestos.reduce((ps, p) =>
            ps + p.mesas.filter(mesa => mesa.foto_camara || mesa.foto_senado).length, 0), 0) : 0

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

    // =================== LOADING ===================
    if (loading && !data) {
        return (
            <div style={{
                minHeight: '100vh', background: '#F0F2F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid #E5E7EB',
                        borderTopColor: '#CE1126', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                    }} />
                    <p style={{ color: '#94A3B8', fontSize: '13px' }}>Cargando estadísticas...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                borderBottom: '1px solid #E5E7EB',
                position: 'sticky', top: 0, zIndex: 20,
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
                                    Estadísticas en Vivo
                                </h1>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#10B981', animation: 'pulse 2s infinite',
                                }} />
                            </div>
                            <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                                {rol === 'super' ? 'Super Admin' : 'Viewer'} — {countdown}s
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
                                fontSize: '11px', fontWeight: 700,
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}
                            title="Cerrar sesión"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span>
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <style>{`
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 480px) {
                    .kpi-grid-dash { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>

            {/* =================== KPI CARDS =================== */}
            {data && (
                <>
                    <div style={{ padding: 'clamp(12px, 2vw, 24px)', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                        <div className="kpi-grid-dash" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(6px, 1vw, 16px)',
                            marginBottom: 'clamp(10px, 1.5vw, 20px)',
                        }}>
                            {[
                                { value: data.resumen.totalMesas, label: 'Mesas', color: '#111827' },
                                { value: data.resumen.completadas, label: 'Completas', color: '#10B981' },
                                { value: pct, label: '% Progreso', color: '#CE1126', suffix: '%' },
                                { value: mesasConFoto, label: 'Con Foto', color: '#3B82F6' },
                            ].map((kpi, i) => (
                                <div key={i} style={{
                                    textAlign: 'center', padding: 'clamp(8px, 1.5vw, 16px)',
                                    borderRadius: '12px', background: '#FAFBFC', border: '1px solid #E5E7EB',
                                }}>
                                    <div style={{
                                        fontSize: 'clamp(24px, 4vw, 96px)', fontWeight: 800, color: kpi.color,
                                        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
                                    }}>
                                        <AnimatedNumber value={kpi.value} />{kpi.suffix || ''}
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(8px, 1vw, 14px)', fontWeight: 700, color: '#94A3B8',
                                        textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px',
                                    }}>{kpi.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: 'clamp(6px, 1vw, 12px)', background: '#E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: '6px',
                                    background: pct >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                        pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #10B981)' :
                                            'linear-gradient(90deg, #CE1126, #F59E0B)',
                                    width: `${pct}%`, transition: 'width 1s ease-out',
                                }} />
                            </div>
                            <span style={{
                                fontSize: 'clamp(12px, 1.5vw, 20px)', fontWeight: 800,
                                color: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#CE1126',
                                fontVariantNumeric: 'tabular-nums', minWidth: '50px', textAlign: 'right',
                            }}><AnimatedNumber value={pct} />%</span>
                        </div>
                    </div>

                    {/* =================== CONTEO (SUPER ONLY) =================== */}
                    {rol === 'super' && conteo && (
                        <div style={{ padding: 'clamp(12px, 2vw, 24px)', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{
                                fontSize: 'clamp(10px, 1vw, 14px)', fontWeight: 700, color: '#94A3B8',
                                textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'clamp(8px, 1vw, 16px)',
                            }}>Conteo de Votos</div>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                gap: 'clamp(6px, 1vw, 12px)',
                            }}>
                                {[
                                    { label: 'Habilitados', value: conteo.habilitados, color: '#6366F1' },
                                    { label: 'Reporte 10am', value: conteo.reporte10am, color: '#F59E0B' },
                                    { label: 'Reporte 1pm', value: conteo.reporte1pm, color: '#F97316' },
                                    { label: 'Alex P.', value: conteo.alexP, color: '#CE1126' },
                                    { label: 'Senado PL', value: conteo.senadoPl, color: '#DC2626' },
                                    { label: 'Oscar Sánchez', value: conteo.oscarSanchez, color: '#BE123C' },
                                    { label: 'Cámara Cund.', value: conteo.camaraCun, color: '#9F1239' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        textAlign: 'center', padding: 'clamp(6px, 1vw, 12px)',
                                        borderRadius: '10px', background: '#FAFBFC', border: '1px solid #E5E7EB',
                                    }}>
                                        <div style={{
                                            fontSize: 'clamp(18px, 3vw, 48px)', fontWeight: 800,
                                            color: item.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
                                        }}>
                                            <AnimatedNumber value={item.value} />
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(7px, 0.8vw, 11px)', fontWeight: 700,
                                            color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px',
                                        }}>{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* =================== MUNICIPIO TABLE =================== */}
                    <div style={{ padding: 'clamp(10px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: muniExpanded ? '#FAFBFC' : '#FFFFFF',
                                            borderBottom: muniExpanded ? '1px solid #E5E7EB' : 'none',
                                            border: 'none', textAlign: 'left',
                                            fontFamily: "'Inter', system-ui, sans-serif",
                                        }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E5E7EB', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: muniPct === 100 ? '#10B981' : '#F59E0B', width: `${muniPct}%` }} />
                                            </div>
                                            <span style={{
                                                fontSize: 'clamp(9px, 0.9vw, 13px)', fontWeight: 700, padding: '2px 8px', borderRadius: '8px',
                                                background: muniPct === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                                                color: muniPct === 100 ? '#10B981' : '#F59E0B',
                                            }}>{muni.completadas}/{muni.totalMesas}</span>
                                        </div>
                                    </button>

                                    {muniExpanded && (
                                        <div style={{ padding: '8px' }}>
                                            {muni.puestos.map(puesto => (
                                                <div key={puesto.puesto} style={{ marginBottom: '8px' }}>
                                                    <div style={{
                                                        fontSize: 'clamp(10px, 1vw, 13px)', fontWeight: 700, color: '#111827',
                                                        padding: '6px 8px', display: 'flex', justifyContent: 'space-between',
                                                    }}>
                                                        <span>{puesto.puesto}</span>
                                                        <span style={{
                                                            color: puesto.completadas === puesto.totalMesas ? '#10B981' : '#F59E0B',
                                                            fontWeight: 700,
                                                        }}>{puesto.completadas}/{puesto.totalMesas}</span>
                                                    </div>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(70px, 8vw, 120px), 1fr))',
                                                        gap: '6px', padding: '0 4px',
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
                                                                        display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px', flexWrap: 'wrap',
                                                                    }}>
                                                                        {[
                                                                            { v: mesa.conteo_8am, l: '8H' },
                                                                            { v: mesa.conteo_11am, l: '11' },
                                                                            { v: mesa.conteo_1pm, l: '1P' },
                                                                            { v: mesa.foto_senado, l: 'FS' },
                                                                            { v: mesa.senado_guardado, l: 'SN' },
                                                                            { v: mesa.foto_camara, l: 'FC' },
                                                                            { v: mesa.camara_guardado, l: 'CM' },
                                                                        ].map((item, i) => (
                                                                            <div key={i} style={{
                                                                                width: 'clamp(10px, 1.2vw, 16px)',
                                                                                height: 'clamp(10px, 1.2vw, 16px)',
                                                                                borderRadius: '2px',
                                                                                background: item.v ? '#10B981' : '#FEE2E2',
                                                                            }} title={item.l} />
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
                                <p style={{ color: '#94A3B8', fontSize: '14px' }}>No hay datos de mesas aún.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
