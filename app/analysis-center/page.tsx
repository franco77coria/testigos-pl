'use client'

import { useState, useEffect } from 'react'
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

interface TestigoCumplimiento {
  cedula: string
  nombre: string
  municipio: string
  puesto: string
  mesas: MesaCumplimiento[]
  mesas_completadas: number
  total_mesas: number
  tareas_hechas: number
  total_tareas: number
  porcentaje: number
}

interface Resumen {
  total_testigos: number
  testigos_al_dia: number
  total_mesas: number
  mesas_completadas: number
}

const TAREAS = [
  { key: 'conteo_8am', label: '08h', title: 'Conteo 8 AM' },
  { key: 'conteo_11am', label: '11h', title: 'Conteo 11 AM' },
  { key: 'conteo_1pm', label: '13h', title: 'Conteo 1 PM' },
  { key: 'foto_senado', label: 'F.S', title: 'Foto Senado' },
  { key: 'datos_senado', label: 'SEN', title: 'Votos Senado' },
  { key: 'foto_camara', label: 'F.C', title: 'Foto Cámara' },
  { key: 'datos_camara', label: 'CÁM', title: 'Votos Cámara' },
]

export default function AnalysisCenterPage() {
  const [testigos, setTestigos] = useState<TestigoCumplimiento[]>([])
  const [municipios, setMunicipios] = useState<string[]>([])
  const [filtro, setFiltro] = useState('')
  const [resumen, setResumen] = useState<Resumen>({ total_testigos: 0, testigos_al_dia: 0, total_mesas: 0, mesas_completadas: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedTestigo, setExpandedTestigo] = useState<string | null>(null)

  // Auth gate — solo super admins
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
      // Solo super admins (rol 'super') pueden acceder
      if (json.exito && json.rol === 'super') {
        setAuthorized(true)
        fetchData()
      } else {
        setGateError('Acceso restringido. Solo jefes autorizados pueden ver este panel.')
      }
    } catch {
      setGateError('Error de conexión.')
    }
    setGateLoading(false)
  }

  async function fetchData(muni?: string) {
    setRefreshing(true)
    try {
      const url = muni ? `/api/analysis-center?municipio=${encodeURIComponent(muni)}` : '/api/analysis-center'
      const res = await fetch(url)
      const data = await res.json()
      if (data.exito) {
        setTestigos(data.testigos)
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
            Panel de Cumplimiento
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

  // ===== PANEL PRINCIPAL =====
  return (
    <div style={{
      minHeight: '100vh', background: '#F0F2F5',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
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
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '16px',
              }}>L</div>
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Analysis Center
                </h1>
                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Cumplimiento de testigos
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(filtro || undefined) }}
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
        </div>
      </header>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>

        {/* Stats ribbon */}
        <div style={{
          background: '#FFFFFF', borderRadius: '0 0 12px 12px',
          padding: '16px', marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
        }}>
          <StatCard label="Testigos" value={resumen.total_testigos} color="#111827" />
          <StatCard label="Al día" value={resumen.testigos_al_dia} color="#10B981" />
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

        {/* Filtro municipio */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <select
            value={filtro}
            onChange={e => handleFiltro(e.target.value)}
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

        {/* Leyenda de tareas */}
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

        {/* Lista de testigos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '32px' }}>
          {testigos.length === 0 ? (
            <div style={{
              background: '#FFFFFF', borderRadius: '12px', padding: '40px',
              textAlign: 'center', border: '1px solid #E5E7EB',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E5E7EB', display: 'block', marginBottom: '8px' }}>search_off</span>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>No hay testigos registrados.</p>
            </div>
          ) : testigos.map(t => {
            const isExpanded = expandedTestigo === t.cedula
            const pct = t.porcentaje
            const barColor = pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

            return (
              <div key={t.cedula} style={{
                background: '#FFFFFF', borderRadius: '12px',
                border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.2)' : '#E5E7EB'}`,
                overflow: 'hidden',
              }}>
                {/* Fila del testigo */}
                <div
                  onClick={() => setExpandedTestigo(isExpanded ? null : t.cedula)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: pct === 100 ? 'rgba(16,185,129,0.02)' : '#FFFFFF',
                  }}
                >
                  {/* Avatar / porcentaje */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: pct === 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{pct}%</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.nombre}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, flexShrink: 0,
                        color: pct === 100 ? '#10B981' : '#F59E0B',
                      }}>
                        {t.mesas_completadas}/{t.total_mesas} mesas
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
                      {t.municipio} — {t.puesto}
                    </div>
                    {/* Mini barra */}
                    <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px', background: barColor,
                        width: `${pct}%`, transition: 'width 0.4s',
                      }} />
                    </div>
                  </div>

                  <span className="material-symbols-outlined" style={{
                    color: '#94A3B8', fontSize: '20px', flexShrink: 0,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}>expand_more</span>
                </div>

                {/* Detalle por mesa */}
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
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
                                    {hecho ? '✓' : '✕'} {tarea.label}
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
      `}</style>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  )
}
