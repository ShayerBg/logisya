import { rpc } from '../../lib/supabase'
import { conf } from '../../lib/useLogis'
import { D, DIAS, MESES, cop, fdate, fdt, horas, hrsLeft, isPast, isToday } from '../../lib/util'
import { Eyebrow, Estado, Ic, Stars } from '../../components/ui'

function Kpis({ evs }) {
  let cupos = 0, c = 0, pres = 0, aus = 0, hrs = 0, post = 0
  evs.forEach(e => e.vacantes.forEach(v => {
    cupos += v.cupos; c += conf(v); post += v.postulaciones.length
    v.postulaciones.forEach(p => {
      const a = p.asis; if (!a) return
      if (a.estado === 'presente') pres++
      if (a.estado === 'ausente') aus++
      hrs += horas(a.entrada, a.salida)
    })
  }))
  const pct = cupos ? Math.round(c / cupos * 100) : 0
  const ausp = (pres + aus) ? Math.round(aus / (pres + aus) * 100) : 0
  const K = ({ t, ic, lab, num, sub }) => (
    <div className="kcard"><span className={`tile ${t}`}><Ic n={ic} /></span><div><div className="lab">{lab}</div><div className="sub">{sub}</div></div><div className="num">{num}</div></div>
  )
  return (
    <div className="kpis">
      <K t="t1" ic="cal" lab="Eventos próximos" num={evs.filter(e => !isPast(e.fecha)).length} sub="Incluye los de hoy" />
      <K t="t4" ic="users" lab="Cupos cubiertos" num={`${c}/${cupos}`} sub={`${pct}% de cobertura`} />
      <K t="t5" ic="swap" lab="Ausentismo" num={`${ausp}%`} sub={`${aus} de ${pres + aus} registros`} />
      <K t="t3" ic="clock" lab="Horas registradas" num={hrs.toFixed(1)} sub={`${post} postulaciones recibidas`} />
    </div>
  )
}

export default function Eventos({ db, op, sel, setSel, irCrear, ...ctx }) {
  const evs = db.EVENTS.filter(e => e.operador_id === op.id)
  // Por defecto se abre el primer evento de hoy o el próximo
  const porDefecto = evs.find(e => !isPast(e.fecha)) || evs[0]
  const e = evs.find(x => x.id === sel) || porDefecto

  return (
    <>
      <div className="page-head"><div><Eyebrow>Panel del operador</Eyebrow>
        <h1 className="h1" style={{ marginTop: 10 }}>{op.nombre}<span className="soft" style={{ display: 'block' }}>Eventos y personal</span></h1></div>
        <button className="btn btn-primary" onClick={irCrear}>Nuevo evento <Ic n="arrow" /></button></div>
      <Kpis evs={evs} />
      <div className="grid2">
        <div className="side">
          <div className="row between" style={{ padding: '4px 6px 6px' }}><strong>Mis eventos</strong><span className="small muted">{evs.length}</span></div>
          <div className="evlist">
            {evs.length ? evs.map(x => {
              const d = D(x.fecha), tc = x.vacantes.reduce((a, v) => a + v.cupos, 0), cc = x.vacantes.reduce((a, v) => a + conf(v), 0)
              return (
                <button key={x.id} className={`evitem ${isToday(x.fecha) ? 'today' : ''}`} onClick={() => setSel(x.id)} aria-current={x.id === e?.id} style={isPast(x.fecha) ? { opacity: .55 } : undefined}>
                  <span className="datebox"><span>{DIAS[d.getDay()]}</span><b className="num">{d.getDate()}</b><span>{MESES[d.getMonth()].slice(0, 3)}</span></span>
                  <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontWeight: 600, overflowWrap: 'anywhere' }}>{x.nombre}</strong>
                    <span className="small muted">{x.lugar} · <span className="num">{cc}/{tc}</span> cupos</span></span>
                </button>
              )
            }) : <p className="note">Aún no tienes eventos. Crea el primero.</p>}
          </div>
        </div>
        <div className="panel">{e ? <Detalle e={e} db={db} op={op} {...ctx} /> : <p className="note">Selecciona un evento de la lista.</p>}</div>
      </div>
    </>
  )
}

