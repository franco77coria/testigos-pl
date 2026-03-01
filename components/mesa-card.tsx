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

  const radio = 17
  const circunferencia = 2 * Math.PI * radio
  const offset = circunferencia - (porcentaje / 100) * circunferencia

  const estadoConfig = {
    pendiente: {
      border: 'border-l-locked',
      badgeBg: 'bg-locked-light',
      badgeText: 'text-locked',
      label: 'Pendiente',
      stroke: '#94A3B8',
    },
    en_progreso: {
      border: 'border-l-pl-red',
      badgeBg: 'bg-red-50',
      badgeText: 'text-pl-red',
      label: 'En progreso',
      stroke: '#E31837',
    },
    completada: {
      border: 'border-l-success',
      badgeBg: 'bg-success-light',
      badgeText: 'text-success',
      label: 'Completada',
      stroke: '#059669',
    },
  }

  const config = estadoConfig[estado]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-4 border border-border border-l-[3px] cursor-pointer transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
        config.border
      )}
    >
      <div className="flex items-center gap-3.5">
        {/* Donut progress */}
        <div className="relative flex-shrink-0">
          <svg width="44" height="44" className="-rotate-90">
            <circle cx="22" cy="22" r={radio} fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
            <motion.circle
              cx="22" cy="22" r={radio}
              fill="none"
              stroke={config.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              initial={{ strokeDashoffset: circunferencia }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
            {mesa.mesa_numero}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-text-primary">Mesa {mesa.mesa_numero}</span>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', config.badgeBg, config.badgeText)}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-secondary">
            <span>Hab: <strong className="text-text-primary">{mesa.cantidad_votantes_mesa || '-'}</strong></span>
            <span>10AM: <strong className="text-text-primary">{mesa.votantes_10am || '-'}</strong></span>
            <span>1PM: <strong className="text-text-primary">{mesa.votantes_1pm || '-'}</strong></span>
          </div>
        </div>

        {/* Arrow */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </motion.div>
  )
}
