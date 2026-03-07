import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

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

export async function POST(request: NextRequest) {
  try {
    const { csv } = await request.json()

    if (!csv) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const supabase = getServiceClient()
    const lines = csv.split('\n').filter((l: string) => l.trim())

    {
      /**
       * CSV CNE — TESTIGOS CUNDINAMARCA
       * Columnas (0-based):
       *  0: Descripción Departamento
       *  1: Descripción Municipio
       *  2: Descripción Puesto
       *  3: Organización Política
       *  4: Identificación (cédula)
       *  5: Nombre y Apellido
       *  6: Correo Electrónico
       *  7: Teléfono
       *  8: Tipo de Testigo
       *  9: Estado Testigo
       * 10: Código Mesa
       * 11: Asiste
       * 12: Lider
       */
      const rows = lines.slice(1) // omitir cabecera

      const testigosMap: Record<string, Record<string, unknown>> = {}
      const asignaciones: { cedula: string; mesa_numero: number; municipio: string; puesto: string }[] = []
      const asignacionesSet = new Set<string>()

      for (const line of rows) {
        const cols = parseCSVLine(line)
        const cedula = (cols[4] || '').trim()
        const mesaNum = parseInt((cols[10] || '').trim())

        if (!cedula) continue

        const nombreCompleto = (cols[5] || '').trim()
        const departamento = (cols[0] || 'CUNDINAMARCA').trim()
        const municipio = (cols[1] || '').trim()
        const puesto = (cols[2] || '').trim()
        const { nombre1, nombre2, apellido1, apellido2 } = splitNombreApellido(nombreCompleto)

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
          correo: (cols[6] || '').trim() || null,
          celular: (cols[7] || '').trim() || null,
          organizacion_politica: (cols[3] || '').trim() || null,
          tipo_testigo: (cols[8] || '').trim() || null,
          estado_testigo: (cols[9] || '').trim() || null,
          asiste: (cols[11] || '').trim() || null,
          lider: (cols[12] || '').trim() || null,
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

      // 1. Limpiar e insertar testigos
      await supabase.from('testigos').delete().neq('cedula', '')
      for (let i = 0; i < testigos.length; i += 500) {
        const { error } = await supabase.from('testigos').insert(testigos.slice(i, i + 500))
        if (error) {
          console.error('Error insertando testigos:', error)
          return NextResponse.json({ exito: false, mensaje: `Error insertando testigos: ${error.message}` })
        }
      }

      // 2. Limpiar e insertar mesa_asignaciones
      await supabase.from('mesa_asignaciones').delete().neq('testigo_cedula', '')
      const asignRows = asignaciones.map(a => ({
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

      // 3. Limpiar y crear resultados vacíos
      await supabase.from('resultados').delete().neq('testigo_cedula', '')

      const resultadosRows = asignaciones.map(a => ({
        testigo_cedula: a.cedula,
        mesa_numero: a.mesa_numero,
        municipio: a.municipio,
        puesto: a.puesto,
        estado: 'pendiente',
      }))
      for (let i = 0; i < resultadosRows.length; i += 500) {
        await supabase
          .from('resultados')
          .insert(resultadosRows.slice(i, i + 500))
      }

      return NextResponse.json({
        exito: true,
        mensaje: `${testigos.length} testigos y ${asignaciones.length} mesas importados correctamente.`,
        total: testigos.length,
        mesas: asignaciones.length,
      })
    }
  } catch (error) {
    console.error('Error en upload-csv:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
