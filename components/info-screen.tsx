'use client'

import { motion } from 'framer-motion'
import type { SesionTestigo } from '@/lib/types'

interface Props {
  sesion: SesionTestigo
  onContinue: () => void
}

export default function InfoScreen({ sesion, onContinue }: Props) {
  const { testigo, mesas } = sesion

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Red header */}
      <div className="bg-pl-red px-6 py-5">
        <h2 className="text-white text-lg font-bold">Su Asignacion</h2>
        <p className="text-white/60 text-sm mt-0.5">
          {testigo.nombre1} {testigo.apellido1}
        </p>
      </div>

      <div className="flex-1 px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[460px] mx-auto space-y-4"
        >
          {/* Info rows */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3.5 border border-red-100">
              <div className="w-9 h-9 rounded-lg bg-pl-red/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E31837" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">Municipio</span>
                <span className="text-sm font-semibold text-text-primary">{testigo.municipio}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3.5 border border-red-100">
              <div className="w-9 h-9 rounded-lg bg-pl-red/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E31837" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <path d="M9 9v.01" /><path d="M9 12v.01" /><path d="M9 15v.01" /><path d="M9 18v.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">Puesto de votacion</span>
                <span className="text-sm font-semibold text-text-primary">{testigo.puesto}</span>
              </div>
            </div>
          </div>

          {/* Mesas */}
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E31837" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
              </svg>
              <span className="text-[10px] font-semibold text-pl-red uppercase tracking-wider">
                Mesas asignadas ({mesas.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mesas.map((mesa, i) => (
                <motion.span
                  key={mesa.mesa_numero}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className="bg-pl-red text-white px-3.5 py-1.5 rounded-lg text-sm font-bold"
                >
                  {mesa.mesa_numero}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Instruction */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E31837" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <p className="text-xs text-pl-red-deep leading-relaxed">
              Complete las secciones <strong>en orden</strong>. Al terminar una seccion, se habilitara la siguiente automaticamente.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-3.5 bg-pl-red text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:bg-pl-red-dark hover:shadow-lg flex items-center justify-center gap-2"
          >
            Continuar al Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
