'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Loader2, ShieldAlert, ChevronDown, ChevronRight, UserPlus, X, Image as ImageIcon, Clock } from 'lucide-react'

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
            // Ease out cubic
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

function formatTime(iso: string | null): string {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('es-CO', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    })
}

export default function AdminStats() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Auth gate
    const [authorized, setAuthorized] = useState(false)
    const [rol, setRol] = useState<'super' | 'viewer'>('viewer')
    const [gateCedula, setGateCedula] = useState('')
    const [gateLoading, setGateLoading] = useState(false)
    const [gateError, setGateError] = useState('')

    // UI states
    const [expandedMuni, setExpandedMuni] = useState<string | null>(null)
    const [expandedPuesto, setExpandedPuesto] = useState<string | null>(null)
    const [photoModal, setPhotoModal] = useState<{ mesa: number; urls: string[] } | null>(null)

    // Access management
    const [showAccessPanel, setShowAccessPanel] = useState(false)
    const [newAccessCedula, setNewAccessCedula] = useState('')
    const [newAccessNombre, setNewAccessNombre] = useState('')
    const [accessList, setAccessList] = useState<{ cedula: string; nombre: string }[]>([])

    // Last update
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

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
                if (json.rol === 'super') fetchAccessList()
            } else {
                setGateError(json.mensaje || 'Acceso denegado.')
            }
        } catch {
            setGateError('Error de conexión.')
        }
        setGateLoading(false)
    }

    async function fetchStats() {
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
                        mesas: p.mesas.map((m: any) => ({
                            ...m,
                        })),
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
                setLastUpdate(new Date())
            }
        } catch {
            setError('Error cargando datos.')
        }
        setLoading(false)
    }

    async function fetchAccessList() {
        try {
            const res = await fetch('/api/admin/acceso-stats')
            const json = await res.json()
            if (json.exito) setAccessList(json.accesos || [])
        } catch { /* silent */ }
    }

    async function grantAccess() {
        if (!newAccessCedula.trim()) return
        await fetch('/api/admin/acceso-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ super_cedula: gateCedula, cedula_nueva: newAccessCedula, nombre: newAccessNombre }),
        })
        setNewAccessCedula('')
        setNewAccessNombre('')
        fetchAccessList()
    }

    async function revokeAccess(cedula: string) {
        await fetch('/api/admin/acceso-stats', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ super_cedula: gateCedula, cedula }),
        })
        fetchAccessList()
    }

    useEffect(() => {
        if (authorized) {
            const interval = setInterval(fetchStats, 30000)
            return () => clearInterval(interval)
        }
    }, [authorized])

    const pct = data ? (data.resumen.totalMesas > 0 ? Math.round((data.resumen.completadas / data.resumen.totalMesas) * 100) : 0) : 0

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
                            <ShieldAlert size={24} style={{ color: '#CE1126' }} />
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
                    }}>← Volver al panel</Link>
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
                    <Loader2 size={24} className="animate-spin" style={{ color: '#CE1126', marginBottom: '8px' }} />
                    <p style={{ color: '#94A3B8', fontSize: '13px' }}>Cargando estadísticas...</p>
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
                📷 Mesa {photoModal.mesa} — {photoModal.urls.length} foto{photoModal.urls.length !== 1 ? 's' : ''}
            </div>
            <div onClick={e => e.stopPropagation()} style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                maxHeight: '80vh', overflowY: 'auto', width: '100%', maxWidth: '420px',
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
            display: 'flex', justifyContent: 'center',
        }}>
            {photoModalEl}

            <div style={{ width: '100%', maxWidth: '640px', minHeight: '100vh' }}>
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
                                background: '#F8F9FA', border: '1px solid #E5E7EB', textDecoration: 'none', color: '#94A3B8',
                                fontSize: '16px',
                            }}>←</Link>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                        Estadísticas en Vivo
                                    </h1>
                                    <span style={{
                                        display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                        background: '#10B981', animation: 'pulse 2s infinite',
                                    }} />
                                </div>
                                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>
                                    {lastUpdate ? `Actualizado ${formatTime(lastUpdate.toISOString())}` : 'Cargando...'}
                                    {rol === 'super' && ' · Super Admin'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {rol === 'super' && (
                                <button onClick={() => setShowAccessPanel(!showAccessPanel)}
                                    style={{
                                        background: showAccessPanel ? '#CE1126' : 'rgba(206,17,38,0.08)',
                                        border: 'none', color: showAccessPanel ? 'white' : '#CE1126',
                                        padding: '7px', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                                    }}><UserPlus size={15} /></button>
                            )}
                            <button onClick={fetchStats}
                                style={{
                                    background: 'rgba(206,17,38,0.08)', border: 'none', color: '#CE1126',
                                    padding: '7px', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                                    fontSize: '15px',
                                }}>🔄</button>
                        </div>
                    </div>
                </header>

                {/* Pulse animation */}
                <style>{`
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        `}</style>

                {/* Access panel */}
                {showAccessPanel && rol === 'super' && (
                    <div style={{ background: '#FFFFFF', padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                            Gestión de Acceso
                        </h3>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            <input type="text" inputMode="numeric" placeholder="Cédula"
                                value={newAccessCedula} onChange={e => setNewAccessCedula(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '8px',
                                    fontSize: '12px', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
                                }} />
                            <input type="text" placeholder="Nombre"
                                value={newAccessNombre} onChange={e => setNewAccessNombre(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '8px',
                                    fontSize: '12px', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
                                }} />
                            <button onClick={grantAccess} style={{
                                background: '#10B981', color: 'white', border: 'none', borderRadius: '8px',
                                padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            }}>+</button>
                        </div>
                        {accessList.map(a => (
                            <div key={a.cedula} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '5px 10px', borderRadius: '6px', background: '#F8F9FA', fontSize: '11px',
                                marginBottom: '3px',
                            }}>
                                <span><strong>{a.nombre || 'Sin nombre'}</strong> — {a.cedula}</span>
                                <button onClick={() => revokeAccess(a.cedula)} style={{
                                    background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px',
                                }}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* =================== KPI CARDS WITH ANIMATED COUNTERS =================== */}
                {data && (
                    <>
                        <div style={{ background: '#FFFFFF', padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
                                {[
                                    { value: data.resumen.totalMunicipios, label: 'Municipios', color: '#3B82F6' },
                                    { value: data.resumen.totalPuestos, label: 'Puestos', color: '#8B5CF6' },
                                    { value: data.resumen.totalMesas, label: 'Mesas', color: '#111827' },
                                    { value: data.resumen.completadas, label: 'Completadas', color: '#10B981' },
                                ].map((kpi, i) => (
                                    <div key={i} style={{
                                        textAlign: 'center', padding: '10px 4px', borderRadius: '10px',
                                        background: '#FAFBFC', border: '1px solid #E5E7EB',
                                    }}>
                                        <div style={{
                                            fontSize: '22px', fontWeight: 800, color: kpi.color,
                                            fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
                                        }}>
                                            <AnimatedNumber value={kpi.value} />
                                        </div>
                                        <div style={{
                                            fontSize: '8px', fontWeight: 700, color: '#94A3B8',
                                            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px',
                                        }}>{kpi.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '4px',
                                        background: pct >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                            pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #10B981)' :
                                                'linear-gradient(90deg, #CE1126, #F59E0B)',
                                        width: `${pct}%`, transition: 'width 1s ease-out',
                                    }} />
                                </div>
                                <span style={{
                                    fontSize: '14px', fontWeight: 800,
                                    color: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#CE1126',
                                    fontVariantNumeric: 'tabular-nums', minWidth: '40px', textAlign: 'right',
                                }}><AnimatedNumber value={pct} />%</span>
                            </div>
                        </div>

                        {/* =================== MUNICIPIO CASCADE =================== */}
                        <div style={{ padding: '10px 16px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {data.municipios.map(muni => {
                                const muniExpanded = expandedMuni === muni.municipio
                                const muniPct = muni.totalMesas > 0 ? Math.round((muni.completadas / muni.totalMesas) * 100) : 0

                                return (
                                    <div key={muni.municipio} style={{
                                        background: '#FFFFFF', borderRadius: '12px',
                                        border: '1px solid #E5E7EB', overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}>
                                        {/* Municipio header */}
                                        <button onClick={() => { setExpandedMuni(muniExpanded ? null : muni.municipio); setExpandedPuesto(null) }}
                                            style={{
                                                width: '100%', padding: '12px 14px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                background: muniExpanded ? '#FAFBFC' : '#FFFFFF',
                                                borderBottom: muniExpanded ? '1px solid #E5E7EB' : 'none',
                                                border: 'none', textAlign: 'left',
                                                fontFamily: "'Inter', system-ui, sans-serif",
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                {muniExpanded ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{muni.municipio}</div>
                                                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>
                                                        {muni.puestos.length} puesto{muni.puestos.length !== 1 ? 's' : ''} · {muni.totalMesas} mesas
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E5E7EB', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', background: muniPct === 100 ? '#10B981' : '#F59E0B', width: `${muniPct}%` }} />
                                                </div>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px',
                                                    background: muniPct === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                                                    color: muniPct === 100 ? '#10B981' : '#F59E0B',
                                                }}>{muni.completadas}/{muni.totalMesas}</span>
                                            </div>
                                        </button>

                                        {/* Puestos cascade */}
                                        {muniExpanded && (
                                            <div style={{ padding: '6px' }}>
                                                {muni.puestos.map(puesto => {
                                                    const pk = `${muni.municipio}__${puesto.puesto}`
                                                    const pOpen = expandedPuesto === pk
                                                    const ppct = puesto.totalMesas > 0 ? Math.round((puesto.completadas / puesto.totalMesas) * 100) : 0

                                                    return (
                                                        <div key={pk} style={{
                                                            borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB',
                                                            marginBottom: '5px',
                                                        }}>
                                                            <button onClick={() => setExpandedPuesto(pOpen ? null : pk)}
                                                                style={{
                                                                    width: '100%', padding: '10px 10px', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                    background: pOpen ? '#F8F9FA' : '#FAFBFC',
                                                                    border: 'none', textAlign: 'left',
                                                                    fontFamily: "'Inter', system-ui, sans-serif",
                                                                }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                                                    <span style={{ fontSize: '12px', color: '#CE1126' }}>📍</span>
                                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{puesto.puesto}</div>
                                                                        <div style={{ fontSize: '9px', color: '#94A3B8' }}>{puesto.totalMesas} mesas</div>
                                                                    </div>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '10px', fontWeight: 700,
                                                                    color: ppct === 100 ? '#10B981' : '#F59E0B',
                                                                }}>{puesto.completadas}/{puesto.totalMesas}</span>
                                                            </button>

                                                            {/* =================== MESAS GRID =================== */}
                                                            {pOpen && (
                                                                <div style={{ padding: '8px', background: '#FFFFFF' }}>
                                                                    <div style={{
                                                                        display: 'grid',
                                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                                                        gap: '6px',
                                                                    }}>
                                                                        {puesto.mesas.map(mesa => {
                                                                            const done = mesa.votos_camara && mesa.votos_senado && mesa.foto_camara && mesa.foto_senado
                                                                            const filled = [mesa.votos_camara, mesa.votos_senado, mesa.foto_camara, mesa.foto_senado].filter(Boolean).length
                                                                            const hasPhotos = mesa.foto_camara_url || mesa.foto_senado_url || mesa.foto_camara_2_url || mesa.foto_senado_2_url
                                                                            const photoUrls = [mesa.foto_camara_url, mesa.foto_senado_url, mesa.foto_camara_2_url, mesa.foto_senado_2_url].filter(Boolean) as string[]

                                                                            return (
                                                                                <div key={mesa.mesa_numero} style={{
                                                                                    padding: '8px 6px', borderRadius: '8px', textAlign: 'center',
                                                                                    background: done ? 'rgba(16,185,129,0.06)' : '#FFFFFF',
                                                                                    border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                                                                                    position: 'relative',
                                                                                }}>
                                                                                    {/* Mesa number */}
                                                                                    <div style={{
                                                                                        fontSize: '16px', fontWeight: 700,
                                                                                        color: done ? '#10B981' : '#111827',
                                                                                    }}>{mesa.mesa_numero}</div>

                                                                                    {/* 4 micro dots */}
                                                                                    <div style={{
                                                                                        display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '3px',
                                                                                    }}>
                                                                                        {[mesa.votos_camara, mesa.foto_camara, mesa.votos_senado, mesa.foto_senado].map((v, i) => (
                                                                                            <div key={i} style={{
                                                                                                width: '8px', height: '8px', borderRadius: '2px',
                                                                                                background: v ? '#10B981' : '#FEE2E2',
                                                                                            }} />
                                                                                        ))}
                                                                                    </div>

                                                                                    {/* Timeline — Feature #7 */}
                                                                                    {mesa.updated_at && (
                                                                                        <div style={{
                                                                                            fontSize: '8px', fontWeight: 600, color: '#94A3B8',
                                                                                            marginTop: '3px', display: 'flex',
                                                                                            alignItems: 'center', justifyContent: 'center', gap: '2px',
                                                                                        }}>
                                                                                            <Clock size={8} />
                                                                                            {formatTime(mesa.updated_at)}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Photo badge — Feature #3 */}
                                                                                    {hasPhotos && (
                                                                                        <button onClick={() => setPhotoModal({ mesa: mesa.mesa_numero, urls: photoUrls })}
                                                                                            style={{
                                                                                                position: 'absolute', top: '3px', right: '3px',
                                                                                                background: '#3B82F6', border: 'none', borderRadius: '4px',
                                                                                                padding: '2px 4px', cursor: 'pointer', display: 'flex',
                                                                                                alignItems: 'center', gap: '2px',
                                                                                            }}>
                                                                                            <ImageIcon size={8} color="white" />
                                                                                            <span style={{ fontSize: '7px', fontWeight: 700, color: 'white' }}>{photoUrls.length}</span>
                                                                                        </button>
                                                                                    )}

                                                                                    <div style={{
                                                                                        fontSize: '8px', fontWeight: 700, marginTop: '2px',
                                                                                        color: done ? '#10B981' : '#94A3B8',
                                                                                    }}>{filled}/4</div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>

                                                                    {/* Legend */}
                                                                    <div style={{
                                                                        marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap',
                                                                        justifyContent: 'center', fontSize: '8px', color: '#94A3B8', fontWeight: 600,
                                                                    }}>
                                                                        <span>🟩 Listo</span><span>🟥 Pendiente</span>
                                                                        <span>📷 = Ver fotos</span>
                                                                        <span>🕐 = Hora de carga</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
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
        </div>
    )
}
