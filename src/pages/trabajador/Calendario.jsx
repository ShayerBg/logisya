import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { conf } from '../../lib/useLogis'
import { D, DIAS, DIAS_L, MESES, ROLES, ZONAS, cop, fdate, hoyISO, iso, isPast, isToday } from '../../lib/util'
import { Eyebrow, Estado, Ic } from '../../components/ui'
import { origenPara } from './Trabajador'

function proximoTurno(db, me) {
  const c = []
  db.EVENTS.forEach(e => e.vacantes.forEach(v => {
    if (!isPast(e.fecha) && v.postulaciones.some(p => p.trabajador_id === me.id && p.estado === 'confirmado')) c.push([e, v])
  }))
  return c[0]
}

function Banner({ db, me, run, ocupado }) {
  const n = proximoTurno(db, me)
  const toggleDia = i => run(async () => {
    const disp = me.disp.includes(i) ? me.disp.filter(x => x !== i) : [...me.disp, i].sort()
    const { error } = await supabase.from('trabajadores').update({ disp }).eq('id', me.id)
    if (error) throw new Error(error.message)
  })
  return (
    <section className="banner">
      <div><Eyebrow style={{ color: '#C7B6FF' }}>Tu calendario de eventos</Eyebrow>
        <h1 style={{ marginTop: 10 }}>Hola, {me.nombre.split(' ')[0]}.<br />Elige tus turnos.</h1>
        <p>Mira las oportunidades por fecha, filtra por tu rol y tu zona, y postúlate directamente. El operador confirma la selección.</p>
        {n && <div className="next"><span className="pill ok">Próximo turno</span><span>{n[1].rol} · {n[0].nombre} · {isToday(n[0].fecha) ? 'hoy' : fdate(n[0].fecha)} <span className="num">{n[1].ini}</span></span></div>}
      </div>
      <div className="sched"><h3>Mi disponibilidad</h3><span className="small muted">Los días marcados se usan para filtrar vacantes y para avisarte de reemplazos.</span>
        <div className="daychips">{[6, 0, 1, 2, 3, 4, 5].map(i => <button key={i} disabled={ocupado} aria-pressed={me.disp.includes(i)} onClick={() => toggleDia(i)}>{DIAS_L[i]}</button>)}</div></div>
    </section>
  )
}

function VCard({ db, me, e, v, postular, ocupado }) {
  const p = v.postulaciones.find(p => p.trabajador_id === me.id)
  const libres = v.cupos - conf(v)
  const org = origenPara(db, e, v, me)
  const badge = org === 'reemplazo' ? <span className="pill bad">Reemplazo urgente</span>
    : org === 'propio' ? (v.fase === 'propio' ? <span className="pill acc">Te convocaron</span> : <span className="pill">Tu operador</span>)
    : <span className="pill ok">Calendario general</span>
  let act
  if (p) act = p.estado === 'pendiente' ? <span className="pill warn">Postulación enviada</span> : <Estado e={p.estado} />
  else if (libres <= 0) act = <span className="pill">Cupo completo</span>
  else if (!me.roles.includes(v.rol)) act = <span className="small muted">Este rol no está en tu perfil</span>
  else act = <button className="btn btn-primary btn-sm" disabled={ocupado} onClick={() => postular(e, v)}>Postularme <Ic n="arrow" /></button>
  return (
    <article className={`vcard ${org === 'reemplazo' && !p ? 'urgent' : ''}`}>
      <div className="row between"><h3>{v.rol} · {e.nombre}</h3>{badge}</div>
      <div className="meta"><span><Ic n="users" />{db.OPS[e.operador_id]?.nombre}</span><span><Ic n="cal" />{fdate(e.fecha)}</span><span><Ic n="clock" /><span className="num">{v.ini}–{v.fin}</span></span><span><Ic n="pin" />{e.lugar}, {e.zona}</span></div>
      <div className="row between"><span><span className="price num">{cop(v.tarifa)}</span> <span className="small muted">por turno · {libres > 0 ? `${libres} cupo(s) libre(s)` : 'sin cupos'}</span></span>{act}</div>
    </article>
  )
}

