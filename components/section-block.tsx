'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Camera, UploadCloud, X } from 'lucide-react'
import type { Seccion, MesaDashboard } from '@/lib/types'
import PhotoCapture from './photo-capture'

interface Props {
  seccion: Seccion
  mesa: MesaDashboard
  seccionActiva: number
  onSave: (seccionId: number, datos: Record<string, string>, fotos?: { camara?: string; senado?: string }) => void
  saving: boolean
}

// Flat, semantic slate colors with red accent for active
const SECTION_COLORS: Record<number, { bg: string; border: string; text: string; iconBg: string; activeColor: string }> = {
  1: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', iconBg: 'bg-white', activeColor: 'bg-[#E31837]' },
  2: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', iconBg: 'bg-white', activeColor: 'bg-[#E31837]' },
  3: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', iconBg: 'bg-white', activeColor: 'bg-[#E31837]' },
  4: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', iconBg: 'bg-white', activeColor: 'bg-[#E31837]' },
}

export default function SectionBlock({ seccion, mesa, seccionActiva, onSave, saving }: Props) {
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    seccion.campos.forEach((c) => {
      const val = (mesa as unknown as Record<string, unknown>)[c]
      initial[c] = val != null ? String(val) : ''
    })
    return initial
  })
  const [fotosCamara, setFotosCamara] = useState<string | undefined>()
  const [fotosSenado, setFotosSenado] = useState<string | undefined>()

  const isActive = seccionActiva === seccion.id
  const isCompleted = seccionActiva > seccion.id
  const isLocked = seccionActiva < seccion.id

  const color = SECTION_COLORS[seccion.id]

  function handleSave() {
    const fotos = seccion.id === 4 ? { camara: fotosCamara, senado: fotosSenado } : undefined
    onSave(seccion.id, valores, fotos)
  }

  // Completed state
  if (isCompleted) {
    const resumen = seccion.campos.map((c, i) => {
      const val = (mesa as unknown as Record<string, unknown>)[c]
      return `${seccion.labels[i]}: ${val || '-'}`
    }).join(' · ')

    return (
      <div className="rounded-2xl p-4 flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 transition-all hover:bg-emerald-50">
        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-bold text-emerald-800 block mb-0.5">{seccion.nombre}</span>
          <p className="text-[11px] font-medium text-emerald-600/80 truncate">{resumen}</p>
        </div>
      </div>
    )
  }

  // Locked state
  if (isLocked) {
    return (
      <div className="rounded-2xl p-4 bg-slate-50/50 border border-slate-100 opacity-60">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <span className="text-[13px] font-bold text-slate-500 block mb-0.5">{seccion.nombre}</span>
            <p className="text-[11px] font-medium text-slate-400">Complete pasos previos</p>
          </div>
        </div>
      </div>
    )
  }

  // Active state
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-5 border shadow-sm ${color.bg} ${color.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold shadow-sm ${color.activeColor}`}>
            {seccion.id}
          </div>
          <span className={`text-[15px] font-bold ${color.text}`}>{seccion.nombre}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-200">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E31837] animate-pulse" />
          <span className="text-[10px] font-bold text-[#E31837] uppercase tracking-wider">
            Activa
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-5 font-medium leading-relaxed">
        {seccion.descripcion}
      </p>

      {/* Fields */}
      <div className={seccion.campos.length > 2 ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        {seccion.campos.map((campo, i) => (
          <div key={campo}>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              {seccion.labels[i]}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={valores[campo]}
                onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                placeholder="0"
                className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none transition-all duration-300 focus:border-[#E31837] focus:ring-4 focus:ring-red-500/10"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Photos (section 4 only) */}
      {seccion.id === 4 && (
        <div className="mt-5 space-y-3">
          <PhotoCapture
            label="Foto E-14 Camara"
            existingUrl={mesa.foto_camara}
            onCapture={setFotosCamara}
          />
          <PhotoCapture
            label="Foto E-14 Senado"
            existingUrl={mesa.foto_senado}
            onCapture={setFotosSenado}
          />
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full mt-6 py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md ${color.activeColor} hover:opacity-90`}
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <UploadCloud size={16} strokeWidth={2.5} />
            Guardar {seccion.nombre}
          </>
        )}
      </button>
    </motion.div>
  )
}
