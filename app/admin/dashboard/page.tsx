'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Activity, Users, Map, CheckCircle2, TrendingUp, UserCheck, ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
    global: {
        testigos: number
        mesasAsignadas: number
        municipiosActivos: number
    }
    progreso: {
        pendientes: number
        enProgreso: number
        completadas: number
        porcentajeTotal: number
    }
    conteo: {
        habilitados: number
        reporte10am: number
        reporte1pm: number
        alexP: number
        senadoPl: number
        oscarSanchez: number
        camaraCun: number
    }
    municipios: {
        nombre: string
        asignadas: number
        completadas: number
        progreso: number
    }[]
}

function StatCard({ title, value, subtitle, icon, delay }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest">{title}</h3>
                <div className="text-slate-400">{icon}</div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800 leading-none">{value}</span>
                <span className="text-xs font-semibold text-slate-500 mb-1">{subtitle}</span>
            </div>
        </motion.div>
    )
}

function CandidateCard({ name, votes, iconColor, bg }: { name: string; votes: number; iconColor: string; bg: string }) {
    return (
        <div className={`p-4 rounded-xl border border-slate-100 flex items-center justify-between transition-colors hover:shadow-sm ${bg}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm font-bold ${iconColor}`}>
                    <UserCheck size={18} />
                </div>
                <span className="font-bold text-slate-700 text-sm tracking-tight">{name}</span>
            </div>
            <div className="text-right">
                <span className="block text-lg font-black text-slate-900">{votes.toLocaleString()}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wider">Votos</span>
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
            if (json.exito) {
                setData(json.data)
            } else {
                setError(json.mensaje || 'Error al cargar los datos.')
            }
        } catch {
            setError('Problema de conexión con la base de datos.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 60000) // update every minute
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#E31837]" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Error Crítico</h1>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <Link href="/admin" className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm">Volver al Panel</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                Estadísticas en Vivo <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            </h1>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Testigos PL 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Actualizar Red</span>
                    </button>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard title="Progreso Total" value={`${data.progreso.porcentajeTotal}%`} subtitle="Mesas completadas" icon={<Activity size={20} />} delay={0.0} />
                    <StatCard title="Mesas Asignadas" value={data.global.mesasAsignadas.toLocaleString()} subtitle="Testigos activos" icon={<Users size={20} />} delay={0.1} />
                    <StatCard title="Municipios Ope." value={data.global.municipiosActivos.toLocaleString()} subtitle="En sistema" icon={<Map size={20} />} delay={0.2} />
                    <StatCard title="Votantes Hábiles" value={data.conteo.habilitados.toLocaleString()} subtitle="Potenciales" icon={<TrendingUp size={20} />} delay={0.3} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Report Count Timeline */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Activity size={20} className="text-[#E31837]" />
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Censos Horarios (Aprox.)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Corte 10:00 AM</span>
                                    <span className="text-2xl font-black text-slate-800">{data.conteo.reporte10am.toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Corte 01:00 PM</span>
                                    <span className="text-2xl font-black text-slate-800">{data.conteo.reporte1pm.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Candidate Votes Breakdown */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-[#E31837]" />
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Reporte Final E-14 (Escrutinio)</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CandidateCard name="Alex P. (Cámara)" votes={data.conteo.alexP} iconColor="text-red-500" bg="bg-red-50/30" />
                                <CandidateCard name="Senado PL" votes={data.conteo.senadoPl} iconColor="text-blue-500" bg="bg-blue-50/30" />
                                <CandidateCard name="Oscar Sánchez (Senado)" votes={data.conteo.oscarSanchez} iconColor="text-emerald-500" bg="bg-emerald-50/30" />
                                <CandidateCard name="Cámara CUN" votes={data.conteo.camaraCun} iconColor="text-amber-500" bg="bg-amber-50/30" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Municipality Breakdown */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Map size={20} className="text-[#E31837]" />
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Municipios</h2>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Avance departamental.</p>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                            {data.municipios.map((mun, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="font-bold text-slate-700 text-sm truncate">{mun.nombre}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{mun.progreso}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#E31837] rounded-full transition-all" style={{ width: `${mun.progreso}%` }} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-slate-700">{mun.completadas}</span>
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">de {mun.asignadas}</span>
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
