import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateInviteCode, calcularFechasRonda, PUNTOS_POR_NIVEL } from '../lib/utils'

export default function CrearGrupo() {
  const navigate = useNavigate()
  const [apodo, setApodo] = useState(() => {
    const saved = localStorage.getItem('temp_nickname')
    if (saved) localStorage.removeItem('temp_nickname')
    return saved || ''
  })
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

      // 2. Crear usuario con session_token (reutilizar si existe)
      const existingToken = localStorage.getItem('session_token')
      const sessionToken = existingToken || crypto.randomUUID()
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

      // Actualizar created_by del grupo
      await supabase.from('groups').update({ created_by: usuario.id }).eq('id', grupo.id)

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
      localStorage.setItem('active_group_id', grupo.id)

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
  // ============================
  // Pantalla post-creación: mostrar código
  // ============================
  if (grupoCreado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)]">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6 animate-celebrate">🎉</div>
          <h1 className="text-3xl font-bold mb-3 text-white">¡Grupo creado!</h1>
          <p className="text-zinc-400 mb-10 text-sm">
            Compartí este código para que tus amigos se unan
          </p>

          <div className="glass-card p-8 mb-8 border-emerald-500/30 animate-scaleIn opacity-0" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-medium">Código de invitación</p>
            <p className="text-5xl font-mono font-bold tracking-[0.2em] text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              {grupoCreado.inviteCode}
            </p>
          </div>

          <div className="space-y-4 mb-10">
            <button
              onClick={copiarCodigo}
              className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 active:bg-zinc-700 text-white rounded-2xl font-medium transition-all"
            >
              {copiado ? '¡Copiado!' : 'Copiar código'}
            </button>
            <button
              onClick={compartirLink}
              className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 active:bg-zinc-700 text-white rounded-2xl font-medium transition-all"
            >
              Compartir link
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-4 btn-aesthetic text-lg tracking-wide hover:scale-[1.02]"
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
    <div className="min-h-screen px-6 py-8 pb-24 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)]">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-white mb-8 text-sm flex items-center gap-2 transition-colors uppercase tracking-widest font-medium"
        >
          <span>←</span> Volver
        </button>

        <h1 className="text-3xl font-bold mb-8 text-white tracking-tight">Crear grupo</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-error">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Apodo */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Tu apodo
            </label>
            <input
              type="text"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej: Benja"
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Nombre del grupo */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.target.value)}
              placeholder="Ej: Los saludables"
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Hábitos */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">
              Hábitos
            </label>
            <div className="space-y-4">
              {habitos.map((habito, index) => (
                <div
                  key={index}
                  className="glass-card p-4 space-y-3 stagger-item"
                  style={{ '--i': index }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) =>
                        actualizarHabito(index, 'name', e.target.value)
                      }
                      placeholder="Nombre del hábito"
                      className="flex-1 py-3 px-4 bg-zinc-900/50 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 text-sm transition-colors"
                    />
                    {habitos.length > 1 && (
                      <button
                        onClick={() => eliminarHabito(index)}
                        className="text-zinc-600 hover:text-red-500 p-2 transition-colors"
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
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${habito.level === nivel
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                          }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]})
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={agregarHabito}
              className="mt-4 w-full py-3 border border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl text-zinc-500 hover:text-emerald-500 text-sm font-medium transition-colors uppercase tracking-widest"
            >
              + Agregar hábito
            </button>
          </div>

          {/* Premio por ronda */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Premio por ronda
            </label>
            <input
              type="text"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder="Ej: El perdedor paga la cena"
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Premio anual */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Premio anual{' '}
              <span className="text-zinc-600 font-normal lowercase tracking-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={premioAnual}
              onChange={(e) => setPremioAnual(e.target.value)}
              placeholder="Ej: El perdedor paga un viaje"
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">
              Frecuencia de ronda
            </label>
            <div className="flex gap-3 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
              {[
                { value: 'weekly', label: 'Semanal' },
                { value: 'monthly', label: 'Mensual' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${period === opt.value
                      ? 'bg-zinc-800 text-white shadow-lg'
                      : 'text-zinc-500 hover:text-zinc-300'
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
            className="w-full py-4 btn-aesthetic text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] mt-8"
          >
            {loading ? 'Creando...' : 'Crear grupo'}
          </button>
        </div>
      </div>
    </div>
  )
}
