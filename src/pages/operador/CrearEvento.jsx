import { useState } from 'react'
import { rpc } from '../../lib/supabase'
import { ROLES, ZONAS, hoyISO, sumarDias } from '../../lib/util'
import { Eyebrow, Ic } from '../../components/ui'

const nuevaVacante = () => ({ rol: ROLES[0], ini: '18:00', fin: '23:00', cupos: 2, tarifa: 110000 })

export default function CrearEvento({ run, ocupado, alPublicar }) {
  const [d, setD] = useState({ nombre: '', fecha: sumarDias(hoyISO(), 14), lugar: '', zona: ZONAS[0], plazo: 48, convocar: true, vacs: [nuevaVacante()] })
  const set = (k, v) => setD(x => ({ ...x, [k]: v }))
  const setVac = (i, k, v) => setD(x => ({ ...x, vacs: x.vacs.map((y, j) => j === i ? { ...y, [k]: v } : y) }))

  const publicar = async e => {
    e.preventDefault()
    const id = await run(() => rpc('crear_evento', {
      p_nombre: d.nombre, p_fecha: d.fecha, p_lugar: d.lugar, p_zona: d.zona,
      p_plazo_horas: Number(d.plazo), p_vacantes: d.vacs.map(v => ({ ...v, cupos: Number(v.cupos), tarifa: Number(v.tarifa) })),
      p_convocar: d.convocar
    }), 'Evento publicado. Tu personal ya lo ve en su calendario.')
    if (id) alPublicar(id)
  }

  return (
    <>
      <div className="page-head"><div><Eyebrow>Nuevo evento</Eyebrow>
        <h1 className="h1" style={{ marginTop: 10 }}>Crea el evento<span className="soft" style={{ display: 'block' }}>y define sus turnos</span></h1>
        <p className="lead">Cada vacante se publica primero solo para tu personal. Si no se llena dentro del plazo, pasa sola al calendario general de la bolsa compartida.</p></div></div>
      <form className="panel" style={{ maxWidth: 900 }} onSubmit={publicar}>
        <div className="formgrid">
          <label className="field" style={{ gridColumn: '1/-1' }}>Nombre del evento<input required value={d.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Lanzamiento de producto en Riomar" /></label>
          <label className="field">Fecha<input type="date" required min={hoyISO()} value={d.fecha} onChange={e => set('fecha', e.target.value)} /></label>
          <label className="field">Lugar<input required value={d.lugar} onChange={e => set('lugar', e.target.value)} placeholder="Ej. Centro de Eventos Puerta de Oro" /></label>
          <label className="field">Zona<select value={d.zona} onChange={e => set('zona', e.target.value)}>{ZONAS.map(z => <option key={z}>{z}</option>)}</select></label>
          <label className="field">Plazo solo para mi personal<select value={d.plazo} onChange={e => set('plazo', e.target.value)}>{[12, 24, 48, 72].map(n => <option key={n} value={n}>{n} horas</option>)}</select></label>
        </div>
        <span className="label">Roles y turnos</span>
        {d.vacs.map((v, i) => (
          <div className="vacrow" key={i}>
            <label className="field">Rol<select value={v.rol} onChange={e => setVac(i, 'rol', e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
            <label className="field">Inicio<input type="time" required value={v.ini} onChange={e => setVac(i, 'ini', e.target.value)} /></label>
            <label className="field">Fin<input type="time" required value={v.fin} onChange={e => setVac(i, 'fin', e.target.value)} /></label>
            <label className="field">Cupos<input type="number" min="1" required value={v.cupos} onChange={e => setVac(i, 'cupos', e.target.value)} /></label>
            <label className="field">Pago por turno (COP)<input type="number" min="0" step="5000" required value={v.tarifa} onChange={e => setVac(i, 'tarifa', e.target.value)} /></label>
            {d.vacs.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => set('vacs', d.vacs.filter((_, j) => j !== i))}>Quitar</button>}
          </div>
        ))}
        <div><button type="button" className="btn btn-soft btn-sm" onClick={() => set('vacs', [...d.vacs, { ...nuevaVacante(), cupos: 1, tarifa: 100000 }])}>+ Agregar rol</button></div>
        <label className="check"><input type="checkbox" checked={d.convocar} onChange={e => set('convocar', e.target.checked)} /> Convocar ahora a mi personal registrado con esos roles</label>
        <div className="row between"><span className="small muted">El pago lo define y lo hace el operador. LogisYa no cobra al trabajador ni toma margen.</span>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>Publicar evento <Ic n="arrow" /></button></div>
      </form>
    </>
  )
}
