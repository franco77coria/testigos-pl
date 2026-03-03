'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SesionTestigo } from '@/lib/types'
import { MapPin, Building2, Plus, X, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  sesion: SesionTestigo
  onConfirm: (mesas: number[]) => Promise<{ exito: boolean; mensaje?: string }>
}

export default function InfoScreen({ sesion, onConfirm }: Props) {
  const { testigo } = sesion
  const [mesaInput, setMesaInput] = useState('')
  const [mesasAgregadas, setMesasAgregadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function agregarMesa() {
    const num = parseInt(mesaInput)
    if (!num || num <= 0) return
    if (mesasAgregadas.includes(num)) {
      setMesaInput('')
      return
    }
    setMesasAgregadas(prev => [...prev, num].sort((a, b) => a - b))
    setMesaInput('')
    setError('')
  }

  function quitarMesa(num: number) {
    setMesasAgregadas(prev => prev.filter(m => m !== num))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      agregarMesa()
    }
  }

  async function handleContinuar() {
    if (mesasAgregadas.length === 0) {
      setError('Agregue al menos una mesa.')
      return
    }
    setLoading(true)
    setError('')
    const result = await onConfirm(mesasAgregadas)
    if (!result.exito) {
      setError(result.mensaje || 'Error al registrar mesas.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.03) 0%, rgba(30,58,138,0.03) 100%)' }}>
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px]"
        >
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)' }}>

            {/* Success header */}
            <div className="px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center" style={{ boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={22} className="text-white" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-lg font-bold text-[#1a1a1a]">Identidad Verificada</h2>
                  <p className="text-[#718096] text-sm">{testigo.nombre1} {testigo.apellido1}</p>
                </div>
              </div>
            </div>

            <div className="px-7 pb-7 pt-5 space-y-5">
              {/* Location info */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.1), rgba(227,24,55,0.05))' }}>
                    <MapPin size={16} className="text-[#E31837]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider block">Municipio</span>
                    <span className="font-semibold text-[#1a1a1a] text-sm">{testigo.municipio}</span>
                  </div>
                </div>
                <div className="h-px bg-[#E2E8F0]" />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.1), rgba(227,24,55,0.05))' }}>
                    <Building2 size={16} className="text-[#E31837]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider block">Puesto de Votacion</span>
                    <span className="font-semibold text-[#1a1a1a] text-sm leading-tight">{testigo.puesto}</span>
                  </div>
                </div>
              </div>

              {/* Mesa input */}
              <div className="rounded-xl p-4" style={{ background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
                <label className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider block mb-3">
                  Ingrese sus mesas de votacion
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={mesaInput}
                    onChange={(e) => setMesaInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="N° mesa"
                    className="flex-1 h-11 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1a1a1a] placeholder-[#CBD5E1] focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 transition-all"
                    style={{ minHeight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={agregarMesa}
                    className="h-11 w-11 shrink-0 text-white rounded-lg flex items-center justify-center active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', minHeight: '44px' }}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  <AnimatePresence mode="popLayout">
                    {mesasAgregadas.map((num) => (
                      <motion.span
                        key={num}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        layout
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 text-white rounded-lg text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #E31837, #C41530)' }}
                      >
                        Mesa {num}
                        <button
                          type="button"
                          onClick={() => quitarMesa(num)}
                          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {mesasAgregadas.length === 0 && (
                    <span className="text-xs text-[#CBD5E1] self-center">
                      Agregue las mesas que va a cubrir
                    </span>
                  )}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-red-600 text-sm px-1 font-medium">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                onClick={handleContinuar}
                disabled={loading || mesasAgregadas.length === 0}
                className="w-full h-12 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, #E31837, #C41530)',
                  boxShadow: loading || mesasAgregadas.length === 0 ? 'none' : '0 4px 12px rgba(227,24,55,0.25)',
                  minHeight: '48px',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Continuar al Panel
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center mt-6 text-[#94A3B8] text-[11px] font-medium tracking-widest uppercase">
            Partido Liberal — Cundinamarca 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
