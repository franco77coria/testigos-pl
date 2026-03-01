'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { Seccion, MesaDashboard } from '@/lib/types'
import PhotoCapture from './photo-capture'

interface Props {
  seccion: Seccion
  mesa: MesaDashboard
  seccionActiva: number
  onSave: (seccionId: number, datos: Record<string, string>, fotos?: { camara?: string; senado?: string }) => void
  saving: boolean
}

const SECTION_COLORS: Record<number, { bg: string; border: string; text: string; btn: string }> = {
  1: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
  2: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
  3: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700' },
  4: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', btn: 'bg-pl-red hover:bg-pl-red-dark' },
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
      <div className="rounded-lg p-3.5 border border-success/20 bg-success-light flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-success block">{seccion.nombre}</span>
          <p className="text-[11px] text-text-secondary truncate">{resumen}</p>
        </div>
      </div>
    )
  }

  // Locked state
  if (isLocked) {
    return (
      <div className="rounded-lg p-3.5 border border-border bg-locked-light/50">
        <div className="flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <span className="text-xs font-semibold text-locked block">{seccion.nombre}</span>
            <p className="text-[11px] text-locked">Complete la seccion anterior</p>
          </div>
        </div>
      </div>
    )
  }

  // Active state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg p-4 border ${color.border} ${color.bg}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded ${color.btn} flex items-center justify-center text-white text-[11px] font-bold`}>
            {seccion.id}
          </div>
          <span className="text-sm font-semibold text-text-primary">{seccion.nombre}</span>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-success-light text-success">
          Activa
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary bg-white/70 rounded-md p-2.5 mb-4 leading-relaxed">
        {seccion.descripcion}
      </p>

      {/* Fields */}
      <div className={seccion.campos.length > 2 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {seccion.campos.map((campo, i) => (
          <div key={campo}>
            <label className="block text-[10px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              {seccion.labels[i]}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={valores[campo]}
              onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
              placeholder="0"
              className="w-full py-2.5 px-3 border border-border rounded-lg bg-white text-base font-semibold text-text-primary focus:border-pl-red focus:outline-none focus:ring-2 focus:ring-pl-red/10 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Photos (section 4 only) */}
      {seccion.id === 4 && (
        <div className="mt-4 space-y-2">
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
        className={`w-full mt-4 py-3 ${color.btn} text-white rounded-lg font-semibold text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {saving ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Guardar {seccion.nombre}
          </>
        )}
      </button>
    </motion.div>
  )
}
