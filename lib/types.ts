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
  cantidad_votantes_mesa: number | null
  votantes_10am: number | null
  votantes_1pm: number | null
  votos_alex_p: number | null
  votos_camara_cun_pl: number | null
  votos_oscar_sanchez_senado: number | null
  votos_senado_pl: number | null
  foto_camara: string | null
  foto_senado: string | null
  estado: 'pendiente' | 'en_progreso' | 'completada'
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
  cantidad_votantes_mesa: number | null
  votantes_10am: number | null
  votantes_1pm: number | null
  votos_alex_p: number | null
  votos_camara_cun_pl: number | null
  votos_oscar_sanchez_senado: number | null
  votos_senado_pl: number | null
  foto_camara: string | null
  foto_senado: string | null
  estado: 'pendiente' | 'en_progreso' | 'completada'
  seccion_activa: number
}

export type SeccionId = 1 | 2 | 3 | 4

export interface Seccion {
  id: SeccionId
  nombre: string
  campos: string[]
  labels: string[]
  descripcion: string
}

export const SECCIONES: Seccion[] = [
  {
    id: 1,
    nombre: 'Censo de Votantes',
    campos: ['cantidad_votantes_mesa'],
    labels: ['Total votantes habilitados'],
    descripcion: 'Registre el total de votantes habilitados en el formulario E-11.',
  },
  {
    id: 2,
    nombre: 'Conteo 10:00 AM',
    campos: ['votantes_10am'],
    labels: ['Votantes hasta las 10:00 AM'],
    descripcion: 'Cuente las personas que han votado hasta las 10:00 AM.',
  },
  {
    id: 3,
    nombre: 'Conteo 1:00 PM',
    campos: ['votantes_1pm'],
    labels: ['Votantes hasta la 1:00 PM'],
    descripcion: 'Cuente las personas que han votado hasta la 1:00 PM.',
  },
  {
    id: 4,
    nombre: 'Resultados Finales',
    campos: ['votos_alex_p', 'votos_camara_cun_pl', 'votos_oscar_sanchez_senado', 'votos_senado_pl'],
    labels: ['Votos Alex P (Cámara)', 'Votos Cámara CUN PL', 'Votos Oscar Sánchez (Senado)', 'Votos Senado PL'],
    descripcion: 'Registre los resultados finales del escrutinio y suba las fotos del E-14.',
  },
]

export function calcularSeccionActiva(mesa: MesaDashboard): number {
  if (!mesa.cantidad_votantes_mesa) return 1
  if (!mesa.votantes_10am) return 2
  if (!mesa.votantes_1pm) return 3
  if (!mesa.votos_alex_p || !mesa.votos_camara_cun_pl || !mesa.votos_oscar_sanchez_senado || !mesa.votos_senado_pl) return 4
  return 5 // todas completas
}

export function calcularEstado(mesa: MesaDashboard): 'pendiente' | 'en_progreso' | 'completada' {
  const seccion = calcularSeccionActiva(mesa)
  if (seccion === 1) return 'pendiente'
  if (seccion === 5 && mesa.foto_camara && mesa.foto_senado) return 'completada'
  return 'en_progreso'
}
