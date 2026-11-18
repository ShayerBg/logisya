// Constantes y utilidades compartidas (vienen del logisya-data.js del MVP)
export const ROLES = ['Mesero/a', 'Bartender', 'Anfitrión/a', 'Promotor/a BTL', 'Logístico de montaje', 'Supervisor de piso']
export const ZONAS = ['Norte-Centro Histórico', 'Riomar', 'Sur Occidente', 'Metropolitana', 'Soledad', 'Puerto Colombia']
export const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
export const DIAS_L = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const pad = n => String(n).padStart(2, '0')

// Fecha de hoy en Barranquilla, en formato AAAA-MM-DD
export const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
export const D = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const sumarDias = (s, n) => { const d = D(s); d.setDate(d.getDate() + n); return iso(d) }
export const isToday = s => s === hoyISO()
export const isPast = s => s < hoyISO()

export const cop = n => '$' + Number(n).toLocaleString('es-CO')
export const fdate = s => { const d = D(s); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}` }
export const fdt = t => { const d = new Date(t); return `${DIAS_L[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} · ${pad(d.getHours())}:${pad(d.getMinutes())}` }
export const hm = t => (t ? t.slice(0, 5) : '')

const mins = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const horas = (a, b) => { const x = mins(a), y = mins(b); if (x == null || y == null) return 0; let d = y - x; if (d < 0) d += 1440; return d / 60 }

export function hrsLeft(t) {
  const h = (new Date(t) - new Date()) / 3600e3
  if (h <= 0) return 'unos minutos'
  if (h < 24) return `${Math.round(h)} h`
  return `${Math.round(h / 24)} d`
}

export const ESTADO = {
  pendiente: ['warn', 'Pendiente'],
  confirmado: ['ok', 'Confirmado'],
  rechazado: ['bad', 'No seleccionado'],
  ausente: ['bad', 'Ausente'],
  presente: ['ok', 'Asistió']
}

export const linkInvitacion = codigo => `${window.location.origin}/registro?codigo=${codigo}`
