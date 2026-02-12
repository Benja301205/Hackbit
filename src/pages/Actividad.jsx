import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'

export default function Actividad() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()

  const [completions, setCompletions] = useState([])
  const [disputas, setDisputas] = useState({})
  const [loading, setLoading] = useState(true)
  const [objetando, setObjetando] = useState(null)
  const [textoObjecion, setTextoObjecion] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Nuevo estado para la vista minimizada (modal)
  const [selectedCompletion, setSelectedCompletion] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarActividad()
  }, [loadingSession, user])

  const cargarActividad = async () => {
    setLoading(true)

    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('group_id', user.group_id)

    if (!usuarios || usuarios.length === 0) {
      setCompletions([])
      setLoading(false)
      return
    }

    const userIds = usuarios.map((u) => u.id)
    const nickMap = {}
    usuarios.forEach((u) => { nickMap[u.id] = u.nickname })

    const { data: comps } = await supabase
      .from('completions')
      .select('*, habits(name, level)')
      .in('user_id', userIds)
      .in('status', ['approved', 'disputed'])
      .order('created_at', { ascending: false })
      .limit(50)

    const lista = (comps || []).map((c) => ({
      ...c,
      nickname: nickMap[c.user_id] || 'Usuario',
    }))

    setCompletions(lista)

    // Cargar disputas existentes para estas completions
    if (lista.length > 0) {
      const { data: disputasData } = await supabase
        .from('disputes')
        .select('*')
        .in('completion_id', lista.map(c => c.id))

      const disputaMap = {}
        ; (disputasData || []).forEach((d) => {
          disputaMap[d.completion_id] = d
        })
      setDisputas(disputaMap)
    }

    setLoading(false)
  }

  const handleObjetar = async (completionId) => {
    if (!textoObjecion.trim()) return
    setEnviando(true)

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        completion_id: completionId,
        disputed_by: user.id,
        objection_text: textoObjecion.trim(),
      })
      .select()
      .single()

    if (!error && data) {
      setDisputas((prev) => ({ ...prev, [completionId]: data }))
      // Actualizar status de la completion a 'disputed'
      await supabase
        .from('completions')
        .update({ status: 'disputed' })
        .eq('id', completionId)
    }

    setObjetando(null)
    setTextoObjecion('')
    setEnviando(false)
  }

  // Agrupar por fecha
  const groupedCompletions = completions.reduce((acc, c) => {
    const date = new Date(c.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateLabel = date.toLocaleDateString('es-AR')

    // Comparar solo fechas (sin hora)
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    const isYesterday = date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    if (isToday) dateLabel = 'Hoy'
    if (isYesterday) dateLabel = 'Ayer'

    if (!acc[dateLabel]) acc[dateLabel] = []
    acc[dateLabel].push(c)
    return acc
  }, {})

  // Ordenar las keys de fechas (si 'Hoy' -> primero, luego 'Ayer', luego fechas)
  // Como vienen ordenados por created_at desc, el orden de inserción debería respetar el orden cronológico inverso
  const dateKeys = Object.keys(groupedCompletions)

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Actividad</h1>
        <p className="text-gray-400 text-sm mt-1">
          Fotos recientes del grupo
        </p>
      </div>

      {completions.length === 0 ? (
        <div className="text-center py-12 px-6">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-gray-500">No hay actividad todavía</p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {dateKeys.map(dateLabel => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">{dateLabel}</h3>
              <div className="grid grid-cols-3 gap-2">
                {groupedCompletions[dateLabel].map((completion) => (
                  <button
                    key={completion.id}
                    onClick={() => setSelectedCompletion(completion)}
                    className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm active:scale-95 transition-transform"
                  >
                    <img
                      src={completion.photo_url}
                      alt={completion.habits?.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Minimizado */}
      {selectedCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm"
          onClick={() => setSelectedCompletion(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header del Modal */}
            <div className="relative">
              <img
                src={selectedCompletion.photo_url}
                alt="Detalle"
                className="w-full aspect-square object-cover"
              />

              <button
                onClick={() => setSelectedCompletion(null)}
                className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {(() => {
                const completion = selectedCompletion
                const esMio = completion.user_id === user.id
                const disputaExistente = disputas[completion.id]
                const puedeObjetar = !esMio && !disputaExistente

                return (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-emerald-600">
                        {completion.nickname}
                        {esMio && <span className="text-gray-400 font-normal"> (vos)</span>}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(completion.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-0.5">
                      {completion.habits?.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Nivel {completion.habits?.level} · {PUNTOS_POR_NIVEL[completion.habits?.level]} puntos
                    </p>

                    {/* Estado de disputa */}
                    {disputaExistente && (
                      <button
                        onClick={() => navigate(`/disputa/${disputaExistente.id}`)}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-xl transition-colors mb-2"
                      >
                        {disputaExistente.resolution
                          ? `Disputa resuelta: ${disputaExistente.resolution === 'accepted' ? 'Aceptada' : 'Rechazada'}`
                          : disputaExistente.defense_text
                            ? 'Disputa: esperando resolución'
                            : disputaExistente.disputed_by === user.id
                              ? 'Disputa: esperando defensa'
                              : 'Disputa: necesitás defenderte'}
                      </button>
                    )}

                    {/* Botón objetar */}
                    {puedeObjetar && objetando !== completion.id && (
                      <button
                        onClick={() => setObjetando(completion.id)}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors"
                      >
                        Objetar
                      </button>
                    )}

                    {/* Formulario de objeción */}
                    {objetando === completion.id && (
                      <div className="space-y-3 mt-2">
                        <textarea
                          value={textoObjecion}
                          onChange={(e) => setTextoObjecion(e.target.value)}
                          placeholder="¿Por qué objetás esta foto?"
                          rows={3}
                          autoFocus
                          className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setObjetando(null)
                              setTextoObjecion('')
                            }}
                            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleObjetar(completion.id)}
                            disabled={enviando || !textoObjecion.trim()}
                            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl transition-colors"
                          >
                            {enviando ? 'Enviando...' : 'Enviar objeción'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
