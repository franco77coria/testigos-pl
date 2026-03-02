'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronRight, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[400px] px-5"
      >
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>

          {/* Header */}
          <div className="text-center mb-9">
            <div className="w-12 h-12 mx-auto bg-red-50 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">
              Testigos Electorales
            </h1>
            <p className="text-gray-400 text-sm">
              Partido Liberal — 2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="cedula" className="block text-xs font-medium text-gray-500 mb-2 tracking-wide">
                DOCUMENTO DE IDENTIDAD
              </label>
              <input
                id="cedula"
                type="number"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value)
                  setHasError(false)
                }}
                className={`w-full py-3.5 px-4 bg-gray-50 border rounded-xl text-[15px] font-medium text-gray-900 placeholder-gray-300 outline-none transition-all duration-200
                  ${hasError
                    ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100'
                  }
                `}
                placeholder="Ej: 1012345678"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={!cedula || loading}
              className="w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] font-medium flex items-start gap-2.5">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-300 text-[11px] font-medium tracking-widest uppercase">
          Cundinamarca · 2026
        </p>
      </motion.div>
    </div>
  )
}
