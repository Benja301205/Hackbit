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
    <div className="min-h-screen px-6 py-8 pb-24 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)]">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-white mb-8 text-sm flex items-center gap-2 transition-colors uppercase tracking-widest font-medium"
        >
          <span>←</span> Volver
        </button>

        <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Unirse a grupo</h1>
        <p className="text-zinc-500 text-xs mb-8 uppercase tracking-widest font-medium">
          Código: <span className="font-mono text-emerald-500">{codigo}</span>
        </p>

        {/* Info del grupo */}
        <div className="glass-card p-6 mb-8 space-y-6">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Grupo</p>
            <p className="text-2xl font-bold text-white">{grupo.name}</p>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-3">Hábitos</p>
            <div className="space-y-2">
              {habitos.map((h, index) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 stagger-item"
                  style={{ '--i': index }}
                >
                  <span className="text-sm font-medium text-zinc-200">{h.name}</span>
                  <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 rounded-lg px-2 py-1 uppercase tracking-wider font-bold">
                    Nv.{h.level} · {PUNTOS_POR_NIVEL[h.level]}pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Frecuencia</p>
              <p className="text-sm font-medium text-white">
                {grupo.period === 'weekly' ? 'Semanal' : 'Mensual'}
              </p>
            </div>
            {grupo.annual_prize && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Premio Anual</p>
                <p className="text-sm font-medium text-white truncate" title={grupo.annual_prize}>{grupo.annual_prize}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Premio por ronda</p>
            <p className="text-sm font-medium text-white">{grupo.prize}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-error">
            {error}
          </div>
        )}

        {/* Apodo + botón */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Tu apodo
            </label>
            <input
              type="text"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej: Benja"
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnirse()
              }}
            />
          </div>

          <button
            onClick={handleUnirse}
            disabled={joining || !apodo.trim()}
            className="w-full py-4 btn-aesthetic text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            {joining ? 'Uniéndose...' : 'Unirme'}
          </button>
        </div>
      </div>
    </div>
  )
}
