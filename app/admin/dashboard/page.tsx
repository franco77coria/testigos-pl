'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Activity, Users, Map, CheckCircle2, TrendingUp, UserCheck, RefreshCw, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
    global: { testigos: number; mesasAsignadas: number; municipiosActivos: number }
    progreso: { pendientes: number; enProgreso: number; completadas: number; porcentajeTotal: number }
    conteo: { habilitados: number; reporte10am: number; reporte1pm: number; alexP: number; senadoPl: number; oscarSanchez: number; camaraCun: number }
    municipios: { nombre: string; asignadas: number; completadas: number; progreso: number }[]
}

function StatCard({ title, value, subtitle, icon, delay }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-xl p-4 relative overflow-hidden"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#718096] font-semibold text-[10px] uppercase tracking-wider">{title}</h3>
                <div className="text-[#CBD5E1]">{icon}</div>
            </div>
            <div className="flex items-end gap-1.5">
                <span style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-2xl font-bold text-[#1a1a1a] leading-none">{value}</span>
                <span className="text-[10px] font-semibold text-[#718096] mb-0.5">{subtitle}</span>
            </div>
        </motion.div>
    )
}

function CandidateCard({ name, votes, color }: { name: string; votes: number; color: string }) {
    return (
        <div className="p-3.5 rounded-xl flex items-center justify-between hover:bg-[#F0F2F5] transition-colors" style={{ background: '#FAFBFC', border: '1px solid #D1D5DB' }}>
            <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="font-medium text-[#4a5568] text-sm">{name}</span>
            </div>
            <div className="text-right">
                <span className="text-base font-bold text-[#1a1a1a]">{votes.toLocaleString()}</span>
                <span className="text-[9px] uppercase font-semibold text-[#CBD5E1] ml-1.5">votos</span>
            </div>
        </div>
    )
}

export default function AdminStats() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    async function fetchStats() {
        setRefreshing(true)
        try {
            const res = await fetch('/api/admin/dashboard')
            const json = await res.json()
            if (json.exito) setData(json.data)
            else setError(json.mensaje || 'Error al cargar los datos.')
        } catch {
            setError('Problema de conexión con la base de datos.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#E31837]" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6">
                <div className="text-center">
                    <ShieldAlert size={36} className="mx-auto text-[#CBD5E1] mb-3" />
                    <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-lg font-bold text-[#1a1a1a] mb-1">Error</h1>
                    <p className="text-[#718096] text-sm mb-5">{error}</p>
                    <Link href="/admin" className="px-4 py-2 rounded-xl text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #E31837, #C41530)' }}>Volver</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-12">
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />

            {/* Header */}
            <div className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid #D1D5DB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-1.5 rounded-lg bg-[#F8F9FA] text-[#94A3B8] hover:bg-[#D1D5DB] hover:text-[#E31837] transition-colors" style={{ border: '1px solid #D1D5DB' }}>
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-base font-bold text-[#1a1a1a] tracking-tight flex items-center gap-2">
                                Estadísticas en Vivo <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </h1>
                            <p className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider">Testigos PL 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-[#718096] hover:text-[#E31837] disabled:opacity-40 transition-all"
                        style={{ border: '1px solid #D1D5DB' }}
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard title="Progreso" value={`${data.progreso.porcentajeTotal}%`} subtitle="completado" icon={<Activity size={16} />} delay={0.0} />
                    <StatCard title="Mesas" value={data.global.mesasAsignadas.toLocaleString()} subtitle="asignadas" icon={<Users size={16} />} delay={0.05} />
                    <StatCard title="Municipios" value={data.global.municipiosActivos.toLocaleString()} subtitle="activos" icon={<Map size={16} />} delay={0.1} />
                    <StatCard title="Habilitados" value={data.conteo.habilitados.toLocaleString()} subtitle="votantes" icon={<TrendingUp size={16} />} delay={0.15} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">

                        {/* Time Reports */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl p-5" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-[#E31837]" />
                                <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#1a1a1a]">Censos Horarios</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl text-center" style={{ background: '#F8F9FA', border: '1px solid #F1F5F9' }}>
                                    <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider block mb-1">10:00 AM</span>
                                    <span style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-xl font-bold text-[#1a1a1a]">{data.conteo.reporte10am.toLocaleString()}</span>
                                </div>
                                <div className="p-4 rounded-xl text-center" style={{ background: '#F8F9FA', border: '1px solid #F1F5F9' }}>
                                    <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider block mb-1">01:00 PM</span>
                                    <span style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-xl font-bold text-[#1a1a1a]">{data.conteo.reporte1pm.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Candidates */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-white rounded-xl p-5" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} className="text-[#E31837]" />
                                <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#1a1a1a]">Reporte E-14 (Escrutinio)</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <CandidateCard name="Alex P. (Cámara)" votes={data.conteo.alexP} color="bg-[#E31837]" />
                                <CandidateCard name="Senado PL" votes={data.conteo.senadoPl} color="bg-[#1E3A8A]" />
                                <CandidateCard name="Oscar Sánchez" votes={data.conteo.oscarSanchez} color="bg-emerald-500" />
                                <CandidateCard name="Cámara CUN" votes={data.conteo.camaraCun} color="bg-amber-500" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Municipalities */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl flex flex-col h-[520px]" style={{ border: '1px solid #D1D5DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div className="p-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <div className="flex items-center gap-2">
                                <Map size={16} className="text-[#E31837]" />
                                <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-sm font-bold text-[#1a1a1a]">Municipios</h2>
                            </div>
                            <p className="text-[10px] text-[#718096] font-semibold mt-0.5">Avance departamental</p>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                            {data.municipios.map((mun, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8F9FA] transition-colors">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="font-medium text-[#4a5568] text-xs truncate">{mun.nombre}</span>
                                            <span className="text-[9px] font-semibold text-[#94A3B8] ml-2">{mun.progreso}%</span>
                                        </div>
                                        <div className="h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${mun.progreso}%`, background: 'linear-gradient(90deg, #E31837, #EF4444)' }} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-[#1a1a1a]">{mun.completadas}</span>
                                        <span className="text-[9px] text-[#CBD5E1] ml-0.5">/{mun.asignadas}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
