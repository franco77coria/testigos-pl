'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface MesaStatus {
    mesa_numero: number
    testigo_nombre: string
    testigo_cedula: string
    camara_guardado: boolean
    senado_guardado: boolean
    conteo_8am: boolean
    conteo_11am: boolean
    conteo_1pm: boolean
    foto_camara: boolean
    foto_senado: boolean
    estado: string
}

interface PuestoData {
    municipio: string
    puesto: string
    mesas: MesaStatus[]
    total: number
    completadas: number
}

interface Resumen {
    totalMesas: number
    completadas: number
    puestos: number
}

const INDICADORES = [
    { key: 'conteo_8am', label: '8H' },
    { key: 'conteo_11am', label: '11H' },
    { key: 'conteo_1pm', label: '1P' },
    { key: 'foto_senado', label: 'F.S' },
    { key: 'senado_guardado', label: 'SEN' },
    { key: 'foto_camara', label: 'F.C' },
    { key: 'camara_guardado', label: 'CÁM' },
]

export default function MonitorPage() {
    const [puestos, setPuestos] = useState<PuestoData[]>([])
    const [municipios, setMunicipios] = useState<string[]>([])
    const [filtro, setFiltro] = useState('')
    const [resumen, setResumen] = useState<Resumen>({ totalMesas: 0, completadas: 0, puestos: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedPuesto, setExpandedPuesto] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(30)

    // Auth gate
    const [authorized, setAuthorized] = useState(false)
    const [gateCedula, setGateCedula] = useState('')
    const [gateLoading, setGateLoading] = useState(false)
    const [gateError, setGateError] = useState('')

    async function verifyAccess() {
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
                fetchData()
            } else {
                setGateError('No tiene acceso al monitor. Contacte al Super Admin.')
            }
        } catch {
            setGateError('Error de conexión.')
        }
        setGateLoading(false)
    }

    const fetchData = useCallback(async (muni?: string) => {
        setRefreshing(true)
        try {
            const url = muni ? `/api/admin/monitor?municipio=${encodeURIComponent(muni)}` : '/api/admin/monitor'
            const res = await fetch(url)
            const data = await res.json()
            if (data.exito) {
                setPuestos(data.puestos)
                setMunicipios(data.municipios || [])
                setResumen(data.resumen)
            }
        } catch { /* silent */ }
        setLoading(false)
        setRefreshing(false)
        setCountdown(30)
    }, [])

    useEffect(() => {
        if (authorized) {
            const interval = setInterval(() => fetchData(filtro || undefined), 30000)
            const ticker = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
            return () => { clearInterval(interval); clearInterval(ticker) }
        }
    }, [authorized, filtro, fetchData])

    function handleFiltro(muni: string) {
        setFiltro(muni)
        setLoading(true)
        fetchData(muni || undefined)
    }

    const porcentaje = resumen.totalMesas > 0
        ? Math.round((resumen.completadas / resumen.totalMesas) * 100)
        : 0

    // ========== AUTH GATE ==========
    if (!authorized) {
        return (
            <div style={{
                minHeight: '100vh', background: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px', fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{
                    width: '100%', maxWidth: '380px',
                    background: '#FFFFFF', borderRadius: '24px',
                    padding: '40px 32px', textAlign: 'center',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                    border: '1px solid #E2E8F0',
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'rgba(206,17,38,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#CE1126' }}>monitoring</span>
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        Monitor de Mesas
                    </h1>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', marginBottom: '24px' }}>
                        Ingrese su cédula para acceder.
                    </p>
                    <input
                        type="text" inputMode="numeric"
                        placeholder="Cédula"
                        value={gateCedula}
                        onChange={e => setGateCedula(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verifyAccess()}
                        style={{
                            width: '100%', padding: '14px 16px', borderRadius: '14px',
                            border: '1px solid #E2E8F0', background: '#F8FAFC',
                            fontSize: '16px', fontWeight: 500, color: '#0F172A',
                            textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                            fontFamily: "'Inter', system-ui, sans-serif", marginBottom: '12px',
                        }}
                    />
                    <button onClick={verifyAccess}
                        disabled={gateLoading || !gateCedula.trim()}
                        style={{
                            width: '100%', padding: '15px', borderRadius: '14px',
                            border: 'none', background: '#CE1126', color: 'white',
                            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            boxShadow: '0 4px 14px rgba(206,17,38,0.2)',
                            opacity: (!gateCedula.trim() || gateLoading) ? 0.5 : 1,
                        }}
                    >{gateLoading ? 'Verificando...' : 'Acceder'}</button>
                    {gateError && (
                        <p style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{gateError}</p>
                    )}
                    <Link href="/" style={{
                        display: 'block', marginTop: '20px', fontSize: '13px',
                        fontWeight: 600, color: '#94A3B8', textDecoration: 'none',
                    }}>Volver al portal</Link>
                </div>
            </div>
        )
    }

    // ========== LOADING ==========
    if (loading) {
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
                    <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Cargando monitor...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#F0F2F5',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            WebkitFontSmoothing: 'antialiased',
        }}>
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
                            background: '#F8F9FA', border: '1px solid #E5E7EB', textDecoration: 'none',
                            color: '#94A3B8',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        </Link>
                        <div>
                            <h1 style={{
                                fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 700, color: '#111827',
                                margin: 0, display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                Monitor de Mesas
                                <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: '#10B981', display: 'inline-block',
                                    animation: 'pulse-dot 2s ease-in-out infinite',
                                }} />
                            </h1>
                            <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>
                                Vista de mesas — {countdown}s
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchData(filtro || undefined) }}
                        disabled={refreshing}
                        style={{
                            background: 'rgba(206,17,38,0.1)', border: 'none', color: '#CE1126',
                            padding: '8px', borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                            opacity: refreshing ? 0.5 : 1,
                        }}
                    >
                        <span className="material-symbols-outlined" style={{
                            fontSize: '18px', animation: refreshing ? 'spin 1s linear infinite' : 'none'
                        }}>sync</span>
                    </button>
                </div>
            </header>

            {/* Stats ribbon */}
            <div style={{
                background: '#FFFFFF', padding: 'clamp(12px, 2vw, 20px)',
                borderBottom: '1px solid #E5E7EB',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 64px)', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{resumen.totalMesas}</div>
                    <div style={{ fontSize: 'clamp(8px, 0.8vw, 12px)', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Total Mesas</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 64px)', fontWeight: 700, color: '#10B981', lineHeight: 1 }}>{resumen.completadas}</div>
                    <div style={{ fontSize: 'clamp(8px, 0.8vw, 12px)', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Completadas</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 64px)', fontWeight: 700, color: '#CE1126', lineHeight: 1 }}>{porcentaje}%</div>
                    <div style={{ fontSize: 'clamp(8px, 0.8vw, 12px)', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Progreso</div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#FFFFFF', padding: '0 clamp(12px, 2vw, 20px) clamp(12px, 2vw, 20px)', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ height: 'clamp(6px, 0.8vw, 10px)', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '4px',
                        background: 'linear-gradient(90deg, #CE1126, #10B981)',
                        width: `${porcentaje}%`, transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>

            {/* Filter */}
            <div style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={filtro}
                        onChange={(e) => handleFiltro(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 40px 12px 16px',
                            background: '#FFFFFF', border: '1px solid #E5E7EB',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                            color: '#111827', appearance: 'none', outline: 'none', cursor: 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                    >
                        <option value="">Todos los municipios</option>
                        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>expand_more</span>
                    </div>
                </div>
            </div>

            {/* Leyenda */}
            <div style={{
                padding: '0 clamp(12px, 2vw, 20px) 12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            }}>
                {INDICADORES.map(ind => (
                    <span key={ind.key} style={{
                        fontSize: 'clamp(8px, 0.8vw, 11px)', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                        background: '#F3F4F6', color: '#374151',
                    }}>{ind.label}</span>
                ))}
                <span style={{ fontSize: 'clamp(8px, 0.8vw, 11px)', fontWeight: 600, color: '#94A3B8', marginLeft: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#10B981', verticalAlign: 'middle', marginRight: '3px' }} />listo
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#FEE2E2', verticalAlign: 'middle', marginLeft: '8px', marginRight: '3px' }} />pendiente
                </span>
            </div>

            {/* Puestos list */}
            <div style={{ padding: '0 clamp(12px, 2vw, 20px) 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {puestos.length === 0 ? (
                    <div style={{
                        background: '#FFFFFF', borderRadius: '12px', padding: '40px 24px',
                        textAlign: 'center', border: '1px solid #E5E7EB',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E5E7EB', display: 'block', marginBottom: '8px' }}>search_off</span>
                        <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 500 }}>No se encontraron mesas.</p>
                    </div>
                ) : (
                    puestos.map((p) => {
                        const key = `${p.municipio}__${p.puesto}`
                        const isExpanded = expandedPuesto === key
                        const pctPuesto = p.total > 0 ? Math.round((p.completadas / p.total) * 100) : 0

                        return (
                            <div key={key} style={{
                                background: '#FFFFFF', borderRadius: '12px',
                                border: '1px solid #E5E7EB', overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}>
                                <div
                                    onClick={() => setExpandedPuesto(isExpanded ? null : key)}
                                    style={{
                                        padding: 'clamp(10px, 1.2vw, 16px) clamp(12px, 1.5vw, 20px)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: isExpanded ? '#FAFBFC' : '#FFFFFF',
                                        borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CE1126' }}>location_on</span>
                                            <span style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', fontWeight: 700, color: '#111827' }}>{p.puesto}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', color: '#94A3B8', fontWeight: 500 }}>{p.municipio}</span>
                                            <span style={{
                                                fontSize: 'clamp(9px, 0.8vw, 12px)', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                                                background: pctPuesto === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: pctPuesto === 100 ? '#10B981' : '#F59E0B',
                                            }}>
                                                {p.completadas}/{p.total}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined" style={{
                                        color: '#94A3B8', fontSize: '20px',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.2s',
                                    }}>expand_more</span>
                                </div>

                                {/* Mesa cards — grid TV-ready */}
                                {isExpanded && (
                                    <div style={{ padding: 'clamp(8px, 1vw, 16px)' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(100px, 10vw, 160px), 1fr))',
                                            gap: 'clamp(6px, 0.8vw, 10px)',
                                        }}>
                                            {p.mesas.map((mesa) => {
                                                const allDone = mesa.camara_guardado && mesa.senado_guardado

                                                return (
                                                    <div key={mesa.mesa_numero} style={{
                                                        padding: 'clamp(8px, 1vw, 14px)',
                                                        borderRadius: '10px', textAlign: 'center',
                                                        background: allDone ? 'rgba(16,185,129,0.04)' : '#FFFFFF',
                                                        border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                                                    }}>
                                                        {/* Mesa number */}
                                                        <div style={{
                                                            fontSize: 'clamp(14px, 1.5vw, 24px)', fontWeight: 700,
                                                            color: allDone ? '#10B981' : '#111827', marginBottom: '4px',
                                                        }}>{mesa.mesa_numero}</div>

                                                        {/* Testigo name */}
                                                        {mesa.testigo_nombre && (
                                                            <div style={{
                                                                fontSize: 'clamp(8px, 0.7vw, 10px)', color: '#94A3B8',
                                                                fontWeight: 500, marginBottom: '6px',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            }}>
                                                                {mesa.testigo_nombre}
                                                            </div>
                                                        )}

                                                        {/* 7 indicators */}
                                                        <div style={{
                                                            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px',
                                                        }}>
                                                            {INDICADORES.map(ind => {
                                                                const val = mesa[ind.key as keyof MesaStatus] as boolean
                                                                return (
                                                                    <div key={ind.key} style={{
                                                                        height: 'clamp(18px, 2vw, 28px)',
                                                                        borderRadius: '3px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 'clamp(7px, 0.6vw, 9px)', fontWeight: 700,
                                                                        background: val ? '#10B981' : '#FEE2E2',
                                                                        color: val ? 'white' : '#EF4444',
                                                                    }}>
                                                                        {ind.label}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    )
}
