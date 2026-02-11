import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'

export default function EditarGrupo() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()

  const [nombre, setNombre] = useState('')
  const [premio, setPremio] = useState('')
  const [premioAnual, setPremioAnual] = useState('')
  const [habitos, setHabitos] = useState([])
  const [habitosOriginales, setHabitosOriginales] = useState([])
  const [nuevosHabitos, setNuevosHabitos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) {
      if (user.id !== user.groups?.created_by) {
        navigate('/grupo', { replace: true })
        return
      }
      cargarDatos()
    }
  }, [loadingSession, user])

  const cargarDatos = async () => {
    const grupo = user.groups
    setNombre(grupo.name)
    setPremio(grupo.prize || '')
    setPremioAnual(grupo.annual_prize || '')

    const { data: h } = await supabase
      .from('habits')
      .select('*')
      .eq('group_id', user.group_id)
      .order('level')

    setHabitos(h || [])
    setHabitosOriginales(h || [])
    setLoading(false)
  }

  const actualizarHabito = (id, field, value) => {
    setHabitos(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const eliminarHabito = (id) => {
    setHabitos(prev => prev.filter(h => h.id !== id))
  }

  const agregarNuevoHabito = () => {
    setNuevosHabitos([...nuevosHabitos, { name: '', level: 1, tempId: Date.now() }])
  }

  const actualizarNuevoHabito = (tempId, field, value) => {
    setNuevosHabitos(prev => prev.map(h => h.tempId === tempId ? { ...h, [field]: value } : h))
  }

  const eliminarNuevoHabito = (tempId) => {
    setNuevosHabitos(prev => prev.filter(h => h.tempId !== tempId))
  }

  const handleGuardar = async () => {
    if (!nombre.trim() || !premio.trim()) return
    setGuardando(true)
    setError(null)

    try {
      // Actualizar grupo
      const { error: errGrupo } = await supabase
        .from('groups')
        .update({
          name: nombre.trim(),
          prize: premio.trim(),
          annual_prize: premioAnual.trim() || null,
        })
        .eq('id', user.group_id)

      if (errGrupo) throw errGrupo

      // Hábitos eliminados
      const idsActuales = habitos.map(h => h.id)
      const idsEliminados = habitosOriginales
        .filter(h => !idsActuales.includes(h.id))
        .map(h => h.id)

      if (idsEliminados.length > 0) {
        await supabase.from('habits').delete().in('id', idsEliminados)
      }

      // Hábitos modificados
      for (const h of habitos) {
        const original = habitosOriginales.find(o => o.id === h.id)
        if (original && (original.name !== h.name || original.level !== h.level)) {
          await supabase.from('habits').update({ name: h.name, level: h.level }).eq('id', h.id)
        }
      }

      // Hábitos nuevos
      const nuevosValidos = nuevosHabitos.filter(h => h.name.trim())
      if (nuevosValidos.length > 0) {
        await supabase.from('habits').insert(
          nuevosValidos.map(h => ({
            group_id: user.group_id,
            name: h.name.trim(),
            level: h.level,
          }))
        )
      }

      navigate('/grupo', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al guardar')
      setGuardando(false)
    }
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/grupo')}
          className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold mb-6">Editar grupo</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Premio por ronda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premio por ronda
            </label>
            <input
              type="text"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Premio anual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premio anual{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={premioAnual}
              onChange={(e) => setPremioAnual(e.target.value)}
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Hábitos existentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hábitos
            </label>
            <div className="space-y-3">
              {habitos.map((habito) => (
                <div
                  key={habito.id}
                  className="bg-white border-2 border-gray-100 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) => actualizarHabito(habito.id, 'name', e.target.value)}
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => eliminarHabito(habito.id)}
                      className="text-gray-300 hover:text-red-400 text-lg px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => actualizarHabito(habito.id, 'level', nivel)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          habito.level === nivel
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]}pts)
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Hábitos nuevos */}
              {nuevosHabitos.map((habito) => (
                <div
                  key={habito.tempId}
                  className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) => actualizarNuevoHabito(habito.tempId, 'name', e.target.value)}
                      placeholder="Nombre del hábito"
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => eliminarNuevoHabito(habito.tempId)}
                      className="text-gray-300 hover:text-red-400 text-lg px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => actualizarNuevoHabito(habito.tempId, 'level', nivel)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          habito.level === nivel
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]}pts)
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={agregarNuevoHabito}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl text-gray-500 hover:text-emerald-600 text-sm font-medium transition-colors"
            >
              + Agregar hábito
            </button>
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim() || !premio.trim()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors mt-4"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
