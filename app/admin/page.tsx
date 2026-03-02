'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, UploadCloud, Users, Map, Cpu, ShieldAlert, CheckCircle2, ShieldCheck, Activity, Key } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  testigos: number
  municipios: number
  asignaciones: number
}

export default function AdminPanel() {
  const router = useRouter()
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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sleek full-width header */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors mb-8">
            <ArrowLeft size={16} /> Volver al portal
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 text-[#E31837] rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Centro de Operaciones</h1>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Administración de Plataforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 mt-8 space-y-8">
        {/* Alertas */}
        {mensaje && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 p-4 rounded-xl text-sm font-bold border shadow-sm ${mensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <ShieldAlert size={20} className="shrink-0 mt-0.5" />}
            {mensaje.texto}
          </motion.div>
        )}

        {/* Hero Dashboard Link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/admin/dashboard')}
          className="relative bg-slate-900 rounded-3xl p-8 sm:p-10 overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all border border-slate-800"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E31837] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Transmisión Activa
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Monitor Nacional de Escrutinio</h2>
              <p className="text-slate-400 font-medium max-w-xl">Visualiza en tiempo real el comportamiento electoral, carga de testigos, estadísticas municipales y desglose de votación por candidato.</p>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 shadow-sm transition-colors">
              <Activity size={32} />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Flow of actions */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 pl-1">
              Flujo de Trabajo Operativo
            </h3>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">

              {/* Row 1: Testigos */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-sm">
                    <Users size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Censo de Testigos</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 mb-3">Actualiza la base de datos maestra con el CSV de testigos asignados.</p>
                    {stats.testigos > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"><CheckCircle2 size={14} /> {stats.testigos} cargados</span>}
                  </div>
                </div>
                <button onClick={() => !loading && testigosRef.current?.click()} className="shrink-0 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 transition-all">
                  {loading === 'testigos' ? <><Loader2 size={18} className="animate-spin" /> Subiendo...</> : <><UploadCloud size={18} /> Subir CSV</>}
                </button>
                <input ref={testigosRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('testigos', f); e.target.value = '' }} />
              </div>

              {/* Row 2: Municipios */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0 shadow-sm">
                    <Map size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Semáforo Municipal</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 mb-3">Establece las metas operativas y mesas habilitadas por cada municipio.</p>
                    {stats.municipios > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"><CheckCircle2 size={14} /> {stats.municipios} registrados</span>}
                  </div>
                </div>
                <button onClick={() => !loading && semaforoRef.current?.click()} className="shrink-0 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 transition-all">
                  {loading === 'semaforo' ? <><Loader2 size={18} className="animate-spin" /> Subiendo...</> : <><UploadCloud size={18} /> Subir CSV</>}
                </button>
                <input ref={semaforoRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('semaforo', f); e.target.value = '' }} />
              </div>

              {/* Row 3: Algoritmo */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors bg-slate-50/50">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Cpu size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Motor de Distribución</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 mb-3">Cruza testigos y semáforo para asignar mesas equitativamente.</p>
                    {stats.asignaciones > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"><CheckCircle2 size={14} /> {stats.asignaciones} mesas calculadas</span>}
                  </div>
                </div>
                <button onClick={ejecutarAsignacion} disabled={!!loading} className="shrink-0 px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {loading === 'asignar' ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : <>Ejecutar Motor</>}
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Seguridad */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 pl-1">
              Seguridad y Acceso
            </h3>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center border border-red-100 mb-6 shadow-sm">
                <Key size={24} />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Conceder Autorización</h4>
              <p className="text-sm text-slate-500 font-medium mb-6">Agrega la cédula de un nuevo supervisor para permitirle acceso a este panel central.</p>

              {adminMensaje && (
                <div className={`mb-6 p-4 rounded-xl text-xs font-bold border flex items-start gap-2 ${adminMensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {adminMensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                  {adminMensaje.texto}
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Credencial Activa</label>
                    <input type="number" inputMode="numeric" value={adminCedula} onChange={(e) => setAdminCedula(e.target.value)} placeholder="Tu cédula maestra" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-[#E31837] focus:shadow-[0_0_0_3px_rgba(227,24,55,0.1)] outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nuevo Administrador</label>
                    <input type="number" inputMode="numeric" value={newAdminCedula} onChange={(e) => setNewAdminCedula(e.target.value)} placeholder="Cédula a autorizar" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-[#E31837] focus:shadow-[0_0_0_3px_rgba(227,24,55,0.1)] outline-none transition-all" required />
                  </div>
                </div>

                <button type="submit" disabled={loading === 'add_admin'} className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 text-white bg-[#E31837] hover:bg-red-700 shadow-md flex items-center justify-center gap-2 mt-4">
                  {loading === 'add_admin' ? <><Loader2 size={18} className="animate-spin" /> Registrando...</> : <>Autorizar Cédula</>}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
