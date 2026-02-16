import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useDashboard } from '../hooks/useDashboard'
import { useRoundCheck } from '../hooks/useRoundCheck'
import { useNotificationScheduler } from '../hooks/useNotificationScheduler'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'
import FinDeRondaModal from '../components/FinDeRondaModal'

function StatusBadge({ status }) {
  const estilos = {
    pending: 'text-zinc-400',
    approved: 'text-emerald-400',
    rejected: 'text-red-400',
    disputed: 'text-amber-400',
  }
  const dotColor = {
    pending: 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.5)]',
    approved: 'bg-emerald-500 shadow-[0_0_8px_#10B981]',
    rejected: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    disputed: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  }
  const textos = {
    pending: 'Pendiente',
    approved: 'Completado',
    rejected: 'Rechazado',
    disputed: 'Objetado',
  }
  return (
    <span className={`text-xs font-medium flex items-center gap-2 ${estilos[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status]}`}></span>
      {textos[status]}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userProfiles, loading: loadingSession } = useSession()
  const { finDeRonda, checking, cerrarModal } = useRoundCheck(user)
  const {
    ranking,
    habitos,
    misCompletions,
    disputasPendientes,
    actividadReciente,
    rondaActiva,
    diasRestantes,
    loading: loadingDash,
    recargar,
  } = useDashboard(user)

  // Notification scheduler (local smart reminders)
  useNotificationScheduler({ user, ranking, misCompletions })

  // Onboarding banner state
  const [showNotifBanner, setShowNotifBanner] = useState(
    () => !localStorage.getItem('hackbit_notif_onboarding')
  )

  const dismissNotifBanner = () => {
    localStorage.setItem('hackbit_notif_onboarding', '1')
    setShowNotifBanner(false)
  }

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
    }
  }, [loadingSession, user, navigate])

  const handleCerrarModal = () => {
    cerrarModal()
    recargar()
  }

  if (loadingSession || loadingDash || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Modal fin de ronda */}
      <FinDeRondaModal
        finDeRonda={finDeRonda}
        premio={user.groups?.prize}
        onCerrar={handleCerrarModal}
      />

      {/* Header */}
      <div className="bg-transparent relative px-6 pt-12 pb-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm mb-1">Hola, {user.nickname}</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {user.groups?.name || 'Mi grupo'}
              <span className="text-emerald-500">.</span>
            </h1>
          </div>
          <button
            onClick={() => navigate('/notificaciones')}
            className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {userProfiles.length > 1 && (
          <button
            onClick={() => navigate('/mis-grupos')}
            className="mt-3 text-emerald-500/60 hover:text-emerald-500 text-xs uppercase tracking-widest font-medium transition-colors"
          >
            Cambiar grupo
          </button>
        )}
      </div>

      <div className="px-4 space-y-6 relative z-10">
        {/* Banner de onboarding notificaciones */}
        {showNotifBanner && (
          <section className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5 animate-scaleIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
                  <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-400">Activa las alertas</p>
                <p className="text-xs text-zinc-400 mt-0.5">Te avisamos cuando entres a la app si te falta completar habitos</p>
                <button
                  onClick={() => navigate('/notificaciones')}
                  className="mt-2 text-xs font-bold text-emerald-500 uppercase tracking-wider hover:text-emerald-400 transition-colors"
                >
                  Configurar
                </button>
              </div>
              <button
                onClick={dismissNotifBanner}
                className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* ============================
            Ranking de la ronda actual
        ============================ */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Ranking
            </h2>
            {rondaActiva && (
              <span className="text-[10px] font-medium text-emerald-400/80 bg-emerald-400/10 rounded-full px-2 py-0.5 border border-emerald-400/20">
                {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
              </span>
            )}
          </div>

          {ranking.length === 0 ? (
            <p className="text-zinc-600 text-sm py-2">No hay participantes todavía</p>
          ) : (
            <div className="space-y-3">
              {ranking.map((item, index) => {
                const esPrimero = index === 0 && item.puntos > 0
                const esMio = item.user.id === user.id
                return (
                  <div
                    key={item.user.id}
                    className="flex items-center gap-3 py-2 transition-colors stagger-item"
                    style={{ '--i': index }}
                  >
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border ${esPrimero
                          ? 'border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'border-zinc-700 text-zinc-500'
                        }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`flex-1 text-sm truncate ${esMio ? 'text-emerald-400 italic font-medium' : 'text-zinc-300'}`}>
                      {item.user.nickname}
                      {esMio && (
                        <span className="text-zinc-600 font-normal not-italic text-xs ml-2"> (vos)</span>
                      )}
                    </span>
                    <span
                      className={`text-sm font-bold ${esPrimero ? 'text-emerald-500' : 'text-zinc-500'
                        }`}
                    >
                      {item.puntos}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ============================
            Mis hábitos de hoy
        ============================ */}
        <section className="glass-card p-5">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
            Mis hábitos
          </h2>

          {habitos.length === 0 ? (
            <p className="text-zinc-600 text-sm py-2">No hay hábitos configurados</p>
          ) : (
            <div className="space-y-3">
              {habitos.map((habito, index) => {
                const completion = misCompletions[habito.id]
                const estado = completion?.status
                const pendiente = !completion || estado === 'rejected'
                const completed = estado === 'approved'

                return (
                  <div
                    key={habito.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all stagger-item ${completed
                        ? 'bg-emerald-500/5 border-l-2 border-emerald-500/50'
                        : 'bg-white/5 border border-white/5'
                      }`}
                    style={{ '--i': index }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium truncate ${completed ? 'text-emerald-100' : 'text-zinc-200'}`}>
                          {habito.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0 uppercase tracking-wider">
                          Nv.{habito.level}
                        </span>
                      </div>
                      {completion && <StatusBadge status={estado} />}
                    </div>

                    {pendiente && (
                      <button
                        onClick={() => navigate(`/completar/${habito.id}`)}
                        className="btn-aesthetic shrink-0 px-3 py-1.5 text-xs"
                      >
                        {estado === 'rejected' ? 'Reintentar' : 'Completar'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ============================
            Disputas pendientes
        ============================ */}
        {disputasPendientes > 0 && (
          <section className="glass-card p-5 border-amber-500/20 bg-amber-500/5 animate-scaleIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">
                  Disputas
                </h2>
                <p className="text-zinc-400 text-xs mt-1">
                  {disputasPendientes} objeción{disputasPendientes !== 1 ? 'es' : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/actividad')}
                className="relative px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-amber-500/50"
              >
                Revisar
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-badge-ping shadow-[0_0_8px_#ef4444]"></span>
              </button>
            </div>
          </section>
        )}

        {/* ============================
            Actividad reciente
        ============================ */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Actividad
            </h2>
            <button
              onClick={() => navigate('/actividad')}
              className="text-emerald-500 text-xs font-medium hover:text-emerald-400 transition-colors"
            >
              Ver todo
            </button>
          </div>
          {actividadReciente.length === 0 ? (
            <p className="text-zinc-600 text-sm py-2">No hay actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {actividadReciente.slice(0, 5).map((c, index) => (
                <div key={c.id} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0 stagger-item" style={{ '--i': index }}>
                  <img
                    src={c.photo_url}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10 photo-reveal"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-zinc-300">
                      <span className="text-white">{c.users?.nickname}</span>
                      <span className="text-zinc-500 mx-1.5">/</span>
                      {c.habits?.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-emerald-500/50 text-xs font-bold">
                    +{PUNTOS_POR_NIVEL[c.habits?.level]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
