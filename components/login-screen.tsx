'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onLogin: (cedula: string) => Promise<{
    exito: boolean
    mensaje?: string
    esCoordinador?: boolean
  }>
}

export default function LoginScreen({ onLogin }: Props) {
  const [cedula, setCedula] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cedula.trim()) return

    setLoading(true)
    setError('')
    setHasError(false)

    try {
      const res = await onLogin(cedula)
      if (!res.exito && !res.esCoordinador) {
        setError(res.mensaje || 'Cédula no encontrada.')
        setHasError(true)
      }
    } catch {
      setError('Error de conexión, intente nuevamente.')
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#F0F2F5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#CE1126',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px 0 rgba(206, 17, 38, 0.35)',
            marginBottom: '8px',
          }}>
            <span style={{ color: 'white', fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>L</span>
          </div>
          <div>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#111827',
              margin: 0,
            }}>
              Testigos Electorales
            </h1>
            <p style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#94A3B8',
              marginTop: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Partido Liberal — Cundinamarca 2026
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #E5E7EB',
          padding: '24px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginLeft: '2px',
                }}
                htmlFor="cedula"
              >
                Documento de Identidad
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <span className="material-icons" style={{ color: hasError ? '#CE1126' : '#94A3B8', fontSize: '20px' }}>fingerprint</span>
                </div>
                <input
                  id="cedula"
                  name="cedula"
                  type="tel"
                  autoComplete="off"
                  placeholder="Ingrese su número de cédula"
                  value={cedula}
                  onChange={(e) => {
                    setCedula(e.target.value)
                    setHasError(false)
                  }}
                  disabled={loading}
                  style={{
                    display: 'block',
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: `1px solid ${hasError ? '#CE1126' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    background: hasError ? '#FEF2F2' : '#F8F9FA',
                    color: '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#CE1126'; e.target.style.background = '#FFFFFF'; }}
                  onBlur={(e) => { if (!hasError) { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F8F9FA'; } }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!cedula || loading}
              style={{
                width: '100%',
                background: (!cedula || loading) ? 'rgba(206, 17, 38, 0.5)' : 'linear-gradient(135deg, #EF4444, #B91C1C)',
                backgroundImage: (!cedula || loading) ? 'none' : 'linear-gradient(135deg, #EF4444, #B91C1C)',
                backgroundColor: (!cedula || loading) ? 'rgba(206, 17, 38, 0.5)' : '#CE1126',
                color: 'white',
                borderRadius: '12px',
                padding: '14px 16px',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: (!cedula || loading) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px 0 rgba(206, 17, 38, 0.35)',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'opacity 0.2s',
              }}
            >
              <span>{loading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
              {!loading && <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: '#FEF2F2',
                    color: '#CE1126',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #FECACA',
                  }}>
                    <span className="material-icons" style={{ fontSize: '18px' }}>error_outline</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: '11px',
          color: '#94A3B8',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          textAlign: 'center',
          paddingBottom: '16px',
        }}>
          Cundinamarca 2026
        </div>
      </motion.div>
    </div>
  )
}
