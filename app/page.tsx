'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SesionTestigo, MesaDashboard } from '@/lib/types'
import LoginScreen from '@/components/login-screen'
import Dashboard from '@/components/dashboard'
import ToastContainer from '@/components/toast'

type Pantalla = 'login' | 'dashboard'

export default function Home() {
  const router = useRouter()
  const [pantalla, setPantalla] = useState<Pantalla>('login')
  const [sesion, setSesion] = useState<SesionTestigo | null>(null)

  async function handleLogin(cedula: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula }),
    })
    const data = await res.json()

    if (data.exito) {
      if (data.esCoordinador) {
        router.push('/admin')
        return { exito: true, esCoordinador: true }
      } else {
        setSesion(data.sesion)
        setPantalla('dashboard')
        return { exito: true }
      }
    } else {
      return {
        exito: false,
        mensaje: data.mensaje || 'Cédula no encontrada en el sistema.',
        esCoordinador: false,
      }
    }
  }

  function handleLogout() {
    setSesion(null)
    setPantalla('login')
  }

  function handleMesasUpdate(mesas: MesaDashboard[]) {
    if (sesion) {
      setSesion({ ...sesion, mesas })
    }
  }

  return (
    <>
      <ToastContainer />

      {pantalla === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {pantalla === 'dashboard' && sesion && (
        <Dashboard
          sesion={sesion}
          onLogout={handleLogout}
          onMesasUpdate={handleMesasUpdate}
        />
      )}
    </>
  )
}
