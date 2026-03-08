export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

function cleanCedula(value: string): string {
  return value.replace(/\./g, '').replace(/\s/g, '').trim()
}

function splitNombreApellido(nombreCompleto: string) {
  const words = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 4) {
    return {
      nombre1: words[0],
      nombre2: words[1],
      apellido1: words[2],
      apellido2: words.slice(3).join(' '),
    }
  } else if (words.length === 3) {
    return { nombre1: words[0], nombre2: null, apellido1: words[1], apellido2: words[2] }
  } else if (words.length === 2) {
    return { nombre1: words[0], nombre2: null, apellido1: words[1], apellido2: null }
  } else {
    return { nombre1: words[0] || '', nombre2: null, apellido1: '', apellido2: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cedula_lider,
      cedula,
      nombre_completo,
      celular,
      correo,
      municipio,
      puesto,
      mesa_numero,
    } = body

    // Validaciones
    if (!cedula_lider || !cedula || !nombre_completo || !municipio || !puesto || !mesa_numero) {
      return NextResponse.json({ exito: false, mensaje: 'Todos los campos obligatorios deben estar completos.' })
    }

    const cedulaClean = cleanCedula(cedula)
    const mesaNum = parseInt(mesa_numero)
    if (isNaN(mesaNum) || mesaNum <= 0) {
      return NextResponse.json({ exito: false, mensaje: 'Número de mesa inválido.' })
    }

    const supabase = getServiceClient()

    // Verificar que el líder existe
    const { data: lider } = await supabase
      .from('lideres')
      .select('cedula, cedula_analista')
      .eq('cedula', cedula_lider)
      .single()

    if (!lider && cedula_lider !== '__all__') {
      return NextResponse.json({ exito: false, mensaje: 'Líder no encontrado.' })
    }

    // Verificar que la cédula no existe ya
    const { data: existe } = await supabase
      .from('testigos')
      .select('cedula')
      .eq('cedula', cedulaClean)
      .single()

    if (existe) {
      return NextResponse.json({ exito: false, mensaje: 'Ya existe un testigo con esa cédula.' })
    }

    // Verificar que la mesa no esté asignada a otro testigo en el mismo puesto
    const { data: mesaOcupada } = await supabase
      .from('mesa_asignaciones')
      .select('testigo_cedula')
      .eq('mesa_numero', mesaNum)
      .eq('municipio', municipio)
      .eq('puesto', puesto)
      .single()

    if (mesaOcupada) {
      return NextResponse.json({ exito: false, mensaje: `La mesa ${mesaNum} en ese puesto ya está asignada a otro testigo.` })
    }

    const { nombre1, nombre2, apellido1, apellido2 } = splitNombreApellido(nombre_completo)

    // Insertar testigo
    const { error: errTestigo } = await supabase.from('testigos').insert({
      cedula: cedulaClean,
      nombre_completo: nombre_completo.trim(),
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      celular: celular?.trim() || null,
      correo: correo?.trim() || null,
      departamento: 'CUNDINAMARCA',
      municipio: municipio.trim(),
      puesto: puesto.trim(),
      cedula_lider: cedula_lider === '__all__' ? null : cedula_lider,
      cedula_analista: lider?.cedula_analista || null,
    })

    if (errTestigo) {
      console.error('Error insertando testigo:', errTestigo)
      return NextResponse.json({ exito: false, mensaje: `Error creando testigo: ${errTestigo.message}` })
    }

    // Insertar asignación de mesa
    const { error: errAsig } = await supabase.from('mesa_asignaciones').insert({
      testigo_cedula: cedulaClean,
      mesa_numero: mesaNum,
      municipio: municipio.trim(),
      puesto: puesto.trim(),
    })

    if (errAsig) {
      console.error('Error insertando asignación:', errAsig)
      return NextResponse.json({ exito: false, mensaje: `Error asignando mesa: ${errAsig.message}` })
    }

    // Crear resultado vacío
    const { error: errRes } = await supabase.from('resultados').insert({
      testigo_cedula: cedulaClean,
      mesa_numero: mesaNum,
      municipio: municipio.trim(),
      puesto: puesto.trim(),
      estado: 'pendiente',
    })

    if (errRes) {
      console.error('Error creando resultado:', errRes)
    }

    return NextResponse.json({
      exito: true,
      mensaje: `Testigo ${nombre_completo.trim()} registrado con mesa ${mesaNum}.`,
    })
  } catch (error) {
    console.error('Error en POST /api/lider/testigo:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
