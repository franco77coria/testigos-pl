'use client'

import { useState, useRef } from 'react'
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
  const testigosRef = useRef<HTMLInputElement>(null)
  const semaforoRef = useRef<HTMLInputElement>(null)

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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="bg-pl-red h-1.5 w-full" />
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-text-secondary text-xs flex items-center gap-1 mb-2 hover:text-pl-red transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
            Volver al formulario
          </Link>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Panel de Administracion
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">Gestion de testigos electorales — Cundinamarca 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Message */}
        {mensaje && (
          <div className={`flex items-start gap-2.5 p-3.5 rounded-lg text-sm border ${
            mensaje.tipo === 'ok'
              ? 'bg-success-light border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {mensaje.tipo === 'ok' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
              </svg>
            )}
            {mensaje.texto}
          </div>
        )}

        {/* CSV Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-lg p-5 border border-border">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.iconPath} />
                  {card.id === 'semaforo' && <circle cx="12" cy="10" r="3" />}
                </svg>
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-1">{card.titulo}</h3>
              <p className="text-xs text-text-secondary mb-4">{card.descripcion}</p>

              {card.statValue > 0 && (
                <div className="bg-success-light text-success text-xs font-medium px-3 py-1.5 rounded inline-flex items-center gap-1.5 mb-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                className="w-full py-2.5 bg-pl-red text-white rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-pl-red-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === card.id ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    Subir CSV
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Assignment */}
        <div className="bg-white rounded-lg p-5 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-pl-red/[0.07] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary text-sm mb-1">Asignacion Automatica de Mesas</h3>
              <p className="text-xs text-text-secondary mb-1">
                Distribuye las mesas de cada municipio entre los testigos disponibles.
              </p>
              <p className="text-xs text-text-secondary mb-4">
                <strong>Optimo:</strong> ~4 mesas por testigo. Si hay mas mesas que testigos, se distribuyen equitativamente con round-robin.
              </p>

              {stats.asignaciones > 0 && (
                <div className="bg-success-light text-success text-xs font-medium px-3 py-1.5 rounded inline-flex items-center gap-1.5 mb-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                  </svg>
                  {stats.asignaciones} asignaciones creadas
                </div>
              )}

              <button
                onClick={ejecutarAsignacion}
                disabled={!!loading}
                className="py-2.5 px-5 bg-pl-red text-white rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-pl-red-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === 'asignar' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
                    </svg>
                    Ejecutar Asignacion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-warning-light border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
          <strong>Flujo recomendado:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Suba el <strong>Listado de Testigos</strong> (CSV con cedulas, nombres, municipios, puestos)</li>
            <li>Suba el <strong>Semaforo</strong> (CSV con total de mesas por municipio)</li>
            <li>Ejecute la <strong>Asignacion Automatica</strong> para distribuir mesas</li>
            <li>Los testigos ya pueden ingresar con su cedula al formulario</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
