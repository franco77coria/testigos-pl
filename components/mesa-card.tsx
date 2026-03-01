'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { MesaDashboard } from '@/lib/types'
import { calcularEstado, calcularSeccionActiva } from '@/lib/types'

interface Props {
  mesa: MesaDashboard
  onClick: () => void
  index: number
}

export default function MesaCard({ mesa, onClick, index }: Props) {
  const estado = calcularEstado(mesa)
  const seccionActiva = calcularSeccionActiva(mesa)

  const totalSecciones = 4
  const completadas = Math.min(seccionActiva - 1, totalSecciones)
  const porcentaje = Math.round((completadas / totalSecciones) * 100)

  const estadoConfig = {
    pendiente: {
      border: '#E0E0E0',
      badgeBg: '#F3F4F6',
      badgeText: '#6B7280',
      label: 'Pendiente',
      progressColor: '#E0E0E0',
    },
    en_progreso: {
      border: '#F59E0B',
      badgeBg: '#FEF3C7',
      badgeText: '#D97706',
      label: 'En progreso',
      progressColor: 'linear-gradient(90deg, #F59E0B, #10B981)',
    },
    completada: {
      border: '#10B981',
      badgeBg: '#D1FAE5',
      badgeText: '#059669',
      label: 'Completada',
      progressColor: '#10B981',
    },
  }

  const config = estadoConfig[estado]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 relative"
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        borderLeft: `5px solid ${config.border}`,
      }}
      whileHover={{ boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-extrabold"
            style={{ background: 'linear-gradient(135deg, #E31837, #B71530)' }}
          >
            {mesa.mesa_numero}
          </div>
          <span className="text-[15px] font-semibold text-[#1A1A1A]">Mesa {mesa.mesa_numero}</span>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: config.badgeBg, color: config.badgeText }}
        >
          {config.label}
        </span>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span>👥</span>
          <span>Hab: <strong className="text-[#1A1A1A]">{mesa.cantidad_votantes_mesa || '-'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span>🕐</span>
          <span>10AM: <strong className="text-[#1A1A1A]">{mesa.votantes_10am || '-'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span>🕐</span>
          <span>1PM: <strong className="text-[#1A1A1A]">{mesa.votantes_1pm || '-'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span>🗳️</span>
          <span>4PM: <strong className="text-[#1A1A1A]">{mesa.votantes_4pm || '-'}</strong></span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-[#6B7280] mb-1">
          <span>Progreso</span>
          <span className="font-semibold">{completadas}/{totalSecciones}</span>
        </div>
        <div className="h-2 bg-[#E5E7EB] rounded overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcentaje}%` }}
            transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
            className="h-full rounded"
            style={{ background: estado === 'en_progreso' ? 'linear-gradient(90deg, #F59E0B, #10B981)' : (estado === 'completada' ? '#10B981' : '#E0E0E0') }}
          />
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E0E0E0] transition-all duration-300">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </motion.div>
  )
}
