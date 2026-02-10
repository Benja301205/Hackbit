import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'

export default function InfoGrupo() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const [habitos, setHabitos] = useState([])
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarInfo()
  }, [loadingSession, user])

  const cargarInfo = async () => {
    const [habitosRes, miembrosRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('group_id', user.group_id)
        .order('level'),
      supabase
        .from('users')
        .select('id, nickname, created_at')
        .eq('group_id', user.group_id)
        .order('created_at'),
    ])

    setHabitos(habitosRes.data || [])
    setMiembros(miembrosRes.data || [])
    setLoading(false)
  }

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(user.groups.invite_code)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {}
  }

  const compartirLink = async () => {
    const url = `${window.location.origin}/unirse/${user.groups.invite_code}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Competencia de Hábitos',
          text: `Unite a mi grupo "${user.groups.name}"`,
          url,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null
  const grupo = user.groups

  return (
    <div className="min-h-screen pb-20">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">{grupo.name}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {grupo.period === 'weekly' ? 'Rondas semanales' : 'Rondas mensuales'}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Código de invitación */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Código de invitación
          </p>
          <p className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-600 mb-4">
            {grupo.invite_code}
          </p>
          <div className="flex gap-2">
            <button
              onClick={copiarCodigo}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
            >
              {copiado ? '¡Copiado!' : 'Copiar código'}
            </button>
            <button
              onClick={compartirLink}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
            >
              Compartir link
            </button>
          </div>
        </section>

        {/* Hábitos */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Hábitos
          </h2>
          <div className="space-y-2">
            {habitos.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5"
              >
                <span className="text-sm font-medium">{h.name}</span>
                <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                  Nv.{h.level} · {PUNTOS_POR_NIVEL[h.level]}pts
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Premios */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Premios
          </h2>
          <div>
            <p className="text-xs text-gray-400">Premio por ronda</p>
            <p className="text-sm font-medium">{grupo.prize}</p>
          </div>
          {grupo.annual_prize && (
            <div>
              <p className="text-xs text-gray-400">Premio anual</p>
              <p className="text-sm font-medium">{grupo.annual_prize}</p>
            </div>
          )}
        </section>

        {/* Miembros */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Miembros ({miembros.length})
          </h2>
          <div className="space-y-2">
            {miembros.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                  m.id === user.id ? 'bg-emerald-50' : 'bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {m.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">
                  {m.nickname}
                  {m.id === user.id && (
                    <span className="text-gray-400 font-normal"> (vos)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
