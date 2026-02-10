import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, PUNTOS_POR_NIVEL } from '../lib/utils'

export function useDashboard(user) {
  const [ranking, setRanking] = useState([])
  const [habitos, setHabitos] = useState([])
  const [misCompletions, setMisCompletions] = useState({})
  const [pendientesValidar, setPendientesValidar] = useState(0)
  const [rondaActiva, setRondaActiva] = useState(null)
  const [diasRestantes, setDiasRestantes] = useState(0)
  const [loading, setLoading] = useState(true)

  const hoy = formatDate(new Date())

  const cargar = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const groupId = user.group_id

    // Cargar en paralelo: ronda activa, hábitos, usuarios del grupo
    const [rondaRes, habitosRes, usuariosRes] = await Promise.all([
      supabase
        .from('rounds')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('habits')
        .select('*')
        .eq('group_id', groupId)
        .order('level'),
      supabase
        .from('users')
        .select('*')
        .eq('group_id', groupId),
    ])

    const ronda = rondaRes.data
    const listaHabitos = habitosRes.data || []
    const usuarios = usuariosRes.data || []

    setRondaActiva(ronda)
    setHabitos(listaHabitos)

    // Días restantes
    if (ronda) {
      const fin = new Date(ronda.end_date + 'T23:59:59')
      const ahora = new Date()
      const diff = Math.max(0, Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24)))
      setDiasRestantes(diff)
    }

    // Cargar completions de la ronda para ranking
    if (ronda) {
      const { data: completions } = await supabase
        .from('completions')
        .select('*, habits(level)')
        .eq('status', 'approved')
        .gte('date', ronda.start_date)
        .lte('date', ronda.end_date)
        .in('user_id', usuarios.map((u) => u.id))

      // Calcular puntos por usuario
      const puntosPorUsuario = {}
      usuarios.forEach((u) => {
        puntosPorUsuario[u.id] = { user: u, puntos: 0 }
      })

      ;(completions || []).forEach((c) => {
        if (puntosPorUsuario[c.user_id] && c.habits) {
          puntosPorUsuario[c.user_id].puntos += PUNTOS_POR_NIVEL[c.habits.level] || 0
        }
      })

      const rankingSorted = Object.values(puntosPorUsuario).sort(
        (a, b) => b.puntos - a.puntos
      )
      setRanking(rankingSorted)
    }

    // Mis completions de hoy
    const { data: misCompHoy } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', hoy)

    const completionMap = {}
    ;(misCompHoy || []).forEach((c) => {
      // Si hay varias (rechazado + nuevo intento), priorizar no-rejected
      const existente = completionMap[c.habit_id]
      if (!existente || existente.status === 'rejected') {
        completionMap[c.habit_id] = c
      }
    })
    setMisCompletions(completionMap)

    // Validaciones pendientes (de otros usuarios, en mi grupo)
    const otrosUsuarios = usuarios.filter((u) => u.id !== user.id).map((u) => u.id)
    if (otrosUsuarios.length > 0) {
      const { count } = await supabase
        .from('completions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('user_id', otrosUsuarios)

      setPendientesValidar(count || 0)
    } else {
      setPendientesValidar(0)
    }

    setLoading(false)
  }, [user, hoy])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    ranking,
    habitos,
    misCompletions,
    pendientesValidar,
    rondaActiva,
    diasRestantes,
    loading,
    recargar: cargar,
  }
}
