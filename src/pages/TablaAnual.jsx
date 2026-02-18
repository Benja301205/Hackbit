import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'

const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']

const getAbbrev = (name) => {
  if (!name) return '??'
  const up = name.toUpperCase()
  return up.length <= 3 ? up : up.slice(0, 2)
}

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00')
  const label = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function TablaAnual() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const anioActual = new Date().getFullYear()

  // Tab
  const [currentTab, setCurrentTab] = useState('ranking')

  // Calendar
  const [calUsers, setCalUsers] = useState([])
  const [calComps, setCalComps] = useState([])
  const [calDays, setCalDays] = useState([])
  const [loadingCal, setLoadingCal] = useState(false)
  const [calLoaded, setCalLoaded] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [fullscreenDate, setFullscreenDate] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarTabla()
  }, [loadingSession, user])

  useEffect(() => {
    if (currentTab === 'calendario' && !calLoaded && user) {
      cargarCalendario()
    }
  }, [currentTab, user])

  // Lookups
  const compsByUserDay = useMemo(() => {
    const map = {}
    calComps.forEach((c) => {
      const key = `${c.user_id}-${c.date}`
      if (!map[key]) map[key] = []
      map[key].push(c)
    })
    return map
  }, [calComps])

  const compsByDate = useMemo(() => {
    const map = {}
    calComps.forEach((c) => {
      if (!map[c.date]) map[c.date] = []
      map[c.date].push(c)
    })
    return map
  }, [calComps])

  const nickMap = useMemo(() => {
    const map = {}
    calUsers.forEach((u) => { map[u.id] = u.nickname })
    return map
  }, [calUsers])

  // ── Data fetching ──

  const cargarTabla = async () => {
    setLoading(true)

    const groupId = user.group_id
    const inicioAnio = `${anioActual}-01-01`
    const finAnio = `${anioActual}-12-31`

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

    const { data: rondas } = await supabase
      .from('rounds')
      .select('id, winner_id, start_date')
      .eq('group_id', groupId)
      .gte('start_date', inicioAnio)
      .lte('start_date', finAnio)

    const rondasGanadas = {}
    userIds.forEach((id) => { rondasGanadas[id] = 0 })
    ;(rondas || []).forEach((r) => {
      if (r.winner_id && rondasGanadas[r.winner_id] !== undefined) {
        rondasGanadas[r.winner_id]++
      }
    })

    const { data: completions } = await supabase
      .from('completions')
      .select('user_id, habits(level)')
      .eq('status', 'approved')
      .gte('date', inicioAnio)
      .lte('date', finAnio)
      .in('user_id', userIds)

    const puntosTotales = {}
    userIds.forEach((id) => { puntosTotales[id] = 0 })
    ;(completions || []).forEach((c) => {
      if (puntosTotales[c.user_id] !== undefined && c.habits) {
        puntosTotales[c.user_id] += PUNTOS_POR_NIVEL[c.habits.level] || 0
      }
    })

    const nickMapLocal = {}
    usuarios.forEach((u) => { nickMapLocal[u.id] = u.nickname })

    const lista = userIds.map((id) => ({
      id,
      nickname: nickMapLocal[id],
      puntos: puntosTotales[id],
      rondasGanadas: rondasGanadas[id],
    }))

    lista.sort((a, b) => b.puntos - a.puntos)
    setRanking(lista)
    setLoading(false)
  }

  const cargarCalendario = async () => {
    setLoadingCal(true)

    const groupId = user.group_id
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const mm = String(m + 1).padStart(2, '0')
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const inicioMes = `${y}-${mm}-01`
    const finMes = `${y}-${mm}-${String(daysInMonth).padStart(2, '0')}`

    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('group_id', groupId)

    if (!usuarios?.length) {
      setCalUsers([])
      setCalComps([])
      setCalDays([])
      setLoadingCal(false)
      setCalLoaded(true)
      return
    }

    const userIds = usuarios.map((u) => u.id)

    const { data: comps } = await supabase
      .from('completions')
      .select('id, user_id, date, photo_url, created_at, habits(name, level)')
      .in('status', ['approved', 'disputed'])
      .gte('date', inicioMes)
      .lte('date', finMes)
      .in('user_id', userIds)
      .order('created_at', { ascending: true })

    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      days.push({
        dateStr: `${y}-${mm}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        dayName: DAY_NAMES[date.getDay()],
        isToday: d === now.getDate(),
        isFuture: d > now.getDate(),
      })
    }

    setCalUsers(usuarios)
    setCalComps(comps || [])
    setCalDays(days)
    setLoadingCal(false)
    setCalLoaded(true)

    setTimeout(() => {
      const el = scrollRef.current?.querySelector('[data-today="true"]')
      el?.scrollIntoView({ inline: 'center', behavior: 'smooth' })
    }, 150)
  }

  // ── Handlers ──

  const handleSelectDay = (dateStr) => {
    setSelectedDate(selectedDate === dateStr ? null : dateStr)
  }

  const handleOpenFullscreen = () => {
    setFullscreenDate(selectedDate)
    setSelectedDate(null)
  }

  // ── Render ──

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const selectedDayComps = selectedDate ? (compsByDate[selectedDate] || []) : []

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Tabla Anual {anioActual}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Puntos acumulados de todas las rondas del año
        </p>
      </div>

      {/* ── PASO 1: Tab Selector (Pill) ── */}
      <div className="px-6 mb-4">
        <div className="glass-card flex p-1">
          {[
            { key: 'ranking', label: 'RANKING' },
            { key: 'calendario', label: 'CALENDARIO' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCurrentTab(tab.key)
                setSelectedDate(null)
              }}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-[22px] transition-all duration-200 ${
                currentTab === tab.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════ RANKING TAB ══════════ */}
      {currentTab === 'ranking' && (
        <div className="px-4">
          {ranking.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">
              No hay datos todavía
            </p>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-[2.5rem_1fr_5rem_4.5rem] gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">#</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Apodo</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Puntos</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Rondas</span>
              </div>

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
      )}

      {/* ══════════ CALENDARIO TAB ══════════ */}
      {currentTab === 'calendario' && (
        <>
          {loadingCal ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : calUsers.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">
              No hay datos todavía
            </p>
          ) : (
            <div className="px-4">
              {/* ── PASO 2: Heatmap Grid ── */}
              <div className="glass-card overflow-hidden p-3">
                <div className="overflow-x-auto pb-1" ref={scrollRef}>
                  <div style={{ minWidth: `${calDays.length * 40 + 110}px` }}>
                    {/* Day headers */}
                    <div className="flex mb-1">
                      <div className="w-[110px] shrink-0" />
                      {calDays.map((day) => (
                        <button
                          key={day.dateStr}
                          data-today={day.isToday || undefined}
                          onClick={() => !day.isFuture && handleSelectDay(day.dateStr)}
                          className={`w-10 shrink-0 text-center pb-1 ${
                            day.isFuture ? 'opacity-25 pointer-events-none' : ''
                          }`}
                        >
                          <div
                            className={`text-[9px] font-bold tracking-wider ${
                              day.isToday ? 'text-emerald-400' : 'text-zinc-600'
                            }`}
                          >
                            {day.dayName}
                          </div>
                          <div
                            className={`text-[11px] font-bold mt-0.5 w-6 h-6 flex items-center justify-center mx-auto rounded-full ${
                              selectedDate === day.dateStr
                                ? 'bg-emerald-500 text-black'
                                : day.isToday
                                  ? 'text-white'
                                  : 'text-zinc-500'
                            }`}
                          >
                            {day.dayNum}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* User rows */}
                    {calUsers.map((u) => (
                      <div key={u.id} className="flex items-center min-h-[36px]">
                        {/* Avatar + name */}
                        <div className="w-[110px] shrink-0 flex items-center gap-2 pr-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {u.nickname.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-white truncate">
                            {u.nickname}
                          </span>
                        </div>

                        {/* Day cells */}
                        {calDays.map((day) => {
                          const comps = compsByUserDay[`${u.id}-${day.dateStr}`] || []
                          const isSelected = selectedDate === day.dateStr
                          return (
                            <button
                              key={day.dateStr}
                              onClick={() =>
                                !day.isFuture && comps.length > 0 && handleSelectDay(day.dateStr)
                              }
                              className={`w-10 shrink-0 flex flex-col items-center justify-center gap-[2px] py-1 rounded-lg transition-colors ${
                                isSelected ? 'bg-emerald-500/10' : ''
                              } ${day.isFuture ? 'opacity-25 pointer-events-none' : ''}`}
                            >
                              {comps.slice(0, 2).map((c) => (
                                <span
                                  key={c.id}
                                  className={`text-[8px] font-bold rounded px-1 py-px leading-tight ${
                                    isSelected
                                      ? 'bg-emerald-500/40 text-emerald-300'
                                      : 'bg-emerald-500/15 text-emerald-500/80'
                                  }`}
                                >
                                  {getAbbrev(c.habits?.name)}
                                </span>
                              ))}
                              {comps.length > 2 && (
                                <span className="text-[7px] text-zinc-600 font-medium">
                                  +{comps.length - 2}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PASO 3: Bottom Sheet Preview ── */}
      {selectedDate && !fullscreenDate && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 pointer-events-auto"
            onClick={() => setSelectedDate(null)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/8 rounded-t-3xl px-5 pt-5 pb-28 sheet-enter">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {formatDateLabel(selectedDate)}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-400">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Thumbnails scroll */}
            {selectedDayComps.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">
                Sin actividad este día
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {selectedDayComps.map((c) => (
                  <div key={c.id} className="shrink-0 w-[100px]">
                    {c.photo_url ? (
                      <img
                        src={c.photo_url}
                        alt={c.habits?.name}
                        className="w-[100px] h-[100px] object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-[100px] h-[100px] bg-zinc-800 rounded-xl flex items-center justify-center">
                        <span className="text-zinc-600 text-[10px]">Sin foto</span>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded px-1.5 py-0.5">
                        {getAbbrev(c.habits?.name)}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {nickMap[c.user_id]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VER DÍA button */}
            {selectedDayComps.length > 0 && (
              <button
                onClick={handleOpenFullscreen}
                className="w-full mt-3 py-3.5 btn-aesthetic text-sm tracking-widest"
              >
                VER DÍA
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── PASO 4: Fullscreen Day Detail ── */}
      {fullscreenDate && (
        <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto modal-overlay">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                {formatDateLabel(fullscreenDate)}
              </h2>
              <button
                onClick={() => setFullscreenDate(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>

          {/* User sections */}
          <div className="px-4 py-4 space-y-6 pb-8">
            {calUsers
              .filter(
                (u) => (compsByUserDay[`${u.id}-${fullscreenDate}`] || []).length > 0
              )
              .map((u, idx) => {
                const comps = compsByUserDay[`${u.id}-${fullscreenDate}`] || []
                return (
                  <div key={u.id} className="stagger-item" style={{ '--i': idx }}>
                    {/* User header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center justify-center">
                        {u.nickname.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-base font-bold text-white">
                        {u.nickname}
                      </span>
                    </div>

                    {/* Photos */}
                    <div className="space-y-3">
                      {comps.map((c) => (
                        <div key={c.id} className="glass-card overflow-hidden">
                          {c.photo_url ? (
                            <img
                              src={c.photo_url}
                              alt={c.habits?.name}
                              className="w-full aspect-[4/3] object-cover photo-reveal"
                            />
                          ) : (
                            <div className="w-full aspect-[4/3] bg-zinc-900 flex items-center justify-center">
                              <span className="text-zinc-600 text-sm">Sin foto</span>
                            </div>
                          )}
                          <div className="px-4 py-3 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-lg px-2 py-1 uppercase tracking-wider">
                              {getAbbrev(c.habits?.name)}
                            </span>
                            <span className="text-sm text-zinc-400">
                              {u.nickname}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

            {calUsers.filter(
              (u) => (compsByUserDay[`${u.id}-${fullscreenDate}`] || []).length > 0
            ).length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-8">
                No hay actividad para este día
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
