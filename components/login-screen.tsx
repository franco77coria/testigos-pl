'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Fingerprint, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center relative bg-slate-50 overflow-hidden">

      {/* Decorative clean background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E31837]/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E31837]/5 blur-[80px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] px-5"
      >
        {/* Main Clean White Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-5 text-[#E31837]"
            >
              <ShieldCheck size={32} strokeWidth={2} />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
              Testigos Electorales
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Partido Liberal — 2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cedula" className="block text-xs font-bold text-slate-500 mb-2 px-1 uppercase tracking-wider">
                Documento de Identidad
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Fingerprint size={20} />
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
                  className={`w-full py-4 pl-[56px] pr-4 bg-slate-50 border-2 rounded-2xl text-[17px] font-bold text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:bg-white
                    ${hasError
                      ? 'border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                      : 'border-slate-200 focus:border-[#E31837] focus:shadow-[0_0_0_4px_rgba(227,24,55,0.1)]'
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
              className="w-full py-4 bg-[#E31837] text-white rounded-2xl font-bold text-[15px] cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c6102b] hover:shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </>
              )}
            </button>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, y: -5 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] font-medium flex items-start gap-2.5 mt-2">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-semibold tracking-widest uppercase">
          Control de Mando Nacional
        </p>
      </motion.div>
    </div>
  )
}
