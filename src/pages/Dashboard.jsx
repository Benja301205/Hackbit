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
  }
  const textos = {
    pending: 'Esperando validación',
    approved: 'Aprobado ✓',
    rejected: 'Rechazado ✗',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${estilos[status]}`}>
      {textos[status]}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const { finDeRonda, checking, cerrarModal } = useRoundCheck(user)
  const {
    ranking,
    habitos,
    misCompletions,
    pendientesValidar,
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
            Validaciones pendientes
        ============================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Validaciones pendientes
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {pendientesValidar === 0
                  ? 'No hay fotos para validar'
                  : `${pendientesValidar} foto${pendientesValidar !== 1 ? 's' : ''} por validar`}
              </p>
            </div>
            {pendientesValidar > 0 && (
              <button
                onClick={() => navigate('/validar')}
                className="relative px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Validar
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendientesValidar}
                </span>
              </button>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
