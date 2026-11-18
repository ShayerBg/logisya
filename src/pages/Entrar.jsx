import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { NavPublica } from '../components/Nav'
import { Eyebrow, Ic } from '../components/ui'

const DEMOS = [
  ['caribe@logisya.demo', 'Operador · Eventos Caribe BTL'],
  ['andrea@logisya.demo', 'Trabajadora · Andrea Pérez']
]

export default function Entrar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/app" replace />

  const entrar = async e => {
    e.preventDefault()
    setError(''); setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    setEnviando(false)
    if (error) setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message)
    else navigate('/app')
  }

  return (
    <>
      <NavPublica />
      <main className="auth-wrap">
        <form className="auth-card" onSubmit={entrar}>
          <div><Eyebrow>Bienvenido</Eyebrow><h1 className="h2" style={{ marginTop: 8 }}>Entra a LogisYa</h1></div>
          {error && <div className="err">{error}</div>}
          <label className="field">Correo<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
          <label className="field">Contraseña<input type="password" required value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" /></label>
          <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Entrando…' : <>Entrar <Ic n="arrow" /></>}</button>
          <div className="note">
            <strong style={{ color: 'var(--ink)' }}>Cuentas de prueba</strong>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              {DEMOS.map(([m, t]) => (
                <button type="button" key={m} className="link small" onClick={() => setEmail(m)}>{t} · {m}</button>
              ))}
            </div>
          </div>
          <div className="row between small">
            <Link to="/registro">Tengo un código de invitación</Link>
            <Link to="/registro-empresa">Registrar mi empresa</Link>
          </div>
        </form>
      </main>
    </>
  )
}
