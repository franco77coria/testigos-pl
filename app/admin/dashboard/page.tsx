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
            className="bg-white border border-gray-100 rounded-xl p-4"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{title}</h3>
                <div className="text-gray-300">{icon}</div>
            </div>
            <div className="flex items-end gap-1.5">
                <span className="text-2xl font-bold text-gray-800 leading-none">{value}</span>
                <span className="text-[10px] font-medium text-gray-400 mb-0.5">{subtitle}</span>
            </div>
        </motion.div>
    )
}

function CandidateCard({ name, votes, color }: { name: string; votes: number; color: string }) {
    return (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-gray-100/50 transition-colors">
            <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="font-medium text-gray-600 text-sm">{name}</span>
            </div>
            <div className="text-right">
                <span className="text-base font-bold text-gray-800">{votes.toLocaleString()}</span>
                <span className="text-[9px] uppercase font-medium text-gray-300 ml-1.5">votos</span>
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
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-red-500" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
                <div className="text-center">
                    <ShieldAlert size={36} className="mx-auto text-gray-300 mb-3" />
                    <h1 className="text-lg font-semibold text-gray-700 mb-1">Error</h1>
                    <p className="text-gray-400 text-sm mb-5">{error}</p>
                    <Link href="/admin" className="px-4 py-2 rounded-lg bg-gray-800 text-white font-medium text-sm">Volver</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 hover:bg-gray-100 transition-colors">
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-base font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                                Estadísticas en Vivo <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </h1>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Testigos PL 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
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
                            className="bg-white rounded-xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-red-500" />
                                <h2 className="text-sm font-semibold text-gray-700">Censos Horarios</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">10:00 AM</span>
                                    <span className="text-xl font-bold text-gray-800">{data.conteo.reporte10am.toLocaleString()}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">01:00 PM</span>
                                    <span className="text-xl font-bold text-gray-800">{data.conteo.reporte1pm.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Candidates */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-white rounded-xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} className="text-red-500" />
                                <h2 className="text-sm font-semibold text-gray-700">Reporte E-14 (Escrutinio)</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <CandidateCard name="Alex P. (Cámara)" votes={data.conteo.alexP} color="bg-red-400" />
                                <CandidateCard name="Senado PL" votes={data.conteo.senadoPl} color="bg-blue-400" />
                                <CandidateCard name="Oscar Sánchez" votes={data.conteo.oscarSanchez} color="bg-emerald-400" />
                                <CandidateCard name="Cámara CUN" votes={data.conteo.camaraCun} color="bg-amber-400" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Municipalities */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-gray-100 flex flex-col h-[520px]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <div className="p-5 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Map size={16} className="text-red-500" />
                                <h2 className="text-sm font-semibold text-gray-700">Municipios</h2>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">Avance departamental</p>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                            {data.municipios.map((mun, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="font-medium text-gray-600 text-xs truncate">{mun.nombre}</span>
                                            <span className="text-[9px] font-medium text-gray-400 ml-2">{mun.progreso}%</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${mun.progreso}%` }} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-600">{mun.completadas}</span>
                                        <span className="text-[9px] text-gray-300 ml-0.5">/{mun.asignadas}</span>
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
