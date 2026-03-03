'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Users, Clock, Loader2, Save, Lock, Check } from 'lucide-react'
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
  const [savingCamara, setSavingCamara] = useState(false)
  const [savingSenado, setSavingSenado] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<{
    seccionId: number
    datos: Record<string, string>
    resumen: { label: string; valor: string }[]
    tipo?: 'camara' | 'senado'
  } | null>(null)

  const estado = calcularEstado(mesa)
  const seccionActiva = calcularSeccionActiva(mesa)
  const completadas = seccionActiva === 4
    ? 3 + (mesa.votos_alex_p != null && mesa.votos_camara_cun_pl != null && mesa.votos_oscar_sanchez_senado != null && mesa.votos_senado_pl != null && mesa.foto_camara && mesa.foto_senado ? 1 : 0)
    : Math.min(seccionActiva - 1, 4)
  const porcentaje = Math.round((completadas / 4) * 100)

  const estadoConfig = {
    pendiente: { badge: 'bg-gray-100 text-[#718096]', label: 'Pendiente', bar: '#D1D5DB' },
    en_progreso: { badge: 'bg-amber-50 text-amber-600', label: 'En progreso', bar: '#F59E0B' },
    completada: { badge: 'bg-emerald-50 text-emerald-600', label: 'Completada', bar: '#10B981' },
  }
  const config = estadoConfig[estado]

  function getInitialValues(secId: number) {
    const sec = SECCIONES.find(s => s.id === secId)
    if (!sec) return {}
    const init: Record<string, string> = {}
    sec.campos.forEach((c) => {
      const val = (mesa as unknown as Record<string, unknown>)[c]
      init[c] = val != null ? String(val) : ''
    })
    return init
  }

  function handleToggle() {
    if (!expanded) {
      setValores(getInitialValues(seccionActiva))
    }
    setExpanded(!expanded)
  }

  function handlePreSave(seccionId: number) {
    const seccion = SECCIONES.find((s) => s.id === seccionId)!
    const resumen = seccion.campos.map((c, i) => ({
      label: seccion.labels[i],
      valor: valores[c] || '0',
    }))
    setConfirm({ seccionId, datos: valores, resumen })
  }

  function handlePreSavePar(tipo: 'camara' | 'senado') {
    const campos = tipo === 'camara'
      ? ['votos_alex_p', 'votos_camara_cun_pl']
      : ['votos_oscar_sanchez_senado', 'votos_senado_pl']
    const labels = tipo === 'camara'
      ? ['Votos Alex Prieto Camara', 'Votos Partido Liberal Camara CUN']
      : ['Votos Oscar Sanchez Senado', 'Votos Partido Liberal Senado']
    const datos: Record<string, string> = {}
    campos.forEach(c => { datos[c] = valores[c] || '' })
    const resumen = campos.map((c, i) => ({ label: labels[i], valor: valores[c] || '0' }))
    setConfirm({ seccionId: 4, datos, resumen, tipo })
  }

  async function handleConfirm() {
    if (!confirm) return
    const { seccionId, datos, tipo } = confirm
    setConfirm(null)

    if (tipo === 'camara') setSavingCamara(true)
    else if (tipo === 'senado') setSavingSenado(true)
    else setSaving(true)

    try {
      const res = await fetch('/api/mesas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, seccion: seccionId, datos }),
      })
      const data = await res.json()
      if (!data.exito) {
        toast('err', data.mensaje || 'Error al guardar.')
        return
      }
      toast('ok', tipo ? `Votos ${tipo === 'camara' ? 'Camara' : 'Senado'} guardados.` : 'Seccion guardada.')
      await refreshMesa()
    } catch {
      toast('err', 'Error de conexion.')
    } finally {
      setSaving(false)
      setSavingCamara(false)
      setSavingSenado(false)
    }
  }

  async function handleUploadPhoto(base64: string, tipo: 'camara' | 'senado') {
    if (tipo === 'camara') setSavingCamara(true)
    else setSavingSenado(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, tipo, base64 }),
      })
      const data = await res.json()
      if (data.exito) {
        toast('ok', `Foto ${tipo === 'camara' ? 'Camara' : 'Senado'} subida.`)
        await refreshMesa()
      } else {
        toast('err', `Error subiendo foto ${tipo}.`)
      }
    } catch {
      toast('err', `Error subiendo foto ${tipo}.`)
    } finally {
      setSavingCamara(false)
      setSavingSenado(false)
    }
  }

  async function refreshMesa() {
    const refreshRes = await fetch(`/api/mesas?cedula=${cedula}`)
    const refreshData = await refreshRes.json()
    if (refreshData.exito) {
      const updated = refreshData.mesas.find((m: MesaDashboard) => m.mesa_numero === mesa.mesa_numero)
      if (updated) {
        onUpdate(updated)
        setValores(getInitialValues(calcularSeccionActiva(updated)))
      }
    }
  }

  const tieneCamara = mesa.votos_alex_p != null && mesa.votos_camara_cun_pl != null
  const tieneSenado = mesa.votos_oscar_sanchez_senado != null && mesa.votos_senado_pl != null

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden transition-shadow duration-200" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {/* Top accent bar */}
        <div className="h-1 bg-[#F1F5F9]">
          <div className="h-full transition-all duration-500" style={{ width: `${porcentaje}%`, background: config.bar }} />
        </div>

        {/* Header */}
        <div onClick={handleToggle} className="p-4 cursor-pointer select-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: '0 2px 8px rgba(227,24,55,0.2)' }}>
                {mesa.mesa_numero}
              </div>
              <div>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#1a1a1a]">Mesa {mesa.mesa_numero}</h3>
                <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${config.badge}`}>
                  {config.label}
                </span>
              </div>
            </div>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-[#94A3B8]">
              <ChevronDown size={18} />
            </motion.div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Users, label: 'Habiles', value: mesa.cantidad_votantes_mesa },
              { icon: Clock, label: '11:00', value: mesa.votantes_10am },
              { icon: Clock, label: '13:00', value: mesa.votantes_1pm },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-2.5 px-1 rounded-lg" style={{ background: '#F8F9FA', border: '1px solid #F1F5F9' }}>
                <stat.icon size={13} className="text-[#94A3B8] mb-1" />
                <span className="text-[9px] text-[#94A3B8] font-semibold uppercase">{stat.label}</span>
                <span className="text-xs font-bold text-[#1a1a1a]">{stat.value ?? '—'}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#94A3B8]">{completadas}/4 reportes</span>
            <div className="flex-1 mx-3 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${porcentaje}%`, background: config.bar }} />
            </div>
          </div>
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#D1D5DB] px-4 pb-4 pt-3 space-y-3">
                {SECCIONES.map((seccion) => {
                  const isActive = seccionActiva === seccion.id || (seccion.id === 4 && seccionActiva === 4)
                  const isCompleted = seccion.id < 4 ? seccionActiva > seccion.id : (seccion.id === 4 && estado === 'completada')
                  const isLocked = seccionActiva < seccion.id

                  // Completed
                  if (isCompleted) {
                    return (
                      <div key={seccion.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={14} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-emerald-700">{seccion.nombre}</span>
                          <div className="mt-0.5 space-y-0.5">
                            {seccion.campos.map((c, i) => {
                              const val = (mesa as unknown as Record<string, unknown>)[c]
                              return (
                                <p key={c} className="text-[10px] text-emerald-500">
                                  {seccion.labels[i]}: <span className="font-semibold">{val != null ? String(val) : '—'}</span>
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Locked
                  if (isLocked) {
                    return (
                      <div key={seccion.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50" style={{ background: '#F8F9FA', border: '1px solid #F1F5F9' }}>
                        <div className="w-7 h-7 rounded-lg bg-[#D1D5DB] flex items-center justify-center shrink-0">
                          <Lock size={12} className="text-[#94A3B8]" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#94A3B8]">{seccion.nombre}</span>
                          <p className="text-[10px] text-[#CBD5E1]">Complete pasos previos</p>
                        </div>
                      </div>
                    )
                  }

                  // Active — sections 1-3
                  if (isActive && seccion.id < 4) {
                    return (
                      <div key={seccion.id} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)' }}>
                              {seccion.id}
                            </div>
                            <span className="text-sm font-bold text-[#1a1a1a]">{seccion.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(227,24,55,0.08)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E31837] animate-pulse" />
                            <span className="text-[9px] font-bold text-[#E31837] uppercase tracking-wider">Activa</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#718096] mb-4">{seccion.descripcion}</p>

                        {seccion.campos.map((campo, i) => (
                          <div key={campo} className="mb-3">
                            <label className="block text-[10px] font-semibold text-[#718096] mb-1.5 uppercase tracking-wider">
                              {seccion.labels[i]}
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={valores[campo] || ''}
                              onChange={(e) => setValores(prev => ({ ...prev, [campo]: e.target.value }))}
                              placeholder="0"
                              className="w-full py-3 px-3.5 bg-[#F8F9FA] border border-[#D1D5DB] rounded-xl text-sm font-semibold text-[#1a1a1a] placeholder-[#CBD5E1] outline-none focus:border-[#E31837] focus:bg-white focus:ring-2 focus:ring-[#E31837]/10 transition-all"
                              style={{ minHeight: '44px' }}
                            />
                          </div>
                        ))}

                        <button
                          onClick={() => handlePreSave(seccion.id)}
                          disabled={saving}
                          className="w-full py-3 text-white rounded-xl font-semibold text-sm active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                          style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: saving ? 'none' : '0 4px 12px rgba(227,24,55,0.2)', minHeight: '44px' }}
                        >
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    )
                  }

                  // Active — section 4
                  if (isActive && seccion.id === 4) {
                    return (
                      <div key={seccion.id} className="rounded-xl p-4 bg-white space-y-4" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)' }}>4</div>
                            <span className="text-sm font-bold text-[#1a1a1a]">{seccion.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(227,24,55,0.08)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E31837] animate-pulse" />
                            <span className="text-[9px] font-bold text-[#E31837] uppercase tracking-wider">Activa</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#718096]">{seccion.descripcion}</p>

                        {/* Camara block */}
                        <div className="rounded-xl p-3.5" style={tieneCamara
                          ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }
                          : { background: '#F8F9FA', border: '1px solid #D1D5DB' }
                        }>
                          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wider block mb-2">Camara</span>
                          {tieneCamara ? (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-emerald-500" />
                              <span className="text-xs font-semibold text-emerald-600">Alex Prieto: {mesa.votos_alex_p} · PL Camara: {mesa.votos_camara_cun_pl}</span>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 mb-2.5">
                                <div>
                                  <label className="block text-[9px] text-[#718096] font-semibold mb-1">Votos Alex Prieto</label>
                                  <input type="number" inputMode="numeric" value={valores.votos_alex_p || ''} onChange={(e) => setValores(p => ({ ...p, votos_alex_p: e.target.value }))} placeholder="0" className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm font-semibold text-[#1a1a1a] placeholder-[#CBD5E1] outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 transition-all" style={{ minHeight: '40px' }} />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-[#718096] font-semibold mb-1">Votos PL Camara CUN</label>
                                  <input type="number" inputMode="numeric" value={valores.votos_camara_cun_pl || ''} onChange={(e) => setValores(p => ({ ...p, votos_camara_cun_pl: e.target.value }))} placeholder="0" className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm font-semibold text-[#1a1a1a] placeholder-[#CBD5E1] outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 transition-all" style={{ minHeight: '40px' }} />
                                </div>
                              </div>
                              <button onClick={() => handlePreSavePar('camara')} disabled={savingCamara} className="w-full py-2.5 text-white rounded-lg font-semibold text-xs active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', minHeight: '40px' }}>
                                {savingCamara ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                {savingCamara ? 'Guardando...' : 'Guardar Camara'}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Senado block */}
                        <div className="rounded-xl p-3.5" style={tieneSenado
                          ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }
                          : { background: '#F8F9FA', border: '1px solid #D1D5DB' }
                        }>
                          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wider block mb-2">Senado</span>
                          {tieneSenado ? (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-emerald-500" />
                              <span className="text-xs font-semibold text-emerald-600">Oscar Sanchez: {mesa.votos_oscar_sanchez_senado} · PL Senado: {mesa.votos_senado_pl}</span>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 mb-2.5">
                                <div>
                                  <label className="block text-[9px] text-[#718096] font-semibold mb-1">Votos Oscar Sanchez</label>
                                  <input type="number" inputMode="numeric" value={valores.votos_oscar_sanchez_senado || ''} onChange={(e) => setValores(p => ({ ...p, votos_oscar_sanchez_senado: e.target.value }))} placeholder="0" className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm font-semibold text-[#1a1a1a] placeholder-[#CBD5E1] outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 transition-all" style={{ minHeight: '40px' }} />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-[#718096] font-semibold mb-1">Votos PL Senado</label>
                                  <input type="number" inputMode="numeric" value={valores.votos_senado_pl || ''} onChange={(e) => setValores(p => ({ ...p, votos_senado_pl: e.target.value }))} placeholder="0" className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm font-semibold text-[#1a1a1a] placeholder-[#CBD5E1] outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 transition-all" style={{ minHeight: '40px' }} />
                                </div>
                              </div>
                              <button onClick={() => handlePreSavePar('senado')} disabled={savingSenado} className="w-full py-2.5 text-white rounded-lg font-semibold text-xs active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', minHeight: '40px' }}>
                                {savingSenado ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                {savingSenado ? 'Guardando...' : 'Guardar Senado'}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Photos */}
                        <div className="space-y-2">
                          <PhotoCapture label="Foto E-14 Camara" existingUrl={mesa.foto_camara} onCapture={(b64) => handleUploadPhoto(b64, 'camara')} />
                          <PhotoCapture label="Foto E-14 Senado" existingUrl={mesa.foto_senado} onCapture={(b64) => handleUploadPhoto(b64, 'senado')} />
                        </div>
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
