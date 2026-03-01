'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

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
      setError('Error de conexion, intente nuevamente.')
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#F5F5F7] overflow-hidden">
      {/* Premium subtle background */}
      <div className="absolute top-0 left-0 right-0 h-[50vh]"
        style={{ background: 'linear-gradient(135deg, #E31837, #8B0A1E)' }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, #ffffff 0%, transparent 60%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] px-5"
      >
        {/* Main Clean White Card */}
        <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-5 text-[#E31837] shadow-inner"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-1">
              Testigos Electorales
            </h1>
            <p className="text-[#6B7280] text-[15px] font-medium">
              Partido Liberal — 2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cedula" className="block text-[13px] font-bold text-[#6B7280] mb-2 px-1">
                Número de cédula
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="12" x="3" y="6" rx="2" ry="2" />
                    <line x1="8" y1="12" x2="8.01" y2="12" />
                  </svg>
                </div>
                <input
                  id="cedula"
                  type="number"
                  inputMode="numeric"
                  value={cedula}
                  onChange={(e) => {
                    setCedula(e.target.value)
                    setHasError(false)
                  }}
                  className={`w-full py-4 pl-12 pr-4 bg-[#F8F9FA] border-2 rounded-2xl text-[17px] font-bold text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-all duration-300 tracking-wide focus:bg-white
                    ${hasError
                      ? 'border-[#EF4444] shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                      : 'border-[#E2E8F0] focus:border-[#E31837] focus:shadow-[0_0_0_4px_rgba(227,24,55,0.1)]'
                    }
                  `}
                  placeholder="Ej: 1012345678"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!cedula || loading}
              className="w-full py-4 text-white rounded-2xl font-bold text-[16px] cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(227,24,55,0.25)] flex items-center justify-center gap-2 group"
              style={{ background: 'linear-gradient(135deg, #E31837, #B71530)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[13px] font-medium flex items-start gap-2.5 mt-4"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <p className="text-center mt-8 text-white/80 text-[12px] font-medium tracking-wide">
          PARTIDO LIBERAL DE COLOMBIA
        </p>
      </motion.div>
    </div>
  )
}
