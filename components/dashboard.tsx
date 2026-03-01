'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, LayoutDashboard, RefreshCw } from 'lucide-react'
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar Minimalista */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E31837] flex items-center justify-center text-white font-bold">
                <LayoutDashboard size={18} />
              </div>
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">Testigos <span className="text-[#E31837]">PL</span></span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {testigo.nombre1} {testigo.apellido1}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {testigo.puesto}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#E31837] transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* User Info Mobile */}
        <div className="sm:hidden mb-6 mx-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {testigo.nombre1} {testigo.apellido1}
            </p>
            <p className="text-[12px] font-medium text-slate-500">
              {testigo.puesto}
            </p>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-700">CI: {testigo.cedula}</span>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 mx-2 sm:mx-0">
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-slate-800 leading-none mb-1">
              <AnimatedNumber value={total} />
            </span>
            <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Total</span>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center border border-emerald-100 shadow-sm transition-transform hover:-translate-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-emerald-600 leading-none mb-1">
              <AnimatedNumber value={completadas} />
            </span>
            <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Listas</span>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center border border-amber-100 shadow-sm transition-transform hover:-translate-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-amber-500 leading-none mb-1">
              <AnimatedNumber value={enProgreso} />
            </span>
            <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Activas</span>
          </div>
        </div>

        {/* Header Mis Mesas */}
        <div className="flex items-center justify-between mb-6 mx-2 sm:mx-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            Mis Mesas Asignadas
          </h2>
          <button
            onClick={refrescar}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 px-2 sm:px-0">
          {mesas.map((mesa, i) => (
            <motion.div
              key={mesa.mesa_numero}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <MesaCard
                mesa={mesa}
                index={i}
                onClick={() => setMesaAbierta(mesa)}
              />
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10 text-xs font-medium text-slate-400">
          Última actualización: {ultimaAct}
        </div>
      </main>

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
