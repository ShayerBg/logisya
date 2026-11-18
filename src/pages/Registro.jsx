// Registro del trabajador con el código de invitación que le manda su operador
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, rpc } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { NavPublica } from '../components/Nav'
import { Eyebrow, Ic } from '../components/ui'
import { ROLES, ZONAS } from '../lib/util'

// Crea la cuenta (si no hay sesión) y devuelve true si quedó con sesión activa
export async function crearCuenta(email, password) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  if (error) throw new Error(error.message === 'User already registered' ? 'Ese correo ya tiene cuenta. Entra con tu contraseña.' : error.message)
  if (data.session) return true
  const r = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return !r.error
}

export default function Registro() {
  const { session, refrescarRol } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({ codigo: params.get('codigo') || '', nombre: '', email: '', pass: '', roles: [ROLES[0]], zona: ZONAS[0], bolsa: true, ley: false })
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const toggleRol = r => set('roles', f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r])

  const enviar = async e => {
    e.preventDefault()
    setError(''); setAviso('')
    if (!f.roles.length) return setError('Elige al menos un rol')
    if (!f.ley) return setError('Debes autorizar el tratamiento de tus datos para continuar')
    setEnviando(true)
    try {
      if (!session) {
        if (f.pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
        const ok = await crearCuenta(f.email, f.pass)
        if (!ok) {
          setAviso('Te enviamos un correo para confirmar tu cuenta. Confírmalo, entra con tu correo y contraseña, y vuelve a usar el código.')
          return
        }
      }
      await rpc('unirme_con_invitacion', { p_codigo: f.codigo, p_nombre: f.nombre, p_roles: f.roles, p_zona: f.zona, p_en_bolsa: f.bolsa })
      await refrescarRol()
      toast('Perfil creado. Ya haces parte del equipo.')
      navigate('/trabajador')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <NavPublica />
      <main className="auth-wrap">
        <form className="auth-card wide" onSubmit={enviar}>
          <div><Eyebrow>Invitación de tu operador</Eyebrow><h1 className="h2" style={{ marginTop: 8 }}>Crea tu perfil en LogisYa</h1>
            <p className="small muted" style={{ marginTop: 6 }}>Registrarte y postularte es gratis. Tu perfil y tu historial son tuyos, no de la empresa.</p></div>
          {error && <div className="err">{error}</div>}
          {aviso && <div className="ok-box">{aviso}</div>}
          <div className="formgrid">
            <label className="field">Código de invitación<input required value={f.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="Ej. ECB7Q2" /></label>
            <label className="field">Nombre completo<input required value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Laura Gutiérrez" /></label>
            {!session && <>
              <label className="field">Correo<input type="email" required value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></label>
              <label className="field">Contraseña<input type="password" required minLength={6} value={f.pass} onChange={e => set('pass', e.target.value)} autoComplete="new-password" /></label>
            </>}
          </div>
          <div className="field">Roles en los que trabajas
            <div className="row" style={{ gap: '6px 14px' }}>
              {ROLES.map(r => <label key={r} className="check small" style={{ fontWeight: 400 }}><input type="checkbox" checked={f.roles.includes(r)} onChange={() => toggleRol(r)} /> {r}</label>)}
            </div>
          </div>
          <label className="field">Zona donde vives<select value={f.zona} onChange={e => set('zona', e.target.value)}>{ZONAS.map(z => <option key={z}>{z}</option>)}</select></label>
          <label className="check small"><input type="checkbox" checked={f.bolsa} onChange={e => set('bolsa', e.target.checked)} /> Quiero aparecer en la bolsa compartida de talento</label>
          <label className="check small"><input type="checkbox" checked={f.ley} onChange={e => set('ley', e.target.checked)} /> Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la política de privacidad de LogisYa.</label>
          <div className="row between">
            {!session ? <Link className="small" to="/entrar">Ya tengo cuenta</Link> : <span />}
            <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Creando…' : <>Crear mi perfil <Ic n="arrow" /></>}</button>
          </div>
        </form>
      </main>
    </>
  )
}