function Detalle({ e, ...ctx }) {
  const hoy = isToday(e.fecha)
  return (
    <>
      <div className="ev-head">
        <div className="row between"><h2 className="h2" style={{ fontSize: '1.6rem' }}>{e.nombre}</h2>{hoy && <span className="pill dark">Hoy</span>}{isPast(e.fecha) && <span className="pill">Finalizado</span>}</div>
        <span className="muted row" style={{ gap: 6 }}><Ic n="pin" />{fdate(e.fecha)} · {e.lugar} · {e.zona}</span>
      </div>
      {e.vacantes.map(v => <Vacante key={v.id} e={e} v={v} hoy={hoy} {...ctx} />)}
    </>
  )
}

function Fase({ v }) {
  if (conf(v) >= v.cupos) return <span className="pill ok">Cupo completo</span>
  if (v.fase === 'general') return <span className="pill ok">Calendario general</span>
  if (v.bloqueada) return <span className="pill bad">Plazo vencido · no compartes tu personal</span>
  return <span className="pill acc">Solo mi personal · abre al general en {hrsLeft(v.cierre)}</span>
}

const ORIGEN = {
  propio: <span className="pill">Mi personal</span>,
  bolsa: <span className="pill acc">Bolsa</span>,
  reemplazo: <span className="pill bad">Reemplazo</span>
}

function Vacante({ e, v, hoy, db, op, run, ocupado, verPerfil }) {
  const c = conf(v), pct = Math.min(100, Math.round(c / v.cupos * 100))
  const W = id => db.W[id] || { id, nombre: '—', rating: 0, asistencia: 0, eventos: 0 }
  const lleno = c >= v.cupos
  const postulantes = v.postulaciones.filter(p => p.estado !== 'rechazado')
  const confs = v.postulaciones.filter(p => p.estado === 'confirmado' || p.estado === 'ausente')

  const responder = (p, estado) => run(() => rpc('responder_postulacion', { p_post: p.id, p_estado: estado }),
    estado === 'confirmado' ? `${W(p.trabajador_id).nombre} confirmado como ${v.rol}` : null)

  return (
    <div className="vac">
      <div className="vac-top">
        <div><h3 style={{ fontSize: 17 }}>{v.rol}</h3><span className="small muted"><span className="num">{v.ini}–{v.fin}</span> · {cop(v.tarifa)} por turno</span></div>
        <div className="row"><div className="meter" role="img" aria-label={`${c} de ${v.cupos} cupos cubiertos`}><i style={{ width: pct + '%' }} /></div><span className="num small"><strong>{c}</strong>/{v.cupos}</span></div>
      </div>
      <div className="vac-top"><Fase v={v} />
        {v.fase === 'propio' && !isPast(e.fecha) && !lleno && (
          <div className="row">
            <button className="btn btn-sm btn-white" disabled={ocupado} onClick={() => run(() => rpc('convocar_mi_personal', { p_vacante: v.id }), n => n ? `Convocaste a ${n} persona(s) de tu equipo` : 'Todo tu personal con ese rol ya está convocado')}>Convocar a mi personal</button>
            {op.compartir && <button className="btn btn-sm btn-white" disabled={ocupado} onClick={() => run(() => rpc('abrir_al_general', { p_vacante: v.id }), `${v.rol} ahora está en el calendario general`)}>Abrir ya al calendario general</button>}
          </div>
        )}
      </div>
      {v.fase === 'propio' && v.convocados.length > 0 && <span className="small muted">Convocadas {v.convocados.length} persona(s) de tu equipo</span>}

      {v.reemplazo && (
        <div className="alert"><strong>Reemplazo de última hora.</strong> {W(v.reemplazo.ausente_id).nombre} quedó como ausente ({fdt(v.reemplazo.inicio)}).{' '}
          {v.reemplazo.notificados.length
            ? `Se notificó a ${v.reemplazo.notificados.length} persona(s) con perfil de ${v.rol}: ${v.reemplazo.notificados.map(id => W(id).nombre).join(', ')}. Sus postulaciones aparecen abajo.`
            : 'No se encontró personal disponible con ese perfil para esa fecha.'}</div>
      )}

      {postulantes.length ? (
        <div className="tbl"><table>
          <thead><tr><th>Postulante</th><th>Origen</th><th>Calif.</th><th>Asistencia</th><th>Eventos</th><th>Estado</th><th></th></tr></thead>
          <tbody>{postulantes.map(p => {
            const w = W(p.trabajador_id)
            return (
              <tr key={p.id}>
                <td><button className="link" onClick={() => verPerfil(w.id)}>{w.nombre}</button></td>
                <td>{ORIGEN[p.origen]}</td><td><Stars r={w.rating} /></td><td className="num">{w.asistencia}%</td><td className="num">{w.eventos}</td>
                <td><Estado e={p.estado} /></td>
                <td>{p.estado === 'pendiente' && !isPast(e.fecha) && (
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <button className="btn btn-primary btn-sm" disabled={lleno || ocupado} title={lleno ? 'Cupo completo' : undefined} onClick={() => responder(p, 'confirmado')}>Confirmar</button>
                    <button className="btn btn-sm" disabled={ocupado} onClick={() => responder(p, 'rechazado')}>Descartar</button>
                  </div>)}</td>
              </tr>
            )
          })}</tbody>
        </table></div>
      ) : <p className="note">Todavía no hay postulaciones para esta vacante.</p>}

      {hoy && confs.length > 0 && <Asistencia confs={confs} W={W} v={v} run={run} ocupado={ocupado} />}
      {!hoy && !isPast(e.fecha) && c > 0 && <p className="note">El registro de entrada, salida y calificación se habilita el día del evento.</p>}
    </div>
  )
}

