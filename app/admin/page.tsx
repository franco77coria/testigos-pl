'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, ShieldAlert, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  testigos: number
  mesas: number
}

type AccesoTab = 'lideres' | 'analysis' | 'super'

interface AccesoItem {
  cedula: string
  nombre?: string
}

export default function AdminPanel() {
  const router = useRouter()

  // Auth gate
  const [authorized, setAuthorized] = useState(false)
  const [gateCedula, setGateCedula] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError] = useState('')

  // Loading & messages
  const [loading, setLoading] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [stats, setStats] = useState<Stats>({ testigos: 0, mesas: 0 })

  // Accesos
  const [accesoTab, setAccesoTab] = useState<AccesoTab>('lideres')
  const [accesoLideres, setAccesoLideres] = useState<AccesoItem[]>([])
  const [accesoAnalysis, setAccesoAnalysis] = useState<AccesoItem[]>([])
  const [accesoSuper, setAccesoSuper] = useState<AccesoItem[]>([])
  const [nuevaCedula, setNuevaCedula] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [accesoMensaje, setAccesoMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [accesoLoading, setAccesoLoading] = useState(false)

  // Reset
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetMensaje, setResetMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  const testigosRef = useRef<HTMLInputElement>(null)

  // ---- Auth Gate ----
  async function verifySuperAdmin() {
    setGateLoading(true)
    setGateError('')
    try {
      const res = await fetch('/api/admin/verify-super', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: gateCedula }),
      })
      const json = await res.json()
      if (json.exito && json.rol === 'super') {
        setAuthorized(true)
      } else {
        setGateError('Solo el Super Admin puede acceder a este panel.')
      }
    } catch {
      setGateError('Error de conexión.')
    }
    setGateLoading(false)
  }

  // ---- Load accesos ----
  useEffect(() => {
    if (!authorized) return
    loadAccesos()
  }, [authorized])

  async function loadAccesos() {
    try {
      const [rL, rA, rS] = await Promise.all([
        fetch('/api/admin/acceso-stats').then(r => r.json()),
        fetch('/api/admin/acceso-analysis').then(r => r.json()),
        fetch('/api/admin/acceso-super').then(r => r.json()),
      ])
      if (rL.exito) setAccesoLideres(rL.accesos)
      if (rA.exito) setAccesoAnalysis(rA.accesos)
      if (rS.exito) setAccesoSuper(rS.accesos)
    } catch { /* silent */ }
  }

  function endpointForTab(tab: AccesoTab) {
    if (tab === 'lideres') return '/api/admin/acceso-stats'
    if (tab === 'analysis') return '/api/admin/acceso-analysis'
    return '/api/admin/acceso-super'
  }

  function setListForTab(tab: AccesoTab, items: AccesoItem[]) {
    if (tab === 'lideres') setAccesoLideres(items)
    else if (tab === 'analysis') setAccesoAnalysis(items)
    else setAccesoSuper(items)
  }

  function getListForTab(tab: AccesoTab) {
    if (tab === 'lideres') return accesoLideres
    if (tab === 'analysis') return accesoAnalysis
    return accesoSuper
  }

  async function handleAddAcceso(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevaCedula.trim()) return
    setAccesoLoading(true)
    setAccesoMensaje(null)
    try {
      const res = await fetch(endpointForTab(accesoTab), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ super_cedula: gateCedula, cedula_nueva: nuevaCedula, nombre: nuevoNombre }),
      })
      const data = await res.json()
      if (data.exito) {
        setAccesoMensaje({ tipo: 'ok', texto: data.mensaje })
        setNuevaCedula('')
        setNuevoNombre('')
        // Refetch this tab
        const r = await fetch(endpointForTab(accesoTab)).then(r => r.json())
        if (r.exito) setListForTab(accesoTab, r.accesos)
      } else {
        setAccesoMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setAccesoMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setAccesoLoading(false)
  }

  async function handleRevokeAcceso(cedula: string) {
    setAccesoLoading(true)
    setAccesoMensaje(null)
    try {
      const res = await fetch(endpointForTab(accesoTab), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ super_cedula: gateCedula, cedula }),
      })
      const data = await res.json()
      if (data.exito) {
        setListForTab(accesoTab, getListForTab(accesoTab).filter(a => a.cedula !== cedula))
        setAccesoMensaje({ tipo: 'ok', texto: data.mensaje })
      } else {
        setAccesoMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setAccesoMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setAccesoLoading(false)
  }

  // ---- CSV Upload ----
  async function uploadCSV(file: File) {
    setLoading('testigos')
    setMensaje(null)
    try {
      const text = await file.text()
      const res = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const data = await res.json()
      if (data.exito) {
        setMensaje({ tipo: 'ok', texto: data.mensaje })
        setStats({ testigos: data.total, mesas: data.mesas })
      } else {
        setMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setLoading('')
  }

  // ---- Reset ----
  async function handleReset() {
    if (resetConfirm !== 'BORRAR') {
      setResetMensaje({ tipo: 'err', texto: 'Debe escribir BORRAR para confirmar.' })
      return
    }
    setLoading('reset')
    setResetMensaje(null)
    try {
      const res = await fetch('/api/admin/reset-elecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: gateCedula }),
      })
      const data = await res.json()
      setResetMensaje({ tipo: data.exito ? 'ok' : 'err', texto: data.mensaje })
      if (data.exito) setResetConfirm('')
    } catch {
      setResetMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setLoading('')
  }

  const TAB_LABELS: Record<AccesoTab, { label: string; desc: string; color: string }> = {
    lideres: { label: 'Líderes', desc: 'Acceso al Monitor de Estadísticas', color: '#3B82F6' },
    analysis: { label: 'Analysis Center', desc: 'Acceso al Centro de Análisis', color: '#8B5CF6' },
    super: { label: 'Super Admin', desc: 'Acceso total al panel de control', color: '#CE1126' },
  }

  // ===================== GATE SCREEN =====================
  if (!authorized) {
    return (
      <div style={styles.gateWrapper}>
        <div style={styles.gateCard}>
          <div style={styles.gateIconCircle}>
            <ShieldAlert size={24} color="#CE1126" />
          </div>
          <h1 style={styles.gateTitle}>Centro de Operaciones</h1>
          <p style={styles.gateSubtitle}>Ingrese su cédula de Super Admin</p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Cédula"
            value={gateCedula}
            onChange={e => setGateCedula(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifySuperAdmin()}
            style={styles.gateInput}
          />
          <button
            onClick={verifySuperAdmin}
            disabled={gateLoading || !gateCedula.trim()}
            style={{
              ...styles.gateButton,
              opacity: (!gateCedula.trim() || gateLoading) ? 0.5 : 1,
              cursor: (!gateCedula.trim() || gateLoading) ? 'not-allowed' : 'pointer',
            }}
          >
            {gateLoading ? 'Verificando...' : 'Acceder'}
          </button>
          {gateError && <p style={styles.gateError}>{gateError}</p>}
          <Link href="/" style={styles.gateBack}>← Volver al portal</Link>
        </div>
      </div>
    )
  }

  // ===================== MAIN PANEL =====================
  const currentList = getListForTab(accesoTab)
  const tabInfo = TAB_LABELS[accesoTab]

  return (
    <div style={styles.page}>
      <div style={styles.topAccent} />

      <div style={styles.container}>
        <Link href="/" style={styles.backLink}>← Volver al portal</Link>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 style={styles.headerTitle}>Centro de Operaciones</h1>
            <p style={styles.headerSub}>Administración de Plataforma</p>
          </div>
        </div>

        {/* Global alert */}
        {mensaje && (
          <div style={{
            ...styles.alert,
            background: mensaje.tipo === 'ok' ? '#ECFDF5' : '#FEF2F2',
            borderColor: mensaje.tipo === 'ok' ? '#A7F3D0' : '#FECACA',
            color: mensaje.tipo === 'ok' ? '#065F46' : '#B91C1C',
          }}>
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* =================== MONITOR CARD =================== */}
        <div style={styles.monitorCard} onClick={() => router.push('/admin/dashboard')}>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot} />
            <span style={styles.liveText}>EN VIVO</span>
          </div>
          <h2 style={styles.monitorTitle}>Monitor Nacional de Escrutinio</h2>
          <p style={styles.monitorDesc}>
            Estadísticas en tiempo real, carga de testigos y desglose por candidato.
          </p>
          <div style={styles.monitorIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        </div>

        {/* =================== FLUJO DE TRABAJO =================== */}
        <div style={styles.sectionHeader}>FLUJO DE TRABAJO</div>
        <div style={styles.workflowCard}>
          <div style={styles.workflowRow}>
            <div style={styles.workflowLeft}>
              <div style={{ ...styles.workflowIconCircle, background: 'rgba(59,130,246,0.08)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <div style={styles.workflowTitle}>Censo de Testigos</div>
                <div style={styles.workflowDesc}>CSV unificado CNE: testigos + mesas asignadas.</div>
                {stats.testigos > 0 && (
                  <div style={styles.workflowBadge}>
                    <CheckCircle2 size={11} /> {stats.testigos} testigos · {stats.mesas} mesas
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => !loading && testigosRef.current?.click()}
              style={styles.csvButton}
            >
              {loading === 'testigos' ? (
                <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Subir CSV
                </>
              )}
            </button>
            <input ref={testigosRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadCSV(f); e.target.value = '' }} />
          </div>
        </div>

        {/* =================== GESTIÓN DE ACCESOS =================== */}
        <div style={styles.sectionHeader}>GESTIÓN DE ACCESOS</div>
        <div style={styles.accessCard}>

          {/* Tabs */}
          <div style={styles.tabBar}>
            {(Object.keys(TAB_LABELS) as AccesoTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setAccesoTab(tab); setAccesoMensaje(null); setNuevaCedula(''); setNuevoNombre('') }}
                style={{
                  ...styles.tabBtn,
                  background: accesoTab === tab ? TAB_LABELS[tab].color : 'transparent',
                  color: accesoTab === tab ? '#FFFFFF' : '#64748B',
                  fontWeight: accesoTab === tab ? 700 : 500,
                }}
              >
                {TAB_LABELS[tab].label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px' }}>
            {/* Tab description */}
            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '16px' }}>
              {tabInfo.desc}
            </p>

            {/* Feedback */}
            {accesoMensaje && (
              <div style={{
                ...styles.inlineAlert,
                background: accesoMensaje.tipo === 'ok' ? '#ECFDF5' : '#FEF2F2',
                color: accesoMensaje.tipo === 'ok' ? '#065F46' : '#B91C1C',
                marginBottom: '16px',
              }}>
                {accesoMensaje.tipo === 'ok' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                <span>{accesoMensaje.texto}</span>
              </div>
            )}

            {/* Add form */}
            <form onSubmit={handleAddAcceso} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text" inputMode="numeric"
                placeholder="Cédula"
                value={nuevaCedula}
                onChange={e => setNuevaCedula(e.target.value)}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Nombre (opcional)"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                style={styles.input}
              />
              <button
                type="submit"
                disabled={accesoLoading || !nuevaCedula.trim()}
                style={{
                  ...styles.addBtn,
                  background: tabInfo.color,
                  opacity: accesoLoading || !nuevaCedula.trim() ? 0.5 : 1,
                  cursor: accesoLoading || !nuevaCedula.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {accesoLoading ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : '+ Agregar acceso'}
              </button>
            </form>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentList.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '16px 0', fontWeight: 500 }}>
                  No hay accesos registrados.
                </p>
              ) : (
                currentList.map(item => (
                  <div key={item.cedula} style={styles.accesoRow}>
                    <div style={styles.accesoInfo}>
                      <div style={{ ...styles.accesoAvatar, background: tabInfo.color }}>
                        {(item.nombre || item.cedula).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {item.nombre && (
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{item.nombre}</div>
                        )}
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{item.cedula}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeAcceso(item.cedula)}
                      disabled={accesoLoading}
                      title="Revocar acceso"
                      style={styles.revokeBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* =================== ZONA DE PELIGRO =================== */}
        <div style={{ ...styles.sectionHeader, color: '#DC2626' }}>ZONA DE PELIGRO</div>
        <div style={styles.dangerCard}>
          <div style={styles.dangerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 style={styles.dangerTitle}>Borrar datos de elecciones cargados</h3>
          <p style={styles.dangerDesc}>
            Esta acción borrará <strong>todos los resultados</strong> (votos, fotos E-14 y asignaciones de mesas). Los testigos NO se borrarán.
          </p>

          {resetMensaje && (
            <div style={{
              ...styles.inlineAlert,
              background: resetMensaje.tipo === 'ok' ? '#ECFDF5' : '#FEF2F2',
              color: resetMensaje.tipo === 'ok' ? '#065F46' : '#B91C1C',
              marginBottom: '12px',
            }}>
              {resetMensaje.tipo === 'ok' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{resetMensaje.texto}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder='Escriba BORRAR para confirmar'
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              style={{ ...styles.input, borderColor: '#FECACA' }}
            />
            <button
              onClick={handleReset}
              disabled={loading === 'reset' || resetConfirm !== 'BORRAR'}
              style={{
                ...styles.dangerButton,
                opacity: (loading === 'reset' || resetConfirm !== 'BORRAR') ? 0.4 : 1,
              }}>
              {loading === 'reset' ? (
                <><Loader2 size={16} className="animate-spin" /> Borrando...</>
              ) : '🗑️ Borrar Todos los Datos de Elecciones'}
            </button>
          </div>
        </div>

        <div style={{ height: '48px' }} />
      </div>
    </div>
  )
}

// ===================== STYLES =====================
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  topAccent: {
    height: '3px',
    background: 'linear-gradient(90deg, #CE1126, #EF4444)',
    width: '100%',
  },
  container: {
    maxWidth: '420px',
    margin: '0 auto',
    padding: '20px 20px 40px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#CE1126',
    textDecoration: 'none',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #CE1126, #B91C1C)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(206,17,38,0.25)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    margin: 0,
  },
  headerSub: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    margin: 0,
    marginTop: '2px',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid',
    marginBottom: '20px',
  },
  monitorCard: {
    background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
    borderRadius: '24px',
    padding: '28px 24px',
    marginBottom: '32px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(15,23,42,0.18)',
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16,185,129,0.15)',
    borderRadius: '20px',
    padding: '5px 12px',
    marginBottom: '16px',
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10B981',
  },
  liveText: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#10B981',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  monitorTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 8px',
  },
  monitorDesc: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(148,163,184,0.9)',
    lineHeight: 1.5,
    margin: '0 0 20px',
  },
  monitorIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    paddingLeft: '2px',
  },
  workflowCard: {
    background: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  workflowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    gap: '12px',
  },
  workflowLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    flex: 1,
  },
  workflowIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workflowTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.3,
  },
  workflowDesc: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    marginTop: '2px',
    lineHeight: 1.4,
  },
  workflowBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px',
    padding: '3px 8px',
    borderRadius: '6px',
    background: '#ECFDF5',
    color: '#059669',
    fontSize: '10px',
    fontWeight: 700,
  },
  csvButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  // Access card
  accessCard: {
    background: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #E2E8F0',
    padding: '8px 8px 0',
    gap: '4px',
  },
  tabBtn: {
    flex: 1,
    padding: '8px 6px',
    borderRadius: '10px 10px 0 0',
    border: 'none',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '0.01em',
    transition: 'all 0.15s',
  },
  accesoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
  },
  accesoInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  accesoAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  revokeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(239,68,68,0.08)',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  addBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  // Input
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: '14px',
    fontWeight: 500,
    color: '#0F172A',
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    boxSizing: 'border-box' as const,
  },
  // Inline alert
  inlineAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  // Danger zone
  dangerCard: {
    background: '#FFFFFF',
    borderRadius: '24px',
    border: '2px solid #FECACA',
    padding: '28px 24px',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(239,68,68,0.06)',
  },
  dangerIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(220,38,38,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  dangerTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 6px',
  },
  dangerDesc: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    lineHeight: 1.5,
    margin: '0 0 20px',
  },
  dangerButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '14px',
    border: 'none',
    background: '#DC2626',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(220,38,38,0.2)',
  },
  // Gate
  gateWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#F8FAFC',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  gateCard: {
    width: '100%',
    maxWidth: '380px',
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '40px 32px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    textAlign: 'center' as const,
  },
  gateIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(206,17,38,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  gateTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 6px',
  },
  gateSubtitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    margin: '0 0 24px',
  },
  gateInput: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: '16px',
    fontWeight: 500,
    color: '#0F172A',
    textAlign: 'center' as const,
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    boxSizing: 'border-box' as const,
    marginBottom: '12px',
  },
  gateButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '14px',
    border: 'none',
    background: '#CE1126',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: "'Inter', system-ui, sans-serif",
    boxShadow: '0 4px 14px rgba(206,17,38,0.2)',
  },
  gateError: {
    marginTop: '14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#DC2626',
    margin: '14px 0 0',
  },
  gateBack: {
    display: 'block',
    marginTop: '20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94A3B8',
    textDecoration: 'none',
  },
}
