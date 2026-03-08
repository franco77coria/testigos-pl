'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface MesaCumplimiento {
  mesa_numero: number
  conteo_8am: boolean
  conteo_11am: boolean
  conteo_1pm: boolean
  foto_camara: boolean
  datos_camara: boolean
  foto_senado: boolean
  datos_senado: boolean
  completada: boolean
}

interface TestigoDrilldown {
  cedula: string
  nombre: string
  celular: string | null
  correo: string | null
  municipio: string
  puesto: string
  mesas: MesaCumplimiento[]
  mesas_completadas: number
  total_mesas: number
  porcentaje: number
}

interface LiderResumen {
  cedula: string
  nombre: string
  telefono: string | null
  total_testigos: number
  total_mesas: number
  mesas_completadas: number
  mesa_numeros: number[]
  porcentaje: number
}

interface ResumenGeneral {
  total_lideres: number
  total_testigos: number
  total_mesas: number
  mesas_completadas: number
}

const TAREAS = [
  { key: 'conteo_8am', label: '8H', title: 'Conteo 8 AM' },
  { key: 'conteo_11am', label: '11H', title: 'Conteo 11 AM' },
  { key: 'conteo_1pm', label: '1P', title: 'Conteo 1 PM' },
  { key: 'foto_senado', label: 'F.S', title: 'Foto Senado' },
  { key: 'datos_senado', label: 'SEN', title: 'Datos Senado' },
  { key: 'foto_camara', label: 'F.C', title: 'Foto Cámara' },
  { key: 'datos_camara', label: 'CÁM', title: 'Datos Cámara' },
]

