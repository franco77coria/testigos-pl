'use client'

import { useState, useEffect } from 'react'
import type { SesionTestigo } from '@/lib/types'

interface MesaDisponible {
  mesa_numero: number
  disponible: boolean
  mia: boolean
  ocupada_por: string | null
}

interface Props {
  sesion: SesionTestigo
  onMesaClaimed: () => void
}

export default function InfoScreen({ sesion, onMesaClaimed }: Props) {
  const { testigo } = sesion
  const [mesas, setMesas] = useState<MesaDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [puestoInfo, setPuestoInfo] = useState({ municipio: '', puesto: '', totalMesas: 0 })

  async function fetchMesas() {
    try {
      const res = await fetch(`/api/mesas/disponibles?cedula=${sesion.cedula}`)
      const data = await res.json()
      if (data.exito) {
        setMesas(data.mesas)
        setPuestoInfo({ municipio: data.municipio, puesto: data.puesto, totalMesas: data.totalMesas })
      } else {
        setError(data.mensaje)
      }
    } catch {
      setError('Error de conexión.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMesas()
    // Auto refresh every 10 seconds to see newly claimed mesas
    const interval = setInterval(fetchMesas, 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleClaimMesa(mesaNum: number) {
    setClaiming(mesaNum)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/mesas/disponibles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: sesion.cedula, mesa_numero: mesaNum }),
      })
      const data = await res.json()
      if (data.exito) {
        setSuccessMsg(`¡Mesa ${mesaNum} reservada!`)
        // Refresh mesas list
        await fetchMesas()
        // Wait a moment then go to dashboard
        setTimeout(() => onMesaClaimed(), 1200)
      } else {
        setError(data.mensaje)
        await fetchMesas() // refresh to see if status changed
      }
    } catch {
      setError('Error de conexión.')
    }
    setClaiming(null)
  }

  const misMesas = mesas.filter(m => m.mia)
  const disponibles = mesas.filter(m => m.disponible)
  const ocupadas = mesas.filter(m => !m.disponible && !m.mia)

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
          <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Cargando mesas...</p>
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
        width: '100%', maxWidth: '448px',
        minHeight: '100vh', position: 'relative',
      }}>
        {/* Red accent */}
        <div style={{ height: '3px', background: '#CE1126', width: '100%' }} />

        {/* Header */}
        <header style={{
          background: '#FFFFFF', padding: '16px',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#CE1126', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '18px',
              boxShadow: '0 3px 8px rgba(206,17,38,0.25)',
            }}>L</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Seleccionar Mesa
              </h1>
              <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Toque para reservar su mesa
              </p>
            </div>
          </div>
        </header>

        {/* Testigo info + puesto */}
        <div style={{
          background: '#FFFFFF', padding: '16px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
              {testigo.nombre1} {testigo.apellido1}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
              CC {sesion.cedula}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(206,17,38,0.04)', border: '1px solid rgba(206,17,38,0.1)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#CE1126' }}>location_on</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{puestoInfo.puesto}</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>{puestoInfo.municipio} — {puestoInfo.totalMesas} mesas</div>
            </div>
          </div>
        </div>

        {/* Stats ribbon */}
        <div style={{
          background: '#FFFFFF', padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
        }}>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>{misMesas.length}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Mis Mesas</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(59,130,246,0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6' }}>{disponibles.length}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Disponibles</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(148,163,184,0.08)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#94A3B8' }}>{ocupadas.length}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Ocupadas</div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            margin: '12px 16px', padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            margin: '12px 16px', padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981', fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Mesa grid */}
        <div style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mesas del Puesto
          </h3>

          {mesas.length === 0 ? (
            <div style={{
              padding: '32px', textAlign: 'center', background: '#FFFFFF',
              borderRadius: '12px', border: '1px solid #E5E7EB',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E5E7EB' }}>search_off</span>
              <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '8px' }}>
                No se encontraron mesas para este puesto.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
            }}>
              {mesas.map((mesa) => {
                const isClaiming = claiming === mesa.mesa_numero
                let bg = '#FFFFFF'
                let border = '1px solid #E5E7EB'
                let color = '#111827'
                let cursor: string = 'pointer'
                let opacity = 1
                let shadow = '0 1px 3px rgba(0,0,0,0.04)'

                if (mesa.mia) {
                  // My claimed mesa — green
                  bg = '#10B981'
                  border = '1px solid #10B981'
                  color = 'white'
                  shadow = '0 2px 8px rgba(16,185,129,0.3)'
                } else if (!mesa.disponible) {
                  // Taken by someone else — greyed out
                  bg = '#F3F4F6'
                  border = '1px solid #E5E7EB'
                  color = '#D1D5DB'
                  cursor = 'not-allowed'
                  opacity = 0.6
                  shadow = 'none'
                } else if (isClaiming) {
                  bg = 'rgba(206,17,38,0.1)'
                  border = '2px solid #CE1126'
                  color = '#CE1126'
                }

                return (
                  <button
                    key={mesa.mesa_numero}
                    onClick={() => {
                      if (mesa.disponible && !mesa.mia && !claiming) {
                        handleClaimMesa(mesa.mesa_numero)
                      } else if (mesa.mia) {
                        // Already mine — go to dashboard
                        onMesaClaimed()
                      }
                    }}
                    disabled={!mesa.disponible && !mesa.mia}
                    style={{
                      width: '100%', aspectRatio: '1/1',
                      borderRadius: '10px', border, background: bg,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor, opacity,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      boxShadow: shadow,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 700, color, lineHeight: 1 }}>
                      {isClaiming ? '...' : mesa.mesa_numero}
                    </span>
                    {mesa.mia && (
                      <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>MÍA</span>
                    )}
                    {!mesa.disponible && !mesa.mia && (
                      <span style={{ fontSize: '8px', fontWeight: 600, color: '#D1D5DB', marginTop: '2px' }}>—</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{
            marginTop: '16px', padding: '10px 12px', borderRadius: '8px',
            background: '#FFFFFF', border: '1px solid #E5E7EB',
            display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid #E5E7EB' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Disponible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Mi mesa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F3F4F6', border: '1px solid #E5E7EB' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>Ocupada</span>
            </div>
          </div>
        </div>

        {/* If has claimed mesas, show "Ir a mis mesas" button */}
        {misMesas.length > 0 && (
          <div style={{
            position: 'sticky', bottom: 0,
            padding: '12px 16px', background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          }}>
            <button
              onClick={onMesaClaimed}
              style={{
                width: '100%', padding: '14px',
                background: '#CE1126', color: 'white',
                fontWeight: 700, fontSize: '14px',
                borderRadius: '12px', border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(206,17,38,0.25)',
                fontFamily: "'Inter', system-ui, sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              Ir a Mis Mesas ({misMesas.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
