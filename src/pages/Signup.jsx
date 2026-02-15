import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!nickname.trim() || !email.trim() || !password) return

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nickname: nickname.trim() },
      },
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('already registered')) {
        setError('Este email ya está registrado. Intentá iniciar sesión.')
      } else {
        setError('Error al crear la cuenta. Intentá de nuevo.')
      }
      return
    }

    // If email confirmation is required, session will be null
    if (!data.session) {
      setLoading(false)
      setPendingConfirmation(true)
      return
    }

    // Store auth user id as session_token (bridge pattern)
    localStorage.setItem('session_token', data.user.id)
    localStorage.setItem('temp_nickname', nickname.trim())
    navigate('/crear-grupo', { replace: true })
  }

  if (pendingConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="w-full max-w-sm text-center relative z-10">
          <div className="w-20 h-20 glass-card flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] animate-scaleIn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-emerald-500">
              <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
              <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Revisá tu email</h2>
          <p className="text-zinc-400 text-sm mb-2">
            Te enviamos un link de confirmación a
          </p>
          <p className="text-emerald-500 font-medium mb-8">{email}</p>
          <p className="text-zinc-500 text-xs mb-8">
            Confirmá tu cuenta y después volvé a iniciar sesión.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-4 btn-aesthetic text-base tracking-widest hover:scale-[1.02]"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        {/* Logo */}
        <div className="w-24 h-24 glass-card flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] animate-scaleIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight">
          Hackbit<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-zinc-500 mb-10 text-center text-sm uppercase tracking-widest font-medium">
          Creá tu cuenta
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Apodo
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej: Benja"
              autoComplete="username"
              required
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nickname.trim() || !email.trim() || !password}
            className="w-full py-4 btn-aesthetic text-base tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] mt-4"
          >
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm mt-8">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
