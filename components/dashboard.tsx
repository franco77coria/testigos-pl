'use client'

import { useState, useEffect } from 'react'
import type { SesionTestigo, MesaDashboard } from '@/lib/types'
import { calcularEstado, SENADO_CANDIDATOS } from '@/lib/types'
import MesaCard from './mesa-card'
import { horaActual } from '@/lib/utils'

interface Props {
  sesion: SesionTestigo
  onLogout: () => void
  onMesasUpdate: (mesas: MesaDashboard[]) => void
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 500
    const start = performance.now()
    const from = display

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value])

  return <>{display}</>
}

export default function Dashboard({ sesion, onLogout, onMesasUpdate }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [ultimaAct, setUltimaAct] = useState(horaActual())
  const [senadoCandidatos, setSenadoCandidatos] = useState(SENADO_CANDIDATOS)

  const { testigo, mesas } = sesion

  const total = mesas.length
  const completadas = mesas.filter((m) => calcularEstado(m) === 'completada').length
  const pendientes = total - completadas

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        if (data.exito && data.candidatos) {
          setSenadoCandidatos(data.candidatos)
        }
      })
      .catch(() => { })
  }, [])

  async function refrescar() {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/mesas?cedula=${sesion.cedula}`)
      const data = await res.json()
      if (data.exito) {
        onMesasUpdate(data.mesas)
        setUltimaAct(horaActual())
      }
    } catch { /* silent */ }
    setRefreshing(false)
  }

  function handleMesaUpdate(updatedMesa: MesaDashboard) {
    const newMesas = mesas.map((m) =>
      m.mesa_numero === updatedMesa.mesa_numero ? updatedMesa : m
    )
    onMesasUpdate(newMesas)
    setUltimaAct(horaActual())
  }

  return (
    <div style={{
      background: '#F0F2F5',
      minHeight: '100vh',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        background: '#F0F2F5',
        minHeight: '100vh',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Red accent bar */}
        <div style={{ height: '3px', background: '#CE1126', width: '100%' }} />

        {/* Header */}
        <header style={{
          background: '#FFFFFF',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#CE1126',
              color: 'white',
              width: '32px', height: '32px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '18px', lineHeight: 1,
            }}>
              L
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              <span style={{ color: '#111827' }}>Testigos</span>
              <span style={{ color: '#CE1126', marginLeft: '4px' }}>PL</span>
            </h1>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'none', border: 'none', color: '#94A3B8',
              cursor: 'pointer', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          </button>
        </header>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '96px' }}>
          {/* User info bar */}
          <div style={{
            background: '#FFFFFF',
            padding: '16px',
            marginBottom: '16px',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{
                  fontSize: '13px', fontWeight: 700, color: '#111827',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  marginBottom: '4px', margin: 0,
                }}>
                  {testigo.nombre1} {testigo.apellido1}
                </h2>
                <p style={{
                  fontSize: '11px', color: '#94A3B8',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  textTransform: 'uppercase', fontWeight: 500, margin: 0, marginTop: '4px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                  {testigo.municipio} - {testigo.puesto}
                </p>
              </div>
              <button
                onClick={refrescar}
                disabled={refreshing}
                style={{
                  color: '#CE1126', background: 'rgba(206,17,38,0.1)',
                  padding: '8px', borderRadius: '50%', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  opacity: refreshing ? 0.5 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>sync</span>
              </button>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ padding: '0 16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{
              background: '#FFFFFF', borderTop: '4px solid #E5E7EB',
              borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB', borderTopColor: '#E5E7EB',
              padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '18px', marginBottom: '4px' }}>list_alt</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: '4px' }}>
                <AnimatedNumber value={total} />
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>Total</span>
            </div>
            <div style={{
              background: '#FFFFFF', borderTop: '4px solid #10B981',
              borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB', borderTopColor: '#10B981',
              padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: '18px', marginBottom: '4px' }}>check_circle</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', lineHeight: 1, marginBottom: '4px' }}>
                <AnimatedNumber value={completadas} />
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>Listas</span>
            </div>
            <div style={{
              background: '#FFFFFF', borderTop: '4px solid #F59E0B',
              borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB', borderTopColor: '#F59E0B',
              padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#F59E0B', fontSize: '18px', marginBottom: '4px' }}>schedule</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#F59E0B', lineHeight: 1, marginBottom: '4px' }}>
                <AnimatedNumber value={pendientes} />
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>Pendientes</span>
            </div>
          </div>

          {/* Mesa List — solo pendientes */}
          <div style={{ padding: '0 16px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                Mesas Pendientes
              </h3>
              {completadas > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: '#10B981',
                  background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px',
                }}>
                  {completadas} completada{completadas > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {mesas.length === 0 ? (
              <div style={{
                background: '#FFFFFF', borderRadius: '12px', padding: '32px',
                textAlign: 'center', border: '1px solid #E5E7EB',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(148,163,184,0.3)', marginBottom: '8px' }}>inbox</span>
                <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>No tiene mesas asignadas.</p>
              </div>
            ) : pendientes === 0 ? (
              <div style={{
                background: 'rgba(16,185,129,0.06)', borderRadius: '12px', padding: '32px',
                textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#10B981', marginBottom: '8px', display: 'block' }}>task_alt</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>Todas las mesas completadas</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{completadas} de {total} reportes enviados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mesas.filter(m => calcularEstado(m) === 'pendiente').map((mesa) => (
                  <MesaCard
                    key={mesa.mesa_numero}
                    mesa={mesa}
                    cedula={sesion.cedula}
                    onUpdate={handleMesaUpdate}
                    senadoCandidatos={senadoCandidatos}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div style={{ padding: '0 16px', marginTop: '32px', paddingBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Última actualización: {ultimaAct}
            </p>
            <p style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
              {completadas}/{total} reportes enviados
            </p>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
