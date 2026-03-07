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

// GET: listar accesos Analysis Center
export async function GET() {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('analysis_acceso')
      .select('*')
      .order('created_at', { ascending: false })
    return NextResponse.json({ exito: true, accesos: data || [] })
  } catch {
    return NextResponse.json({ exito: false }, { status: 500 })
  }
}

// POST: conceder acceso
export async function POST(request: NextRequest) {
  try {
    const { super_cedula, cedula_nueva, nombre } = await request.json()

    if (!await verificarSuper(super_cedula)) {
      return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede dar acceso.' })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('analysis_acceso')
      .upsert({ cedula: String(cedula_nueva).trim(), nombre: (nombre || '').trim() }, { onConflict: 'cedula' })

    if (error) return NextResponse.json({ exito: false, mensaje: error.message })
    return NextResponse.json({ exito: true, mensaje: 'Acceso concedido.' })
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}

// DELETE: revocar acceso
export async function DELETE(request: NextRequest) {
  try {
    const { super_cedula, cedula } = await request.json()

    if (!await verificarSuper(super_cedula)) {
      return NextResponse.json({ exito: false, mensaje: 'Solo el super admin puede revocar acceso.' })
    }

    const supabase = getServiceClient()
    await supabase.from('analysis_acceso').delete().eq('cedula', String(cedula).trim())
    return NextResponse.json({ exito: true, mensaje: 'Acceso revocado.' })
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
