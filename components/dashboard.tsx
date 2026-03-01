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
      <div className="min-h-screen bg-[#F5F5F7]">
        {/* Header con gradiente */}
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #E31837, #8B0A1E)' }}
        >
          <div className="max-w-[900px] mx-auto px-5 pt-6 pb-16">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold">Testigos PL</span>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-full text-white text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-white/25 flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                Salir
              </button>
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold mb-1">
                {testigo.nombre1} {testigo.apellido1}
              </h1>
              <div className="flex items-center gap-2 text-[13px] text-white/85 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {testigo.municipio}
                </span>
                <span className="text-white/30">|</span>
                <span>{testigo.puesto}</span>
                <span className="px-2.5 py-0.5 rounded-xl text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {mesas.length} mesas
                </span>
              </div>
            </div>
          </div>

          {/* Curva decorativa */}
          <div className="absolute -bottom-[1px] left-[-5%] right-[-5%] h-[60px]"
            style={{ background: '#F5F5F7', borderRadius: '50% 50% 0 0' }}
          />
        </div>

        <div className="max-w-[900px] mx-auto px-4 -mt-7 relative z-10">
          {/* Resumen cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { label: 'Total', value: total, color: '#E31837' },
              { label: 'Completadas', value: completadas, color: '#059669' },
              { label: 'En progreso', value: enProgreso, color: '#D97706' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-3.5 text-center"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
              >
                <div className="text-[24px] font-extrabold leading-none mb-1" style={{ color: item.color }}>
                  <AnimatedNumber value={item.value} />
                </div>
                <div className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Title + Refresh */}
          <div className="flex items-center justify-between mb-3.5 px-1">
            <h2 className="text-base font-bold text-[#1A1A1A]">📋 Mis Mesas</h2>
            <button
              onClick={refrescar}
              disabled={refreshing}
              className="text-xs text-[#6B7280] flex items-center gap-1.5 hover:text-[#E31837] transition-colors cursor-pointer disabled:opacity-50"
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
          <div className="flex flex-col gap-3.5">
            {mesas.map((mesa, i) => (
              <MesaCard
                key={mesa.mesa_numero}
                mesa={mesa}
                index={i}
                onClick={() => setMesaAbierta(mesa)}
              />
            ))}
          </div>

          <p className="text-center mt-5 mb-8 text-[11px] text-[#6B7280]/50">
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
