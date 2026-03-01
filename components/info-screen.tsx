'use client'

import { motion } from 'framer-motion'
import type { SesionTestigo } from '@/lib/types'
import { MapPin, Building2, CheckCircle2, ChevronRight, Inbox } from 'lucide-react'

interface Props {
  sesion: SesionTestigo
  onContinue: () => void
}

export default function InfoScreen({ sesion, onContinue }: Props) {
  const { testigo, mesas } = sesion

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[500px] px-5 py-8"
      >
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">

          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-[#E31837]">
              <CheckCircle2 size={30} strokeWidth={2.5} />
            </div>
            <h2 className="text-slate-800 text-2xl font-bold tracking-tight mb-1">Verificación Exitosa</h2>
            <p className="text-slate-500 text-[15px] font-medium">
              Bienvenido/a {testigo.nombre1} {testigo.apellido1}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Box: Municipio & Puesto */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              {/* Municipio */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#E31837] flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Municipio Asignado</span>
                  <span className="font-bold text-slate-800 text-[15px]">{testigo.municipio}</span>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full" />

              {/* Puesto */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#E31837] flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Puesto de votación</span>
                  <span className="font-bold text-slate-800 text-[15px] leading-tight block">{testigo.puesto}</span>
                </div>
              </div>
            </div>

            {/* Box: Mesas */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Inbox size={16} className="text-slate-400" />
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                  Mesas asignadas ({mesas.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {mesas.map((mesa, i) => (
                  <motion.span
                    key={mesa.mesa_numero}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[16px] bg-[#E31837] text-white shadow-md shadow-red-500/20"
                  >
                    {mesa.mesa_numero}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 bg-[#E31837] text-white rounded-2xl font-bold text-[15px] cursor-pointer transition-all duration-300 hover:bg-[#c6102b] hover:shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
          >
            Continuar al Centro de Control
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-semibold tracking-widest uppercase">
          Partido Liberal de Colombia — 2026
        </p>
      </motion.div>
    </div>
  )
}
