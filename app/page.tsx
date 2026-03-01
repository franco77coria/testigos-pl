'use client'

import { useState } from 'react'
import type { SesionTestigo, MesaDashboard } from '@/lib/types'
import LoginScreen from '@/components/login-screen'
import InfoScreen from '@/components/info-screen'
import Dashboard from '@/components/dashboard'
import ToastContainer from '@/components/toast'

type Pantalla = 'login' | 'info' | 'dashboard'

export default function Home() {
  const [pantalla, setPantalla] = useState<Pantalla>('login')
  const [sesion, setSesion] = useState<SesionTestigo | null>(null)

  function handleLogin(s: SesionTestigo) {
    setSesion(s)
    setPantalla('info')
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

      {pantalla === 'info' && sesion && (
        <InfoScreen sesion={sesion} onContinue={() => setPantalla('dashboard')} />
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
