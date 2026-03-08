'use client'

import { useState, useEffect } from 'react'
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

  // Auto-login cuando un líder quiere entrar como testigo
  useEffect(() => {
    const forzar = sessionStorage.getItem('forzar_testigo')
    const cedula = sessionStorage.getItem('forzar_testigo_cedula')
    if (forzar === 'true' && cedula) {
      handleLogin(cedula)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(cedula: string) {
    // Si viene del lider page queriendo entrar como testigo
    const forzarTestigo = sessionStorage.getItem('forzar_testigo') === 'true'
    if (forzarTestigo) {
      sessionStorage.removeItem('forzar_testigo')
      sessionStorage.removeItem('forzar_testigo_cedula')
    }

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, forzarTestigo }),
    })
    const data = await res.json()

    if (data.exito) {
      if (data.esCoordinador) {
        router.push('/admin')
        return { exito: true, esCoordinador: true }
      } else if (data.esAnalista) {
        sessionStorage.setItem('analista_cedula', data.sesion.cedula)
        sessionStorage.setItem('analista_nombre', data.sesion.nombre)
        router.push('/analysis-center')
        return { exito: true, esCoordinador: true }
      } else if (data.esLider) {
        // Líder entra por la página principal → cargarlo como testigo
        if (data.tambienEsTestigo) {
          // Re-llamar auth forzando modo testigo
          const res2 = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, forzarTestigo: true }),
          })
          const data2 = await res2.json()
          if (data2.exito && data2.sesion) {
            setSesion(data2.sesion)
            setPantalla('dashboard')
            return { exito: true }
          }
        }
        // Si no es testigo, mostrar error
        return {
          exito: false,
          mensaje: 'Esta cédula es de líder. Use /lider para acceder al panel de líder.',
          esCoordinador: false,
        }
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
