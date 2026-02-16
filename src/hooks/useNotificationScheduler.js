import { useEffect } from 'react'

const STORAGE_KEY = 'hackbit_notif_settings'
const NOTIF_LOG_KEY = 'hackbit_notif_log'
const LEADER_KEY = 'hackbit_last_leader'
const STREAK_KEY = 'hackbit_leader_streak'

function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getNotifCount() {
  try {
    const raw = localStorage.getItem(NOTIF_LOG_KEY)
    if (!raw) return 0
    const log = JSON.parse(raw)
    return log.date === getTodayKey() ? log.count : 0
  } catch {
    return 0
  }
}

function incrementNotifCount() {
  const today = getTodayKey()
  const current = getNotifCount()
  localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify({ date: today, count: current + 1 }))
}

function wasNotifiedToday(tag) {
  try {
    const raw = localStorage.getItem(`hackbit_notif_${tag}`)
    return raw === getTodayKey()
  } catch {
    return false
  }
}

function markNotified(tag) {
  localStorage.setItem(`hackbit_notif_${tag}`, getTodayKey())
}

async function sendNotification(title, body, tag) {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag,
      })
    }
  } catch {
    try {
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    } catch {
      // Notifications not supported
    }
  }
  incrementNotifCount()
  markNotified(tag)
}

export function useNotificationScheduler({ user, ranking, misCompletions }) {
  useEffect(() => {
    if (!user || !ranking) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const settings = getSettings()
    if (!settings) return

    // Max 2 notifications per session/day
    if (getNotifCount() >= 2) return

    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentTime = hours * 60 + minutes

    const completionsEmpty = !misCompletions || Object.keys(misCompletions).length === 0

    // Parse hora setting
    const [settingH, settingM] = (settings.horaDiaria || '20:00').split(':').map(Number)
    const settingTime = settingH * 60 + settingM

    // 1. Recordatorio diario
    if (
      settings.recordatorioDiario &&
      currentTime >= settingTime &&
      completionsEmpty &&
      !wasNotifiedToday('daily')
    ) {
      sendNotification(
        'Hackbit',
        'Todavia no completaste ningun habito hoy. No pierdas puntos!',
        'daily'
      )
      return // One at a time
    }

    // 2. Ultima chance
    if (
      settings.ultimaChance &&
      currentTime >= 23 * 60 &&
      completionsEmpty &&
      !wasNotifiedToday('lastchance')
    ) {
      sendNotification(
        'Ultima chance!',
        'Quedan menos de una hora para completar tus habitos de hoy.',
        'lastchance'
      )
      return
    }

    // 3. Cambio de lider
    if (settings.cambioDeLider && ranking.length > 0) {
      const currentLeader = ranking[0]
      if (currentLeader.puntos > 0) {
        const lastLeader = localStorage.getItem(LEADER_KEY)
        if (lastLeader && lastLeader !== currentLeader.user.id && !wasNotifiedToday('leader')) {
          sendNotification(
            'Nuevo lider!',
            `${currentLeader.user.nickname} tomo la punta del ranking.`,
            'leader'
          )
        }
        localStorage.setItem(LEADER_KEY, currentLeader.user.id)
      }
    }

    // 4. Racha de liderazgo
    if (settings.rachaLiderazgo && ranking.length > 0) {
      const currentLeader = ranking[0]
      if (currentLeader.puntos > 0) {
        try {
          const raw = localStorage.getItem(STREAK_KEY)
          const streak = raw ? JSON.parse(raw) : { id: null, days: [], lastDate: null }
          const today = getTodayKey()

          if (streak.id === currentLeader.user.id) {
            if (streak.lastDate !== today) {
              streak.days.push(today)
              streak.lastDate = today
              // Keep only unique consecutive days
              const unique = [...new Set(streak.days)].sort().slice(-5)
              streak.days = unique

              if (unique.length >= 3 && !wasNotifiedToday('streak')) {
                sendNotification(
                  'Racha de liderazgo',
                  `${currentLeader.user.nickname} lleva ${unique.length} dias liderando!`,
                  'streak'
                )
              }
            }
          } else {
            streak.id = currentLeader.user.id
            streak.days = [today]
            streak.lastDate = today
          }

          localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
        } catch {
          // Ignore streak errors
        }
      }
    }
  }, [user, ranking, misCompletions])
}
