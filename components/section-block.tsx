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

const SECTION_COLORS: Record<number, { bg: string; border: string; text: string; iconBg: string; btnGradient: string }> = {
  1: { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', iconBg: 'rgba(245,158,11,0.3)', btnGradient: 'linear-gradient(135deg, #D97706, #B45309)' },
  2: { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', iconBg: 'rgba(59,130,246,0.3)', btnGradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  3: { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', iconBg: 'rgba(249,115,22,0.3)', btnGradient: 'linear-gradient(135deg, #F97316, #EA580C)' },
  4: { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', iconBg: 'rgba(227,24,55,0.3)', btnGradient: 'linear-gradient(135deg, #E31837, #B71530)' },
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
      <div className="rounded-2xl p-4 flex items-center gap-3 border-2"
        style={{ borderColor: '#D1FAE5', background: 'rgba(16,185,129,0.02)' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-[#059669] block">{seccion.nombre} ✓</span>
          <p className="text-[11px] text-[#6B7280] truncate">{resumen}</p>
        </div>
      </div>
    )
  }

  // Locked state
  if (isLocked) {
    return (
      <div className="rounded-2xl p-4 border-2 border-[#E0E0E0]"
        style={{ background: '#F9FAFB', opacity: 0.55 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(148,163,184,0.15)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] block">{seccion.nombre}</span>
            <p className="text-[11px] text-[#94A3B8]">Complete la seccion anterior</p>
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
      className="rounded-2xl p-5 border-2"
      style={{ borderColor: color.border, background: color.bg }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-bold"
            style={{ background: color.btnGradient }}
          >
            {seccion.id}
          </div>
          <span className="text-sm font-bold text-[#1A1A1A]">{seccion.nombre}</span>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl"
          style={{ background: '#D1FAE5', color: '#059669' }}
        >
          🟢 Activa
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[#6B7280] rounded-xl p-3 mb-4 leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.7)' }}
      >
        {seccion.descripcion}
      </p>

      {/* Fields */}
      <div className={seccion.campos.length > 2 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {seccion.campos.map((campo, i) => (
          <div key={campo}>
            <label className="block text-[10px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wider">
              {seccion.labels[i]}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={valores[campo]}
              onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
              placeholder="0"
              className="w-full py-3 px-4 border-2 border-[#E0E0E0] rounded-xl bg-[#F5F5F7] text-base font-semibold text-[#1A1A1A] outline-none transition-all duration-300 focus:border-[#E31837] focus:bg-white focus:shadow-[0_0_0_4px_rgba(227,24,55,0.1)]"
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
        className="w-full mt-4 py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: color.btnGradient }}
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
