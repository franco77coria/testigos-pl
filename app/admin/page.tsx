'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, UploadCloud, Users, Map, Cpu, ShieldAlert, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react'
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
      descripcion: 'Cargue el CSV maestro con el censo de testigos registrados.',
      ref: testigosRef,
      statLabel: 'cargados',
      statValue: stats.testigos,
      icon: <Users size={20} className="text-blue-500" />,
      colorIconBg: 'bg-blue-50',
      colorStatusText: 'text-blue-600',
      colorStatusBg: 'bg-blue-100',
    },
    {
      id: 'semaforo' as const,
      titulo: 'Semáforo Municipal',
      descripcion: 'Actualice las metas operativas por cada municipio.',
      ref: semaforoRef,
      statLabel: 'registrados',
      statValue: stats.municipios,
      icon: <Map size={20} className="text-amber-500" />,
      colorIconBg: 'bg-amber-50',
      colorStatusText: 'text-amber-600',
      colorStatusBg: 'bg-amber-100',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative flex justify-center">

      <div className="w-full max-w-3xl relative z-10 flex flex-col min-h-screen pb-12">
        {/* Sleek Light Header */}
        <div className="px-6 pt-12 pb-8 flex flex-col items-center text-center relative border-b border-slate-200 bg-white">
          <Link href="/" className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all absolute left-6 top-10 shadow-sm">
            <ArrowLeft size={18} />
          </Link>

          <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-[#E31837] shadow-sm border border-red-100">
            <ShieldCheck size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
            Panel de Control
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
            Administración Central
          </p>
        </div>

        <div className="px-4 sm:px-8 py-8 space-y-6 flex-1 max-w-2xl mx-auto w-full">

          {/* Alertas */}
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-4 rounded-xl text-[13px] font-bold border shadow-sm ${mensaje.tipo === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
                }`}
            >
              {mensaje.tipo === 'ok' ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              )}
              {mensaje.texto}
            </motion.div>
          )}

          {/* Grid de Carga de Datos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => !loading && card.ref.current?.click()}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl p-5 flex flex-col cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl ${card.colorIconBg} flex items-center justify-center mb-4 border border-slate-100 group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>

                <h3 className="font-bold text-slate-800 tracking-tight text-[15px] mb-1.5">{card.titulo}</h3>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-6 flex-1">{card.descripcion}</p>

                <div className="mt-auto border-t border-slate-100 pt-4">
                  {card.statValue > 0 ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${card.colorStatusBg} ${card.colorStatusText} text-xs font-bold`}>
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                      {card.statValue} procesados
                    </div>
                  ) : (
                    <div className="text-xs font-bold flex items-center justify-between text-slate-400 group-hover:text-[#E31837] transition-colors">
                      <span className="flex items-center gap-2">
                        {loading === card.id ? (
                          <><Loader2 size={14} className="animate-spin" /> Procesando file...</>
                        ) : (
                          <><UploadCloud size={16} /> Subir archivo CSV</>
                        )}
                      </span>
                      <ChevronRight size={16} />
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-0" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-[#E31837] text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E31837] animate-pulse" />
                    Motor Analítico
                  </div>
                  <h3 className="font-bold text-slate-800 text-[18px]">Asignación de Mesas</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <Cpu size={24} strokeWidth={1.5} />
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                Ejecuta el algoritmo de distribución para asignar equitativamente las mesas del censo entre los testigos cargados priorizando puestos.
              </p>

              {stats.asignaciones > 0 && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  {stats.asignaciones} mesas estructuradas con éxito
                </div>
              )}

              <button
                onClick={ejecutarAsignacion}
                disabled={!!loading}
                className="w-full h-12 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === 'asignar' ? (
                  <><Loader2 size={18} className="animate-spin" /> Calculando distribución...</>
                ) : (
                  <>Ejecutar Sincronización Red</>
                )}
              </button>
            </div>
          </motion.div>

          {/* Configuración de Administradores */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E31837] flex items-center justify-center border border-red-200">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-[16px]">Permisos de Acceso</h3>
            </div>

            {adminMensaje && (
              <div className={`mb-5 px-4 py-3 rounded-xl border flex items-start gap-2 text-[12px] font-bold ${adminMensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                {adminMensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0" /> : <ShieldAlert size={16} className="shrink-0" />}
                {adminMensaje.texto}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="bg-white rounded-xl flex flex-col border border-slate-200 overflow-hidden shadow-sm">
                <input
                  type="number"
                  inputMode="numeric"
                  value={adminCedula}
                  onChange={(e) => setAdminCedula(e.target.value)}
                  placeholder="Tu Documento Maestro"
                  className="w-full px-5 py-4 bg-transparent text-slate-800 text-sm outline-none placeholder-slate-400 font-bold block"
                  required
                />
                <div className="h-px w-full bg-slate-100" />
                <input
                  type="number"
                  inputMode="numeric"
                  value={newAdminCedula}
                  onChange={(e) => setNewAdminCedula(e.target.value)}
                  placeholder="Documento a autorizar"
                  className="w-full px-5 py-4 bg-red-50/50 text-slate-800 text-sm outline-none placeholder-slate-400 font-bold block"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading === 'add_admin'}
                className="w-full py-4 rounded-xl font-bold text-[14px] transition-all disabled:opacity-50 text-[#E31837] flex items-center justify-center gap-2 border border-red-200 bg-white hover:bg-red-50 shadow-sm"
              >
                {loading === 'add_admin' ? (
                  <><Loader2 size={18} className="animate-spin" /> Concediendo...</>
                ) : (
                  <>Otorgar Acceso de Administrador</>
                )}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
