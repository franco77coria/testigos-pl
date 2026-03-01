'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { MesaDashboard } from '@/lib/types'
import { SECCIONES, calcularSeccionActiva } from '@/lib/types'
import SectionBlock from './section-block'
import ConfirmModal from './confirm-modal'
import { toast } from './toast'

interface Props {
  mesa: MesaDashboard | null
  cedula: string
  onClose: () => void
  onUpdate: (mesa: MesaDashboard) => void
}

export default function MesaModal({ mesa, cedula, onClose, onUpdate }: Props) {
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<{
    seccionId: number
    datos: Record<string, string>
    fotos?: { camara?: string; senado?: string }
    resumen: { label: string; valor: string }[]
  } | null>(null)

  if (!mesa) return null

  const seccionActiva = calcularSeccionActiva(mesa)

  function handlePreSave(seccionId: number, datos: Record<string, string>, fotos?: { camara?: string; senado?: string }) {
    const seccion = SECCIONES.find((s) => s.id === seccionId)!
    const resumen = seccion.campos.map((c, i) => ({
      label: seccion.labels[i],
      valor: datos[c] || '0',
    }))
    setConfirm({ seccionId, datos, fotos, resumen })
  }

  async function handleConfirm() {
    if (!confirm || !mesa) return
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
        if (confirm.fotos.camara) {
          photoUploads.push(uploadPhoto(confirm.fotos.camara, 'camara'))
        }
        if (confirm.fotos.senado) {
          photoUploads.push(uploadPhoto(confirm.fotos.senado, 'senado'))
        }
        await Promise.all(photoUploads)
      }

      toast('ok', 'Seccion guardada correctamente.')

      const refreshRes = await fetch(`/api/mesas?cedula=${cedula}`)
      const refreshData = await refreshRes.json()
      if (refreshData.exito) {
        const updatedMesa = refreshData.mesas.find((m: MesaDashboard) => m.mesa_numero === mesa.mesa_numero)
        if (updatedMesa) onUpdate(updatedMesa)
      }
    } catch {
      toast('err', 'Error de conexion.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(base64: string, tipo: 'camara' | 'senado') {
    if (!mesa) return
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula,
          mesa_numero: mesa.mesa_numero,
          tipo,
          base64,
        }),
      })
      const data = await res.json()
      if (!data.exito) {
        toast('err', `Error subiendo foto ${tipo}.`)
      }
    } catch {
      toast('err', `Error subiendo foto ${tipo}.`)
    }
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-3xl sm:rounded-3xl rounded-t-3xl w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Header Limpio */}
            <div className="px-6 py-5 bg-white sticky top-0 z-10 flex items-center justify-between shrink-0 border-b border-slate-100">
              <div>
                <h2 className="text-slate-900 text-lg sm:text-xl font-bold tracking-tight">Mesa {mesa.mesa_numero}</h2>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">{mesa.puesto}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="p-3 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50" style={{ scrollbarWidth: 'none' }}>
              {SECCIONES.map((seccion) => (
                <SectionBlock
                  key={seccion.id}
                  seccion={seccion}
                  mesa={mesa}
                  seccionActiva={seccionActiva}
                  onSave={handlePreSave}
                  saving={saving}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

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
