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
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F2F5' }}>
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #B91C1C)' }} />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' }}>

            {/* Header — bold red gradient */}
            <div className="px-8 pt-8 pb-7 text-center" style={{ background: 'linear-gradient(135deg, #E31837 0%, #991B1B 100%)' }}>
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5 bg-white/15 backdrop-blur-sm" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                <Shield size={30} className="text-white" />
              </div>
              <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-2xl font-extrabold text-white tracking-tight mb-1.5">
                Testigos Electorales
              </h1>
              <p className="text-white/70 text-sm font-medium">
                Partido Liberal — Cundinamarca 2026
              </p>
            </div>

            {/* Form section */}
            <div className="px-8 pb-8 pt-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="cedula" className="block text-[11px] font-bold text-[#374151] mb-2.5 uppercase tracking-wider">
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
                    className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold text-[#111827] placeholder-[#9CA3AF] outline-none transition-all duration-200
                      ${hasError
                        ? 'border-2 border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                        : 'border-2 border-[#D1D5DB] bg-[#F9FAFB] focus:border-[#E31837] focus:bg-white focus:ring-4 focus:ring-[#E31837]/10'
                      }
                    `}
                    placeholder="Ingrese su numero de cedula"
                    disabled={loading}
                    style={{ minHeight: '52px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!cedula || loading}
                  className="w-full py-4 text-white rounded-xl font-bold text-[15px] cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] flex items-center justify-center gap-2.5"
                  style={{
                    background: !cedula || loading ? '#E5E7EB' : 'linear-gradient(135deg, #E31837, #B91C1C)',
                    color: !cedula || loading ? '#9CA3AF' : '#FFFFFF',
                    boxShadow: !cedula || loading ? 'none' : '0 4px 14px rgba(227,24,55,0.4), 0 2px 4px rgba(227,24,55,0.2)',
                    minHeight: '52px',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar al Sistema
                      <ArrowRight size={20} />
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
                      <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-[13px] font-semibold flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          <p className="text-center mt-6 text-[#6B7280] text-[11px] font-bold tracking-widest uppercase">
            Cundinamarca 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
