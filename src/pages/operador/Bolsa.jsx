import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../lib/toast'
import { ROLES, linkInvitacion } from '../../lib/util'
import { Eyebrow, Ic, Stars } from '../../components/ui'

export default function Bolsa({ db, op, run, ocupado, verPerfil }) {
  const toast = useToast()
  const [tab, setTab] = useState('mios')
  const [rol, setRol] = useState('')
  const misIds = new Set(db.VINC.filter(x => x.operador_id === op.id).map(x => x.trabajador_id))
  const todos = Object.values(db.W).sort((a, b) => a.nombre.localeCompare(b.nombre))
  const mios = todos.filter(w => misIds.has(w.id))
  const otros = todos.filter(w => !misIds.has(w.id) && w.en_bolsa)
  const link = linkInvitacion(op.invite_code)

  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); toast('Enlace copiado') }
    catch { toast('No se pudo copiar. Selecciónalo y cópialo con Ctrl+C') }
  }
  const compartir = checked => run(async () => {
    const { error } = await supabase.from('operadores').update({ compartir: checked }).eq('id', op.id)
    if (error) throw new Error(error.message)
  }, checked ? 'Tu personal ahora es visible en la bolsa compartida' : 'Dejaste de compartir tu personal')

  const Tabla = ({ ws }) => {
    const filtrados = ws.filter(w => !rol || w.roles.includes(rol))
    return (
      <div className="tbl"><table>
        <thead><tr><th>Nombre</th><th>Roles</th><th>Zona</th><th>Calif.</th><th>Asistencia</th><th>Eventos</th></tr></thead>
        <tbody>{filtrados.length ? filtrados.map(w => (
          <tr key={w.id}><td><button className="link" onClick={() => verPerfil(w.id)}>{w.nombre}</button></td><td className="small">{w.roles.join(', ')}</td><td className="small">{w.zona}</td>
            <td><Stars r={w.rating} /></td><td className="num">{w.asistencia}%</td><td className="num">{w.eventos}</td></tr>
        )) : <tr><td colSpan={6} className="muted">Nadie con ese rol.</td></tr>}</tbody>
      </table></div>
    )
  }

  return (
    <>
      <div className="page-head"><div><Eyebrow>Personal y bolsa</Eyebrow>
        <h1 className="h1" style={{ marginTop: 10 }}>Tu equipo<span className="soft" style={{ display: 'block' }}>y la bolsa compartida</span></h1></div></div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div className="kcard"><span className="tile t1"><Ic n="users" /></span>
          <div><div className="lab">Invitar a mi personal</div><div className="sub">Comparte el enlace por WhatsApp. Cada persona crea su propio perfil y autoriza el tratamiento de sus datos (Ley 1581 de 2012). Tu código es <strong className="mono">{op.invite_code}</strong>.</div></div>
          <div className="copybox" style={{ background: '#fff' }}><code>{link}</code><button className="btn btn-sm btn-dark" onClick={copiar}>Copiar</button></div>
        </div>
        <div className="kcard"><span className="tile t4"><Ic n="globe" /></span>
          <div><div className="lab">Bolsa compartida</div><div className="sub">El acceso es recíproco: para ver el personal de otras empresas, y para que tus vacantes lleguen al calendario general, debes compartir el tuyo.</div></div>
          <label className="switch"><input type="checkbox" checked={op.compartir} disabled={ocupado} onChange={e => compartir(e.target.checked)} />
            <span><strong>Compartir mi personal</strong><br /><span className="small muted">Solo quienes aceptaron estar en la bolsa.</span></span></label>
        </div>
      </div>
      <div className="panel">
        <div className="seg" role="group" aria-label="Lista de personal">
          <button aria-pressed={tab === 'mios'} onClick={() => setTab('mios')}><span className="tile t2"><Ic n="users" /></span>Mi personal · {mios.length}</button>
          <button aria-pressed={tab === 'otros'} onClick={() => setTab('otros')}><span className="tile t4"><Ic n="globe" /></span>Otros operadores · {op.compartir ? otros.length : 'bloqueado'}</button>
        </div>
        <div className="bolsa-head"><span className="small muted">Haz clic en un nombre para ver su historial verificado.</span>
          <select value={rol} onChange={e => setRol(e.target.value)} aria-label="Filtrar por rol"><option value="">Todos los roles</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
        {tab === 'mios' ? <Tabla ws={mios} /> : op.compartir ? <Tabla ws={otros} /> : <p className="note">Activa “Compartir mi personal” para consultar perfiles, historial y calificaciones de otros operadores.</p>}
      </div>
    </>
  )
}
