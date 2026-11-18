// Registro de una empresa operadora de eventos
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { rpc } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { NavPublica } from '../components/Nav'
import { Eyebrow, Ic } from '../components/ui'
import { crearCuenta } from './Registro'

export default function RegistroEmpresa() {
  const { session, refrescarRol } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({ empresa: '', email: '', pass: '' })
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const enviar = async e => {
    e.preventDefault()
    setError(''); setAviso(''); setEnviando(true)
    try {
      if (!session) {
        if (f.pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
        const ok = await crearCuenta(f.email, f.pass)
        if (!ok) {
          setAviso('Te enviamos un correo para confirmar la cuenta. Confírmalo, entra y termina el registro de la empresa.')
          return
        }
      }
      await rpc('registrar_operador', { p_nombre: f.empresa })
      await refrescarRol()
      toast('Empresa registrada. Ya puedes crear tu primer evento.')
      navigate('/operador')
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
        <form className="auth-card" onSubmit={enviar}>
          <div><Eyebrow>Para operadores</Eyebrow><h1 className="h2" style={{ marginTop: 8 }}>Registra tu empresa</h1>
            <p className="small muted" style={{ marginTop: 6 }}>Crea eventos, convoca a tu personal y comparte la bolsa de talento con otros operadores.</p></div>
          {error && <div className="err">{error}</div>}
          {aviso && <div className="ok-box">{aviso}</div>}
          <label className="field">Nombre de la empresa<input required value={f.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Ej. Eventos del Río SAS" /></label>
          {!session && <>
            <label className="field">Correo<input type="email" required value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></label>
            <label className="field">Contraseña<input type="password" required minLength={6} value={f.pass} onChange={e => set('pass', e.target.value)} autoComplete="new-password" /></label>
          </>}
          <div className="row between">
            {!session ? <Link className="small" to="/entrar">Ya tengo cuenta</Link> : <span />}
            <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Registrando…' : <>Registrar empresa <Ic n="arrow" /></>}</button>
          </div>
        </form>
      </main>
    </>
  )
}
