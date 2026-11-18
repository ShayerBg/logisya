// Para quien ya tiene cuenta pero todavía no es operador ni trabajador
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { NavPublica } from '../components/Nav'
import { Eyebrow, Ic, Loading } from '../components/ui'

export default function Bienvenida() {
  const { session, rol, salir } = useAuth()
  if (session === undefined || (session && rol === undefined)) return <Loading />
  if (!session) return <Navigate to="/entrar" replace />
  if (rol?.operador || rol?.trabajador) return <Navigate to="/app" replace />
  return (
    <>
      <NavPublica />
      <main className="auth-wrap">
        <div className="auth-card wide">
          <div><Eyebrow>Un paso más</Eyebrow><h1 className="h2" style={{ marginTop: 8 }}>¿Cómo vas a usar LogisYa?</h1>
            <p className="small muted" style={{ marginTop: 6 }}>Entraste como {session.user.email}. Elige una opción para terminar tu registro.</p></div>
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            <Link to="/registro" className="kcard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="tile t3"><Ic n="users" /></span><div><div className="lab">Soy trabajador</div><div className="sub">Tengo un código de invitación de un operador.</div></div></Link>
            <Link to="/registro-empresa" className="kcard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="tile t4"><Ic n="cal" /></span><div><div className="lab">Soy operador</div><div className="sub">Quiero registrar mi empresa y crear eventos.</div></div></Link>
          </div>
          <button className="btn btn-soft btn-sm" style={{ justifySelf: 'start' }} onClick={salir}>Salir</button>
        </div>
      </main>
    </>
  )
}