export default function Calendario(ctx) {
  const { db, me } = ctx
  const hoy = D(hoyISO())
  const [cal, setCal] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() })
  const [f, setF] = useState({ rol: '', zona: '', disp: false, fecha: '' })
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const oportunidades = ignorarFecha => {
    const out = []
    db.EVENTS.forEach(e => e.vacantes.forEach(v => {
      if (isPast(e.fecha)) return
      if (f.rol ? v.rol !== f.rol : !me.roles.includes(v.rol)) return
      if (f.zona && e.zona !== f.zona) return
      if (f.disp && !me.disp.includes(D(e.fecha).getDay())) return
      if (!ignorarFecha && f.fecha && e.fecha !== f.fecha) return
      out.push([e, v])
    }))
    return out
  }

  const { y, m } = cal
  const first = new Date(y, m, 1), dias = new Date(y, m + 1, 0).getDate()
  const porFecha = {}
  oportunidades(true).forEach(([e]) => { porFecha[e.fecha] = (porFecha[e.fecha] || 0) + 1 })
  const lista = oportunidades(false)
  const mover = d => setCal(({ y, m }) => { let mm = m + d, yy = y; if (mm < 0) { mm = 11; yy-- } if (mm > 11) { mm = 0; yy++ } return { y: yy, m: mm } })

  return (
    <>
      <Banner {...ctx} />
      <div className="grid2">
        <div className="panel" style={{ gap: 14 }}>
          <div className="row between"><button className="btn btn-soft btn-sm" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button>
            <h3 style={{ textTransform: 'capitalize', fontSize: 17 }}>{MESES[m]} {y}</h3>
            <button className="btn btn-soft btn-sm" onClick={() => mover(1)} aria-label="Mes siguiente">›</button></div>
          <div className="cal">
            {DIAS.map(d => <div className="dh" key={d}>{d}</div>)}
            {Array.from({ length: first.getDay() }, (_, i) => <button key={'x' + i} className="off" tabIndex={-1} aria-hidden="true" />)}
            {Array.from({ length: dias }, (_, i) => {
              const d = i + 1, ds = iso(new Date(y, m, d)), n = porFecha[ds] || 0, dow = new Date(y, m, d).getDay()
              const cls = [n && 'has', f.fecha === ds && 'sel', isToday(ds) && 'today', !me.disp.includes(dow) && 'unavail'].filter(Boolean).join(' ')
              return <button key={ds} className={cls} onClick={() => set('fecha', f.fecha === ds ? '' : ds)} aria-label={`${d} de ${MESES[m]}${n ? `, ${n} vacante(s)` : ''}`}>{d}</button>
            })}
          </div>
          <span className="small muted">Los días en morado tienen vacantes para ti. Los grises no están en tu disponibilidad.</span>
          <label className="field">Rol<select value={f.rol} onChange={e => set('rol', e.target.value)}><option value="">Mis roles</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
          <label className="field">Ubicación<select value={f.zona} onChange={e => set('zona', e.target.value)}><option value="">Barranquilla y área metropolitana</option>{ZONAS.map(z => <option key={z}>{z}</option>)}</select></label>
          <label className="check"><input type="checkbox" checked={f.disp} onChange={e => set('disp', e.target.checked)} /> Solo días en que estoy disponible</label>
        </div>
        <div className="stack">
          <div className="row between"><div><Eyebrow>Oportunidades</Eyebrow>
            <h2 className="h2" style={{ marginTop: 6 }}>{f.fecha ? fdate(f.fecha) : 'Próximos eventos'}<span className="soft"> · {lista.length}</span></h2></div>
            {f.fecha && <button className="btn btn-soft btn-sm" onClick={() => set('fecha', '')}>Ver todas las fechas</button>}</div>
          {lista.length ? lista.map(([e, v]) => <VCard key={v.id} e={e} v={v} {...ctx} />)
            : <p className="note">No hay vacantes con esos filtros. Prueba otra fecha, otra zona o quita el filtro de disponibilidad.</p>}
        </div>
      </div>
    </>
  )
}
