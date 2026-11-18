import { useState } from 'react'
import './trabajador.css'
import Nav, { Footer } from '../../components/Nav'
import { Ic, Loading } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useLogis, conf } from '../../lib/useLogis'
import { useAccion } from '../../lib/useAccion'
import { rpc } from '../../lib/supabase'
import { cop, fdate, isPast, isToday } from '../../lib/util'
import Calendario from './Calendario'
import MisPostulaciones from './MisPostulaciones'
import Perfil from './Perfil'

const TABS = [['calendario', 'Calendario'], ['mis', 'Mis postulaciones'], ['perfil', 'Mi perfil']]

// De dónde le llega la vacante a este trabajador
export function origenPara(db, e, v, me) {
  if (v.reemplazo?.notificados.includes(me.id)) return 'reemplazo'
  return db.VINC.some(x => x.operador_id === e.operador_id && x.trabajador_id === me.id) ? 'propio' : 'bolsa'
}

export default function Trabajador() {
  const { rol } = useAuth()
  const { db, error, recargar } = useLogis()
  const accion = useAccion(recargar)
  const [vista, setVista] = useState('calendario')
  const me = db?.W[rol.trabajador]
  const ir = v => { setVista(v); window.scrollTo(0, 0) }

  const postular = (e, v) => accion.run(() => rpc('postularme', { p_vacante: v.id }), `Te postulaste como ${v.rol}. ${db.OPS[e.operador_id]?.nombre || 'El operador'} revisará tu perfil.`)
  const ctx = { db, me, ...accion, recargar, postular }

  return (
    <>
      <Nav tabs={TABS} activa={vista} onTab={ir} nombre={me?.nombre} />
      <main className="page">
        {error && <div className="err">No se pudieron cargar los datos: {error}</div>}
        {!db || !me ? <Loading /> : <>
          <Urgentes {...ctx} />
          {vista === 'calendario' ? <Calendario {...ctx} /> : vista === 'mis' ? <MisPostulaciones {...ctx} /> : <Perfil {...ctx} />}
        </>}
      </main>
      <Footer izq="LogisYa" der="Registrarte y postularte es gratis. Ningún operador te puede cobrar por usar LogisYa." />
    </>
  )
}

function Urgentes({ db, me, postular, ocupado }) {
  const out = []
  db.EVENTS.forEach(e => e.vacantes.forEach(v => {
    if (v.reemplazo?.notificados.includes(me.id) && !v.postulaciones.some(p => p.trabajador_id === me.id) && conf(v) < v.cupos && !isPast(e.fecha)) out.push([e, v])
  }))
  return out.map(([e, v]) => (
    <div className="alert urgente" key={v.id}>
      <span><strong>Reemplazo urgente.</strong> {db.OPS[e.operador_id]?.nombre} necesita {v.rol} {isToday(e.fecha) ? 'hoy' : fdate(e.fecha)} en {e.lugar}, <span className="num">{v.ini}–{v.fin}</span>, {cop(v.tarifa)}.</span>
      <button className="btn btn-primary btn-sm" disabled={ocupado} onClick={() => postular(e, v)}>Postularme <Ic n="arrow" /></button>
    </div>
  ))
}
