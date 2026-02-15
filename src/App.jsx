import { Routes, Route, useLocation } from 'react-router-dom'
import Gate from './components/Gate.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CrearGrupo from './pages/CrearGrupo.jsx'
import UnirseGrupo from './pages/UnirseGrupo.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TablaAnual from './pages/TablaAnual.jsx'
import InfoGrupo from './pages/InfoGrupo.jsx'
import CompletarHabito from './pages/CompletarHabito.jsx'
import Actividad from './pages/Actividad.jsx'
import Disputa from './pages/Disputa.jsx'
import EditarGrupo from './pages/EditarGrupo.jsx'
import MisGrupos from './pages/MisGrupos.jsx'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500 selection:text-white">
      <div key={location.pathname} className="page-enter">
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<Gate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unirse/:codigo" element={<UnirseGrupo />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route path="/mis-grupos" element={<MisGrupos />} />
            <Route path="/crear-grupo" element={<CrearGrupo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tabla-anual" element={<TablaAnual />} />
            <Route path="/grupo" element={<InfoGrupo />} />
            <Route path="/completar/:habitoId" element={<CompletarHabito />} />
            <Route path="/actividad" element={<Actividad />} />
            <Route path="/disputa/:disputaId" element={<Disputa />} />
            <Route path="/editar-grupo" element={<EditarGrupo />} />
          </Route>
        </Routes>
      </div>
    </div>
  )
}

export default App
