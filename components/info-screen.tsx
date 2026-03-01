'use client'

import { motion } from 'framer-motion'
import type { SesionTestigo } from '@/lib/types'

interface Props {
  sesion: SesionTestigo
  onContinue: () => void
}

export default function InfoScreen({ sesion, onContinue }: Props) {
  const { testigo, mesas } = sesion

  const pasos = [
    { icon: '10AM', color: 'bg-amber-100 text-amber-700', titulo: 'Conteo 10:00 AM', desc: 'Registre el numero de votantes a las 10 de la manana.' },
    { icon: '1PM', color: 'bg-blue-100 text-blue-700', titulo: 'Conteo 1:00 PM', desc: 'Registre el numero de votantes a la 1 de la tarde.' },
    { icon: '4PM', color: 'bg-orange-100 text-orange-700', titulo: 'Conteo 4:00 PM', desc: 'Registre el conteo final al cierre de votacion.' },
    { icon: 'E-14', color: 'bg-red-100 text-[#E31837]', titulo: 'Resultados E-14', desc: 'Registre los datos del formulario E-14 y suba las fotos.' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#F5F5F7]">
      {/* Premium subtle background */}
      <div className="absolute top-0 left-0 right-0 h-[40vh]"
        style={{ background: 'linear-gradient(135deg, #E31837, #8B0A1E)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[500px] px-5 py-8"
      >
        {/* Main Card - Minimalist Apple/SaaS style */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-[#E31837]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <h2 className="text-[#1A1A1A] text-2xl font-bold tracking-tight mb-1">Su Asignación</h2>
            <p className="text-[#6B7280] text-[15px] font-medium">
              {testigo.nombre1} {testigo.apellido1}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {/* Municipio */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#E31837] flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider block mb-0.5">Municipio</span>
                <span className="font-bold text-[#1A1A1A] text-[15px]">{testigo.municipio}</span>
              </div>
            </div>

            {/* Puesto */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#E31837] flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider block mb-0.5">Puesto de votación</span>
                <span className="font-bold text-[#1A1A1A] text-[15px] leading-tight block">{testigo.puesto}</span>
              </div>
            </div>

            {/* Mesas */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E2E8F0]">
              <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider block mb-3 text-center">
                Mesas asignadas ({mesas.length})
              </span>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {mesas.map((mesa, i) => (
                  <motion.span
                    key={mesa.mesa_numero}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[15px] text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #E31837, #B71530)' }}
                  >
                    {mesa.mesa_numero}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 text-white rounded-2xl font-bold text-[15px] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(227,24,55,0.3)] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #E31837, #B71530)' }}
          >
            Continuar al Dashboard
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center mt-6 text-white/70 text-[12px] font-medium">
          Partido Liberal de Colombia — 2026
        </p>
      </motion.div>
    </div>
  )
}
