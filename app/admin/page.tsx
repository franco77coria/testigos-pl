'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, UploadCloud, Users, Map, CheckCircle2, ShieldAlert, Key, Activity, UserCog } from 'lucide-react'
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

  // Senado config
  const [senadoNames, setSenadoNames] = useState<string[]>(['', '', '', '', ''])
  const [senadoMensaje, setSenadoMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Reset elections
  const [resetCedula, setResetCedula] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetMensaje, setResetMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  const testigosRef = useRef<HTMLInputElement>(null)
  const semaforoRef = useRef<HTMLInputElement>(null)

  // Load senado candidates on mount
  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        if (data.exito && data.candidatos) {
          setSenadoNames(data.candidatos.map((c: { title: string }) => c.title))
        }
      })
      .catch(() => { })
  }, [])

  async function handleSaveSenadoConfig(e: React.FormEvent) {
    e.preventDefault()
    setLoading('senado_config')
    setSenadoMensaje(null)
    try {
      const candidatos = senadoNames.map((name, i) => ({
        code: `votos_senado_${i + 1}`,
        title: name.trim() || `Senado Candidato ${i + 1}`,
      }))
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatos }),
      })
      const data = await res.json()
      if (data.exito) {
        setSenadoMensaje({ tipo: 'ok', texto: data.mensaje })
      } else {
        setSenadoMensaje({ tipo: 'err', texto: data.mensaje })
      }
    } catch {
      setSenadoMensaje({ tipo: 'err', texto: 'Error de conexión.' })
    }
    setLoading('')
  }

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

  return (
    <div className="min-h-screen pb-16 font-sans bg-[#F8FAFC]">
      <div className="max-w-md mx-auto px-5 pt-8 space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#CE1126] hover:opacity-80 transition-opacity mb-5">
            <ArrowLeft size={16} /> Volver al portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FEE2E2] shrink-0">
              <ShieldAlert size={22} className="text-[#CE1126]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">Centro de Operaciones</h1>
              <p className="text-[13px] text-[#64748B] font-medium mt-0.5">Administración de Plataforma</p>
            </div>
          </div>
        </div>

        {/* Alert (Global CSV uploads, etc.) */}
        {mensaje && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium ${mensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700' : 'bg-[#FEF2F2] text-red-600'}`}
            style={{ border: `1px solid ${mensaje.tipo === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(227,24,55,0.15)'}` }}
          >
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
            {mensaje.texto}
          </motion.div>
        )}

        {/* Monitor Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-7 relative overflow-hidden"
          style={{ background: '#111827', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(16,185,129,0.15)] w-fit mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#10B981] text-[10px] font-bold uppercase tracking-wider">En vivo</span>
            </div>
            <h2 className="text-[20px] font-bold text-white mb-2 leading-tight">Monitor Nacional de Escrutinio</h2>
            <p className="text-[#94A3B8] text-[13px] leading-relaxed mb-6 font-medium">Estadísticas en tiempo real, carga de testigos y desglose por candidato.</p>

            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-11 h-11 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors flex items-center justify-center mt-auto self-start"
            >
              <Activity size={18} className="text-white" />
            </button>
          </div>
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1E293B] to-transparent rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
        </motion.div>

        {/* Flujo de Trabajo */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] pl-1">Flujo de Trabajo</h3>

          <div className="bg-white rounded-[24px] overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            {/* Testigos */}
            <div className="p-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#EFF6FF]">
                  <Users size={18} className="text-[#3B82F6]" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-[#0F172A] text-[15px] leading-snug">Censo de Testigos</h4>
                  <p className="text-[13px] text-[#64748B] mt-1 font-medium leading-relaxed">Actualiza la base con el CSV de testigos.</p>
                  {stats.testigos > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md bg-[#ECFDF5] text-emerald-600 text-[11px] font-semibold">
                      <CheckCircle2 size={12} /> {stats.testigos} cargados
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => !loading && testigosRef.current?.click()}
                  className="px-4 py-2 rounded-full text-[#475569] font-semibold text-[13px] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                >
                  {loading === 'testigos' ? <><Loader2 size={16} className="animate-spin text-[#64748B]" /> Subiendo...</> : <><UploadCloud size={16} className="text-[#64748B]" /> Subir CSV</>}
                </button>
                <input ref={testigosRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('testigos', f); e.target.value = '' }} />
              </div>
            </div>

            {/* Municipios */}
            <div className="p-5">
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FFFBEB]">
                  <Map size={18} className="text-[#F59E0B]" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-[#0F172A] text-[15px] leading-snug">Semáforo Municipal</h4>
                  <p className="text-[13px] text-[#64748B] mt-1 font-medium leading-relaxed">Metas y mesas habilitadas por municipio.</p>
                  {stats.municipios > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md bg-[#ECFDF5] text-emerald-600 text-[11px] font-semibold">
                      <CheckCircle2 size={12} /> {stats.municipios} registrados
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => !loading && semaforoRef.current?.click()}
                  className="px-4 py-2 rounded-full text-[#475569] font-semibold text-[13px] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                >
                  {loading === 'semaforo' ? <><Loader2 size={16} className="animate-spin text-[#64748B]" /> Subiendo...</> : <><UploadCloud size={16} className="text-[#64748B]" /> Subir CSV</>}
                </button>
                <input ref={semaforoRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSV('semaforo', f); e.target.value = '' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] pl-1">Seguridad</h3>

          <div className="bg-white rounded-[24px] p-6" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 bg-[#FEE2E2]">
              <Key size={18} className="text-[#CE1126]" />
            </div>
            <h4 className="font-bold text-[#0F172A] text-[16px] mb-1.5">Conceder Autorización</h4>
            <p className="text-[13px] text-[#64748B] font-medium leading-relaxed mb-6">Agrega la cédula de un nuevo supervisor.</p>

            {adminMensaje && (
              <div className={`mb-5 p-3.5 rounded-xl text-[13px] font-medium flex items-start gap-2.5 ${adminMensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700' : 'bg-[#FEF2F2] text-red-600'}`}
                style={{ border: `1px solid ${adminMensaje.tipo === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(227,24,55,0.15)'}` }}
              >
                {adminMensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                {adminMensaje.texto}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Tu cédula</label>
                <input type="number" inputMode="numeric" value={adminCedula} onChange={(e) => setAdminCedula(e.target.value)} placeholder="Cédula maestra"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0F172A] focus:bg-white focus:border-[#CE1126] focus:ring-4 focus:ring-[#CE1126]/10 outline-none transition-all placeholder:text-[#94A3B8]" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Nuevo admin</label>
                <input type="number" inputMode="numeric" value={newAdminCedula} onChange={(e) => setNewAdminCedula(e.target.value)} placeholder="Cédula a autorizar"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0F172A] focus:bg-white focus:border-[#CE1126] focus:ring-4 focus:ring-[#CE1126]/10 outline-none transition-all placeholder:text-[#94A3B8]" required />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading === 'add_admin'}
                  className="w-full py-3.5 rounded-[14px] font-bold text-[14px] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 active:scale-[0.98]"
                  style={{ background: '#CE1126', boxShadow: '0 4px 14px rgba(206,17,38,0.2)' }}
                >
                  {loading === 'add_admin' ? <><Loader2 size={16} className="animate-spin" /> Registrando...</> : <>Autorizar Cédula</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-[0.08em] pl-1">Zona de Peligro</h3>

          <div className="bg-white rounded-[24px] p-6 border-2 border-red-100" style={{ boxShadow: '0 4px 20px rgba(239, 68, 68, 0.05)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 bg-red-50">
              <ShieldAlert size={18} className="text-red-500" />
            </div>
            <h4 className="font-bold text-[#0F172A] text-[16px] mb-1.5">Borrar datos de elecciones cargados</h4>
            <p className="text-[13px] text-[#64748B] font-medium leading-relaxed mb-6">Esta acción borrará <strong className="text-red-600">todos los resultados cargados</strong> (votos, fotos y asignaciones). Los testigos y el semáforo NO se borrarán.</p>

            {resetMensaje && (
              <div className={`mb-5 p-3.5 rounded-xl text-[13px] font-medium flex items-start gap-2.5 ${resetMensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700 border border-emerald-200' : 'bg-[#FEF2F2] text-red-600 border border-red-200'}`}>
                {resetMensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                {resetMensaje.texto}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Cédula super admin"
                value={resetCedula}
                onChange={(e) => setResetCedula(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0F172A] focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Escriba BORRAR para confirmar"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0F172A] focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-[#94A3B8]"
              />
              <div className="pt-2">
                <button
                  onClick={async () => {
                    if (resetConfirm !== 'BORRAR') {
                      setResetMensaje({ tipo: 'err', texto: 'Debe escribir BORRAR para confirmar.' })
                      return
                    }
                    setLoading('reset')
                    setResetMensaje(null)
                    try {
                      const res = await fetch('/api/admin/reset-elecciones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cedula: resetCedula }),
                      })
                      const data = await res.json()
                      setResetMensaje({ tipo: data.exito ? 'ok' : 'err', texto: data.mensaje })
                      if (data.exito) {
                        setResetCedula('')
                        setResetConfirm('')
                      }
                    } catch {
                      setResetMensaje({ tipo: 'err', texto: 'Error de conexión.' })
                    }
                    setLoading('')
                  }}
                  disabled={loading === 'reset' || !resetCedula.trim() || resetConfirm !== 'BORRAR'}
                  className="w-full py-3.5 rounded-[14px] font-bold text-[14px] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 active:scale-[0.98] bg-red-600 hover:bg-red-700"
                >
                  {loading === 'reset' ? <><Loader2 size={16} className="animate-spin" /> Borrando...</> : <>Borrar Resultados</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Senado (Moved to bottom) */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] pl-1">Configuración</h3>

          <div className="bg-white rounded-[24px] p-6" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 bg-[#EFF6FF]">
              <UserCog size={18} className="text-[#3B82F6]" />
            </div>
            <h4 className="font-bold text-[#0F172A] text-[16px] mb-1.5">Candidatos al Senado</h4>
            <p className="text-[13px] text-[#64748B] font-medium leading-relaxed mb-6">Configura los nombres de los 5 candidatos al Senado apoyados.</p>

            {senadoMensaje && (
              <div className={`mb-5 p-3.5 rounded-xl text-[13px] font-medium flex items-start gap-2.5 ${senadoMensaje.tipo === 'ok' ? 'bg-[#ECFDF5] text-emerald-700 border border-emerald-200' : 'bg-[#FEF2F2] text-red-600 border border-red-200'}`}>
                {senadoMensaje.tipo === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                {senadoMensaje.texto}
              </div>
            )}

            <form onSubmit={handleSaveSenadoConfig} className="space-y-4">
              {senadoNames.map((name, i) => (
                <div key={i}>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Candidato {i + 1}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...senadoNames]
                      newNames[i] = e.target.value
                      setSenadoNames(newNames)
                    }}
                    placeholder={`Nombre candidato ${i + 1}`}
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0F172A] focus:bg-white focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 outline-none transition-all placeholder:text-[#94A3B8]"
                  />
                </div>
              ))}
              <div className="pt-2">
                <button type="submit" disabled={loading === 'senado_config'}
                  className="w-full py-3.5 rounded-[14px] font-bold text-[14px] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 active:scale-[0.98] bg-[#3B82F6] hover:bg-[#2563EB]"
                >
                  {loading === 'senado_config' ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <>Guardar Candidatos</>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
