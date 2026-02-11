import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useDashboard } from '../hooks/useDashboard'
import { useRoundCheck } from '../hooks/useRoundCheck'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'
import FinDeRondaModal from '../components/FinDeRondaModal'

function StatusBadge({ status }) {
  const estilos = {
    pending: 'bg-gray-100 text-gray-500',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-600',
    disputed: 'bg-amber-100 text-amber-700',
  }
  const textos = {
    pending: 'Pendiente',
    approved: 'Completado ✓',
    rejected: 'Rechazado ✗',
    disputed: 'Objetado ⚠',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${estilos[status]}`}>
      {textos[status]}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userProfiles, loading: loadingSession, switchGroup } = useSession()
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
    <div className="min-h-screen pb-20">
      {/* Modal fin de ronda */}
      <FinDeRondaModal
        finDeRonda={finDeRonda}
        premio={user.groups?.prize}
        onCerrar={handleCerrarModal}
      />

      {/* Header */}
      <div className="bg-emerald-500 text-white px-6 pt-8 pb-6">
        <p className="text-emerald-100 text-sm">Hola, {user.nickname}</p>
        <h1 className="text-xl font-bold">{user.groups?.name || 'Mi grupo'}</h1>
        {userProfiles.length > 1 && (
          <select
            value={user.group_id}
            onChange={(e) => switchGroup(e.target.value)}
            className="mt-2 w-full bg-emerald-600 text-white text-sm rounded-lg px-3 py-2 border border-emerald-400 focus:outline-none"
          >
            {userProfiles.map((p) => (
              <option key={p.group_id} value={p.group_id}>
                {p.groups?.name || 'Grupo'}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* ============================
            Ranking de la ronda actual
        ============================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Ranking de la ronda
            </h2>
            {rondaActiva && (
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
                {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restante{diasRestantes !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {ranking.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">No hay participantes todavía</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((item, index) => {
                const esPrimero = index === 0 && item.puntos > 0
                const esMio = item.user.id === user.id
                return (
                  <div
                    key={item.user.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      esPrimero
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50'
                    } ${esMio ? 'ring-2 ring-emerald-300' : ''}`}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                        esPrimero
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {item.user.nickname}
                      {esMio && (
                        <span className="text-gray-400 font-normal"> (vos)</span>
                      )}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        esPrimero ? 'text-emerald-600' : 'text-gray-600'
                      }`}
                    >
                      {item.puntos} pts
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
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Mis hábitos de hoy
          </h2>

          {habitos.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">No hay hábitos configurados</p>
          ) : (
            <div className="space-y-3">
              {habitos.map((habito) => {
                const completion = misCompletions[habito.id]
                const estado = completion?.status
                const pendiente = !completion || estado === 'rejected'

                return (
                  <div
                    key={habito.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">
                          {habito.name}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          Nv.{habito.level} · {PUNTOS_POR_NIVEL[habito.level]}pts
                        </span>
                      </div>
                      {completion && <StatusBadge status={estado} />}
                    </div>

                    {pendiente && (
                      <button
                        onClick={() => navigate(`/completar/${habito.id}`)}
                        className="shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
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
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Disputas pendientes
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {disputasPendientes} objeción{disputasPendientes !== 1 ? 'es' : ''} por responder
                </p>
              </div>
              <button
                onClick={() => navigate('/actividad')}
                className="relative px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Ver
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {disputasPendientes}
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ============================
            Actividad reciente
        ============================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Actividad reciente
            </h2>
            <button
              onClick={() => navigate('/actividad')}
              className="text-emerald-600 text-sm font-medium"
            >
              Ver todo
            </button>
          </div>
          {actividadReciente.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">No hay actividad reciente</p>
          ) : (
            <div className="space-y-2">
              {actividadReciente.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                  <img
                    src={c.photo_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {c.users?.nickname} — {c.habits?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {PUNTOS_POR_NIVEL[c.habits?.level]}pts · {new Date(c.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
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
