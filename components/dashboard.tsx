'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, LayoutDashboard, RefreshCw } from 'lucide-react'
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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center text-white">
                <LayoutDashboard size={15} />
              </div>
              <span className="text-sm font-semibold text-gray-800 tracking-tight">Testigos <span className="text-red-600">PL</span></span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {testigo.nombre1} {testigo.apellido1}
                </p>
                <p className="text-[11px] text-gray-400">
                  {testigo.puesto}
                </p>
              </div>
              <div className="w-px h-7 bg-gray-100 hidden sm:block" />
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline text-xs font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Mobile User Info */}
        <div className="sm:hidden mb-5 bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {testigo.nombre1} {testigo.apellido1}
            </p>
            <p className="text-[11px] text-gray-400">
              {testigo.puesto}
            </p>
          </div>
          <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md">
            CI: {testigo.cedula}
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100 transition-transform hover:-translate-y-0.5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span className="text-2xl sm:text-3xl font-bold text-gray-800 leading-none mb-0.5">
              <AnimatedNumber value={total} />
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-100 transition-transform hover:-translate-y-0.5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-500 leading-none mb-0.5">
              <AnimatedNumber value={completadas} />
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Listas</span>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-amber-100 transition-transform hover:-translate-y-0.5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 leading-none mb-0.5">
              <AnimatedNumber value={enProgreso} />
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Activas</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Mis Mesas</h2>
          <button
            onClick={refrescar}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Mesa Grid — now with inline accordion, no modal */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mesas.map((mesa, i) => (
            <motion.div
              key={mesa.mesa_numero}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MesaCard
                mesa={mesa}
                cedula={sesion.cedula}
                onUpdate={handleMesaUpdate}
              />
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-8 text-[11px] text-gray-300">
          Última actualización: {ultimaAct}
        </p>
      </main>
    </div>
  )
}
