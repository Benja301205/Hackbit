import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateInviteCode, calcularFechasRonda, PUNTOS_POR_NIVEL } from '../lib/utils'

export default function CrearGrupo() {
  const navigate = useNavigate()
  const [apodo, setApodo] = useState('')
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [habitos, setHabitos] = useState([{ name: '', level: 1 }])
  const [premio, setPremio] = useState('')
  const [premioAnual, setPremioAnual] = useState('')
  const [period, setPeriod] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estado post-creación
  const [grupoCreado, setGrupoCreado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const agregarHabito = () => {
    setHabitos([...habitos, { name: '', level: 1 }])
  }

  const actualizarHabito = (index, field, value) => {
    const nuevos = [...habitos]
    nuevos[index] = { ...nuevos[index], [field]: value }
    setHabitos(nuevos)
  }

  const eliminarHabito = (index) => {
    if (habitos.length <= 1) return
    setHabitos(habitos.filter((_, i) => i !== index))
  }

  const formValido = () => {
    return (
      apodo.trim() &&
      nombreGrupo.trim() &&
      premio.trim() &&
      habitos.every((h) => h.name.trim())
    )
  }

  const handleCrear = async () => {
    if (!formValido()) return
    setLoading(true)
    setError(null)

    try {
      // 1. Crear grupo con código único
      let inviteCode = generateInviteCode()
      // Verificar que no exista (poco probable pero por las dudas)
      const { data: existente } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle()
      if (existente) inviteCode = generateInviteCode()

      const { data: grupo, error: errorGrupo } = await supabase
        .from('groups')
        .insert({
          name: nombreGrupo.trim(),
          invite_code: inviteCode,
          prize: premio.trim(),
          annual_prize: premioAnual.trim() || null,
          period,
        })
        .select()
        .single()

      if (errorGrupo) throw errorGrupo

      // 2. Crear usuario con session_token
      const sessionToken = crypto.randomUUID()
      const { data: usuario, error: errorUsuario } = await supabase
        .from('users')
        .insert({
          group_id: grupo.id,
          nickname: apodo.trim(),
          session_token: sessionToken,
        })
        .select()
        .single()

      if (errorUsuario) throw errorUsuario

      // 3. Crear hábitos
      const { error: errorHabitos } = await supabase
        .from('habits')
        .insert(
          habitos.map((h) => ({
            group_id: grupo.id,
            name: h.name.trim(),
            level: h.level,
          }))
        )

      if (errorHabitos) throw errorHabitos

      // 4. Crear primera ronda
      const fechas = calcularFechasRonda(period)
      const { error: errorRonda } = await supabase
        .from('rounds')
        .insert({
          group_id: grupo.id,
          start_date: fechas.start_date,
          end_date: fechas.end_date,
          is_active: true,
        })

      if (errorRonda) throw errorRonda

      // 5. Guardar sesión
      localStorage.setItem('session_token', sessionToken)

      setGrupoCreado({ ...grupo, inviteCode })
    } catch (err) {
      setError(err.message || 'Error al crear el grupo')
    } finally {
      setLoading(false)
    }
  }

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(grupoCreado.inviteCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback
    }
  }

  const compartirLink = async () => {
    const url = `${window.location.origin}/unirse/${grupoCreado.inviteCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Competencia de Hábitos', text: `Unite a mi grupo "${grupoCreado.name}"`, url })
      } catch {
        // Usuario canceló
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  // ============================
  // Pantalla post-creación: mostrar código
  // ============================
  if (grupoCreado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">¡Grupo creado!</h1>
          <p className="text-gray-500 mb-8">
            Compartí este código para que tus amigos se unan
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <p className="text-sm text-gray-400 mb-2">Código de invitación</p>
            <p className="text-4xl font-mono font-bold tracking-[0.3em] text-emerald-600">
              {grupoCreado.inviteCode}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <button
              onClick={copiarCodigo}
              className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium transition-colors"
            >
              {copiado ? '¡Copiado!' : 'Copiar código'}
            </button>
            <button
              onClick={compartirLink}
              className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl font-medium transition-colors"
            >
              Compartir link
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ============================
  // Formulario de creación
  // ============================
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold mb-6">Crear grupo</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Apodo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu apodo
            </label>
            <input
              type="text"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej: Benja"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.target.value)}
              placeholder="Ej: Los saludables"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Hábitos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hábitos
            </label>
            <div className="space-y-3">
              {habitos.map((habito, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-100 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) =>
                        actualizarHabito(index, 'name', e.target.value)
                      }
                      placeholder="Nombre del hábito"
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                    />
                    {habitos.length > 1 && (
                      <button
                        onClick={() => eliminarHabito(index)}
                        className="text-gray-300 hover:text-red-400 text-lg px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => actualizarHabito(index, 'level', nivel)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          habito.level === nivel
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]}pts)
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={agregarHabito}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl text-gray-500 hover:text-emerald-600 text-sm font-medium transition-colors"
            >
              + Agregar hábito
            </button>
          </div>

          {/* Premio por ronda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premio por ronda
            </label>
            <input
              type="text"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder="Ej: El perdedor paga la cena"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Premio anual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premio anual{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={premioAnual}
              onChange={(e) => setPremioAnual(e.target.value)}
              placeholder="Ej: El perdedor paga un viaje"
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia de ronda
            </label>
            <div className="flex gap-3">
              {[
                { value: 'weekly', label: 'Semanal' },
                { value: 'monthly', label: 'Mensual' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    period === opt.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón crear */}
          <button
            onClick={handleCrear}
            disabled={loading || !formValido()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors mt-4"
          >
            {loading ? 'Creando...' : 'Crear grupo'}
          </button>
        </div>
      </div>
    </div>
  )
}