function Asistencia({ confs, W, v, run, ocupado }) {
  const guardar = (p, cambios) => {
    const a = { entrada: p.asis?.entrada || '', salida: p.asis?.salida || '', calificacion: p.asis?.calificacion || 0, ...cambios }
    return run(() => rpc('registrar_asistencia', {
      p_post: p.id, p_entrada: a.entrada || null, p_salida: a.salida || null, p_cal: Number(a.calificacion) || null
    }))
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="label">Registro de asistencia y horas</span>
      <div className="tbl"><table>
        <thead><tr><th>Persona</th><th>Entrada</th><th>Salida</th><th>Horas</th><th>Calificación</th><th></th></tr></thead>
        <tbody>{confs.map(p => {
          const w = W(p.trabajador_id), a = p.asis || {}
          if (p.estado === 'ausente') return <tr key={p.id}><td>{w.nombre}</td><td colSpan={5}><span className="pill bad">Ausente</span></td></tr>
          return (
            <tr key={p.id + (a.entrada || '') + (a.salida || '') + (a.calificacion || '')}>
              <td>{w.nombre}</td>
              <td><input type="time" defaultValue={a.entrada || ''} aria-label={`Entrada de ${w.nombre}`} onBlur={ev => ev.target.value !== (a.entrada || '') && guardar(p, { entrada: ev.target.value })} /></td>
              <td><input type="time" defaultValue={a.salida || ''} disabled={!a.entrada} aria-label={`Salida de ${w.nombre}`} onBlur={ev => ev.target.value !== (a.salida || '') && guardar(p, { salida: ev.target.value })} /></td>
              <td className="num">{horas(a.entrada, a.salida).toFixed(1)}</td>
              <td><select value={a.calificacion || 0} disabled={!a.salida || ocupado} title={a.salida ? undefined : 'Disponible al registrar la salida'} aria-label={`Calificación de ${w.nombre}`} onChange={ev => guardar(p, { calificacion: +ev.target.value })}>
                {[0, 1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i ? i + ' ★' : '—'}</option>)}</select></td>
              <td>{!a.entrada && <button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => run(() => rpc('marcar_ausente', { p_post: p.id }), n => n ? `Se notificó a ${n} persona(s) disponibles con perfil de ${v.rol}` : 'No hay personas disponibles con ese perfil')}>Marcar ausente</button>}</td>
            </tr>
          )
        })}</tbody>
      </table></div>
      <span className="small muted">Escribe la hora y sal del campo para guardarla. La salida se habilita después de registrar la entrada.</span>
    </div>
  )
}
