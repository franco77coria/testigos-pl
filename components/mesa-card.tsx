'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MesaDashboard, FranjaHoraria } from '@/lib/types'
import { calcularEstado, CAMARA_CANDIDATOS, SENADO_CANDIDATOS, FRANJAS_HORARIAS } from '@/lib/types'
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
  const activeSenado = senadoCandidatos?.length ? senadoCandidatos : SENADO_CANDIDATOS
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [confirmResumen, setConfirmResumen] = useState<{ label: string; valor: string }[] | null>(null)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [valHorario, setValHorario] = useState<Record<string, string>>({})

  const estado = calcularEstado(mesa)
  const isCompletada = estado === 'completada'
  const camaraGuardada = mesa.datos_camara_guardados === true
  const senadoGuardado = mesa.datos_senado_guardados === true
  const datosFinalesBloqueados = isCompletada

  function handleToggle() {
    if (!expanded) {
      const init: Record<string, string> = {}
      CAMARA_CANDIDATOS.forEach(c => { init[c.code] = mesa[c.code as keyof MesaDashboard]?.toString() || '0' })
      init.votos_camara_partido = mesa.votos_camara_partido?.toString() || '0'
      activeSenado.forEach(c => { init[c.code] = mesa[c.code as keyof MesaDashboard]?.toString() || '0' })
      init.votos_senado_partido = mesa.votos_senado_partido?.toString() || '0'
      setValores(init)

      const initH: Record<string, string> = {}
      FRANJAS_HORARIAS.forEach(f => {
        initH[f.key] = mesa[`votantes_${f.key}` as keyof MesaDashboard]?.toString() || ''
      })
      setValHorario(initH)
    }
    setExpanded(!expanded)
  }

  // ---- CONTEO HORARIO ----
  function handlePreSaveHorario(franja: FranjaHoraria) {
    const franjaInfo = FRANJAS_HORARIAS.find(f => f.key === franja)!
    const valor = valHorario[franja] || '0'
    setConfirmResumen([{ label: franjaInfo.label, valor: `${valor} personas` }])
    setConfirmAction(() => () => doSaveHorario(franja))
  }

  async function doSaveHorario(franja: FranjaHoraria) {
    setConfirmResumen(null)
    setConfirmAction(null)
    setSaving(true)
    try {
      const res = await fetch('/api/mesas/save-horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula, mesa_numero: mesa.mesa_numero, franja,
          votantes: parseInt(valHorario[franja]) || 0,
        }),
      })
      const data = await res.json()
      if (!data.exito) { toast('err', data.mensaje || 'Error al guardar.'); return }
      toast('ok', data.mensaje || 'Conteo guardado.')
      await refreshMesa()
    } catch { toast('err', 'Error de conexión.') }
    finally { setSaving(false) }
  }

  // ---- GUARDAR SENADO ----
  function handlePreSaveSenado() {
    if (senadoGuardado) { toast('err', 'Los registros de Senado ya fueron guardados.'); return }
    if (!mesa.foto_senado) { toast('err', 'Suba la foto del acta de Senado antes de guardar.'); return }
    const resumen: { label: string; valor: string }[] = []
    resumen.push({ label: '--- SENADO ---', valor: '' })
    activeSenado.forEach(c => resumen.push({ label: c.title, valor: valores[c.code] || '0' }))
    resumen.push({ label: 'VOTOS POR EL PARTIDO LIBERAL', valor: valores.votos_senado_partido || '0' })
    setConfirmResumen(resumen)
    setConfirmAction(() => () => doSaveSenado())
  }

  async function doSaveSenado() {
    setConfirmResumen(null)
    setConfirmAction(null)
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      activeSenado.forEach(c => { payload[c.code] = parseInt(valores[c.code]) || 0 })
      payload.votos_senado_partido = parseInt(valores.votos_senado_partido) || 0
      const res = await fetch('/api/mesas/save-senado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, datos: payload }),
      })
      const data = await res.json()
      if (!data.exito) { toast('err', data.mensaje || 'Error al guardar.'); return }
      toast('ok', 'Registros de Senado guardados.')
      await refreshMesa()
    } catch { toast('err', 'Error de conexión.') }
    finally { setSaving(false) }
  }

  // ---- GUARDAR CÁMARA ----
  function handlePreSaveCamara() {
    if (camaraGuardada) { toast('err', 'Los registros de Cámara ya fueron guardados.'); return }
    if (!mesa.foto_camara) { toast('err', 'Suba la foto del acta de Cámara antes de guardar.'); return }
    const resumen: { label: string; valor: string }[] = []
    resumen.push({ label: '--- CÁMARA ---', valor: '' })
    CAMARA_CANDIDATOS.forEach(c => resumen.push({ label: c.title, valor: valores[c.code] || '0' }))
    resumen.push({ label: 'Votos por la LISTA DEL PARTIDO LIBERAL', valor: valores.votos_camara_partido || '0' })
    setConfirmResumen(resumen)
    setConfirmAction(() => () => doSaveCamara())
  }

  async function doSaveCamara() {
    setConfirmResumen(null)
    setConfirmAction(null)
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      CAMARA_CANDIDATOS.forEach(c => { payload[c.code] = parseInt(valores[c.code]) || 0 })
      payload.votos_camara_partido = parseInt(valores.votos_camara_partido) || 0
      const res = await fetch('/api/mesas/save-camara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, mesa_numero: mesa.mesa_numero, datos: payload }),
      })
      const data = await res.json()
      if (!data.exito) { toast('err', data.mensaje || 'Error al guardar.'); return }
      toast('ok', 'Registros de Cámara guardados.')
      await refreshMesa()
    } catch { toast('err', 'Error de conexión.') }
    finally { setSaving(false) }
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
        toast('ok', `Foto ${tipo.includes('camara') ? 'Cámara' : 'Senado'} subida.`)
        await refreshMesa()
      } else {
        toast('err', 'Error subiendo foto.')
      }
    } catch { toast('err', 'Error subiendo foto.') }
    finally { setSaving(false); setExpanded(true) }
  }

  async function refreshMesa() {
    const res = await fetch(`/api/mesas?cedula=${cedula}`)
    const data = await res.json()
    if (data.exito) {
      const updated = data.mesas.find((m: MesaDashboard) => m.mesa_numero === mesa.mesa_numero)
      if (updated) onUpdate(updated)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '14px',
    height: '40px', outline: 'none', color: '#111827',
    fontFamily: "'Inter', system-ui, sans-serif",
  }
  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle, background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed',
  }

  function isFranjaHabilitada(franja: FranjaHoraria): boolean {
    if (mesa[`datos_${franja}_guardados` as keyof MesaDashboard]) return false
    if (franja === '8am') return true
    if (franja === '11am') return mesa.datos_8am_guardados === true
    if (franja === '1pm') return mesa.datos_11am_guardados === true
    return false
  }

  function isFranjaGuardada(franja: FranjaHoraria): boolean {
    return mesa[`datos_${franja}_guardados` as keyof MesaDashboard] === true
  }

  return (
    <>
      <div style={{
        background: '#FFFFFF', borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        {/* Header */}
        <div
          onClick={handleToggle}
          style={{
            padding: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: expanded ? '1px solid #E5E7EB' : 'none',
            cursor: 'pointer', background: '#FAFBFC', transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '18px',
              background: isCompletada ? '#10B981' : '#CE1126', color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              {mesa.mesa_numero}
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '14px', margin: 0, lineHeight: 1.3 }}>
                Mesa {mesa.mesa_numero}
              </h4>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: isCompletada ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: isCompletada ? '#10B981' : '#F59E0B',
                }}>
                  {isCompletada ? 'Completado' : 'Pendiente'}
                </span>
                {FRANJAS_HORARIAS.map(f => (
                  <span key={f.key} style={{
                    display: 'inline-block', padding: '2px 6px', borderRadius: '12px',
                    fontSize: '9px', fontWeight: 700,
                    background: isFranjaGuardada(f.key) ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                    color: isFranjaGuardada(f.key) ? '#10B981' : '#94A3B8',
                  }}>
                    {f.hora.replace(':00', 'h')} {isFranjaGuardada(f.key) ? '✓' : '○'}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined" style={{
            color: '#94A3B8', transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>expand_more</span>
        </div>

        {/* Body expandible */}
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

                {/* ===== SECCIÓN 1: CONTEO HORARIO ===== */}
                <div style={{ marginBottom: '24px' }}>
                  <SectionTitle color="#3B82F6" title="Conteo de Votantes" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {FRANJAS_HORARIAS.map((f) => {
                      const guardada = isFranjaGuardada(f.key)
                      const habilitada = datosFinalesBloqueados ? false : isFranjaHabilitada(f.key)
                      const valorGuardado = mesa[`votantes_${f.key}` as keyof MesaDashboard]

                      return (
                        <div key={f.key} style={{
                          background: guardada ? 'rgba(16,185,129,0.04)' : habilitada ? '#FFFFFF' : '#F9FAFB',
                          border: `1px solid ${guardada ? '#10B981' : habilitada ? '#3B82F6' : '#E5E7EB'}`,
                          borderRadius: '10px', padding: '12px',
                          opacity: !habilitada && !guardada ? 0.5 : 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span className="material-symbols-outlined" style={{
                                  fontSize: '16px',
                                  color: guardada ? '#10B981' : habilitada ? '#3B82F6' : '#94A3B8',
                                }}>
                                  {guardada ? 'check_circle' : habilitada ? 'schedule' : 'lock'}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{f.label}</span>
                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>({f.hora})</span>
                              </div>
                              {guardada && (
                                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                                  Registrado: {valorGuardado?.toString()}
                                </span>
                              )}
                              {!guardada && !habilitada && (
                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                  Complete la franja anterior primero
                                </span>
                              )}
                            </div>
                            {guardada ? (
                              <div style={{
                                background: '#10B981', color: 'white', borderRadius: '8px',
                                padding: '8px 12px', fontWeight: 700, fontSize: '14px',
                                minWidth: '60px', textAlign: 'center',
                              }}>
                                {valorGuardado?.toString()}
                              </div>
                            ) : habilitada ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="number" inputMode="numeric" min="0" placeholder="0"
                                  value={valHorario[f.key] || ''}
                                  onChange={e => setValHorario(v => ({ ...v, [f.key]: e.target.value }))}
                                  style={{ ...inputStyle, width: '80px' }}
                                />
                                <button
                                  onClick={() => handlePreSaveHorario(f.key)}
                                  disabled={saving}
                                  style={{
                                    background: '#3B82F6', color: 'white', border: 'none',
                                    borderRadius: '8px', padding: '8px 12px',
                                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    opacity: saving ? 0.5 : 1,
                                    fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
                                  Guardar
                                </button>
                              </div>
                            ) : (
                              <div style={{
                                background: '#F3F4F6', borderRadius: '8px',
                                padding: '8px 12px', color: '#9CA3AF', fontSize: '12px', fontWeight: 600,
                              }}>
                                Bloqueado
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ===== SECCIÓN 2: SENADO (primero) ===== */}
                <div style={{ marginBottom: '24px' }}>
                  <SectionTitle color="#3B82F6" title="Senado de la República" guardado={senadoGuardado} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {activeSenado.map(c => (
                      <VotoRow
                        key={c.code}
                        id={c.code}
                        label={c.title}
                        value={valores[c.code] || '0'}
                        disabled={senadoGuardado}
                        onChange={v => setValores(prev => ({ ...prev, [c.code]: v }))}
                        inputStyle={inputStyle}
                        disabledInputStyle={disabledInputStyle}
                        guardado={senadoGuardado}
                        highlight={false}
                      />
                    ))}

                    <VotoRow
                      id="votos_senado_partido"
                      label="VOTOS POR EL PARTIDO LIBERAL"
                      value={valores.votos_senado_partido || '0'}
                      disabled={senadoGuardado}
                      onChange={v => setValores(prev => ({ ...prev, votos_senado_partido: v }))}
                      inputStyle={inputStyle}
                      disabledInputStyle={disabledInputStyle}
                      guardado={senadoGuardado}
                      highlight={true}
                      highlightColor="#3B82F6"
                    />

                    <FotoSection
                      titulo="Fotos E-14 Senado"
                      color="#3B82F6"
                      foto1Url={mesa.foto_senado}
                      foto2Url={mesa.foto_senado_2}
                      disabled={senadoGuardado}
                      requerida={!mesa.foto_senado && !senadoGuardado}
                      onCapture1={b64 => handleUploadPhoto(b64, 'senado')}
                      onCapture2={b64 => handleUploadPhoto(b64, 'senado_2')}
                    />

                    {senadoGuardado ? (
                      <SavedBadge label="Registros de Senado Guardados" />
                    ) : (
                      <SaveButton
                        label="GUARDAR REGISTROS DE SENADO"
                        color="#3B82F6"
                        disabled={saving || !mesa.foto_senado}
                        missingPhoto={!mesa.foto_senado}
                        onClick={handlePreSaveSenado}
                        saving={saving}
                      />
                    )}
                  </div>
                </div>

                {/* ===== SECCIÓN 3: CÁMARA (después) ===== */}
                <div style={{ marginBottom: '8px' }}>
                  <SectionTitle color="#CE1126" title="Cámara de Representantes" guardado={camaraGuardada} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {CAMARA_CANDIDATOS.map(c => (
                      <VotoRow
                        key={c.code}
                        id={c.code}
                        label={c.title}
                        value={valores[c.code] || '0'}
                        disabled={camaraGuardada}
                        onChange={v => setValores(prev => ({ ...prev, [c.code]: v }))}
                        inputStyle={inputStyle}
                        disabledInputStyle={disabledInputStyle}
                        guardado={camaraGuardada}
                        highlight={false}
                      />
                    ))}

                    <VotoRow
                      id="votos_camara_partido"
                      label="Votos por la LISTA DEL PARTIDO LIBERAL"
                      value={valores.votos_camara_partido || '0'}
                      disabled={camaraGuardada}
                      onChange={v => setValores(prev => ({ ...prev, votos_camara_partido: v }))}
                      inputStyle={inputStyle}
                      disabledInputStyle={disabledInputStyle}
                      guardado={camaraGuardada}
                      highlight={true}
                      highlightColor="#CE1126"
                    />

                    <FotoSection
                      titulo="Fotos E-14 Cámara"
                      color="#CE1126"
                      foto1Url={mesa.foto_camara}
                      foto2Url={mesa.foto_camara_2}
                      disabled={camaraGuardada}
                      requerida={!mesa.foto_camara && !camaraGuardada}
                      onCapture1={b64 => handleUploadPhoto(b64, 'camara')}
                      onCapture2={b64 => handleUploadPhoto(b64, 'camara_2')}
                    />

                    {camaraGuardada ? (
                      <SavedBadge label="Registros de Cámara Guardados" />
                    ) : (
                      <SaveButton
                        label="GUARDAR REGISTROS DE CÁMARA"
                        color="#CE1126"
                        disabled={saving || !mesa.foto_camara}
                        missingPhoto={!mesa.foto_camara}
                        onClick={handlePreSaveCamara}
                        saving={saving}
                      />
                    )}
                  </div>
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
        onConfirm={() => confirmAction && confirmAction()}
        onCancel={() => { setConfirmResumen(null); setConfirmAction(null) }}
      />
    </>
  )
}

// ---- Subcomponentes ----

function SectionTitle({ color, title, guardado }: { color: string; title: string; guardado?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB',
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <h5 style={{ fontWeight: 700, color: '#111827', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', margin: 0 }}>
        {title}
      </h5>
      {guardado && (
        <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
          ✓ Guardado
        </span>
      )}
    </div>
  )
}

function VotoRow({ id, label, value, disabled, onChange, inputStyle, disabledInputStyle, guardado, highlight, highlightColor }: {
  id: string; label: string; value: string; disabled: boolean
  onChange: (v: string) => void
  inputStyle: React.CSSProperties; disabledInputStyle: React.CSSProperties
  guardado: boolean; highlight: boolean; highlightColor?: string
}) {
  const bg = guardado ? 'rgba(16,185,129,0.04)' : highlight ? '#FAFAFA' : '#F8F9FA'
  const border = guardado ? '#10B981' : highlight && highlightColor ? highlightColor + '40' : '#E5E7EB'
  const labelColor = highlight && highlightColor && !guardado ? highlightColor : '#374151'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      background: bg, padding: highlight ? '12px' : '10px 12px',
      borderRadius: '8px', border: `1px solid ${border}`,
    }}>
      <label style={{ fontSize: highlight ? '13px' : '12px', fontWeight: highlight ? 700 : 500, color: labelColor, flex: 1 }} htmlFor={id}>
        {label}
      </label>
      <input
        id={id} type="number" inputMode="numeric" min="0" placeholder="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={disabled ? { ...disabledInputStyle, width: '80px', flexShrink: 0 } : { ...inputStyle, width: '80px', flexShrink: 0 }}
      />
    </div>
  )
}

function FotoSection({ titulo, color, foto1Url, foto2Url, disabled, requerida, onCapture1, onCapture2 }: {
  titulo: string; color: string
  foto1Url: string | null; foto2Url: string | null
  disabled: boolean; requerida: boolean
  onCapture1: (b64: string) => void; onCapture2: (b64: string) => void
}) {
  return (
    <div style={{ marginTop: '4px', padding: '12px', borderRadius: '10px', background: '#FAFBFC', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color }}>photo_camera</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{titulo}</span>
        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>(hasta 2)</span>
        {requerida && (
          <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>
            Requerida para guardar
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <PhotoCapture label="Foto 1" existingUrl={foto1Url} onCapture={onCapture1} disabled={disabled} />
        <PhotoCapture label="Foto 2" existingUrl={foto2Url} onCapture={onCapture2} disabled={disabled} />
      </div>
    </div>
  )
}

function SavedBadge({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', background: '#10B981', color: 'white',
      fontWeight: 700, padding: '13px 16px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      fontSize: '13px', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
      {label}
    </div>
  )
}

function SaveButton({ label, color, disabled, missingPhoto, onClick, saving }: {
  label: string; color: string; disabled: boolean
  missingPhoto: boolean; onClick: () => void; saving: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={missingPhoto ? 'Suba la foto del acta primero' : ''}
      style={{
        width: '100%',
        background: missingPhoto ? '#E5E7EB' : color,
        color: missingPhoto ? '#9CA3AF' : 'white',
        fontWeight: 700, padding: '13px 16px', borderRadius: '10px',
        boxShadow: missingPhoto ? 'none' : `0 4px 14px ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.6 : 1, fontSize: '13px',
        fontFamily: "'Inter', system-ui, sans-serif", transition: 'all 0.2s',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
        {missingPhoto ? 'photo_camera' : 'how_to_vote'}
      </span>
      {saving ? 'Guardando...' : missingPhoto ? 'Suba la foto para habilitar' : label}
    </button>
  )
}
