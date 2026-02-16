import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'

export default function TablaAnual() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const anioActual = new Date().getFullYear()

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarTabla()
  }, [loadingSession, user])

  const cargarTabla = async () => {
    setLoading(true)

    const groupId = user.group_id
    const inicioAnio = `${anioActual}-01-01`
    const finAnio = `${anioActual}-12-31`

    // Obtener usuarios del grupo
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('group_id', groupId)

    if (!usuarios || usuarios.length === 0) {
      setRanking([])
      setLoading(false)
      return
    }

    const userIds = usuarios.map((u) => u.id)

    // Obtener rondas del año (para contar ganadas)
    const { data: rondas } = await supabase
      .from('rounds')
      .select('id, winner_id, start_date')
      .eq('group_id', groupId)
      .gte('start_date', inicioAnio)
      .lte('start_date', finAnio)

    // Contar rondas ganadas por usuario
    const rondasGanadas = {}
    userIds.forEach((id) => { rondasGanadas[id] = 0 })
    ;(rondas || []).forEach((r) => {
      if (r.winner_id && rondasGanadas[r.winner_id] !== undefined) {
        rondasGanadas[r.winner_id]++
      }
    })

    // Obtener completions aprobadas del año
    const { data: completions } = await supabase
      .from('completions')
      .select('user_id, habits(level)')
      .eq('status', 'approved')
      .gte('date', inicioAnio)
      .lte('date', finAnio)
      .in('user_id', userIds)

    // Calcular puntos totales
    const puntosTotales = {}
    userIds.forEach((id) => { puntosTotales[id] = 0 })
    ;(completions || []).forEach((c) => {
      if (puntosTotales[c.user_id] !== undefined && c.habits) {
        puntosTotales[c.user_id] += PUNTOS_POR_NIVEL[c.habits.level] || 0
      }
    })

    // Armar ranking
    const nickMap = {}
    usuarios.forEach((u) => { nickMap[u.id] = u.nickname })

    const lista = userIds.map((id) => ({
      id,
      nickname: nickMap[id],
      puntos: puntosTotales[id],
      rondasGanadas: rondasGanadas[id],
    }))

    lista.sort((a, b) => b.puntos - a.puntos)
    setRanking(lista)
    setLoading(false)
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Tabla Anual {anioActual}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Puntos acumulados de todas las rondas del año
        </p>
      </div>

      <div className="px-4">
        {ranking.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">
            No hay datos todavía
          </p>
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Encabezado de tabla */}
            <div className="grid grid-cols-[2.5rem_1fr_5rem_4.5rem] gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">#</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Apodo</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Puntos</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Rondas</span>
            </div>

            {/* Filas */}
            {ranking.map((item, index) => {
              const esPrimero = index === 0 && item.puntos > 0
              const esMio = item.id === user.id
              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[2.5rem_1fr_5rem_4.5rem] gap-2 px-4 py-3 items-center border-b border-white/5 last:border-b-0 stagger-item ${
                    esMio ? 'bg-emerald-500/10 border border-emerald-500/20' : ''
                  }`}
                  style={{ '--i': index }}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      esPrimero
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-white truncate">
                    {item.nickname}
                    {esMio && (
                      <span className="text-zinc-500 font-normal"> (vos)</span>
                    )}
                  </span>
                  <span
                    className={`text-sm font-bold text-right ${
                      esPrimero ? 'text-emerald-400' : 'text-zinc-200'
                    }`}
                  >
                    {item.puntos}
                  </span>
                  <span className="text-sm text-zinc-500 text-right">
                    {item.rondasGanadas} {item.rondasGanadas === 1 ? 'ganada' : 'ganadas'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Premio anual */}
        {user.groups?.annual_prize && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-500 uppercase tracking-wide mb-1">
              Premio anual
            </p>
            <p className="text-sm font-medium text-amber-100">
              {user.groups.annual_prize}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
