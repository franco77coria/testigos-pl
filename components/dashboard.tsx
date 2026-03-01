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
    <div className="min-h-screen bg-[#F5F5F7] flex justify-center">
      <div className="w-full max-w-[500px] bg-white min-h-screen shadow-[0_0_40px_rgba(0,0,0,0.05)] relative flex flex-col">
        {/* Header con gradiente */}
        <div className="relative overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #E31837, #8B0A1E)' }}
        >
          <div className="px-5 pt-6 pb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold tracking-wide">Testigos PL</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-full text-white text-[11px] font-bold tracking-wide cursor-pointer transition-colors hover:bg-white/20 flex items-center gap-1.5 border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                SALIR
              </button>
            </div>

            <div className="text-white text-center">
              <h1 className="text-[22px] font-bold leading-tight mb-1">
                {testigo.nombre1} {testigo.apellido1}
              </h1>
              <p className="text-white/80 text-[13px] font-medium">
                {testigo.puesto}
              </p>
            </div>
          </div>

          {/* Curva inferior */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[30px]" style={{ transform: 'rotateY(180deg)' }}>
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#F5F5F7" />
            </svg>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="px-5 -mt-6 relative z-10 flex-1 pb-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-0.5">
              <span className="block text-[22px] font-black text-[#E31837] leading-none mb-1">
                <AnimatedNumber value={total} />
              </span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-0.5">
              <span className="block text-[22px] font-black text-[#10B981] leading-none mb-1">
                <AnimatedNumber value={completadas} />
              </span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Listas</span>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-0.5">
              <span className="block text-[22px] font-black text-[#F59E0B] leading-none mb-1">
                <AnimatedNumber value={enProgreso} />
              </span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Activas</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[15px] font-bold text-[#1A1A1A] flex items-center gap-2">
              📋 Mis Mesas
            </h2>
            <button
              onClick={refrescar}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Loader2 size={12} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          <div className="space-y-3">
            {mesas.map((mesa, i) => (
              <motion.div
                key={mesa.mesa_numero}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MesaCard
                  mesa={mesa}
                  index={i}
                  onClick={() => setMesaAbierta(mesa)}
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 text-[11px] font-medium text-gray-400">
            Última actualización: {ultimaAct}
          </div>
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
    </div>
  )
}
