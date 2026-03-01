'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { formatCedula } from '@/lib/utils'
import type { SesionTestigo } from '@/lib/types'

interface Props {
  onLogin: (sesion: SesionTestigo) => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    const raw = cedula.replace(/\D/g, '')
    if (!raw) {
      setError('Ingrese su numero de cedula.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: raw }),
      })
      const data = await res.json()

      if (data.exito) {
        onLogin(data.sesion)
      } else {
        setError(data.mensaje || 'Cedula no encontrada en el sistema.')
      }
    } catch {
      setError('Error de conexion. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Red header band */}
      <div className="bg-pl-red px-5 py-6 text-center">
        <div className="w-14 h-14 mx-auto mb-3 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Testigos Electorales
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Partido Liberal — Cundinamarca 2026
        </p>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-start justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px]"
        >
          <div className="bg-white border border-border rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <label className="block text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Numero de cedula
            </label>
            <div className="relative mb-4">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pl-red/50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatCedula(cedula)}
                onChange={(e) => {
                  setCedula(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Ingrese su cedula"
                autoComplete="off"
                className="w-full py-3.5 pl-11 pr-4 border border-border rounded-xl bg-surface text-base font-semibold tracking-wider text-text-primary placeholder:text-text-secondary/40 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal focus:border-pl-red focus:outline-none focus:ring-2 focus:ring-pl-red/10 transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-red-50 border border-red-200 text-pl-red-dark px-3 py-2.5 rounded-lg text-sm flex items-start gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                {error}
              </motion.div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-pl-red text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:bg-pl-red-dark hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                  </svg>
                  Ingresar
                </>
              )}
            </button>
          </div>

          <p className="text-center mt-6 text-text-secondary/40 text-[11px]">
            Partido Liberal de Colombia
          </p>
        </motion.div>
      </div>
    </div>
  )
}
