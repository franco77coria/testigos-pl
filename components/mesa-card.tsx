'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MesaDashboard } from '@/lib/types'
import { calcularEstado, CAMARA_CANDIDATOS, SENADO_CANDIDATOS } from '@/lib/types'
import PhotoCapture from './photo-capture'
import ConfirmModal from './confirm-modal'
import { toast } from './toast'

interface Props {
  mesa: MesaDashboard
  cedula: string
  onUpdate: (mesa: MesaDashboard) => void
  senadoCandidatos?: { code: string; title: string }[]
}

export default function MesaCard({ mesa, cedula, onUpdate, senadoCandidatos }: Props) {
  const activeSenado = senadoCandidatos || SENADO_CANDIDATOS
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [confirmResumen, setConfirmResumen] = useState<{ label: string; valor: string }[] | null>(null)

  const estado = calcularEstado(mesa)
  const isCompletada = estado === 'completada'

  function handleToggle() {
    if (!expanded) {
      const init: Record<string, string> = {}
      CAMARA_CANDIDATOS.forEach(c => { init[c.code] = mesa[c.code as keyof MesaDashboard]?.toString() || '0' })
      init.votos_camara_partido = mesa.votos_camara_partido?.toString() || '0'
      activeSenado.forEach(c => { init[c.code] = mesa[c.code as keyof MesaDashboard]?.toString() || '0' })
      init.votos_senado_partido = mesa.votos_senado_partido?.toString() || '0'
      init.confirmacion_e14 = mesa.confirmacion_e14 ? 'true' : 'false'
      setValores(init)
    }
    setExpanded(!expanded)
  }

  function handlePreSave() {
    const resumen: { label: string; valor: string }[] = []
    resumen.push({ label: '--- CÁMARA ---', valor: '' })
    CAMARA_CANDIDATOS.forEach(c => resumen.push({ label: c.title, valor: valores[c.code] || '0' }))
    resumen.push({ label: 'Votos Partido Cámara', valor: valores.votos_camara_partido || '0' })
    resumen.push({ label: '--- SENADO ---', valor: '' })
    activeSenado.forEach(c => resumen.push({ label: c.title, valor: valores[c.code] || '0' }))
    resumen.push({ label: 'Votos Partido Senado', valor: valores.votos_senado_partido || '0' })
    resumen.push({ label: 'Confirmación E-14 física', valor: valores.confirmacion_e14 === 'true' ? 'Sí' : 'No' })
    setConfirmResumen(resumen)
  }

  async function handleConfirm() {
    setConfirmResumen(null)
    setSaving(true)

    try {
      const payload: Record<string, any> = {}
      CAMARA_CANDIDATOS.forEach(c => { payload[c.code] = valores[c.code] ? parseInt(valores[c.code]) : 0 })
      payload.votos_camara_partido = valores.votos_camara_partido ? parseInt(valores.votos_camara_partido) : 0
      activeSenado.forEach(c => { payload[c.code] = valores[c.code] ? parseInt(valores[c.code]) : 0 })
      payload.votos_senado_partido = valores.votos_senado_partido ? parseInt(valores.votos_senado_partido) : 0
      payload.confirmacion_e14 = valores.confirmacion_e14 === 'true'

      const res = await fetch('/api/mesas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, datos: payload }),
      })
      const data = await res.json()
      if (!data.exito) {
        toast('err', data.mensaje || 'Error al guardar.')
        return
      }
      toast('ok', 'Resultados guardados exitosamente.')
      await refreshMesa()
    } catch {
      toast('err', 'Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadPhoto(base64: string, tipo: 'camara' | 'senado' | 'camara_2' | 'senado_2') {
    setSaving(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, tipo, base64 }),
      })
      const data = await res.json()
      if (data.exito) {
        toast('ok', `Foto E-14 ${tipo === 'camara' ? 'Cámara' : 'Senado'} subida con éxito.`)
        await refreshMesa()
      } else {
        toast('err', `Error subiendo foto ${tipo}.`)
      }
    } catch {
      toast('err', `Error subiendo foto ${tipo}.`)
    } finally {
      setSaving(false)
      setExpanded(true)
    }
  }

  async function refreshMesa() {
    const refreshRes = await fetch(`/api/mesas?cedula=${cedula}`)
    const refreshData = await refreshRes.json()
    if (refreshData.exito) {
      const updated = refreshData.mesas.find((m: MesaDashboard) => m.mesa_numero === mesa.mesa_numero)
      if (updated) {
        onUpdate(updated)
      }
    }
  }

  const allPhotosUploaded = !!mesa.foto_camara && !!mesa.foto_senado

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '14px',
    height: '40px',
    outline: 'none',
    color: '#111827',
    fontFamily: "'Inter', system-ui, sans-serif",
  }

  return (
    <>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        {/* Header toggle */}
        <div
          onClick={handleToggle}
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: expanded ? '1px solid #E5E7EB' : 'none',
            cursor: 'pointer',
            background: '#FAFBFC',
            transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '18px',
              background: isCompletada ? '#10B981' : '#CE1126',
              color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              {mesa.mesa_numero}
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '14px', margin: 0, lineHeight: 1.3 }}>
                Mesa {mesa.mesa_numero}
              </h4>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '4px',
                background: isCompletada ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: isCompletada ? '#10B981' : '#F59E0B',
              }}>
                {isCompletada ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined" style={{
            color: '#94A3B8',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>
            expand_more
          </span>
        </div>

        {/* Expandable Body */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '16px' }}>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                  <div style={{
                    background: '#F8F9FA', borderRadius: '8px', padding: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #E5E7EB',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '4px' }}>groups</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.05em' }}>Hábiles</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>-</span>
                  </div>
                  <div style={{
                    background: '#F8F9FA', borderRadius: '8px', padding: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #E5E7EB',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '4px' }}>how_to_vote</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.05em' }}>Votos</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>-</span>
                  </div>
                  <div style={{
                    background: '#F8F9FA', borderRadius: '8px', padding: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #E5E7EB',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '4px' }}>block</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.05em' }}>Nulos</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>-</span>
                  </div>
                </div>

                {/* Cámara */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '12px', paddingBottom: '8px',
                    borderBottom: '1px solid #E5E7EB',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CE1126' }} />
                    <h5 style={{ fontWeight: 700, color: '#111827', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', margin: 0 }}>
                      Cámara de Representantes
                    </h5>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Votos partido */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                      background: '#F8F9FA', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: '#111827' }} htmlFor="votos_camara_partido">
                        Votos solo por la lista (PL)
                      </label>
                      <input
                        id="votos_camara_partido"
                        type="number" inputMode="numeric" min="0" placeholder="0"
                        value={valores.votos_camara_partido || '0'}
                        onChange={e => setValores(v => ({ ...v, votos_camara_partido: e.target.value }))}
                        style={{ ...inputStyle, width: '80px' }}
                      />
                    </div>

                    {/* Candidatos list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      {CAMARA_CANDIDATOS.map(c => (
                        <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', flex: 1 }} htmlFor={c.code} title={c.title}>
                            {c.title}
                          </label>
                          <input
                            id={c.code}
                            type="number" inputMode="numeric" min="0" placeholder="0"
                            value={valores[c.code] || '0'}
                            onChange={e => setValores(v => ({ ...v, [c.code]: e.target.value }))}
                            style={{ ...inputStyle, width: '80px', flexShrink: 0 }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Fotos Cámara — 2 fotos */}
                    <div style={{
                      marginTop: '12px', padding: '12px', borderRadius: '10px',
                      background: '#FAFBFC', border: '1px solid #E5E7EB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CE1126' }}>photo_camera</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Fotos E-14 Cámara</span>
                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>(hasta 2)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <PhotoCapture label="Foto 1" existingUrl={mesa.foto_camara} onCapture={(b64) => handleUploadPhoto(b64, 'camara')} />
                        <PhotoCapture label="Foto 2" existingUrl={mesa.foto_camara_2} onCapture={(b64) => handleUploadPhoto(b64, 'camara_2')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Senado */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '12px', paddingBottom: '8px',
                    borderBottom: '1px solid #E5E7EB',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CE1126' }} />
                    <h5 style={{ fontWeight: 700, color: '#111827', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', margin: 0 }}>
                      Senado de la República
                    </h5>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                      background: '#F8F9FA', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: '#111827' }} htmlFor="votos_senado_partido">
                        Votos solo por la lista (PL)
                      </label>
                      <input
                        id="votos_senado_partido"
                        type="number" inputMode="numeric" min="0" placeholder="0"
                        value={valores.votos_senado_partido || '0'}
                        onChange={e => setValores(v => ({ ...v, votos_senado_partido: e.target.value }))}
                        style={{ ...inputStyle, width: '80px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      {activeSenado.map(c => (
                        <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', flex: 1 }} htmlFor={c.code} title={c.title}>
                            {c.title}
                          </label>
                          <input
                            id={c.code}
                            type="number" inputMode="numeric" min="0" placeholder="0"
                            value={valores[c.code] || '0'}
                            onChange={e => setValores(v => ({ ...v, [c.code]: e.target.value }))}
                            style={{ ...inputStyle, width: '80px', flexShrink: 0 }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Fotos Senado — 2 fotos */}
                    <div style={{
                      marginTop: '12px', padding: '12px', borderRadius: '10px',
                      background: '#FAFBFC', border: '1px solid #E5E7EB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CE1126' }}>photo_camera</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Fotos E-14 Senado</span>
                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>(hasta 2)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <PhotoCapture label="Foto 1" existingUrl={mesa.foto_senado} onCapture={(b64) => handleUploadPhoto(b64, 'senado')} />
                        <PhotoCapture label="Foto 2" existingUrl={mesa.foto_senado_2} onCapture={(b64) => handleUploadPhoto(b64, 'senado_2')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={handlePreSave}
                    disabled={saving || (isCompletada && allPhotosUploaded)}
                    style={{
                      width: '100%',
                      background: (isCompletada && allPhotosUploaded) ? '#10B981' : '#CE1126',
                      color: 'white',
                      fontWeight: 700,
                      padding: '14px 16px',
                      borderRadius: '12px',
                      boxShadow: (isCompletada && allPhotosUploaded) ? 'none' : '0 4px 14px rgba(206,17,38,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: (saving || (isCompletada && allPhotosUploaded)) ? 'not-allowed' : 'pointer',
                      opacity: (saving || (isCompletada && allPhotosUploaded)) ? (isCompletada ? 1 : 0.5) : 1,
                      fontSize: '14px',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    <span className="material-symbols-outlined">
                      {(isCompletada && allPhotosUploaded) ? 'check_circle' : 'save'}
                    </span>
                    {saving ? 'Guardando Registro...' : (isCompletada && allPhotosUploaded ? 'Registro Completado' : 'Guardar Resultados')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={!!confirmResumen}
        titulo={`Confirmar Mesa ${mesa.mesa_numero}`}
        resumen={confirmResumen || []}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmResumen(null)}
      />
    </>
  )
}
