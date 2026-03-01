'use client'

import { ChevronRight, Users, Clock } from 'lucide-react'
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
      border: 'border-slate-200',
      bgHeader: 'bg-slate-50',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      label: 'Pendiente',
      progressColor: 'bg-slate-200'
    },
    en_progreso: {
      border: 'border-amber-200',
      bgHeader: 'bg-amber-50/50',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      label: 'En progreso',
      progressColor: 'bg-amber-500'
    },
    completada: {
      border: 'border-emerald-200',
      bgHeader: 'bg-emerald-50/50',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
      label: 'Completada',
      progressColor: 'bg-emerald-500'
    },
  }

  const config = estadoConfig[estado]

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border ${config.border} cursor-pointer transition-all duration-200 hover:shadow-md hover:border-slate-300 relative flex flex-col h-full overflow-hidden`}
    >
      {/* Target indicator on top */}
      <div className={`h-1 w-full ${config.progressColor}`} />

      <div className={`p-4 ${config.bgHeader} border-b ${config.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 text-lg font-bold">
            {mesa.mesa_numero}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Mesa {mesa.mesa_numero}</h3>
            <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
          </div>
        </div>

        <div className="text-slate-400 group-hover:text-slate-600 transition-colors group-hover:translate-x-0.5 transform duration-200">
          <ChevronRight size={20} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Datos */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Users size={14} className="text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">Habilitados</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">{mesa.cantidad_votantes_mesa || '-'}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Clock size={14} className="text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">10:00 AM</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">{mesa.votantes_10am || '-'}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Clock size={14} className="text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">01:00 PM</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">{mesa.votantes_1pm || '-'}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-auto">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span>Progreso de reportes</span>
            <span>{completadas} de {totalSecciones}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.progressColor} transition-all duration-500 ease-out`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
