// Historial verificado de un trabajador (eventos ya trabajados) y su perfil en ventana
import { useEffect, useRef, useState } from 'react'
import { rpc } from '../lib/supabase'
import { DIAS, fdate } from '../lib/util'
import { Eyebrow, Estado } from './ui'

export function HistorialTabla({ trabajadorId }) {
  const [filas, setFilas] = useState(null)
  useEffect(() => {
    let vivo = true
    rpc('historial_trabajador', { p_trab: trabajadorId }).then(d => vivo && setFilas(d || [])).catch(() => vivo && setFilas([]))
    return () => { vivo = false }
  }, [trabajadorId])
  if (filas === null) return <p className="note">Cargando historial…</p>
  if (!filas.length) return <p className="note">Todavía no hay eventos registrados en LogisYa.</p>
  return (
    <div className="tbl"><table>
      <thead><tr><th>Fecha</th><th>Evento</th><th>Rol</th><th>Operador</th><th>Asistencia</th></tr></thead>
      <tbody>{filas.map((x, i) => (
        <tr key={i}><td className="num" style={{ whiteSpace: 'nowrap' }}>{fdate(x.fecha)}</td><td>{x.evento}</td><td className="small">{x.rol}</td><td className="small">{x.operador}</td>
          <td>{x.estado === 'ausente' ? <span className="pill bad">No asistió</span> : x.estado === 'presente' ? <span className="pill ok">Asistió</span> : <Estado e={x.estado} />}</td></tr>
      ))}</tbody>
    </table></div>
  )
}

export function PerfilDialog({ w, onClose }) {
  const ref = useRef(null)
  useEffect(() => { if (w && ref.current && !ref.current.open) ref.current.showModal() }, [w])
  if (!w) return null
  return (
    <dialog ref={ref} onClose={onClose} onClick={e => { if (e.target === ref.current) ref.current.close() }}>
      <div className="dlg">
        <div className="row between"><div><Eyebrow>Perfil verificado</Eyebrow><h2 className="h2" style={{ marginTop: 6 }}>{w.nombre}</h2></div>
          <button className="btn btn-soft btn-sm" onClick={() => ref.current.close()}>Cerrar</button></div>
        <span className="muted small">{w.roles.join(' · ')} · {w.zona} · disponible {w.disp.map(i => DIAS[i]).join(', ')}</span>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <div className="kcard"><span className="lab small">Calificación</span><span className="num">{w.rating.toFixed(1)}</span></div>
          <div className="kcard"><span className="lab small">Asistencia</span><span className="num">{w.asistencia}%</span></div>
          <div className="kcard"><span className="lab small">Eventos</span><span className="num">{w.eventos}</span></div>
        </div>
        <span className="label">Historial reciente</span>
        <HistorialTabla trabajadorId={w.id} />
      </div>
    </dialog>
  )
}
