export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

async function verificarSuper(cedula: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('admins')
    .select('es_super')
    .eq('cedula', cedula.trim())
    .single()
  return data?.es_super === true
}

// GET: listar super admins
export async function GET() {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('admins')
      .select('cedula, created_at')
      .eq('es_super', true)
      .order('created_at', { ascending: false })
    return NextResponse.json({ exito: true, accesos: data || [] })
  } catch {
    return NextResponse.json({ exito: false }, { status: 500 })
  }
}

// POST: agregar super admin
export async function POST(request: NextRequest) {
  try {
    const { super_cedula, cedula_nueva, nombre } = await request.json()

    if (!await verificarSuper(super_cedula)) {
      return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede agregar super admins.' })
    }

    const cedulaClean = String(cedula_nueva).trim()
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('admins')
      .upsert({ cedula: cedulaClean, es_super: true }, { onConflict: 'cedula' })

    if (error) return NextResponse.json({ exito: false, mensaje: error.message })
    return NextResponse.json({ exito: true, mensaje: 'Super admin agregado.' })
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}

// DELETE: revocar super admin
export async function DELETE(request: NextRequest) {
  try {
    const { super_cedula, cedula } = await request.json()

    if (!await verificarSuper(super_cedula)) {
      return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede revocar super admins.' })
    }

    // No permitir que se borre a sí mismo
    if (String(cedula).trim() === String(super_cedula).trim()) {
      return NextResponse.json({ exito: false, mensaje: 'No puede revocar su propio acceso.' })
    }

    const supabase = getServiceClient()
    await supabase.from('admins').delete().eq('cedula', String(cedula).trim()).eq('es_super', true)
    return NextResponse.json({ exito: true, mensaje: 'Super admin revocado.' })
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
