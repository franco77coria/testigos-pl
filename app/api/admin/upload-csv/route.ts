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
      // Parse SEMAFORO CSV
      // Columns: (empty),MUNICIPIO,MESAS,Testigos,VOTANTES,MESAS POR TESTIGO,META,TESTIGOS A CONSEGUIR
      const rows = lines.slice(1)

      // Clear existing municipios
      await supabase.from('municipios').delete().neq('municipio', '')

      const municipios: Record<string, unknown>[] = []

      for (const line of rows) {
        const cols = parseCSVLine(line)
        const municipio = (cols[1] || '').trim()
        if (!municipio) continue

        const mesasPorTestigo = (cols[5] || '').trim()

        municipios.push({
          municipio,
          mesas: parseInt(cols[2]) || 0,
          testigos: parseInt(cols[3]) || 0,
          votantes: parseInt(cols[4]) || 0,
          mesas_por_testigo: mesasPorTestigo === 'null' ? null : parseFloat(mesasPorTestigo) || null,
          meta: parseInt(cols[6]) || 0,
          testigos_a_conseguir: parseInt(cols[7]) || null,
        })
      }

      const { error } = await supabase.from('municipios').insert(municipios)
      if (error) {
        console.error('Error inserting municipios:', error)
        return NextResponse.json({ exito: false, mensaje: error.message })
      }

      return NextResponse.json({
        exito: true,
        mensaje: `${municipios.length} municipios importados correctamente.`,
        total: municipios.length,
      })
    }

    return NextResponse.json({ exito: false, mensaje: 'Tipo de CSV inválido.' })
  } catch (error) {
    console.error('Error en upload-csv:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error del sistema.' }, { status: 500 })
  }
}
