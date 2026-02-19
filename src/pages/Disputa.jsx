import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import { sendPushNotification } from '../lib/push'

export default function Disputa() {
  const { disputaId } = useParams()
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()

  const [disputa, setDisputa] = useState(null)
  const [completion, setCompletion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [defensa, setDefensa] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarDisputa()
  }, [loadingSession, user])

  const cargarDisputa = async () => {
    const { data: d, error: errorDisputa } = await supabase
      .from('disputes')
      .select('*, users!disputed_by(nickname)')
      .eq('id', disputaId)
      .single()

    if (errorDisputa) console.error('Error fetching dispute:', errorDisputa)

    if (!d) {
      setLoading(false)
      return
    }

    setDisputa(d)

    const { data: c } = await supabase
      .from('completions')
      .select('*, habits(name, level), users!user_id(nickname)')
      .eq('id', d.completion_id)
      .single()

    setCompletion(c)
    setLoading(false)
  }

  const enviarDefensa = async () => {
    if (!defensa.trim()) return
    setEnviando(true)
    setError(null)

    const { error: err } = await supabase
      .from('disputes')
      .update({ defense_text: defensa.trim() })
      .eq('id', disputaId)

    if (err) {
      setError('No se pudo enviar la defensa. Intentá de nuevo.')
      console.error('Error enviando defensa:', err)
    } else {
      setDisputa((prev) => ({ ...prev, defense_text: defensa.trim() }))
      // Notificar al objetante que hay defensa esperando
      await sendPushNotification(
        [disputa.disputed_by],
        'Hackbit',
        `${completion?.users?.nickname} se defendió — tomá una decisión`
      )
    }
    setEnviando(false)
  }

  const resolver = async (resolution) => {
    setEnviando(true)
    setError(null)

    const { error: err } = await supabase
      .from('disputes')
      .update({ resolution, resolved_at: new Date().toISOString() })
      .eq('id', disputaId)

    if (!err) {
      if (resolution === 'rejected') {
        // Rechazar la completion (se restan puntos)
        await supabase
          .from('completions')
          .update({ status: 'rejected' })
          .eq('id', disputa.completion_id)
      } else {
        // Aceptar la defensa (se mantienen puntos, volver a approved)
        await supabase
          .from('completions')
          .update({ status: 'approved' })
          .eq('id', disputa.completion_id)
      }
      // Notificar al acusado con el resultado
      const msg = resolution === 'accepted'
        ? `${disputa.users?.nickname} aceptó tu defensa ✅`
        : `${disputa.users?.nickname} rechazó tu defensa ❌`
      await sendPushNotification([completion.user_id], 'Hackbit', msg)
      setDisputa((prev) => ({ ...prev, resolution, resolved_at: new Date().toISOString() }))
    } else {
      setError('No se pudo resolver la disputa. Intentá de nuevo.')
      console.error('Error resolviendo disputa:', err)
    }
    setEnviando(false)
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!disputa || !completion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-gray-400 mb-4">Disputa no encontrada</p>
        <button
          onClick={() => navigate('/actividad')}
          className="text-emerald-600 font-medium"
        >
          Volver a Actividad
        </button>
      </div>
    )
  }

  const esObjetante = disputa.disputed_by === user.id
  const esAcusado = completion.user_id === user.id
  const resuelta = !!disputa.resolution

  console.log('DEBUG DISPUTA:', {
    disputaId,
    userId: user.id,
    disputa_disputed_by: disputa.disputed_by,
    completion_user_id: completion.user_id,
    esObjetante,
    esAcusado,
    resuelta,
    disputa_defensa: disputa.defense_text
  })

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/actividad')}
          className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold mb-4">Disputa</h1>

        {/* Foto y datos de la completion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <img
            src={completion.photo_url}
            alt="Foto del hábito"
            className="w-full aspect-square object-cover"
          />
          <div className="p-4">
            <p className="text-sm font-bold text-emerald-600">{completion.users?.nickname}</p>
            <p className="text-sm font-medium">{completion.habits?.name}</p>
            <p className="text-xs text-gray-500">
              Nivel {completion.habits?.level} · {PUNTOS_POR_NIVEL[completion.habits?.level]} puntos
            </p>
          </div>
        </div>

        {/* Paso 1: Objeción */}
        <div className="bg-red-50 rounded-2xl p-4 mb-4 stagger-item" style={{ '--i': 0 }}>
          <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-1">Objeción</p>
          <p className="text-sm font-medium text-red-700 mb-1">
            {disputa.users?.nickname || 'Objetante'}:
          </p>
          <p className="text-sm text-red-600">{disputa.objection_text}</p>
        </div>

        {/* Paso 2: Defensa */}
        {disputa.defense_text ? (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 stagger-item" style={{ '--i': 1 }}>
            <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold mb-1">Defensa</p>
            <p className="text-sm font-medium text-blue-700 mb-1">
              {completion.users?.nickname}:
            </p>
            <p className="text-sm text-blue-600">{disputa.defense_text}</p>
          </div>
        ) : esAcusado && !resuelta ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 stagger-item" style={{ '--i': 1 }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Tu defensa</p>
            <textarea
              value={defensa}
              onChange={(e) => setDefensa(e.target.value)}
              placeholder="Explicá por qué tu foto es válida..."
              rows={3}
              className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl text-sm placeholder:text-gray-400 caret-emerald-500 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none mb-3"
            />
            <button
              onClick={enviarDefensa}
              disabled={enviando || !defensa.trim()}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar defensa'}
            </button>
            {error && (
              <p className="text-red-500 text-sm text-center mt-2 animate-error">{error}</p>
            )}
          </div>
        ) : !resuelta ? (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 stagger-item" style={{ '--i': 1 }}>
            <p className="text-sm text-gray-500">Esperando defensa de {completion.users?.nickname}...</p>
          </div>
        ) : null}

        {/* Paso 3: Resolución */}
        {resuelta ? (
          <div className={`rounded-2xl p-4 mb-4 ${disputa.resolution === 'accepted' ? 'bg-emerald-50 animate-success' : 'bg-red-50 animate-error'
            }`}>
            <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{
              color: disputa.resolution === 'accepted' ? '#047857' : '#dc2626'
            }}>
              Resolución
            </p>
            <p className="text-sm font-medium" style={{
              color: disputa.resolution === 'accepted' ? '#059669' : '#dc2626'
            }}>
              {disputa.resolution === 'accepted'
                ? 'Defensa aceptada — se mantienen los puntos'
                : 'Defensa rechazada — se restaron los puntos'}
            </p>
          </div>
        ) : esObjetante && disputa.defense_text ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 stagger-item" style={{ '--i': 2 }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Tu decisión</p>
            <div className="flex gap-3">
              <button
                onClick={() => resolver('accepted')}
                disabled={enviando}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => resolver('rejected')}
                disabled={enviando}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                Rechazar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Aceptar = se mantienen los puntos · Rechazar = se restan
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
