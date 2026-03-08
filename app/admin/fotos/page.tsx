'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface MesaFoto {
    mesa_numero: number
    municipio: string
    puesto: string
    testigo_cedula: string
    testigo_nombre: string
    foto_camara: string | null
    foto_camara_2: string | null
    foto_senado: string | null
    foto_senado_2: string | null
    tiene_fotos: boolean
}

interface Resumen {
    total: number
    con_foto: number
    sin_foto: number
}

export default function FotosPage() {
    const [mesas, setMesas] = useState<MesaFoto[]>([])
    const [municipios, setMunicipios] = useState<string[]>([])
    const [filtro, setFiltro] = useState('')
    const [soloSinFoto, setSoloSinFoto] = useState(false)
    const [resumen, setResumen] = useState<Resumen>({ total: 0, con_foto: 0, sin_foto: 0 })
    const [loading, setLoading] = useState(true)
    const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

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
                setGateError('Acceso denegado.')
            }
        } catch {
            setGateError('Error de conexión.')
        }
        setGateLoading(false)
    }

    const fetchData = useCallback(async (muni?: string) => {
        setLoading(true)
        try {
            const url = muni ? `/api/admin/fotos?municipio=${encodeURIComponent(muni)}` : '/api/admin/fotos'
            const res = await fetch(url)
            const data = await res.json()
            if (data.exito) {
                setMesas(data.mesas)
                setMunicipios(data.municipios || [])
                setResumen(data.resumen)
            }
        } catch { /* silent */ }
        setLoading(false)
    }, [])

    function handleFiltro(muni: string) {
        setFiltro(muni)
        fetchData(muni || undefined)
    }

    function openLightbox(fotos: (string | null)[], startIndex: number) {
        const urls = fotos.filter(Boolean) as string[]
        if (urls.length > 0) {
            setLightbox({ urls, index: Math.min(startIndex, urls.length - 1) })
        }
    }

    const filteredMesas = soloSinFoto ? mesas.filter(m => !m.tiene_fotos) : mesas

    // ===== AUTH GATE =====
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
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#CE1126' }}>photo_library</span>
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        Galería de Fotos
                    </h1>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', marginBottom: '24px' }}>
                        Ingrese su cédula para acceder.
                    </p>
                    <input
                        type="text" inputMode="numeric" placeholder="Cédula"
                        value={gateCedula} onChange={e => setGateCedula(e.target.value)}
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
                            opacity: (!gateCedula.trim() || gateLoading) ? 0.5 : 1,
                        }}
                    >{gateLoading ? 'Verificando...' : 'Acceder'}</button>
                    {gateError && <p style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{gateError}</p>}
                    <Link href="/admin" style={{
                        display: 'block', marginTop: '20px', fontSize: '13px',
                        fontWeight: 600, color: '#94A3B8', textDecoration: 'none',
                    }}>Volver al panel</Link>
                </div>
            </div>
        )
    }

    // ===== LIGHTBOX =====
    const lightboxEl = lightbox && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>
            <img
                src={lightbox.urls[lightbox.index]}
                alt={`Foto ${lightbox.index + 1}`}
                style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
            />
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                {lightbox.urls.length > 1 && (
                    <button onClick={() => setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.urls.length) % lightbox.urls.length })}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 600,
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    </button>
                )}
                <button onClick={() => setLightbox(null)}
                    style={{
                        padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>Cerrar ({lightbox.index + 1}/{lightbox.urls.length})</button>
                {lightbox.urls.length > 1 && (
                    <button onClick={() => setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.urls.length })}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 600,
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                    </button>
                )}
            </div>
        </div>
    )

    // ===== LOADING =====
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
                    <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Cargando fotos...</p>
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
            {lightboxEl}

            <div style={{ height: '3px', background: '#CE1126', width: '100%' }} />

            {/* Header */}
            <header style={{
                background: '#FFFFFF', padding: 'clamp(8px, 1.5vw, 16px) clamp(12px, 2vw, 24px)',
                borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 20,
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
                        <h1 style={{ fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 700, color: '#111827', margin: 0 }}>
                            Galería de Fotos
                        </h1>
                    </div>
                    <button onClick={() => fetchData(filtro || undefined)}
                        style={{
                            background: 'rgba(206,17,38,0.08)', border: 'none', color: '#CE1126',
                            padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
                    </button>
                </div>
            </header>

            {/* Stats + Filters */}
            <div style={{ padding: 'clamp(12px, 2vw, 20px)', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'clamp(18px, 2.5vw, 40px)', fontWeight: 700, color: '#111827' }}>{resumen.total}</div>
                        <div style={{ fontSize: 'clamp(8px, 0.8vw, 11px)', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'clamp(18px, 2.5vw, 40px)', fontWeight: 700, color: '#10B981' }}>{resumen.con_foto}</div>
                        <div style={{ fontSize: 'clamp(8px, 0.8vw, 11px)', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Con Foto</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'clamp(18px, 2.5vw, 40px)', fontWeight: 700, color: '#EF4444' }}>{resumen.sin_foto}</div>
                        <div style={{ fontSize: 'clamp(8px, 0.8vw, 11px)', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Sin Foto</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select value={filtro} onChange={e => handleFiltro(e.target.value)}
                        style={{
                            flex: 1, minWidth: '200px', padding: '10px 14px',
                            background: '#F8FAFC', border: '1px solid #E5E7EB',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                            color: '#111827', outline: 'none', cursor: 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                        }}>
                        <option value="">Todos los municipios</option>
                        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={() => setSoloSinFoto(!soloSinFoto)}
                        style={{
                            padding: '10px 16px', borderRadius: '10px',
                            border: '1px solid #E5E7EB',
                            background: soloSinFoto ? '#CE1126' : '#F8FAFC',
                            color: soloSinFoto ? 'white' : '#111827',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                        }}>
                        {soloSinFoto ? 'Solo sin foto' : 'Mostrar todo'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div style={{
                padding: 'clamp(12px, 2vw, 20px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px, 15vw, 220px), 1fr))',
                gap: 'clamp(8px, 1vw, 14px)',
            }}>
                {filteredMesas.map((m, idx) => {
                    const fotos = [m.foto_camara, m.foto_camara_2, m.foto_senado, m.foto_senado_2]
                    const fotosExist = fotos.filter(Boolean) as string[]
                    const slots = [
                        { url: m.foto_camara, label: 'Cám' },
                        { url: m.foto_camara_2, label: 'Cám 2' },
                        { url: m.foto_senado, label: 'Sen' },
                        { url: m.foto_senado_2, label: 'Sen 2' },
                    ]

                    return (
                        <div key={`${m.testigo_cedula}_${m.mesa_numero}_${idx}`} style={{
                            background: '#FFFFFF', borderRadius: '12px',
                            border: `1px solid ${m.tiene_fotos ? '#E5E7EB' : 'rgba(239,68,68,0.3)'}`,
                            overflow: 'hidden', position: 'relative',
                        }}>
                            {!m.tiene_fotos && (
                                <div style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    background: '#EF4444', color: 'white',
                                    fontSize: '8px', fontWeight: 700,
                                    padding: '2px 6px', borderRadius: '4px', zIndex: 1,
                                }}>SIN FOTO</div>
                            )}

                            <div style={{ padding: '10px 12px 6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', fontWeight: 800, color: '#111827' }}>
                                        Mesa {m.mesa_numero}
                                    </span>
                                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#94A3B8' }}>
                                        {fotosExist.length}/4
                                    </span>
                                </div>
                                <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
                                    {m.municipio}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '6px' }}>
                                {slots.map((slot, i) => (
                                    <div key={i}
                                        onClick={() => slot.url && openLightbox(fotos, i)}
                                        style={{
                                            aspectRatio: '4/3', borderRadius: '6px',
                                            background: slot.url ? '#000' : '#F3F4F6',
                                            overflow: 'hidden', cursor: slot.url ? 'pointer' : 'default',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                        }}>
                                        {slot.url ? (
                                            <img src={slot.url} alt={slot.label}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D1D5DB' }}>photo_camera</span>
                                        )}
                                        <div style={{
                                            position: 'absolute', bottom: '2px', left: '2px',
                                            fontSize: '7px', fontWeight: 700, padding: '1px 4px',
                                            borderRadius: '3px', background: 'rgba(0,0,0,0.5)', color: 'white',
                                        }}>{slot.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredMesas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '14px' }}>
                    No hay mesas para mostrar.
                </div>
            )}
        </div>
    )
}
