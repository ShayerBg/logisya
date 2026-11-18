import { Link } from 'react-router-dom'
import './landing.css'
import { NavPublica, Footer } from '../components/Nav'
import { Ic, Eyebrow } from '../components/ui'
import { DIAS_L } from '../lib/util'

const FEATURES = [
  ['t1', 'users', 'Convocatoria propia', 'Cada vacante se publica primero solo para tu equipo.'],
  ['t2', 'check', 'Confirmación clara', 'Sabes quién confirmó, quién falta y cuántos cupos quedan.'],
  null,
  ['t3', 'clock', 'Horas verificables', 'Entrada, salida y calificación quedan registradas por evento.'],
  ['t4', 'globe', 'Bolsa compartida', 'Si el cupo no se llena, la vacante se abre sola al calendario general.']
]

export default function Landing() {
  return (
    <>
      <NavPublica />
      <section className="hero" id="top"><div className="hero-in">
        <div className="badges">
          <span><Ic n="check" />Gestión de personal para operadores de eventos</span>
          <span><Ic n="check" />Bolsa de talento <b>compartida</b> y recíproca</span>
        </div>
        <h1>Tu personal de eventos, confirmado.</h1>
        <p className="sub">Crea el evento, define roles y turnos, convoca a tu equipo y registra las horas trabajadas. Sin grupos de WhatsApp ni hojas de cálculo.</p>
        <div className="ctas">
          <Link className="btn btn-primary" to="/entrar">Entrar a LogisYa <Ic n="arrow" /></Link>
          <Link className="btn btn-text" to="/registro-empresa">Registrar mi empresa</Link>
        </div>
        <div className="visual" aria-hidden="true">
          <div className="cred">
            <div className="row between"><span className="chip"></span><strong style={{ fontSize: 14 }}>LogisYa</strong></div>
            <div><div className="who">Andrea Pérez</div><div className="role">MESERA · 17:00–01:00</div></div>
            <div className="foot"><div><small>Entrada</small>16:52</div><div><small>Evento</small>Cena de gala</div></div>
          </div>
          <div className="disc"></div>
          <div className="mini">
            <div className="top"><span className="tile t1"><Ic n="users" /></span><div><b>Eventos Caribe BTL</b><span>Cupos de esta semana</span></div></div>
            <div className="body"><div><small>Cupos cubiertos</small><div><span className="big">11/16</span><span className="up">69%</span></div></div>
              <svg width="70" height="30" viewBox="0 0 70 30"><path d="M2 26 L12 22 L20 24 L30 15 L38 18 L48 9 L56 11 L68 3" fill="none" stroke="#2BC48A" strokeWidth="2" strokeLinejoin="round" /><path d="M2 26 L12 22 L20 24 L30 15 L38 18 L48 9 L56 11 L68 3 L68 30 L2 30Z" fill="#2BC48A" opacity=".12" /></svg></div>
          </div>
        </div>
      </div></section>

      <section className="section" id="como">
        <h2 className="h2 center" style={{ fontSize: 'clamp(1.7rem,3.4vw,2.4rem)' }}>Coordina a tu personal operativo<span className="soft" style={{ display: 'block' }}>sin perder a nadie en el chat</span></h2>
        <div className="features">
          {FEATURES.map((f, i) => f
            ? <div className="kcard" key={i}><span className={`tile ${f[0]}`}><Ic n={f[1]} /></span><div><div className="lab">{f[2]}</div><p>{f[3]}</p></div></div>
            : <div className="kcard fdisc" key={i} aria-hidden="true"><div className="disc"></div></div>)}
        </div>
      </section>

      <section className="section" id="vistas" style={{ paddingTop: 70 }}>
        <div className="page-head"><div><Eyebrow>Dos vistas</Eyebrow>
          <h2 className="h1" style={{ marginTop: 10, maxWidth: '16ch' }}>Un mismo evento, dos lados de la operación.</h2>
          <p className="lead">El operador publica y confirma. El trabajador consulta su calendario y se postula. Lo que hagas en una vista se refleja en la otra al instante.</p></div>
          <Link className="btn btn-primary" to="/registro-empresa">Empezar como operador <Ic n="arrow" /></Link></div>
        <div className="views">
          <Link className="view dark" to="/entrar">
            <div><span className="pill acc">Vista del operador</span><h3 style={{ marginTop: 14 }}>Eventos, turnos y asistencia en un solo panel.</h3>
              <p>Crea eventos, convoca a tu equipo, revisa postulaciones con historial y calificación, registra horas y activa reemplazos de última hora.</p></div>
            <div className="wcard"><div className="r"><strong>Cena de gala aniversario</strong><span className="pill dark">Hoy</span></div>
              <div className="r"><span className="muted">Mesero/a · 17:00–01:00</span><span className="num"><strong>3</strong>/3</span></div>
              <div className="r"><span className="muted">Supervisor de piso</span><span className="num"><strong>1</strong>/1</span></div></div>
          </Link>
          <Link className="view light" to="/registro">
            <div><span className="pill">Vista del trabajador</span><h3 style={{ marginTop: 14 }}>Un calendario con las vacantes que son para ti.</h3>
              <p>Filtra por rol, fecha, disponibilidad y zona, y postúlate en un clic. Tu perfil y tu historial son tuyos, no de la empresa.</p></div>
            <div className="wcard"><strong style={{ fontSize: 18 }}>Mi disponibilidad</strong><span className="small muted">Turnos de fin de semana</span>
              <div className="daychips">{[6, 0, 1, 2, 3, 4, 5].map(i => <button key={i} tabIndex={-1} aria-pressed={[6, 0, 5].includes(i)}>{DIAS_L[i]}</button>)}</div></div>
          </Link>
        </div>
      </section>
      <Footer />
    </>
  )
}
