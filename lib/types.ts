export interface Testigo {
  id: string
  cedula: string
  nombre1: string
  nombre2: string | null
  apellido1: string
  apellido2: string | null
  nombre_completo: string
  celular: string | null
  correo: string | null
  departamento: string
  municipio: string
  puesto: string
  dd: string | null
  mm: string | null
  zz: string | null
  pp: string | null
  created_at: string
}

export interface Municipio {
  id: string
  municipio: string
  mesas: number
  testigos: number
  votantes: number
  mesas_por_testigo: number | null
  meta: number
  testigos_a_conseguir: number | null
  created_at: string
}

export interface MesaAsignacion {
  id: string
  testigo_cedula: string
  mesa_numero: number
  municipio: string
  puesto: string
  created_at: string
}

export interface Resultado {
  id: string
  testigo_cedula: string
  mesa_numero: number
  municipio: string
  puesto: string
  // Camara
  votos_camara_l101: number | null
  votos_camara_l102: number | null
  votos_camara_l103: number | null
  votos_camara_l104: number | null
  votos_camara_l105: number | null
  votos_camara_l106: number | null
  votos_camara_l107: number | null
  votos_camara_partido: number | null
  // Senado
  votos_senado_1: number | null
  votos_senado_2: number | null
  votos_senado_3: number | null
  votos_senado_4: number | null
  votos_senado_5: number | null
  votos_senado_partido: number | null
  // Conteo por hora
  votantes_8am: number | null
  votantes_11am: number | null
  votantes_1pm: number | null
  // Flags de bloqueo (una sola vez)
  datos_8am_guardados: boolean
  datos_11am_guardados: boolean
  datos_1pm_guardados: boolean
  datos_finales_guardados: boolean
  // Evidencia
  confirmacion_e14: boolean | null
  foto_camara: string | null
  foto_camara_2: string | null
  foto_senado: string | null
  foto_senado_2: string | null

  estado: 'pendiente' | 'completada'
  created_at: string
  updated_at: string
}

export interface SesionTestigo {
  cedula: string
  testigo: Testigo
  mesas: MesaDashboard[]
}

export interface MesaDashboard {
  mesa_numero: number
  municipio: string
  puesto: string
  // Camara
  votos_camara_l101: number | null
  votos_camara_l102: number | null
  votos_camara_l103: number | null
  votos_camara_l104: number | null
  votos_camara_l105: number | null
  votos_camara_l106: number | null
  votos_camara_l107: number | null
  votos_camara_partido: number | null
  // Senado
  votos_senado_1: number | null
  votos_senado_2: number | null
  votos_senado_3: number | null
  votos_senado_4: number | null
  votos_senado_5: number | null
  votos_senado_partido: number | null
  // Conteo por hora
  votantes_8am: number | null
  votantes_11am: number | null
  votantes_1pm: number | null
  // Flags de bloqueo
  datos_8am_guardados: boolean
  datos_11am_guardados: boolean
  datos_1pm_guardados: boolean
  datos_finales_guardados: boolean
  // Evidencia
  confirmacion_e14: boolean | null
  foto_camara: string | null
  foto_camara_2: string | null
  foto_senado: string | null
  foto_senado_2: string | null

  estado: 'pendiente' | 'completada'
}

export const CAMARA_CANDIDATOS = [
  { code: 'votos_camara_l101', title: 'L101 ALEX PRIETO' },
  { code: 'votos_camara_l102', title: 'L102 EDGAR CRUZ GARCÍA' },
  { code: 'votos_camara_l103', title: 'L103 DORA CECILIA MURCIA SANCHEZ' },
  { code: 'votos_camara_l104', title: 'L104 DIANA CAROLINA LOPEZ SANCHEZ' },
  { code: 'votos_camara_l105', title: 'L105 JENNIFER DAMARYS PINZON RUBIANO' },
  { code: 'votos_camara_l106', title: 'L106 NESTOR IVAN PAREDES NARVAEZ' },
  { code: 'votos_camara_l107', title: 'L107 JEISON ALBERTO AREVALO ROJAS' }
]

export const SENADO_CANDIDATOS = [
  { code: 'votos_senado_1', title: 'Senado Candidato 1' },
  { code: 'votos_senado_2', title: 'Senado Candidato 2' },
  { code: 'votos_senado_3', title: 'Senado Candidato 3' },
  { code: 'votos_senado_4', title: 'Senado Candidato 4' },
  { code: 'votos_senado_5', title: 'Senado Candidato 5' }
]

export type FranjaHoraria = '8am' | '11am' | '1pm'

export const FRANJAS_HORARIAS: { key: FranjaHoraria; label: string; hora: string }[] = [
  { key: '8am', label: 'Cantidad de Votantes 8 AM', hora: '08:00' },
  { key: '11am', label: 'Cantidad de Votantes 11 AM', hora: '11:00' },
  { key: '1pm', label: 'Cantidad de Votantes 1 PM', hora: '13:00' },
]

export function calcularEstado(mesa: MesaDashboard): 'pendiente' | 'completada' {
  // Si ya se guardaron los resultados finales, siempre es completada
  if (mesa.datos_finales_guardados) {
    return 'completada'
  }
  const tieneVotosCamara = mesa.votos_camara_l101 != null && mesa.votos_camara_partido != null;
  const tieneVotosSenado = mesa.votos_senado_1 != null && mesa.votos_senado_partido != null;
  if (tieneVotosCamara && tieneVotosSenado && mesa.foto_camara && mesa.foto_senado && mesa.confirmacion_e14) {
    return 'completada'
  }
  return 'pendiente'
}
