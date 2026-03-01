'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { SesionTestigo, MesaDashboard } from '@/lib/types'
import { calcularEstado } from '@/lib/types'
import MesaCard from './mesa-card'
import MesaModal from './mesa-modal'
import { horaActual } from '@/lib/utils'

interface Props {
  sesion: SesionTestigo
  onLogout: () => void
  onMesasUpdate: (mesas: MesaDashboard[]) => void
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 500
    const start = performance.now()
    const from = display

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value])

  return <>{display}</>
}

export default function Dashboard({ sesion, onLogout, onMesasUpdate }: Props) {
  const [mesaAbierta, setMesaAbierta] = useState<MesaDashboard | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [ultimaAct, setUltimaAct] = useState(horaActual())

  const { testigo, mesas } = sesion

  const total = mesas.length
  const completadas = mesas.filter((m) => calcularEstado(m) === 'completada').length
  const enProgreso = mesas.filter((m) => calcularEstado(m) === 'en_progreso').length

  async function refrescar() {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/mesas?cedula=${sesion.cedula}`)
      const data = await res.json()
      if (data.exito) {
        onMesasUpdate(data.mesas)
        setUltimaAct(horaActual())
      }
    } catch { /* silent */ }
    setRefreshing(false)
  }

  function handleMesaUpdate(updatedMesa: MesaDashboard) {
    const newMesas = mesas.map((m) =>
      m.mesa_numero === updatedMesa.mesa_numero ? updatedMesa : m
    )
    onMesasUpdate(newMesas)
    setMesaAbierta(updatedMesa)
    setUltimaAct(horaActual())
  }

  return (
    <>
      <div className="min-h-screen bg-surface">
        {/* Red header */}
        <div className="bg-pl-red relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative z-10 max-w-[900px] mx-auto px-4 pt-4 pb-14">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white/70 text-xs font-medium">Testigos PL</span>
              </div>
              <button
                onClick={onLogout}
                className="text-white/70 text-xs font-medium cursor-pointer hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                Salir
              </button>
            </div>
            <h1 className="text-white text-lg font-bold">
              {testigo.nombre1} {testigo.apellido1}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {testigo.municipio}
              </span>
              <span className="text-white/30">|</span>
              <span>{testigo.puesto}</span>
            </div>
          </div>

          {/* Curve */}
          <div className="absolute -bottom-[1px] left-0 right-0">
            <svg viewBox="0 0 1440 40" className="w-full h-auto block">
              <path d="M0,40 L0,20 Q720,0 1440,20 L1440,40 Z" fill="#F8F9FA" />
            </svg>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-4 -mt-7 relative z-10">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total', value: total, color: 'text-pl-red', borderColor: 'border-t-pl-red' },
              { label: 'Completadas', value: completadas, color: 'text-success', borderColor: 'border-t-success' },
              { label: 'En progreso', value: enProgreso, color: 'text-warning', borderColor: 'border-t-warning' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white rounded-lg p-3.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-t-[3px] ${item.borderColor}`}
              >
                <div className={`text-2xl font-extrabold ${item.color} leading-none mb-1`}>
                  <AnimatedNumber value={item.value} />
                </div>
                <div className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Title + Refresh */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-sm font-bold text-text-primary">Mis Mesas</h2>
            <button
              onClick={refrescar}
              disabled={refreshing}
              className="text-xs text-text-secondary flex items-center gap-1.5 hover:text-pl-red transition-colors cursor-pointer disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              )}
              Actualizar
            </button>
          </div>

          {/* Mesa grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mesas.map((mesa, i) => (
              <MesaCard
                key={mesa.mesa_numero}
                mesa={mesa}
                index={i}
                onClick={() => setMesaAbierta(mesa)}
              />
            ))}
          </div>

          <p className="text-center mt-5 text-[11px] text-text-secondary/50">
            Ultima actualizacion: {ultimaAct}
          </p>
        </div>
      </div>

      {mesaAbierta && (
        <MesaModal
          mesa={mesaAbierta}
          cedula={sesion.cedula}
          onClose={() => setMesaAbierta(null)}
          onUpdate={handleMesaUpdate}
        />
      )}
    </>
  )
}
