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
      descripcion: 'Sube el CSV base con la información de todos los testigos.',
      ref: testigosRef,
      statLabel: 'cargados',
      statValue: stats.testigos,
      iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    },
    {
      id: 'semaforo' as const,
      titulo: 'Semáforo por Municipio',
      descripcion: 'Actualiza las metas y mesas designadas por región.',
      ref: semaforoRef,
      statLabel: 'registrados',
      statValue: stats.municipios,
      iconPath: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z',
    },
  ]

  return (
    <div className="min-h-screen bg-black/95 relative flex justify-center selection:bg-red-500/30">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-red-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[540px] relative z-10 flex flex-col min-h-screen pb-12">
        {/* Sleek Header */}
        <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md mb-6 absolute left-6 top-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E31837] to-[#8f0e21] shadow-[0_0_30px_rgba(227,24,55,0.4)] flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight">
            Control de Mando
          </h1>
          <p className="text-white/50 text-[14px] font-medium mt-1">
            Administración Central • Cundinamarca 2026
          </p>
        </div>

        <div className="px-4 sm:px-6 space-y-4 flex-1">

          {/* Alertas */}
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-start gap-3 p-4 rounded-2xl text-[13px] font-medium backdrop-blur-md border ${mensaje.tipo === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
            >
              {mensaje.tipo === 'ok' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                </svg>
              )}
              {mensaje.texto}
            </motion.div>
          )}

          {/* Grid de Carga de Datos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => !loading && card.ref.current?.click()}
                className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-xl rounded-[20px] p-5 flex flex-col cursor-pointer group relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 text-white/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.iconPath} />
                    {card.id === 'semaforo' && <circle cx="12" cy="10" r="3" />}
                  </svg>
                </div>

                <h3 className="font-semibold text-white tracking-tight text-[14px] leading-tight mb-1">{card.titulo}</h3>
                <p className="text-[12px] text-white/40 font-medium leading-snug mb-5">{card.descripcion}</p>

                <div className="mt-auto">
                  {card.statValue > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {card.statValue}
                    </div>
                  ) : (
                    <div className="text-[12px] font-bold flex items-center gap-1.5 text-white/50 group-hover:text-white transition-colors">
                      {loading === card.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Cargando</>
                      ) : (
                        <><span className="text-xl leading-none -mt-1">+</span> Subir Archivo</>
                      )}
                    </div>
                  )}
                </div>

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
              </motion.div>
            ))}
          </div>

          {/* Asignación Inteligente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl rounded-[24px] p-1 shadow-2xl relative overflow-hidden"
          >
            <div className="bg-[#111] rounded-[22px] p-6 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[#E31837] text-[11px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E31837] animate-pulse" />
                    Motor Neural
                  </div>
                  <h3 className="font-bold text-white text-[18px]">Asignación de Mesas</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
              </div>

              <p className="text-[13px] text-white/50 mb-6 font-medium leading-relaxed">
                Distribuye automáticamente las mesas del censo entre los testigos cargados. El algoritmo balancea ~4 mesas por persona mediante asignación equitativa.
              </p>

              {stats.asignaciones > 0 && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] font-bold flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                  {stats.asignaciones} mesas estructuradas con éxito
                </div>
              )}

              <button
                onClick={ejecutarAsignacion}
                disabled={!!loading}
                className="w-full h-12 rounded-[14px] bg-white text-black font-bold text-[14px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === 'asignar' ? (
                  <><Loader2 size={18} className="animate-spin" /> Procesando red...</>
                ) : (
                  <>Ejecutar Sincronización</>
                )}
              </button>
            </div>
          </motion.div>

          {/* Configuración de Administradores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[24px] p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="font-bold text-white text-[15px]">Nuevos Autorizados</h3>
            </div>

            {adminMensaje && (
              <div className={`mb-4 px-3 py-2.5 rounded-xl text-[12px] font-medium border flex items-start gap-2 ${adminMensaje.tipo === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {adminMensaje.texto}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div className="bg-[#111] rounded-[16px] p-1.5 flex flex-col gap-1.5 border border-white/5">
                <input
                  type="number"
                  value={adminCedula}
                  onChange={(e) => setAdminCedula(e.target.value)}
                  placeholder="Tu Cédula Maestra"
                  className="w-full px-4 py-3 bg-transparent text-white text-[13px] outline-none placeholder-white/30 font-medium font-mono"
                  required
                />
                <div className="h-px w-full bg-white/5" />
                <input
                  type="number"
                  value={newAdminCedula}
                  onChange={(e) => setNewAdminCedula(e.target.value)}
                  placeholder="Cédula a autorizar"
                  className="w-full px-4 py-3 bg-transparent text-white text-[13px] outline-none placeholder-white/30 font-medium font-mono border-l-2 border-red-500/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading === 'add_admin'}
                className="w-full py-3.5 rounded-[14px] font-bold text-[13px] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
              >
                {loading === 'add_admin' ? (
                  <><Loader2 size={16} className="animate-spin" /> Autorizando...</>
                ) : (
                  <>Otorgar Acceso Total</>
                )}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
