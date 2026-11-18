// Íconos y piezas pequeñas de interfaz reutilizadas en todas las vistas
import { ESTADO } from '../lib/util'

const I = {
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6.3"/><path d="M5.4 8.2l1.8 1.8 3.5-3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cal: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M2.5 7h11M5.5 2v3M10.5 2v3"/></svg>',
  users: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6" cy="5.5" r="2.3"/><path d="M1.8 13.5c.6-2.3 2.2-3.5 4.2-3.5s3.6 1.2 4.2 3.5M10.5 3.4a2.2 2.2 0 010 4.2M12 10.3c1.2.5 1.9 1.6 2.2 3.2" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2l1.8 3.8 4.1.5-3 2.8.8 4.1L8 11.2l-3.7 2 .8-4.1-3-2.8 4.1-.5z" stroke-linejoin="round"/></svg>',
  globe: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14c-1.8-1.7-2.6-3.7-2.6-6S6.2 3.7 8 2z"/></svg>',
  pin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 00-9 0C3.5 10 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.6"/></svg>',
  shield: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 1.8l5 2v3.8c0 3.2-2.2 5.6-5 6.6-2.8-1-5-3.4-5-6.6V3.8z" stroke-linejoin="round"/></svg>',
  swap: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}

export const Ic = ({ n }) => <span className="ic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: I[n] }} />

export const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="7" fill="#fff" />
    <path d="M7 12.6l3.3 3.2L17.2 8.8" stroke="#000" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Estado = ({ e }) => <span className={`pill ${ESTADO[e]?.[0] || ''}`}>{ESTADO[e]?.[1] || e}</span>

export const Stars = ({ r }) => (
  <span style={{ whiteSpace: 'nowrap' }}><span className="star" aria-hidden="true">★</span> <span className="num">{Number(r || 0).toFixed(1)}</span></span>
)

export const Eyebrow = ({ children, style }) => <span className="eyebrow" style={style}><Ic n="check" /> {children}</span>

export const Loading = ({ texto = 'Cargando…' }) => <div className="loading">{texto}</div>
