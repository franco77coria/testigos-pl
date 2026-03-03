'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowRight, AlertCircle, Shield } from 'lucide-react'

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
        setError(res.mensaje || 'Cedula no encontrada.')
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.03) 0%, rgba(30,58,138,0.03) 100%)' }}>
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)' }}>

            {/* Header section with gradient background */}
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.06) 0%, rgba(30,58,138,0.06) 100%)' }}>
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: '0 4px 12px rgba(227,24,55,0.3)' }}>
                <Shield size={26} className="text-white" />
              </div>
              <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-1">
                Testigos Electorales
              </h1>
              <p className="text-[#718096] text-sm font-medium">
                Partido Liberal — Cundinamarca 2026
              </p>
            </div>

            {/* Form section */}
            <div className="px-8 pb-8 pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="cedula" className="block text-[11px] font-semibold text-[#4a5568] mb-2 uppercase tracking-wider">
                    Documento de Identidad
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
                    className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-[#1a1a1a] placeholder-[#CBD5E1] outline-none transition-all duration-200
                      ${hasError
                        ? 'border-2 border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border border-[#E2E8F0] bg-[#F8F9FA] focus:border-[#E31837] focus:bg-white focus:ring-2 focus:ring-[#E31837]/10'
                      }
                    `}
                    placeholder="Ingrese su numero de cedula"
                    disabled={loading}
                    style={{ minHeight: '48px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!cedula || loading}
                  className="w-full py-3.5 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2.5"
                  style={{
                    background: 'linear-gradient(135deg, #E31837, #C41530)',
                    boxShadow: !cedula || loading ? 'none' : '0 4px 12px rgba(227,24,55,0.25)',
                    minHeight: '48px',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar al Sistema
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          <p className="text-center mt-6 text-[#94A3B8] text-[11px] font-medium tracking-widest uppercase">
            Cundinamarca 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
