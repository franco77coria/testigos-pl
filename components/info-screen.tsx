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
    { icon: '🕐', color: 'rgba(245,158,11,0.3)', titulo: 'Conteo 10:00 AM', desc: 'Registre el numero de votantes a las 10 de la manana.' },
    { icon: '🕐', color: 'rgba(59,130,246,0.3)', titulo: 'Conteo 1:00 PM', desc: 'Registre el numero de votantes a la 1 de la tarde.' },
    { icon: '🗳️', color: 'rgba(249,115,22,0.3)', titulo: 'Conteo 4:00 PM', desc: 'Registre el conteo final al cierre de votacion.' },
    { icon: '📸', color: 'rgba(227,24,55,0.3)', titulo: 'Resultados E-14', desc: 'Registre los datos del formulario E-14 y suba las fotos.' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #E31837 0%, #8B0A1E 50%, #1A1A1A 100%)' }}
    >
      {/* Background decorative radials */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[480px] px-6 py-8"
      >
        {/* Info Card */}
        <div className="rounded-2xl p-8 border border-white/15 text-center"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-white text-xl font-bold mb-5">Su Asignación</h2>
          <p className="text-white/70 text-sm mb-5">
            {testigo.nombre1} {testigo.apellido1}
          </p>

          {/* Municipio */}
          <div className="rounded-xl p-3.5 mb-2.5 text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-[11px] text-white/60 uppercase tracking-widest block mb-1">Municipio</span>
            <span className="font-bold text-base">{testigo.municipio}</span>
          </div>

          {/* Puesto */}
          <div className="rounded-xl p-3.5 mb-2.5 text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-[11px] text-white/60 uppercase tracking-widest block mb-1">Puesto de votación</span>
            <span className="font-bold text-base">{testigo.puesto}</span>
          </div>

          {/* Mesas */}
          <div className="rounded-xl p-3.5 mb-2.5 text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-[11px] text-white/60 uppercase tracking-widest block mb-2">
              Mesas asignadas ({mesas.length})
            </span>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {mesas.map((mesa, i) => (
                <motion.span
                  key={mesa.mesa_numero}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="px-4 py-1.5 rounded-full font-bold text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  {mesa.mesa_numero}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Pasos instructivos */}
          <div className="mt-6 text-left">
            <h3 className="text-white text-[15px] font-semibold mb-4 text-center">
              📋 Instrucciones
            </h3>
            {pasos.map((paso, i) => (
              <div key={i} className="flex gap-3 mb-3 text-white text-xs leading-relaxed items-start">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 font-bold"
                  style={{ background: paso.color }}
                >
                  {paso.icon}
                </div>
                <div>
                  <strong className="text-[13px] block mb-0.5">{paso.titulo}</strong>
                  <span className="text-white/70">{paso.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 bg-white text-[#E31837] rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 mt-6"
          >
            Continuar al Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center mt-6 text-white/40 text-[11px]">
          Partido Liberal de Colombia
        </p>
      </motion.div>
    </div>
  )
}
