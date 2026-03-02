'use client'

import { motion } from 'framer-motion'
import type { SesionTestigo } from '@/lib/types'
import { MapPin, Building2, ChevronRight } from 'lucide-react'

interface Props {
  sesion: SesionTestigo
  onContinue: () => void
}

export default function InfoScreen({ sesion, onContinue }: Props) {
  const { testigo, mesas } = sesion

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] px-5 py-8"
      >
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>

          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-11 h-11 mx-auto bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <h2 className="text-gray-900 text-xl font-semibold tracking-tight mb-1">Verificación Exitosa</h2>
            <p className="text-gray-400 text-sm">
              Bienvenido/a {testigo.nombre1} {testigo.apellido1}
            </p>
          </div>

          {/* Info Card */}
          <div className="space-y-3 mb-7">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-red-500 flex-shrink-0">
                  <MapPin size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Municipio</span>
                  <span className="font-semibold text-gray-800 text-sm">{testigo.municipio}</span>
                </div>
              </div>

              <div className="h-px bg-gray-200/60" />

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-red-500 flex-shrink-0">
                  <Building2 size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Puesto de votación</span>
                  <span className="font-semibold text-gray-800 text-sm leading-tight">{testigo.puesto}</span>
                </div>
              </div>
            </div>

            {/* Mesas */}
            <div className="bg-gray-50 rounded-xl p-4">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block text-center mb-3">
                Mesas asignadas ({mesas.length})
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {mesas.map((mesa, i) => (
                  <motion.span
                    key={mesa.mesa_numero}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.04 }}
                    className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm bg-red-600 text-white"
                  >
                    {mesa.mesa_numero}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continuar al Panel
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="text-center mt-6 text-gray-300 text-[11px] font-medium tracking-widest uppercase">
          Partido Liberal de Colombia — 2026
        </p>
      </motion.div>
    </div>
  )
}
