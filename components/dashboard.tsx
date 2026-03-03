'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, RefreshCw, BarChart3, CheckCircle2, Clock, Layers } from 'lucide-react'
import type { SesionTestigo, MesaDashboard } from '@/lib/types'
import { calcularEstado } from '@/lib/types'
import MesaCard from './mesa-card'
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
    setUltimaAct(horaActual())
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F5' }}>
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <span style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#1a1a1a] tracking-tight">
                  Testigos <span className="text-[#E31837]">PL</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right max-w-[220px]">
                <p className="text-sm font-semibold text-[#1a1a1a] leading-tight truncate">
                  {testigo.nombre1} {testigo.apellido1}
                </p>
                <p className="text-[11px] text-[#718096] truncate">
                  {testigo.puesto}
                </p>
              </div>
              <div className="w-px h-7 bg-[#D1D5DB] hidden sm:block" />
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm text-[#718096] hover:text-[#E31837] transition-colors"
                title="Cerrar sesion"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline text-xs font-semibold">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Mobile User Info */}
        <div className="sm:hidden mb-5 bg-white p-4 rounded-xl flex items-center justify-between" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              {testigo.nombre1} {testigo.apellido1}
            </p>
            <p className="text-[11px] text-[#718096]">
              {testigo.municipio} · {testigo.puesto}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />
            <Layers size={16} className="text-[#718096] mb-2" />
            <span className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-none mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <AnimatedNumber value={total} />
            </span>
            <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">Total</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 leading-none mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <AnimatedNumber value={completadas} />
            </span>
            <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">Listas</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
            <Clock size={16} className="text-amber-500 mb-2" />
            <span className="text-2xl sm:text-3xl font-bold text-amber-500 leading-none mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <AnimatedNumber value={enProgreso} />
            </span>
            <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">Activas</span>
          </motion.div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-base font-bold text-[#1a1a1a]">
            Mis Mesas
          </h2>
          <button
            onClick={refrescar}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#718096] bg-white px-3 py-2 rounded-lg hover:text-[#E31837] transition-all disabled:opacity-40"
            style={{ border: '1px solid #D1D5DB' }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Mesa Grid */}
        {mesas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-10 text-center"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            <Layers size={36} className="mx-auto text-[#CBD5E1] mb-3" />
            <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-base font-bold text-[#1a1a1a] mb-1">Sin mesas asignadas</h3>
            <p className="text-sm text-[#718096]">Aún no tiene mesas de votación registradas.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mesas.map((mesa, i) => (
              <motion.div
                key={mesa.mesa_numero}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <MesaCard
                  mesa={mesa}
                  cedula={sesion.cedula}
                  onUpdate={handleMesaUpdate}
                />
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center mt-8 text-[11px] text-[#94A3B8]">
          Ultima actualizacion: {ultimaAct}
        </p>
      </main>
    </div>
  )
}
