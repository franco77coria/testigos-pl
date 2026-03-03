'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, UploadCloud, Users, Map, Cpu, CheckCircle2, Activity, Key, ShieldAlert } from 'lucide-react'
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
        body: JSON.stringify({ cedula_admin: adminCedula, nueva_cedula: newAdminCedula }),
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
        setStats((prev) => ({ ...prev, [tipo === 'testigos' ? 'testigos' : 'municipios']: data.total }))
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
    <div className="min-h-screen pb-16" style={{ background: '#F0F2F5' }}>
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />

      {/* Header */}
      <div className="bg-white py-8 px-6 sm:px-10" style={{ borderBottom: '1px solid #D1D5DB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#E31837] transition-colors mb-6">
            <ArrowLeft size={14} /> Volver al portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: '0 4px 12px rgba(227,24,55,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Centro de Operaciones</h1>
              <p className="text-xs text-[#718096] mt-0.5">Administración de Plataforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 mt-6 space-y-5">
        {/* Alert */}
        {mensaje && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium ${mensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700' : 'bg-[#FEF2F2] text-red-600'}`}
            style={{ border: `1px solid ${mensaje.tipo === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(227,24,55,0.15)'}` }}
          >
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
            {mensaje.texto}
          </motion.div>
        )}

        {/* Dashboard Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/admin/dashboard')}
          className="rounded-2xl p-6 sm:p-8 cursor-pointer group transition-all hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En vivo
              </div>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-xl font-bold text-white mb-1">Monitor Nacional de Escrutinio</h2>
              <p className="text-white/50 text-sm max-w-lg">Estadísticas en tiempo real, carga de testigos y desglose por candidato.</p>
            </div>
            <div className="shrink-0 w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#1a1a1a] transition-colors">
              <Activity size={22} />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Workflow */}
          <div className="lg:col-span-2 space-y-4">
            <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#4a5568] tracking-tight pl-0.5">Flujo de Trabajo</h3>

            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {/* Testigos */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.08)' }}>
                    <Users size={20} className="text-[#3B82F6]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] text-sm">Censo de Testigos</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Actualiza la base con el CSV de testigos.</p>
                    {stats.testigos > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-[#ECFDF5] text-emerald-600 text-[10px] font-semibold">
                        <CheckCircle2 size={11} /> {stats.testigos} cargados
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => !loading && testigosRef.current?.click()}
                  className="shrink-0 px-5 py-2.5 rounded-lg bg-white text-[#4a5568] font-semibold text-xs hover:text-[#E31837] transition-all flex items-center gap-2"
                  style={{ border: '1px solid #D1D5DB' }}
                >
                  {loading === 'testigos' ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : <><UploadCloud size={14} /> Subir CSV</>}
                </button>
                <input ref={testigosRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('testigos', f); e.target.value = '' }} />
              </div>

              {/* Municipios */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.08)' }}>
                    <Map size={20} className="text-[#F59E0B]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] text-sm">Semáforo Municipal</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Metas y mesas habilitadas por municipio.</p>
                    {stats.municipios > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-[#ECFDF5] text-emerald-600 text-[10px] font-semibold">
                        <CheckCircle2 size={11} /> {stats.municipios} registrados
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => !loading && semaforoRef.current?.click()}
                  className="shrink-0 px-5 py-2.5 rounded-lg bg-white text-[#4a5568] font-semibold text-xs hover:text-[#E31837] transition-all flex items-center gap-2"
                  style={{ border: '1px solid #D1D5DB' }}
                >
                  {loading === 'semaforo' ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : <><UploadCloud size={14} /> Subir CSV</>}
                </button>
                <input ref={semaforoRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('semaforo', f); e.target.value = '' }} />
              </div>

              {/* Motor */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'rgba(227,24,55,0.02)' }}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] text-sm">Motor de Distribución</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Asigna mesas equitativamente.</p>
                    {stats.asignaciones > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-[#ECFDF5] text-emerald-600 text-[10px] font-semibold">
                        <CheckCircle2 size={11} /> {stats.asignaciones} mesas
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={ejecutarAsignacion} disabled={!!loading}
                  className="shrink-0 px-6 py-2.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-40 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: '0 4px 12px rgba(227,24,55,0.2)' }}
                >
                  {loading === 'asignar' ? <><Loader2 size={14} className="animate-spin" /> Procesando...</> : <>Ejecutar Motor</>}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Security */}
          <div className="space-y-4">
            <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#4a5568] tracking-tight pl-0.5">Seguridad</h3>

            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(227,24,55,0.08)' }}>
                <Key size={18} className="text-[#E31837]" />
              </div>
              <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">Conceder Autorización</h4>
              <p className="text-xs text-[#718096] mb-5">Agrega la cédula de un nuevo supervisor.</p>

              {adminMensaje && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${adminMensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700' : 'bg-[#FEF2F2] text-red-600'}`}
                  style={{ border: `1px solid ${adminMensaje.tipo === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(227,24,55,0.15)'}` }}
                >
                  {adminMensaje.tipo === 'ok' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <ShieldAlert size={14} className="shrink-0 mt-0.5" />}
                  {adminMensaje.texto}
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#718096] uppercase tracking-wider mb-1.5">Tu cédula</label>
                  <input type="number" inputMode="numeric" value={adminCedula} onChange={(e) => setAdminCedula(e.target.value)} placeholder="Cédula maestra"
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#D1D5DB] rounded-xl text-sm font-medium text-[#1a1a1a] focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 outline-none transition-all" required style={{ minHeight: '44px' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#718096] uppercase tracking-wider mb-1.5">Nuevo admin</label>
                  <input type="number" inputMode="numeric" value={newAdminCedula} onChange={(e) => setNewAdminCedula(e.target.value)} placeholder="Cédula a autorizar"
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#D1D5DB] rounded-xl text-sm font-medium text-[#1a1a1a] focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/10 outline-none transition-all" required style={{ minHeight: '44px' }} />
                </div>
                <button type="submit" disabled={loading === 'add_admin'}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 text-white flex items-center justify-center gap-2 mt-1 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #E31837, #C41530)', boxShadow: '0 4px 12px rgba(227,24,55,0.25)', minHeight: '44px' }}
                >
                  {loading === 'add_admin' ? <><Loader2 size={14} className="animate-spin" /> Registrando...</> : <>Autorizar Cédula</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
