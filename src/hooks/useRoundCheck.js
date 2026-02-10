import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, calcularSiguienteRonda, PUNTOS_POR_NIVEL } from '../lib/utils'

export function useRoundCheck(user) {
  const [finDeRonda, setFinDeRonda] = useState(null) // datos del cierre para mostrar modal
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    verificarRonda()
  }, [user])

  const verificarRonda = async () => {
    const groupId = user.group_id
    const hoy = formatDate(new Date())

    // Buscar ronda activa
    const { data: ronda } = await supabase
      .from('rounds')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .maybeSingle()

    if (!ronda || hoy <= ronda.end_date) {
      setChecking(false)
      return
    }

    // La ronda expiró → cerrarla
    const { data: grupo } = await supabase
      .from('groups')
      .select('period')
      .eq('id', groupId)
      .single()

    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('group_id', groupId)

    if (!usuarios || usuarios.length === 0) {
      setChecking(false)
      return
    }

    const userIds = usuarios.map((u) => u.id)

    // Completions aprobadas de la ronda
    const { data: completions } = await supabase
      .from('completions')
      .select('*, habits(level)')
      .eq('status', 'approved')
      .gte('date', ronda.start_date)
      .lte('date', ronda.end_date)
      .in('user_id', userIds)

    // Calcular puntos y cantidad de completions por usuario
    const stats = {}
    usuarios.forEach((u) => {
      stats[u.id] = { user: u, puntos: 0, cantidad: 0 }
    })

    ;(completions || []).forEach((c) => {
      if (stats[c.user_id] && c.habits) {
        stats[c.user_id].puntos += PUNTOS_POR_NIVEL[c.habits.level] || 0
        stats[c.user_id].cantidad += 1
      }
    })

    // Ranking: ordenar por puntos, desempate por cantidad
    const rankingFinal = Object.values(stats).sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos
      return b.cantidad - a.cantidad
    })

    // Determinar ganador (o empate)
    let winnerId = null
    let empate = false
    if (rankingFinal.length > 0 && rankingFinal[0].puntos > 0) {
      winnerId = rankingFinal[0].user.id
      if (
        rankingFinal.length > 1 &&
        rankingFinal[0].puntos === rankingFinal[1].puntos &&
        rankingFinal[0].cantidad === rankingFinal[1].cantidad
      ) {
        empate = true
        winnerId = null
      }
    }

    // Cerrar ronda
    await supabase
      .from('rounds')
      .update({ is_active: false, winner_id: winnerId })
      .eq('id', ronda.id)

    // Crear siguiente ronda
    const fechas = calcularSiguienteRonda(grupo.period, ronda.end_date)
    await supabase.from('rounds').insert({
      group_id: groupId,
      start_date: fechas.start_date,
      end_date: fechas.end_date,
      is_active: true,
    })

    setFinDeRonda({
      ranking: rankingFinal,
      winnerId,
      empate,
      ronda,
    })
    setChecking(false)
  }

  const cerrarModal = () => {
    setFinDeRonda(null)
  }

  return { finDeRonda, checking, cerrarModal }
}
