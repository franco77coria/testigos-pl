import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, fetchAllRows } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function cleanCedula(value: string): string {
  return value.replace(/\./g, '').replace(/\s/g, '').trim()
}

/**
 * Divide "Nombre y Apellido" combinado en campos separados.
 * Convención colombiana típica: 2 nombres + 2 apellidos.
 */
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

/**
 * CSV CNE — TESTIGOS CUNDINAMARCA (nuevo formato)
 * Columnas (0-based):
 *  0: Identificación (cédula)
 *  1: Nombre y Apellido
 *  2: Teléfono
 *  3: Correo Electrónico
 *  4: Descripción Departamento
 *  5: Provincia
 *  6: Municipio
 *  7: Tipo
 *  8: Descripción Puesto
 *  9: Organización Política
 * 10: Tipo de Testigo
 * 11: Estado Testigo
 * 12: Código Mesa
 * 13: lider (nombre)
 * 14: cedula_lider
 * 15: telefono_lider
 * 16: Analista_center (nombre)
 * 17: cedula_analista
 * 18: telefono_analista
 * 19: Asiste
 */
export async function POST(request: NextRequest) {
  try {
    const { csv } = await request.json()

    if (!csv) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const supabase = getServiceClient()
    const lines = csv.split('\n').filter((l: string) => l.trim())
    const rows = lines.slice(1) // omitir cabecera

    const testigosMap: Record<string, Record<string, unknown>> = {}
    const asignaciones: { cedula: string; mesa_numero: number; municipio: string; puesto: string }[] = []
    const asignacionesSet = new Set<string>()
    const lideresMap: Record<string, { cedula: string; nombre: string; telefono: string | null; cedula_analista: string | null }> = {}
    const analistasMap: Record<string, { cedula: string; nombre: string; telefono: string | null }> = {}

    for (const line of rows) {
      const cols = parseCSVLine(line)
      const cedula = (cols[0] || '').trim()
      const mesaNum = parseInt((cols[12] || '').trim())

      if (!cedula) continue

      const nombreCompleto = (cols[1] || '').trim()
      const departamento = (cols[4] || 'CUNDINAMARCA').trim()
      const municipio = (cols[6] || '').trim()
      const puesto = (cols[8] || '').trim()
      const { nombre1, nombre2, apellido1, apellido2 } = splitNombreApellido(nombreCompleto)

      // Lider info
      const liderNombre = (cols[13] || '').trim()
      const liderCedulaRaw = (cols[14] || '').trim()
      const liderTelefono = (cols[15] || '').trim()
      const liderCedula = liderCedulaRaw ? cleanCedula(liderCedulaRaw) : ''

      // Analista info
      const analistaNombre = (cols[16] || '').trim()
      const analistaCedulaRaw = (cols[17] || '').trim()
      const analistaTelefono = (cols[18] || '').trim()
      const analistaCedula = analistaCedulaRaw ? cleanCedula(analistaCedulaRaw) : ''

      // Build lider map
      if (liderCedula && liderNombre) {
        if (!lideresMap[liderCedula]) {
          lideresMap[liderCedula] = {
            cedula: liderCedula,
            nombre: liderNombre,
            telefono: liderTelefono || null,
            cedula_analista: analistaCedula || null,
          }
        }
      }

      // Build analista map
      if (analistaCedula && analistaNombre) {
        if (!analistasMap[analistaCedula]) {
          analistasMap[analistaCedula] = {
            cedula: analistaCedula,
            nombre: analistaNombre,
            telefono: analistaTelefono || null,
          }
        }
      }

      testigosMap[cedula] = {
        cedula,
        nombre_completo: nombreCompleto,
        nombre1,
        nombre2: nombre2 || null,
        apellido1,
        apellido2: apellido2 || null,
        departamento,
        municipio,
        puesto,
        correo: (cols[3] || '').trim() || null,
        celular: (cols[2] || '').trim() || null,
        organizacion_politica: (cols[9] || '').trim() || null,
        tipo_testigo: (cols[10] || '').trim() || null,
        estado_testigo: (cols[11] || '').trim() || null,
        asiste: (cols[19] || '').trim() || null,
        lider: liderNombre || null,
        cedula_lider: liderCedula || null,
        cedula_analista: analistaCedula || null,
      }

      if (!isNaN(mesaNum) && mesaNum > 0) {
        const key = `${cedula}__${mesaNum}`
        if (!asignacionesSet.has(key)) {
          asignacionesSet.add(key)
          asignaciones.push({ cedula, mesa_numero: mesaNum, municipio, puesto })
        }
      }
    }

    const testigos = Object.values(testigosMap)
    if (testigos.length === 0) {
      return NextResponse.json({ exito: false, mensaje: 'No se encontraron testigos en el CSV.' })
    }

    const lideres = Object.values(lideresMap)
    const analistas = Object.values(analistasMap)

    // 1. UPSERT testigos (actualiza datos si ya existe, inserta si es nuevo)
    for (let i = 0; i < testigos.length; i += 500) {
      const { error } = await supabase.from('testigos').upsert(testigos.slice(i, i + 500), { onConflict: 'cedula' })
      if (error) {
        console.error('Error upserting testigos:', error)
        return NextResponse.json({ exito: false, mensaje: `Error upserting testigos: ${error.message}` })
      }
    }

    // 2. UPSERT mesa_asignaciones (insertar solo las que no existen)
    // mesa_asignaciones no tiene UNIQUE constraint, así que verificamos manualmente
    const existingAsigRows = await fetchAllRows(supabase, 'mesa_asignaciones', 'testigo_cedula, mesa_numero')

    const existingAsigSet = new Set(
      existingAsigRows.map((a: Record<string, unknown>) => `${a.testigo_cedula}__${a.mesa_numero}`)
    )

    const newAsignaciones = asignaciones.filter(a => !existingAsigSet.has(`${a.cedula}__${a.mesa_numero}`))
    const asignRows = newAsignaciones.map(a => ({
      testigo_cedula: a.cedula,
      mesa_numero: a.mesa_numero,
      municipio: a.municipio,
      puesto: a.puesto,
    }))
    for (let i = 0; i < asignRows.length; i += 500) {
      const { error } = await supabase.from('mesa_asignaciones').insert(asignRows.slice(i, i + 500))
      if (error) {
        console.error('Error insertando asignaciones:', error)
        return NextResponse.json({ exito: false, mensaje: `Error insertando asignaciones: ${error.message}` })
      }
    }

    // 3. Crear resultados SOLO para mesas nuevas (preserva progreso existente)
    const existingResRows = await fetchAllRows(supabase, 'resultados', 'testigo_cedula, mesa_numero')

    const existingResSet = new Set(
      existingResRows.map((r: Record<string, unknown>) => `${r.testigo_cedula}__${r.mesa_numero}`)
    )

    const newResultados = asignaciones
      .filter(a => !existingResSet.has(`${a.cedula}__${a.mesa_numero}`))
      .map(a => ({
        testigo_cedula: a.cedula,
        mesa_numero: a.mesa_numero,
        municipio: a.municipio,
        puesto: a.puesto,
        estado: 'pendiente',
      }))

    for (let i = 0; i < newResultados.length; i += 500) {
      await supabase.from('resultados').insert(newResultados.slice(i, i + 500))
    }

    // 4. UPSERT lideres
    for (let i = 0; i < lideres.length; i += 500) {
      const { error } = await supabase.from('lideres').upsert(lideres.slice(i, i + 500), { onConflict: 'cedula' })
      if (error) {
        console.error('Error upserting lideres:', error)
        return NextResponse.json({ exito: false, mensaje: `Error upserting lideres: ${error.message}` })
      }
    }

    // 5. UPSERT analistas
    for (let i = 0; i < analistas.length; i += 500) {
      const { error } = await supabase.from('analistas').upsert(analistas.slice(i, i + 500), { onConflict: 'cedula' })
      if (error) {
        console.error('Error upserting analistas:', error)
        return NextResponse.json({ exito: false, mensaje: `Error upserting analistas: ${error.message}` })
      }
    }

    return NextResponse.json({
      exito: true,
      mensaje: `${testigos.length} testigos (upsert), ${newAsignaciones.length} mesas nuevas, ${newResultados.length} resultados nuevos, ${lideres.length} líderes y ${analistas.length} analistas importados. Progreso existente preservado.`,
      total: testigos.length,
      mesas_nuevas: newAsignaciones.length,
      mesas_total: asignaciones.length,
      resultados_nuevos: newResultados.length,
      lideres: lideres.length,
      analistas: analistas.length,
    })
  } catch (error) {
    console.error('Error en upload-csv:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
