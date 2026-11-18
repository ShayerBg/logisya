import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Loading } from './components/ui'
import Landing from './pages/Landing'
import Entrar from './pages/Entrar'
import Registro from './pages/Registro'
import RegistroEmpresa from './pages/RegistroEmpresa'
import Bienvenida from './pages/Bienvenida'
import Operador from './pages/operador/Operador'
import Trabajador from './pages/trabajador/Trabajador'

// Manda a cada usuario a su panel según su rol
function AlPanel() {
  const { session, rol } = useAuth()
  if (session === undefined || (session && rol === undefined)) return <Loading />
  if (!session) return <Navigate to="/entrar" replace />
  if (rol?.operador) return <Navigate to="/operador" replace />
  if (rol?.trabajador) return <Navigate to="/trabajador" replace />
  return <Navigate to="/bienvenida" replace />
}

// Protege las rutas internas
function Requiere({ tipo, children }) {
  const { session, rol } = useAuth()
  if (session === undefined || (session && rol === undefined)) return <Loading />
  if (!session) return <Navigate to="/entrar" replace />
  if (!rol?.[tipo]) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/registro-empresa" element={<RegistroEmpresa />} />
      <Route path="/bienvenida" element={<Bienvenida />} />
      <Route path="/app" element={<AlPanel />} />
      <Route path="/operador" element={<Requiere tipo="operador"><Operador /></Requiere>} />
      <Route path="/trabajador" element={<Requiere tipo="trabajador"><Trabajador /></Requiere>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
