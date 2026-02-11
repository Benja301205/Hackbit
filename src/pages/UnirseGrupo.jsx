import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'

export default function UnirseGrupo() {
  const { codigo } = useParams()
  const navigate = useNavigate()

  const [grupo, setGrupo] = useState(null)
  const [habitos, setHabitos] = useState([])
  const [apodo, setApodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarGrupo()
  }, [codigo])

  const cargarGrupo = async () => {
    setLoading(true)
    setError(null)

    const { data: g, error: err } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', codigo.toUpperCase())
      .maybeSingle()

    if (err || !g) {
      setError('No se encontró un grupo con ese código')
      setLoading(false)
      return
    }

    setGrupo(g)

    const { data: h } = await supabase
      .from('habits')
      .select('*')
      .eq('group_id', g.id)
      .order('level')

    setHabitos(h || [])
    setLoading(false)
  }

  const handleUnirse = async () => {
    if (!apodo.trim()) return
    setJoining(true)
    setError(null)

    try {
      const existingToken = localStorage.getItem('session_token')
      const sessionToken = existingToken || crypto.randomUUID()

      const { error: err } = await supabase
        .from('users')
        .insert({
          group_id: grupo.id,
          nickname: apodo.trim(),
          session_token: sessionToken,
        })

      if (err) throw err

      localStorage.setItem('session_token', sessionToken)
      localStorage.setItem('active_group_id', grupo.id)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al unirse al grupo')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-xl font-bold mb-2">Grupo no encontrado</h1>
          <p className="text-gray-500 mb-6">
            El código <span className="font-mono font-bold">{codigo}</span> no corresponde a ningún grupo.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold mb-1">Unirse a grupo</h1>
        <p className="text-gray-400 text-sm mb-6">
          Código: <span className="font-mono font-bold">{codigo}</span>
        </p>

        {/* Info del grupo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Grupo</p>
            <p className="text-lg font-semibold">{grupo.name}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Hábitos</p>
            <div className="space-y-2">
              {habitos.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium">{h.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                    Nv.{h.level} · {PUNTOS_POR_NIVEL[h.level]}pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Frecuencia</p>
              <p className="text-sm font-medium">
                {grupo.period === 'weekly' ? 'Semanal' : 'Mensual'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Premio por ronda</p>
            <p className="text-sm font-medium">{grupo.prize}</p>
          </div>

          {grupo.annual_prize && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Premio anual</p>
              <p className="text-sm font-medium">{grupo.annual_prize}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Apodo + botón */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu apodo
            </label>
            <input
              type="text"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej: Benja"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnirse()
              }}
            />
          </div>

          <button
            onClick={handleUnirse}
            disabled={joining || !apodo.trim()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors"
          >
            {joining ? 'Uniéndose...' : 'Unirme'}
          </button>
        </div>
      </div>
    </div>
  )
}
