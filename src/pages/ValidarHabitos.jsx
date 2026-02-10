import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'

export default function ValidarHabitos() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()

  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarPendientes()
  }, [loadingSession, user])

  const cargarPendientes = async () => {
    setLoading(true)

    // Obtener usuarios del mismo grupo (excluyendo al actual)
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('group_id', user.group_id)
      .neq('id', user.id)

    if (!usuarios || usuarios.length === 0) {
      setPendientes([])
      setLoading(false)
      return
    }

    const userIds = usuarios.map((u) => u.id)
    const nickMap = {}
    usuarios.forEach((u) => { nickMap[u.id] = u.nickname })

    const { data: completions } = await supabase
      .from('completions')
      .select('*, habits(name, level)')
      .eq('status', 'pending')
      .in('user_id', userIds)
      .order('created_at', { ascending: true })

    const lista = (completions || []).map((c) => ({
      ...c,
      nickname: nickMap[c.user_id] || 'Usuario',
    }))

    setPendientes(lista)
    setLoading(false)
  }

  const handleValidar = async (completionId, nuevoStatus) => {
    setProcesando(completionId)

    const { error } = await supabase
      .from('completions')
      .update({
        status: nuevoStatus,
        validated_by: user.id,
      })
      .eq('id', completionId)

    if (!error) {
      setPendientes((prev) => prev.filter((c) => c.id !== completionId))
    }

    setProcesando(null)
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold mb-1">Validar hábitos</h1>
        <p className="text-gray-400 text-sm mb-6">
          {pendientes.length === 0
            ? 'No hay fotos pendientes'
            : `${pendientes.length} foto${pendientes.length !== 1 ? 's' : ''} por validar`}
        </p>

        {pendientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">👍</p>
            <p className="text-gray-500">¡Todo validado!</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {pendientes.map((completion) => (
              <div
                key={completion.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Foto */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={completion.photo_url}
                    alt="Foto del hábito"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-emerald-600">
                      {completion.nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(completion.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-0.5">
                    {completion.habits?.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Nivel {completion.habits?.level} · {PUNTOS_POR_NIVEL[completion.habits?.level]} puntos
                  </p>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleValidar(completion.id, 'rejected')}
                      disabled={procesando === completion.id}
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      ✗ Rechazar
                    </button>
                    <button
                      onClick={() => handleValidar(completion.id, 'approved')}
                      disabled={procesando === completion.id}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      ✓ Aprobar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
