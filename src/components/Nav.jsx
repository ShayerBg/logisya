import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './ui'
import { useAuth } from '../lib/auth'

// Barra negra superior de las vistas internas
export default function Nav({ tabs = [], activa, onTab, nombre }) {
  const { salir } = useAuth()
  const navigate = useNavigate()
  const cerrar = async () => { await salir(); navigate('/') }
  return (
    <header className="nav">
      <div className="nav-in">
        <Link className="logo" to="/"><Logo />LogisYa</Link>
        <nav className="nav-links" aria-label="Secciones">
          {tabs.map(([k, t]) => (
            <button key={k} onClick={() => onTab(k)} aria-current={k === activa ? 'page' : undefined}>{t}</button>
          ))}
        </nav>
        <div className="nav-right">
          {nombre && <span className="nav-user" title={nombre}>{nombre}</span>}
          <button className="btn btn-dark btn-sm" onClick={cerrar}>Salir</button>
        </div>
      </div>
    </header>
  )
}

// Barra para páginas públicas (inicio, entrar, registro)
export function NavPublica() {
  const { session } = useAuth()
  return (
    <header className="nav">
      <div className="nav-in">
        <Link className="logo" to="/"><Logo />LogisYa</Link>
        <nav className="nav-links" aria-label="Secciones">
          <a href="/#como">Cómo funciona</a>
          <a href="/#vistas">Vistas</a>
          <Link to="/registro-empresa">Para operadores</Link>
          <Link to="/registro">Para trabajadores</Link>
        </nav>
        <div className="nav-right">
          <Link className="btn btn-dark btn-sm" to={session ? '/app' : '/entrar'}>{session ? 'Ir a mi panel' : 'Entrar'}</Link>
        </div>
      </div>
    </header>
  )
}

export function Footer({ izq = 'LogisYa', der = 'Se cobra solo al operador. Nunca al trabajador.' }) {
  return <footer className="footer" style={{ marginTop: 60 }}><div><span>{izq}</span><span>{der}</span></div></footer>
}
