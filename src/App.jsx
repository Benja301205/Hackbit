import { Routes, Route, useLocation } from 'react-router-dom'
import Inicio from './pages/Inicio.jsx'
import CrearGrupo from './pages/CrearGrupo.jsx'
import UnirseGrupo from './pages/UnirseGrupo.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TablaAnual from './pages/TablaAnual.jsx'
import InfoGrupo from './pages/InfoGrupo.jsx'
import CompletarHabito from './pages/CompletarHabito.jsx'
import ValidarHabitos from './pages/ValidarHabitos.jsx'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div key={location.pathname} className="page-enter">
        <Routes location={location}>
          <Route path="/" element={<Inicio />} />
          <Route path="/crear-grupo" element={<CrearGrupo />} />
          <Route path="/unirse/:codigo" element={<UnirseGrupo />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tabla-anual" element={<TablaAnual />} />
          <Route path="/grupo" element={<InfoGrupo />} />
          <Route path="/completar/:habitoId" element={<CompletarHabito />} />
          <Route path="/validar" element={<ValidarHabitos />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
