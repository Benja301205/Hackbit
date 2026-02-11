import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, PUNTOS_POR_NIVEL } from '../lib/utils'

export function useDashboard(user) {
  const [ranking, setRanking] = useState([])
  const [habitos, setHabitos] = useState([])
  const [misCompletions, setMisCompletions] = useState({})
  const [disputasPendientes, setDisputasPendientes] = useState(0)
  const [actividadReciente, setActividadReciente] = useState([])
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
      const existente = completionMap[c.habit_id]
      if (!existente || existente.status === 'rejected') {
        completionMap[c.habit_id] = c
      }
    })
    setMisCompletions(completionMap)

    // Disputas pendientes (donde el usuario necesita defenderse)
    const { data: misCompletionsIds } = await supabase
      .from('completions')
      .select('id')
      .eq('user_id', user.id)

    if (misCompletionsIds && misCompletionsIds.length > 0) {
      const { count } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .in('completion_id', misCompletionsIds.map(c => c.id))
        .is('resolution', null)
        .is('defense_text', null)

      setDisputasPendientes(count || 0)
    } else {
      setDisputasPendientes(0)
    }

    // Actividad reciente del grupo (últimas 20 completions)
    const userIds = usuarios.map((u) => u.id)
    if (userIds.length > 0) {
      const { data: actividad } = await supabase
        .from('completions')
        .select('*, habits(name, level), users(nickname)')
        .in('user_id', userIds)
        .in('status', ['approved', 'disputed'])
        .order('created_at', { ascending: false })
        .limit(20)

      setActividadReciente(actividad || [])
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
    disputasPendientes,
    actividadReciente,
    rondaActiva,
    diasRestantes,
    loading,
    recargar: cargar,
  }
}
