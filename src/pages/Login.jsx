import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setLoading(false)
      if (authError.message === 'Invalid login credentials') {
        setError('Email o contraseña incorrectos')
      } else if (authError.message === 'Email not confirmed') {
        setError('Tu email aún no está confirmado. Revisá tu casilla de correo (incluso spam) y hacé click en el link de confirmación.')
      } else {
        setError('Error al iniciar sesión. Intentá de nuevo.')
      }
      return
    }

    localStorage.setItem('session_token', data.user.id)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight">
          Hackbit<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-zinc-500 mb-10 text-center text-sm uppercase tracking-widest font-medium">
          Iniciá sesión
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full py-4 btn-aesthetic text-base tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] mt-4"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm mt-8">
          ¿No tenés cuenta?{' '}
          <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
