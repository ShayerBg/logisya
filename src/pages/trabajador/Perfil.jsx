import { useState } from 'react'
import { supabase, rpc } from '../../lib/supabase'
import { fdate } from '../../lib/util'
import { Eyebrow, Ic } from '../../components/ui'
import { HistorialTabla } from '../../components/Historial'

export default function Perfil({ db, me, run, ocupado }) {
  const [codigo, setCodigo] = useState('')
  const misOps = db.VINC.filter(x => x.trabajador_id === me.id).map(x => db.OPS[x.operador_id]).filter(Boolean)

  const toggleBolsa = checked => run(async () => {
    const { error } = await supabase.from('trabajadores').update({ en_bolsa: checked }).eq('id', me.id)
    if (error) throw new Error(error.message)
  }, checked ? 'Ahora apareces en la bolsa compartida' : 'Saliste de la bolsa compartida')

  const unirme = async e => {
    e.preventDefault()
    const ok = await run(() => rpc('unirme_con_invitacion', { p_codigo: codigo, p_nombre: me.nombre, p_roles: me.roles, p_zona: me.zona, p_en_bolsa: me.en_bolsa }), 'Te uniste al equipo de un nuevo operador')
    if (ok) setCodigo('')
  }

  return (
    <>
      <div className="page-head"><div><Eyebrow>Mi perfil</Eyebrow>
        <h1 className="h1" style={{ marginTop: 10 }}>{me.nombre}<span className="soft" style={{ display: 'block' }}>{me.roles.join(' · ')}</span></h1></div></div>
      <div className="kpis">
        <div className="kcard"><span className="tile t4"><Ic n="star" /></span><div className="lab">Calificación</div><div className="num">{me.rating.toFixed(1)}</div></div>
        <div className="kcard"><span className="tile t3"><Ic n="check" /></span><div className="lab">Asistencia</div><div className="num">{me.asistencia}%</div></div>
        <div className="kcard"><span className="tile t1"><Ic n="cal" /></span><div className="lab">Eventos trabajados</div><div className="num">{me.eventos}</div></div>
        <div className="kcard"><span className="tile t2"><Ic n="pin" /></span><div className="lab">Zona</div><div className="sub" style={{ fontSize: 15, color: 'var(--ink)' }}>{me.zona}</div></div>
      </div>
      <div className="grid2">
        <div className="stack">
          <div className="kcard"><span className="tile t4"><Ic n="globe" /></span>
            <label className="switch"><input type="checkbox" checked={me.en_bolsa} disabled={ocupado} onChange={e => toggleBolsa(e.target.checked)} />
              <span><strong>Aparecer en la bolsa compartida</strong><br /><span className="small muted">Otros operadores podrán ver tu historial y calificaciones, y te llegarán vacantes del calendario general.</span></span></label></div>
          <div className="kcard"><span className="tile t1"><Ic n="shield" /></span>
            <div><div className="lab">Autorización de datos</div><div className="sub">Otorgada el {fdate(me.desde)} al registrarte. Tus datos son tuyos: puedes consultarlos, corregirlos o retirar la autorización cuando quieras (Ley 1581 de 2012).</div></div></div>
          <div className="kcard"><span className="tile t2"><Ic n="users" /></span>
            <div className="lab">Operadores que me invitaron</div>
            <div className="row">{misOps.map(o => <span key={o.id} className="pill">{o.nombre}</span>)}</div>
            <form className="row" onSubmit={unirme} style={{ flexWrap: 'nowrap' }}>
              <input className="mono" style={{ flex: 1, minWidth: 0, padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }} placeholder="Código de otro operador" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} required />
              <button className="btn btn-sm btn-dark" disabled={ocupado}>Unirme</button>
            </form>
          </div>
        </div>
        <div className="panel"><h3>Historial verificado</h3><HistorialTabla trabajadorId={me.id} /></div>
      </div>
    </>
  )
}
