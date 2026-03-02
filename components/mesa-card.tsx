'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Users, Clock, Loader2, UploadCloud, Camera } from 'lucide-react'
import type { MesaDashboard } from '@/lib/types'
import { calcularEstado, calcularSeccionActiva, SECCIONES } from '@/lib/types'
import PhotoCapture from './photo-capture'
import ConfirmModal from './confirm-modal'
import { toast } from './toast'

interface Props {
  mesa: MesaDashboard
  cedula: string
  onUpdate: (mesa: MesaDashboard) => void
}

export default function MesaCard({ mesa, cedula, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [fotosCamara, setFotosCamara] = useState<string | undefined>()
  const [fotosSenado, setFotosSenado] = useState<string | undefined>()
  const [confirm, setConfirm] = useState<{
    seccionId: number
    datos: Record<string, string>
    fotos?: { camara?: string; senado?: string }
    resumen: { label: string; valor: string }[]
  } | null>(null)

  const estado = calcularEstado(mesa)
  const seccionActiva = calcularSeccionActiva(mesa)
  const totalSecciones = 4
  const completadas = Math.min(seccionActiva - 1, totalSecciones)
  const porcentaje = Math.round((completadas / totalSecciones) * 100)

  const estadoConfig = {
    pendiente: {
      dot: 'bg-gray-300',
      badge: 'bg-gray-100 text-gray-500',
      label: 'Pendiente',
      progress: 'bg-gray-200',
    },
    en_progreso: {
      dot: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-600',
      label: 'En progreso',
      progress: 'bg-amber-400',
    },
    completada: {
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-50 text-emerald-600',
      label: 'Completada',
      progress: 'bg-emerald-500',
    },
  }

  const config = estadoConfig[estado]

  // Initialize values for the active section
  function getInitialValues(seccionId: number) {
    const seccion = SECCIONES.find(s => s.id === seccionId)
    if (!seccion) return {}
    const initial: Record<string, string> = {}
    seccion.campos.forEach((c) => {
      const val = (mesa as unknown as Record<string, unknown>)[c]
      initial[c] = val != null ? String(val) : ''
    })
    return initial
  }

  function handleToggle() {
    if (!expanded) {
      // Initialize values for active section when expanding
      setValores(getInitialValues(seccionActiva))
      setFotosCamara(undefined)
      setFotosSenado(undefined)
    }
    setExpanded(!expanded)
  }

  function handlePreSave(seccionId: number) {
    const seccion = SECCIONES.find((s) => s.id === seccionId)!
    const resumen = seccion.campos.map((c, i) => ({
      label: seccion.labels[i],
      valor: valores[c] || '0',
    }))
    const fotos = seccionId === 4 ? { camara: fotosCamara, senado: fotosSenado } : undefined
    setConfirm({ seccionId, datos: valores, fotos, resumen })
  }

  async function handleConfirm() {
    if (!confirm) return
    setConfirm(null)
    setSaving(true)

    try {
      const res = await fetch('/api/mesas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula,
          mesa_numero: mesa.mesa_numero,
          seccion: confirm.seccionId,
          datos: confirm.datos,
        }),
      })
      const data = await res.json()

      if (!data.exito) {
        toast('err', data.mensaje || 'Error al guardar.')
        setSaving(false)
        return
      }

      if (confirm.fotos?.camara || confirm.fotos?.senado) {
        const photoUploads = []
        if (confirm.fotos.camara) photoUploads.push(uploadPhoto(confirm.fotos.camara, 'camara'))
        if (confirm.fotos.senado) photoUploads.push(uploadPhoto(confirm.fotos.senado, 'senado'))
        await Promise.all(photoUploads)
      }

      toast('ok', 'Sección guardada correctamente.')

      const refreshRes = await fetch(`/api/mesas?cedula=${cedula}`)
      const refreshData = await refreshRes.json()
      if (refreshData.exito) {
        const updatedMesa = refreshData.mesas.find((m: MesaDashboard) => m.mesa_numero === mesa.mesa_numero)
        if (updatedMesa) {
          onUpdate(updatedMesa)
          setValores(getInitialValues(calcularSeccionActiva(updatedMesa)))
        }
      }
    } catch {
      toast('err', 'Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(base64: string, tipo: 'camara' | 'senado') {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, tipo, base64 }),
      })
      const data = await res.json()
      if (!data.exito) toast('err', `Error subiendo foto ${tipo}.`)
    } catch {
      toast('err', `Error subiendo foto ${tipo}.`)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-shadow duration-200 hover:shadow-sm" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        {/* Progress bar top */}
        <div className="h-0.5 bg-gray-100">
          <div className={`h-full ${config.progress} transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
        </div>

        {/* Card Header - clickable to expand */}
        <div onClick={handleToggle} className="p-4 cursor-pointer select-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 text-sm font-bold">
                {mesa.mesa_numero}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Mesa {mesa.mesa_numero}</h3>
                <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-md ${config.badge}`}>
                  {config.label}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-300"
            >
              <ChevronDown size={18} />
            </motion.div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-50">
              <Users size={12} className="text-gray-300 mb-1" />
              <span className="text-[9px] text-gray-400">Hábiles</span>
              <span className="text-xs font-semibold text-gray-700">{mesa.cantidad_votantes_mesa || '—'}</span>
            </div>
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-50">
              <Clock size={12} className="text-gray-300 mb-1" />
              <span className="text-[9px] text-gray-400">10:00</span>
              <span className="text-xs font-semibold text-gray-700">{mesa.votantes_10am || '—'}</span>
            </div>
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-50">
              <Clock size={12} className="text-gray-300 mb-1" />
              <span className="text-[9px] text-gray-400">13:00</span>
              <span className="text-xs font-semibold text-gray-700">{mesa.votantes_1pm || '—'}</span>
            </div>
          </div>

          {/* Progress footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{completadas}/{totalSecciones} reportes</span>
            <div className="flex-1 mx-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${config.progress} transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        </div>

        {/* Expandable Section Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                {SECCIONES.map((seccion) => {
                  const isActive = seccionActiva === seccion.id
                  const isCompleted = seccionActiva > seccion.id
                  const isLocked = seccionActiva < seccion.id

                  // Completed section - minimal
                  if (isCompleted) {
                    const resumen = seccion.campos.map((c, i) => {
                      const val = (mesa as unknown as Record<string, unknown>)[c]
                      return `${seccion.labels[i]}: ${val || '—'}`
                    }).join(' · ')

                    return (
                      <div key={seccion.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50">
                        <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-emerald-700">{seccion.nombre}</span>
                          <p className="text-[10px] text-emerald-500 truncate">{resumen}</p>
                        </div>
                      </div>
                    )
                  }

                  // Locked section - minimal
                  if (isLocked) {
                    return (
                      <div key={seccion.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 opacity-40">
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-400">{seccion.nombre}</span>
                          <p className="text-[10px] text-gray-300">Complete pasos previos</p>
                        </div>
                      </div>
                    )
                  }

                  // Active section - form
                  if (isActive) {
                    return (
                      <div key={seccion.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center text-white text-[11px] font-bold">
                              {seccion.id}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seccion.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-semibold text-red-500 uppercase tracking-wider">Activa</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{seccion.descripcion}</p>

                        <div className={seccion.campos.length > 2 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                          {seccion.campos.map((campo, i) => (
                            <div key={campo}>
                              <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-wider">
                                {seccion.labels[i]}
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={valores[campo] || ''}
                                onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                                placeholder="0"
                                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 placeholder-gray-300 outline-none transition-all duration-200 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Photos (section 4 only) */}
                        {seccion.id === 4 && (
                          <div className="mt-4 space-y-2">
                            <PhotoCapture label="Foto E-14 Cámara" existingUrl={mesa.foto_camara} onCapture={setFotosCamara} />
                            <PhotoCapture label="Foto E-14 Senado" existingUrl={mesa.foto_senado} onCapture={setFotosSenado} />
                          </div>
                        )}

                        <button
                          onClick={() => handlePreSave(seccion.id)}
                          disabled={saving}
                          className="w-full mt-4 py-3 bg-red-600 text-white rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <UploadCloud size={15} />
                              Guardar {seccion.nombre}
                            </>
                          )}
                        </button>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={!!confirm}
        titulo={`Mesa ${mesa.mesa_numero}`}
        resumen={confirm?.resumen || []}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
