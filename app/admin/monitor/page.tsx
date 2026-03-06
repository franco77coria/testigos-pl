'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MesaStatus {
    mesa_numero: number
    testigo_nombre: string
    testigo_cedula: string
    votos_camara: boolean
    votos_senado: boolean
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

export default function MonitorPage() {
    const [puestos, setPuestos] = useState<PuestoData[]>([])
    const [municipios, setMunicipios] = useState<string[]>([])
    const [filtro, setFiltro] = useState('')
    const [resumen, setResumen] = useState<Resumen>({ totalMesas: 0, completadas: 0, puestos: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedPuesto, setExpandedPuesto] = useState<string | null>(null)

    // Auth gate
    const [authorized, setAuthorized] = useState(false)
    const [gateCedula, setGateCedula] = useState('')
    const [gateLoading, setGateLoading] = useState(false)
    const [gateError, setGateError] = useState('')

    async function verifyAccess() {
        setGateLoading(true)
        setGateError('')
        try {
            // Check if cedula is in admins table OR estadisticas_acceso
            const res = await fetch('/api/admin/verify-super', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: gateCedula }),
            })
            const json = await res.json()
            if (json.exito) {
                // Both 'super' and 'viewer' roles can see the monitor
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

    async function fetchData(muni?: string) {
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
    }

    useEffect(() => {
        if (authorized) {
            const interval = setInterval(() => fetchData(filtro || undefined), 30000)
            return () => clearInterval(interval)
        }
    }, [authorized, filtro])

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
                        <span style={{ fontSize: '24px' }}>📊</span>
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        Monitor de Mesas
                    </h1>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', marginBottom: '24px' }}>
                        Ingrese su cédula para acceder al monitor.
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
                    }}>← Volver al portal</Link>
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
            display: 'flex', justifyContent: 'center',
        }}>
            <div style={{
                width: '100%', maxWidth: '640px',
                minHeight: '100vh', position: 'relative',
            }}>
                {/* Red accent */}
                <div style={{ height: '3px', background: '#CE1126', width: '100%' }} />

                {/* Header */}
                <header style={{
                    background: '#FFFFFF', padding: '12px 16px',
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
                                <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Monitor de Mesas
                                    <span style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: '#10B981', display: 'inline-block',
                                        animation: 'pulse-dot 2s ease-in-out infinite',
                                    }} />
                                </h1>
                                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                                    Vista de líder provincial
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
                    background: '#FFFFFF', padding: '16px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{resumen.totalMesas}</div>
                        <div style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>Total Mesas</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#10B981', lineHeight: 1 }}>{resumen.completadas}</div>
                        <div style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>Completadas</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#CE1126', lineHeight: 1 }}>{porcentaje}%</div>
                        <div style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>Progreso</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: '#FFFFFF', padding: '0 16px 16px', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: '3px',
                            background: 'linear-gradient(90deg, #CE1126, #10B981)',
                            width: `${porcentaje}%`, transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>

                {/* Filter */}
                <div style={{ padding: '16px', background: '#F0F2F5' }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={filtro}
                            onChange={(e) => handleFiltro(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 40px 12px 16px',
                                background: '#FFFFFF', border: '1px solid #E5E7EB',
                                borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                                color: '#111827', appearance: 'none', WebkitAppearance: 'none',
                                outline: 'none', cursor: 'pointer',
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

                {/* Puestos list */}
                <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {puestos.length === 0 ? (
                        <div style={{
                            background: '#FFFFFF', borderRadius: '12px', padding: '40px 24px',
                            textAlign: 'center', border: '1px solid #E5E7EB',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E5E7EB', display: 'block', marginBottom: '8px' }}>search_off</span>
                            <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 500 }}>No se encontraron mesas asignadas.</p>
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
                                    {/* Puesto header */}
                                    <div
                                        onClick={() => setExpandedPuesto(isExpanded ? null : key)}
                                        style={{
                                            padding: '14px 16px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: isExpanded ? '#FAFBFC' : '#FFFFFF',
                                            borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CE1126' }}>location_on</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{p.puesto}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{p.municipio}</span>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
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

                                    {/* Mesas grid */}
                                    {isExpanded && (
                                        <div style={{ padding: '16px' }}>
                                            {/* Legend */}
                                            <div style={{
                                                display: 'flex', flexWrap: 'wrap', gap: '12px',
                                                marginBottom: '16px', padding: '10px 12px',
                                                background: '#F8F9FA', borderRadius: '8px',
                                                border: '1px solid #E5E7EB',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: '#CE1126' }}>📊</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Cámara</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: '#3B82F6' }}>📊</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Senado</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: '#CE1126' }}>📷</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Foto Cám.</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '10px', color: '#3B82F6' }}>📷</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Foto Sen.</span>
                                                </div>
                                            </div>

                                            {/* Mesa cards */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {p.mesas.map((mesa) => {
                                                    const allDone = mesa.votos_camara && mesa.votos_senado && mesa.foto_camara && mesa.foto_senado
                                                    const filledCount = [mesa.votos_camara, mesa.votos_senado, mesa.foto_camara, mesa.foto_senado].filter(Boolean).length

                                                    return (
                                                        <div key={mesa.mesa_numero} style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                            padding: '12px', borderRadius: '10px',
                                                            background: allDone ? 'rgba(16,185,129,0.04)' : '#FFFFFF',
                                                            border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                                                        }}>
                                                            {/* Mesa number badge */}
                                                            <div style={{
                                                                width: '38px', height: '38px', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 700, fontSize: '16px', flexShrink: 0,
                                                                background: allDone ? '#10B981' : '#CE1126',
                                                                color: 'white',
                                                                boxShadow: `0 2px 6px ${allDone ? 'rgba(16,185,129,0.3)' : 'rgba(206,17,38,0.2)'}`,
                                                            }}>
                                                                {mesa.mesa_numero}
                                                            </div>

                                                            {/* Info */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                                                                        Mesa {mesa.mesa_numero}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '10px', fontWeight: 600,
                                                                        color: allDone ? '#10B981' : '#F59E0B',
                                                                    }}>
                                                                        {filledCount}/4
                                                                    </span>
                                                                </div>

                                                                {/* 4 status blocks */}
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                                                                    {/* Votos Cámara */}
                                                                    <div style={{
                                                                        height: '28px', borderRadius: '4px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                                                                        background: mesa.votos_camara ? '#10B981' : '#FEE2E2',
                                                                        color: mesa.votos_camara ? 'white' : '#EF4444',
                                                                    }}>
                                                                        {mesa.votos_camara ? '✓' : '✕'} CÁM
                                                                    </div>
                                                                    {/* Foto Cámara */}
                                                                    <div style={{
                                                                        height: '28px', borderRadius: '4px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                                                                        background: mesa.foto_camara ? '#10B981' : '#FEE2E2',
                                                                        color: mesa.foto_camara ? 'white' : '#EF4444',
                                                                    }}>
                                                                        {mesa.foto_camara ? '✓' : '✕'} F.C
                                                                    </div>
                                                                    {/* Votos Senado */}
                                                                    <div style={{
                                                                        height: '28px', borderRadius: '4px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                                                                        background: mesa.votos_senado ? '#10B981' : '#FEE2E2',
                                                                        color: mesa.votos_senado ? 'white' : '#EF4444',
                                                                    }}>
                                                                        {mesa.votos_senado ? '✓' : '✕'} SEN
                                                                    </div>
                                                                    {/* Foto Senado */}
                                                                    <div style={{
                                                                        height: '28px', borderRadius: '4px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                                                                        background: mesa.foto_senado ? '#10B981' : '#FEE2E2',
                                                                        color: mesa.foto_senado ? 'white' : '#EF4444',
                                                                    }}>
                                                                        {mesa.foto_senado ? '✓' : '✕'} F.S
                                                                    </div>
                                                                </div>

                                                                {/* Testigo name */}
                                                                {mesa.testigo_nombre && (
                                                                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>person</span>
                                                                        {mesa.testigo_nombre}
                                                                    </div>
                                                                )}
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
