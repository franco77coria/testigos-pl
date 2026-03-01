'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  testigos: number
  municipios: number
  asignaciones: number
}

export default function AdminPanel() {
  const [loading, setLoading] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [stats, setStats] = useState<Stats>({ testigos: 0, municipios: 0, asignaciones: 0 })

  // States for new admin form
  const [adminCedula, setAdminCedula] = useState('')
  const [newAdminCedula, setNewAdminCedula] = useState('')
  const [adminMensaje, setAdminMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  const testigosRef = useRef<HTMLInputElement>(null)
  const semaforoRef = useRef<HTMLInputElement>(null)

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    setLoading('add_admin')
    setAdminMensaje(null)

    try {
      const res = await fetch('/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula_admin: adminCedula,
          nueva_cedula: newAdminCedula
        }),
      })
      const data = await res.json()

      if (data.exito) {
        setAdminMensaje({ tipo: 'ok', texto: data.mensaje })
        setNewAdminCedula('')
      } else {
        setAdminMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setAdminMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setLoading('')
  }

  async function uploadCSV(tipo: 'testigos' | 'semaforo', file: File) {
    setLoading(tipo)
    setMensaje(null)

    try {
      const text = await file.text()
      const res = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, csv: text }),
      })
      const data = await res.json()

      if (data.exito) {
        setMensaje({ tipo: 'ok', texto: data.mensaje })
        setStats((prev) => ({
          ...prev,
          [tipo === 'testigos' ? 'testigos' : 'municipios']: data.total,
        }))
      } else {
        setMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setMensaje({ tipo: 'err', texto: 'Error de conexion.' })
    }
    setLoading('')
  }

  async function ejecutarAsignacion() {
    setLoading('asignar')
    setMensaje(null)

    try {
      const res = await fetch('/api/admin/asignar', { method: 'POST' })
      const data = await res.json()

      if (data.exito) {
        setMensaje({ tipo: 'ok', texto: data.mensaje })
        setStats((prev) => ({ ...prev, asignaciones: data.estadisticas.totalAsignaciones }))
      } else {
        setMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setMensaje({ tipo: 'err', texto: 'Error de conexion.' })
    }
    setLoading('')
  }

  const cards = [
    {
      id: 'testigos' as const,
      titulo: 'Listado de Testigos',
      descripcion: 'CSV con la informacion de todos los testigos electorales.',
      ref: testigosRef,
      statLabel: 'testigos cargados',
      statValue: stats.testigos,
      iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    },
    {
      id: 'semaforo' as const,
      titulo: 'Semaforo por Municipio',
      descripcion: 'CSV con mesas, votantes y metas por municipio.',
      ref: semaforoRef,
      statLabel: 'municipios cargados',
      statValue: stats.municipios,
      iconPath: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex justify-center">
      <div className="w-full max-w-[600px] bg-white min-h-screen shadow-[0_0_40px_rgba(0,0,0,0.05)] relative flex flex-col">
        {/* Header con gradiente */}
        <div className="relative overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A1A1A, #000000)' }}
        >
          {/* Subtle background glow for premium feel */}
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(227,24,55,0.4) 0%, transparent 60%)' }}
          />

          <div className="px-6 pt-6 pb-14 relative z-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 text-[11px] font-bold tracking-wider hover:text-white transition-colors uppercase mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Volver al Login
            </Link>

            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                  Panel de Administración
                </h1>
                <p className="text-white/60 text-[13px] font-medium mt-0.5">
                  Centro de Control — Cundinamarca 2026
                </p>
              </div>
            </div>
          </div>

          {/* Curva inferior */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[35px]" style={{ transform: 'rotateY(180deg)' }}>
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#F5F5F7" />
            </svg>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="px-5 sm:px-6 -mt-8 relative z-10 flex-1 pb-12 space-y-5">
          {/* Message */}
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-4 rounded-[16px] text-[13px] font-medium shadow-sm border ${mensaje.tipo === 'ok'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-red-50 border-red-100 text-red-800'
                }`}
            >
              {mensaje.tipo === 'ok' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-emerald-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-red-600">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                </svg>
              )}
              {mensaje.texto}
            </motion.div>
          )}

          {/* Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={card.id}
                className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 text-[#E31837]"
                  style={{ background: 'linear-gradient(135deg, rgba(227,24,55,0.1), rgba(227,24,55,0.05))' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.iconPath} />
                    {card.id === 'semaforo' && <circle cx="12" cy="10" r="3" />}
                  </svg>
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1.5">{card.titulo}</h3>
                <p className="text-[12px] text-[#6B7280] mb-5 flex-1 leading-relaxed font-medium">{card.descripcion}</p>

                {card.statValue > 0 && (
                  <div className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4 self-start border border-emerald-100">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                    </svg>
                    {card.statValue} {card.statLabel}
                  </div>
                )}

                <input
                  ref={card.ref}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadCSV(card.id, file)
                    e.target.value = ''
                  }}
                />

                <button
                  onClick={() => card.ref.current?.click()}
                  disabled={!!loading}
                  className="w-full py-3 mt-auto text-white rounded-xl font-bold text-[13px] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #E31837, #B71530)' }}
                >
                  {loading === card.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                      </svg>
                      Subir archivo CSV
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Assignment Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 relative overflow-hidden"
          >
            {/* Decorative background element for this hero card */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 opacity-50" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-[14px] bg-red-50 text-[#E31837] flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2">Asignación Automática Inteligente</h3>
              <p className="text-[13px] text-[#6B7280] mb-2 font-medium">
                Distribuye las mesas de cada municipio entre los testigos disponibles de forma automatizada y equitativa.
              </p>
              <p className="text-[12px] text-gray-500 mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <strong className="text-gray-700">Algoritmo Óptimo:</strong> Intenta asignar ~4 mesas por testigo. Si hay exceso de mesas, aplica distribución round-robin.
              </p>

              {stats.asignaciones > 0 && (
                <div className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-5 border border-emerald-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                  </svg>
                  {stats.asignaciones} asignaciones creadas
                </div>
              )}

              <button
                onClick={ejecutarAsignacion}
                disabled={!!loading}
                className="w-full py-3.5 mt-2 bg-[#1A1A1A] text-white rounded-xl font-bold text-[14px] cursor-pointer transition-all duration-300 hover:bg-black hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === 'asignar' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Procesando asignaciones...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                    Ejecutar Motor de Asignación
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Add Admin Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-slate-50 text-slate-700 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6" /><path d="M16 11h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-[16px]">Agregar Administrador</h3>
                  <p className="text-[13px] text-[#6B7280] font-medium">Autorice una nueva cédula para acceder a este panel.</p>
                </div>
              </div>

              {adminMensaje && (
                <div className={`mb-4 p-3 rounded-xl text-[12px] font-medium border flex items-start gap-2 ${adminMensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                  {adminMensaje.texto}
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-700 ml-1">Su Cédula (Autorización)</label>
                    <input
                      type="number"
                      value={adminCedula}
                      onChange={(e) => setAdminCedula(e.target.value)}
                      placeholder="Ej: 42725129"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none transition-all focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-700 ml-1">Nueva Cédula Admin</label>
                    <input
                      type="number"
                      value={newAdminCedula}
                      onChange={(e) => setNewAdminCedula(e.target.value)}
                      placeholder="Cédula a autorizar"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none transition-all focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading === 'add_admin'}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-[13px] cursor-pointer transition-all duration-300 hover:bg-black hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === 'add_admin' ? (
                    <><Loader2 size={16} className="animate-spin" /> Agregando...</>
                  ) : (
                    <>Agregar Administrador</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Instructions Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-amber-50/50 border border-amber-100 rounded-[20px] p-5"
          >
            <h4 className="flex items-center gap-2 text-[12px] font-bold text-amber-800 uppercase tracking-widest mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              Flujo de Operación
            </h4>
            <ol className="list-decimal list-outside ml-4 space-y-2 text-[12px] font-medium text-amber-700/80">
              <li>Suba el <strong>Listado de Testigos</strong> (CSV con cedulas, nombres, municipios, etc).</li>
              <li>Suba el <strong>Semáforo</strong> (CSV con metas de mesas por municipio).</li>
              <li>Ejecute la <strong>Asignación Automática</strong> para mapear todo.</li>
              <li>Los testigos ahora pueden acceder con su cédula al portal principal.</li>
            </ol>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
