import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/image'
import { PUNTOS_POR_NIVEL, formatDate } from '../lib/utils'

export default function CompletarHabito() {
  const { habitoId } = useParams()
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const fileInputRef = useRef(null)

  const [habito, setHabito] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarHabito()
  }, [loadingSession, user])

  const cargarHabito = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitoId)
      .single()

    setHabito(data)
    setLoading(false)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    try {
      const blob = await compressImage(file)
      setArchivo(blob)
      setPreview(URL.createObjectURL(blob))
    } catch {
      setError('No se pudo procesar la imagen')
    }
  }

  const handleEnviar = async () => {
    if (!archivo || !user || !habito) return
    setEnviando(true)
    setError(null)

    try {
      const hoy = formatDate(new Date())
      const filePath = `${user.group_id}/${user.id}/${hoy}_${habito.id}.jpg`

      // Subir foto a Storage
      const { error: uploadErr } = await supabase.storage
        .from('habit-photos')
        .upload(filePath, archivo, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadErr) throw uploadErr

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('habit-photos')
        .getPublicUrl(filePath)

      // Crear completion
      const { error: insertErr } = await supabase
        .from('completions')
        .insert({
          habit_id: habito.id,
          user_id: user.id,
          photo_url: urlData.publicUrl,
          status: 'pending',
          date: hoy,
        })

      if (insertErr) throw insertErr

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al enviar')
      setEnviando(false)
    }
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!habito) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-gray-400 mb-4">Hábito no encontrado</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-emerald-600 font-medium"
        >
          Volver al Dashboard
        </button>
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

        <h1 className="text-2xl font-bold mb-1">Completar hábito</h1>

        {/* Info del hábito */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-lg font-semibold">{habito.name}</p>
          <p className="text-sm text-gray-500">
            Nivel {habito.level} · {PUNTOS_POR_NIVEL[habito.level]} puntos
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Zona de foto */}
        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
            <span className="text-gray-400 text-sm font-medium">
              Sacar foto o elegir de galería
            </span>
          </button>
        ) : (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden mb-3">
              <img
                src={preview}
                alt="Vista previa"
                className="w-full object-cover"
              />
              <button
                onClick={() => {
                  setPreview(null)
                  setArchivo(null)
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview && (
          <div className="space-y-3">
            <button
              onClick={handleEnviar}
              disabled={enviando}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar para validación'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 font-medium transition-colors text-sm"
            >
              Cambiar foto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
