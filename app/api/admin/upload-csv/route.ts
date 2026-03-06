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

export async function POST(request: NextRequest) {
  try {
    const { tipo, csv } = await request.json()

    if (!tipo || !csv) {
      return NextResponse.json({ exito: false, mensaje: 'Datos incompletos.' })
    }

    const supabase = getServiceClient()
    const lines = csv.split('\n').filter((l: string) => l.trim())

    if (tipo === 'testigos') {
      // Parse LISTADO TESTIGOS CSV
      // Columns: dd,mm,zz,pp,departamento,municipio,puesto,cedula,nombre1,nombre2,apellido1,apellido2,Nombre,celular,correo
      const header = parseCSVLine(lines[0])
      const rows = lines.slice(1)

      // Clear existing testigos
      await supabase.from('testigos').delete().neq('cedula', '')

      const testigos: Record<string, unknown>[] = []
      const seen = new Set<string>()

      for (const line of rows) {
        const cols = parseCSVLine(line)
        const cedula = (cols[7] || '').trim()

        // Skip empty cedulas and duplicates
        if (!cedula || seen.has(cedula)) continue
        seen.add(cedula)

        testigos.push({
          dd: (cols[0] || '').trim() || null,
          mm: (cols[1] || '').trim() || null,
          zz: (cols[2] || '').trim() || null,
          pp: (cols[3] || '').trim() || null,
          departamento: (cols[4] || '').trim() || 'CUNDINAMARCA',
          municipio: (cols[5] || '').trim(),
          puesto: (cols[6] || '').trim(),
          cedula,
          nombre1: (cols[8] || '').trim(),
          nombre2: (cols[9] || '').trim() || null,
          apellido1: (cols[10] || '').trim(),
          apellido2: (cols[11] || '').trim() || null,
          nombre_completo: [(cols[8] || '').trim(), (cols[9] || '').trim(), (cols[10] || '').trim(), (cols[11] || '').trim()].filter(Boolean).join(' '),
          celular: (cols[13] || '').trim() || null,
          correo: (cols[14] || '').trim() || null,
        })
      }

      // Insert in batches of 500
      for (let i = 0; i < testigos.length; i += 500) {
        const batch = testigos.slice(i, i + 500)
        const { error } = await supabase.from('testigos').insert(batch)
        if (error) {
          console.error('Error inserting testigos batch:', error)
          return NextResponse.json({
            exito: false,
            mensaje: `Error en lote ${i / 500 + 1}: ${error.message}`,
          })
        }
      }

      return NextResponse.json({
        exito: true,
        mensaje: `${testigos.length} testigos importados correctamente.`,
        total: testigos.length,
      })
    }

    if (tipo === 'semaforo') {
      // Parse CUNDINAMARCA CSV (puestos de votación)
      // Columns: dd,mm,zz,pp,departamento,municipio,punto de votacion,mujeres,hombres,total,mesas,comuna,dirección
      const rows = lines.slice(1)

      // Clear existing municipios/puestos
      await supabase.from('municipios').delete().gte('created_at', '1970-01-01')

      const puestos: Record<string, unknown>[] = []
      const seen = new Set<string>()

      for (const line of rows) {
        const cols = parseCSVLine(line)
        const municipio = (cols[5] || '').trim()
        const puesto = (cols[6] || '').trim()
        if (!municipio || !puesto) continue

        const key = `${municipio}||${puesto}`
        if (seen.has(key)) continue
        seen.add(key)

        puestos.push({
          departamento: (cols[4] || '').trim() || 'CUNDINAMARCA',
          municipio,
          puesto,
          mesas: parseInt(cols[10]) || 0,
          votantes: parseInt(cols[9]) || 0,
          direccion: (cols[12] || '').trim() || null,
        })
      }

      // Insert in batches
      for (let i = 0; i < puestos.length; i += 500) {
        const batch = puestos.slice(i, i + 500)
        const { error } = await supabase.from('municipios').insert(batch)
        if (error) {
          console.error('Error inserting puestos batch:', error)
          return NextResponse.json({
            exito: false,
            mensaje: `Error en lote ${i / 500 + 1}: ${error.message}`,
          })
        }
      }

      return NextResponse.json({
        exito: true,
        mensaje: `${puestos.length} puestos de votación importados correctamente.`,
        total: puestos.length,
      })
    }

    return NextResponse.json({ exito: false, mensaje: 'Tipo de CSV inválido.' })
  } catch (error) {
    console.error('Error en upload-csv:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