export default function AnalysisCenterPage() {
  // Vista nivel 1: lideres
  const [lideres, setLideres] = useState<LiderResumen[]>([])
  const [resumen, setResumen] = useState<ResumenGeneral>({ total_lideres: 0, total_testigos: 0, total_mesas: 0, mesas_completadas: 0 })

  // Vista nivel 2: drill-down a testigos de un lider
  const [drilldownLider, setDrilldownLider] = useState<{ cedula: string; nombre: string } | null>(null)
  const [drilldownTestigos, setDrilldownTestigos] = useState<TestigoDrilldown[]>([])
  const [drilldownResumen, setDrilldownResumen] = useState<{ total_testigos: number; testigos_al_dia: number; total_mesas: number; mesas_completadas: number }>({ total_testigos: 0, testigos_al_dia: 0, total_mesas: 0, mesas_completadas: 0 })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedTestigo, setExpandedTestigo] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(30)

  // Auth gate
  const [authorized, setAuthorized] = useState(false)
  const [gateCedula, setGateCedula] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError] = useState('')
  const [analistaCedula, setAnalistaCedula] = useState('')
  const [analistaNombre, setAnalistaNombre] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('analista_cedula')
    const nombre = sessionStorage.getItem('analista_nombre')
    if (stored) {
      setAnalistaCedula(stored)
      setAnalistaNombre(nombre || '')
      setAuthorized(true)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchLideres = useCallback(async (cedula: string, isSuper: boolean) => {
    setRefreshing(true)
    try {
      const url = isSuper
        ? '/api/analysis-center'
        : `/api/analysis-center?cedula_analista=${encodeURIComponent(cedula)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.exito) {
        setLideres(data.lideres)
        setResumen(data.resumen)
      }
    } catch { /* silent */ }
    setLoading(false)
    setRefreshing(false)
    setCountdown(30)
  }, [])

  const fetchDrilldown = useCallback(async (cedulaLider: string) => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/analysis-center?cedula_lider=${encodeURIComponent(cedulaLider)}`)
      const data = await res.json()
      if (data.exito) {
        setDrilldownTestigos(data.testigos)
        setDrilldownResumen(data.resumen)
      }
    } catch { /* silent */ }
    setRefreshing(false)
    setCountdown(30)
  }, [])

  useEffect(() => {
    if (authorized && (analistaCedula || isSuperAdmin)) {
      fetchLideres(analistaCedula, isSuperAdmin)
    }
  }, [authorized, analistaCedula, isSuperAdmin, fetchLideres])

  // Auto-refresh + countdown
  useEffect(() => {
    if (!authorized) return
    const interval = setInterval(() => {
      if (drilldownLider) {
        fetchDrilldown(drilldownLider.cedula)
      } else {
        fetchLideres(analistaCedula, isSuperAdmin)
      }
    }, 30000)
    const ticker = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
    return () => { clearInterval(interval); clearInterval(ticker) }
  }, [authorized, analistaCedula, isSuperAdmin, drilldownLider, fetchLideres, fetchDrilldown])

  async function verifyAccess() {
    setGateLoading(true)
    setGateError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: gateCedula }),
      })
      const json = await res.json()

      if (json.exito && json.esAnalista) {
        setAnalistaCedula(json.sesion.cedula)
        setAnalistaNombre(json.sesion.nombre)
        sessionStorage.setItem('analista_cedula', json.sesion.cedula)
        sessionStorage.setItem('analista_nombre', json.sesion.nombre)
        setAuthorized(true)
        setLoading(true)
      } else if (json.exito && json.esCoordinador) {
        setIsSuperAdmin(true)
        setAnalistaNombre('Super Admin')
        setAuthorized(true)
        setLoading(true)
      } else {
        setGateError('Acceso restringido. Solo analistas y super admins.')
      }
    } catch {
      setGateError('Error de conexión.')
    }
    setGateLoading(false)
  }

  function handleDrilldown(lider: LiderResumen) {
    setDrilldownLider({ cedula: lider.cedula, nombre: lider.nombre })
    setExpandedTestigo(null)
    fetchDrilldown(lider.cedula)
  }

  function handleBack() {
    setDrilldownLider(null)
    setDrilldownTestigos([])
    setExpandedTestigo(null)
  }

  const porcentajeGlobal = resumen.total_mesas > 0
    ? Math.round((resumen.mesas_completadas / resumen.total_mesas) * 100)
    : 0

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
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          border: '1px solid #E2E8F0',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(206,17,38,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#CE1126' }}>analytics</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
            Analysis Center
          </h1>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
            Panel de seguimiento
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
          <button
            onClick={verifyAccess}
            disabled={gateLoading || !gateCedula.trim()}
            style={{
              width: '100%', padding: '15px', borderRadius: '14px',
              border: 'none', background: '#CE1126', color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              boxShadow: '0 4px 14px rgba(206,17,38,0.2)',
              opacity: (!gateCedula.trim() || gateLoading) ? 0.5 : 1,
            }}
          >
            {gateLoading ? 'Verificando...' : 'Acceder'}
          </button>
          {gateError && (
            <p style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{gateError}</p>
          )}
          <Link href="/" style={{
            display: 'block', marginTop: '20px', fontSize: '13px',
            fontWeight: 600, color: '#94A3B8', textDecoration: 'none',
          }}>
            Volver al portal
          </Link>
        </div>
      </div>
    )
  }

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
          <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Cargando datos...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ===== DRILLDOWN: Testigos de un líder =====
  if (drilldownLider) {
    const ddPct = drilldownResumen.total_mesas > 0
      ? Math.round((drilldownResumen.mesas_completadas / drilldownResumen.total_mesas) * 100) : 0

    return (
      <div style={{
        minHeight: '100vh', background: '#F0F2F5',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}>
        <div style={{ height: '3px', background: '#E5E7EB', width: '100%', position: 'relative' }}>
          <div style={{ height: '100%', background: '#CE1126', width: `${(countdown / 30) * 100}%`, transition: 'width 1s linear' }} />
        </div>

        <header style={{
          background: '#FFFFFF', padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleBack} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#F8F9FA', border: '1px solid #E5E7EB', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8', fontSize: '16px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              </button>
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'clamp(120px, 40vw, 300px)' }}>
                  {drilldownLider.nombre}
                </h1>
                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>
                  Testigos del líder
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{countdown}s</span>
              <button
                onClick={() => {
                  sessionStorage.removeItem('analista_cedula')
                  sessionStorage.removeItem('analista_nombre')
                  window.location.href = '/'
                }}
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

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
          <div className="stats-grid-ac" style={{
            background: '#FFFFFF', borderRadius: '0 0 12px 12px',
            padding: '16px', marginBottom: '16px',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          }}>
            <StatCard label="Testigos" value={drilldownResumen.total_testigos} color="#111827" />
            <StatCard label="Al día" value={drilldownResumen.testigos_al_dia} color="#10B981" />
            <StatCard label="Mesas listas" value={drilldownResumen.mesas_completadas} color="#10B981" />
            <StatCard label="Progreso" value={`${ddPct}%`} color="#CE1126" />
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                background: 'linear-gradient(90deg, #CE1126, #10B981)',
                width: `${ddPct}%`, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', borderRadius: '10px', padding: '10px 14px',
            marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginRight: '4px' }}>Tareas:</span>
            {TAREAS.map(t => (
              <span key={t.key} style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                background: '#F3F4F6', color: '#374151',
              }} title={t.title}>{t.label}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '32px' }}>
            {drilldownTestigos.map(t => {
              const isExpanded = expandedTestigo === t.cedula
              const pct = t.porcentaje
              const barColor = pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

              return (
                <div key={t.cedula} style={{
                  background: '#FFFFFF', borderRadius: '12px',
                  border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                  overflow: 'hidden',
                }}>
                  <div
                    onClick={() => setExpandedTestigo(isExpanded ? null : t.cedula)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                      background: pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.nombre}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, flexShrink: 0, color: pct === 100 ? '#10B981' : '#F59E0B' }}>
                          {t.mesas_completadas}/{t.total_mesas}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
                        {t.municipio} — {t.puesto}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', color: '#6366F1', fontWeight: 600 }}>
                          Mesas: {t.mesas.map((m: any) => m.mesa_numero).sort((a: number, b: number) => a - b).join(', ')}
                        </span>
                        {t.celular && (
                          <a
                            href={`https://wa.me/57${t.celular.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              background: '#25D366', color: 'white', borderRadius: '4px',
                              padding: '1px 6px', fontSize: '9px', fontWeight: 700,
                              textDecoration: 'none', flexShrink: 0,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>chat</span>
                            WA
                          </a>
                        )}
                      </div>
                      <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '2px', background: barColor, width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{
                      color: '#94A3B8', fontSize: '20px', flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s',
                    }}>expand_more</span>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '10px 0', fontSize: '11px' }}>
                        {t.celular && <a href={`tel:${t.celular}`} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Tel: {t.celular}</a>}
                        {t.correo && <a href={`mailto:${t.correo}`} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>{t.correo}</a>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {t.mesas.map(m => (
                          <div key={m.mesa_numero} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '8px',
                            background: m.completada ? 'rgba(16,185,129,0.04)' : '#F8F9FA',
                            border: `1px solid ${m.completada ? 'rgba(16,185,129,0.15)' : '#E5E7EB'}`,
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '6px',
                              background: m.completada ? '#10B981' : '#CE1126',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            }}>
                              {m.mesa_numero}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {TAREAS.map(tarea => {
                                  const hecho = m[tarea.key as keyof MesaCumplimiento] as boolean
                                  return (
                                    <span key={tarea.key} title={tarea.title} style={{
                                      fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                                      background: hecho ? '#10B981' : '#FEE2E2',
                                      color: hecho ? 'white' : '#EF4444',
                                    }}>
                                      {hecho ? '\u2713' : '\u2715'} {tarea.label}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 380px) {
            .stats-grid-ac { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </div>
    )
  }

  // ===== NIVEL 1: Lista de líderes =====
  return (
    <div style={{
      minHeight: '100vh', background: '#F0F2F5',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ height: '3px', background: '#E5E7EB', width: '100%', position: 'relative' }}>
        <div style={{ height: '100%', background: '#CE1126', width: `${(countdown / 30) * 100}%`, transition: 'width 1s linear' }} />
      </div>

      <header style={{
        background: '#FFFFFF', padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '16px',
            }}>A</div>
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Analysis Center
              </h1>
              <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {analistaNombre || 'Seguimiento de líderes'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{countdown}s</span>
            <button
              onClick={() => { setLoading(true); fetchLideres(analistaCedula, isSuperAdmin) }}
              disabled={refreshing}
              style={{
                background: 'rgba(206,17,38,0.1)', border: 'none', color: '#CE1126',
                padding: '8px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', opacity: refreshing ? 0.5 : 1,
              }}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: '18px', animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}>sync</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('analista_cedula')
                sessionStorage.removeItem('analista_nombre')
                window.location.href = '/'
              }}
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

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
        {/* Stats ribbon */}
        <div className="stats-grid-ac" style={{
          background: '#FFFFFF', borderRadius: '0 0 12px 12px',
          padding: '16px', marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
        }}>
          <StatCard label="Líderes" value={resumen.total_lideres} color="#111827" />
          <StatCard label="Testigos" value={resumen.total_testigos} color="#3B82F6" />
          <StatCard label="Mesas listas" value={resumen.mesas_completadas} color="#10B981" />
          <StatCard label="Progreso" value={`${porcentajeGlobal}%`} color="#CE1126" />
        </div>

        {/* Barra de progreso */}
        <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Progreso global</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>{resumen.mesas_completadas}/{resumen.total_mesas} mesas</span>
          </div>
          <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              background: 'linear-gradient(90deg, #CE1126, #10B981)',
              width: `${porcentajeGlobal}%`, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Lista de líderes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '32px' }}>
          {lideres.length === 0 ? (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px', padding: '40px',
              textAlign: 'center', border: '1px solid #E5E7EB',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E5E7EB', display: 'block', marginBottom: '8px' }}>group_off</span>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>No hay líderes asignados.</p>
            </div>
          ) : lideres.map(l => {
            const pct = l.porcentaje
            const barColor = pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

            return (
              <div key={l.cedula}
                onClick={() => handleDrilldown(l)}
                style={{
                  background: '#FFFFFF', borderRadius: '12px',
                  border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                  overflow: 'hidden', cursor: 'pointer',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                  background: pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{pct}%</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.nombre}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, flexShrink: 0, color: pct === 100 ? '#10B981' : '#F59E0B' }}>
                      {l.mesas_completadas}/{l.total_mesas} mesas
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>
                      {l.total_testigos} testigos{l.telefono ? ` \u00B7 ${l.telefono}` : ''}
                    </span>
                    {l.telefono && (
                      <a
                        href={`https://wa.me/57${l.telefono.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          background: '#25D366', color: 'white', borderRadius: '4px',
                          padding: '1px 6px', fontSize: '9px', fontWeight: 700,
                          textDecoration: 'none', flexShrink: 0,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>chat</span>
                        WA
                      </a>
                    )}
                  </div>
                  {l.mesa_numeros && l.mesa_numeros.length > 0 && (
                    <div style={{
                      fontSize: '9px', color: '#64748B', fontWeight: 500, marginTop: '4px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <span style={{ fontWeight: 700, color: '#94A3B8' }}>Mesas:</span>{' '}
                      {l.mesa_numeros.join(', ')}
                    </div>
                  )}
                  <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', background: barColor,
                      width: `${pct}%`, transition: 'width 0.4s',
                    }} />
                  </div>
                </div>

                <span className="material-symbols-outlined" style={{
                  color: '#94A3B8', fontSize: '20px', flexShrink: 0,
                }}>chevron_right</span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 380px) {
          .stats-grid-ac { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 'clamp(8px, 2vw, 9px)', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  )
}
