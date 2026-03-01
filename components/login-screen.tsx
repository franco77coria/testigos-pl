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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #E31837 0%, #8B0A1E 50%, #1A1A1A 100%)' }}
    >
      {/* Background decorative radials */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[420px] px-6"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(255,255,255,0.1)', '0 0 40px rgba(255,255,255,0.2)', '0 0 20px rgba(255,255,255,0.1)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[90px] h-[90px] mx-auto mb-5 rounded-full flex items-center justify-center border-2 border-white/25"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </motion.div>
          <h1 className="text-[22px] font-bold text-white mb-1.5 tracking-tight">
            Testigos Electorales
          </h1>
          <p className="text-white/70 text-[13px] leading-relaxed">
            Partido Liberal — Cundinamarca 2026
          </p>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl p-8 border border-white/15"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <label className="block text-white/85 text-[13px] font-medium mb-2">
            Numero de cedula
          </label>
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              className="w-full py-4 pl-[52px] pr-4 rounded-xl text-white text-lg font-semibold tracking-widest outline-none transition-all duration-300 placeholder:text-white/35 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.5)'
                e.target.style.background = 'rgba(255,255,255,0.12)'
                e.target.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                e.target.style.background = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-white text-[#E31837] rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 px-4 py-3 rounded-xl text-[13px] flex items-start gap-2"
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#FCA5A5',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              {error}
            </motion.div>
          )}
        </div>

        <p className="text-center mt-8 text-white/40 text-[11px]">
          Partido Liberal de Colombia
        </p>
      </motion.div>
    </div>
  )
}
