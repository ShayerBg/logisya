import { cop, fdate, horas } from '../../lib/util'
import { Eyebrow, Estado, Ic } from '../../components/ui'

export default function MisPostulaciones({ db, me }) {
  const filas = []
  db.EVENTS.forEach(e => e.vacantes.forEach(v => {
    const p = v.postulaciones.find(p => p.trabajador_id === me.id)
    if (p) filas.push([e, v, p])
  }))
  const confirmados = filas.filter(r => r[2].estado === 'confirmado').length
  const pend = filas.filter(r => r[2].estado === 'pendiente').length

  return (
    <>
      <div className="page-head"><div><Eyebrow>Mis postulaciones</Eyebrow>
        <h1 className="h1" style={{ marginTop: 10 }}>Tus turnos<span className="soft" style={{ display: 'block' }}>confirmados y pendientes</span></h1></div></div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <div className="kcard"><span className="tile t3"><Ic n="check" /></span><div className="lab">Confirmados</div><div className="num">{confirmados}</div></div>
        <div className="kcard"><span className="tile t1"><Ic n="clock" /></span><div className="lab">En revisión</div><div className="num">{pend}</div></div>
        <div className="kcard"><span className="tile t4"><Ic n="star" /></span><div className="lab">Mi calificación</div><div className="num">{me.rating.toFixed(1)}</div></div>
      </div>
      <div className="panel">{filas.length ? (
        <div className="tbl"><table>
          <thead><tr><th>Fecha</th><th>Evento</th><th>Rol y turno</th><th>Operador</th><th>Pago</th><th>Estado</th><th>Horas</th></tr></thead>
          <tbody>{filas.map(([e, v, p]) => (
            <tr key={p.id}><td className="num" style={{ whiteSpace: 'nowrap' }}>{fdate(e.fecha)}</td><td>{e.nombre}</td>
              <td>{v.rol} <span className="num small muted">{v.ini}–{v.fin}</span></td><td className="small">{db.OPS[e.operador_id]?.nombre}</td>
              <td className="num">{cop(v.tarifa)}</td><td><Estado e={p.estado} /></td>
              <td className="num">{p.asis?.salida ? horas(p.asis.entrada, p.asis.salida).toFixed(1) : '—'}</td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="note">Aún no te has postulado. Busca oportunidades en el calendario.</p>}</div>
    </>
  )
}
