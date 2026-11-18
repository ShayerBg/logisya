import { useState } from 'react'
import './operador.css'
import Nav, { Footer } from '../../components/Nav'
import { Loading } from '../../components/ui'
import { PerfilDialog } from '../../components/Historial'
import { useAuth } from '../../lib/auth'
import { useLogis } from '../../lib/useLogis'
import { useAccion } from '../../lib/useAccion'
import Eventos from './Eventos'
import CrearEvento from './CrearEvento'
import Bolsa from './Bolsa'

const TABS = [['eventos', 'Eventos'], ['crear', 'Crear evento'], ['bolsa', 'Personal y bolsa']]

export default function Operador() {
  const { rol } = useAuth()
  const { db, error, recargar } = useLogis()
  const accion = useAccion(recargar)
  const [vista, setVista] = useState('eventos')
  const [evSel, setEvSel] = useState(null)
  const [perfil, setPerfil] = useState(null)

  const op = db?.OPS[rol.operador]
  const ir = v => { setVista(v); window.scrollTo(0, 0) }
  const ctx = { db, op, ...accion, recargar, verPerfil: id => setPerfil(db.W[id] || null) }

  return (
    <>
      <Nav tabs={TABS} activa={vista} onTab={ir} nombre={op?.nombre} />
      <main className="page">
        {error && <div className="err">No se pudieron cargar los datos: {error}</div>}
        {!db || !op ? <Loading /> :
          vista === 'eventos' ? <Eventos {...ctx} sel={evSel} setSel={setEvSel} irCrear={() => ir('crear')} /> :
          vista === 'crear' ? <CrearEvento {...ctx} alPublicar={id => { setEvSel(id); ir('eventos') }} /> :
          <Bolsa {...ctx} />}
      </main>
      <Footer izq="LogisYa · panel del operador" der="Los cambios se ven al instante en la vista del trabajador." />
      <PerfilDialog key={perfil?.id} w={perfil} onClose={() => setPerfil(null)} />
    </>
  )
}
