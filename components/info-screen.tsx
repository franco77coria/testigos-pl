'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, MapPin, Building2, Plus, ArrowRight, AlertCircle, X } from 'lucide-react'
import type { SesionTestigo } from '@/lib/types'

interface Props {
  sesion: SesionTestigo
  onConfirm: (mesas: number[]) => Promise<{ exito: boolean; mensaje?: string }>
}

export default function InfoScreen({ sesion, onConfirm }: Props) {
  const { testigo } = sesion
  const [mesas, setMesas] = useState<number[]>(sesion.mesas?.map(m => m.mesa_numero) || [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addMesa() {
    const num = parseInt(input)
    if (!num || mesas.includes(num)) return
    setMesas([...mesas, num])
    setInput('')
  }

  async function handleContinue() {
    setLoading(true)
    setError(null)
    const res = await onConfirm(mesas)
    if (!res.exito) {
      setError(res.mensaje || 'Error al confirmar mesas.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F2F5' }}>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #B91C1C)' }} />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px]"
        >
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Success header */}
            <div className="px-7 pt-7 pb-5 flex items-center gap-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div className="w-12 h-12 rounded-xl bg-[#059669] flex items-center justify-center shrink-0" style={{ boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-xl font-extrabold text-[#111827]">
                  Identidad Verificada
                </h1>
                <p className="text-[13px] text-[#059669] font-bold mt-0.5 uppercase tracking-wide">
                  {testigo.nombre1} {testigo.apellido1}
                </p>
              </div>
            </div>

            {/* Location info */}
            <div className="px-7 py-5 space-y-3.5" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#F5F6FA', border: '1px solid #E5E7EB' }}>
                <MapPin size={18} className="text-[#E31837] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Municipio</p>
                  <p className="text-sm font-bold text-[#111827]">{testigo.municipio}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#F5F6FA', border: '1px solid #E5E7EB' }}>
                <Building2 size={18} className="text-[#E31837] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Puesto de Votacion</p>
                  <p className="text-sm font-bold text-[#111827]">{testigo.puesto}</p>
                </div>
              </div>
            </div>

            {/* Mesas input */}
            <div className="px-7 py-5">
              <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-3">
                Ingrese sus mesas de votacion
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMesa())}
                  placeholder="N° mesa"
                  className="flex-1 py-2.5 px-3.5 bg-[#F9FAFB] border-2 border-[#D1D5DB] rounded-xl text-sm font-semibold text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#E31837] focus:bg-white focus:ring-4 focus:ring-[#E31837]/10 transition-all"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={addMesa}
                  className="w-12 h-12 bg-[#E31837] rounded-xl text-white flex items-center justify-center shrink-0 hover:bg-[#C41530] active:scale-95 transition-all"
                  style={{ boxShadow: '0 4px 12px rgba(227,24,55,0.3)' }}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Mesa chips */}
              <AnimatePresence>
                {mesas.length > 0 ? (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden mb-4">
                    <div className="flex flex-wrap gap-2">
                      {mesas.map((m) => (
                        <motion.span
                          key={m}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF2F2] text-[#E31837] text-xs font-bold"
                          style={{ border: '1px solid #FCA5A5' }}
                        >
                          Mesa {m}
                          <button onClick={() => setMesas(mesas.filter(x => x !== m))} className="hover:text-red-900 transition-colors">
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] font-medium mb-4">Agregue las mesas que va a cubrir</p>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-semibold flex items-start gap-2"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #E31837, #B91C1C)',
                  boxShadow: '0 4px 14px rgba(227,24,55,0.4), 0 2px 4px rgba(227,24,55,0.2)',
                  minHeight: '52px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Continuar al Panel
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center mt-6 text-[#6B7280] text-[11px] font-bold tracking-widest uppercase">
            Partido Liberal — Cundinamarca 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
