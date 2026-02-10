import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSession() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('session_token')
    if (!token) {
      setLoading(false)
      return
    }

    supabase
      .from('users')
      .select('*, groups(*)')
      .eq('session_token', token)
      .maybeSingle()
      .then(({ data }) => {
        setUser(data)
        setLoading(false)
      })
  }, [])

  const saveSession = (token) => {
    localStorage.setItem('session_token', token)
  }

  const clearSession = () => {
    localStorage.removeItem('session_token')
    setUser(null)
  }

  return { user, loading, saveSession, clearSession, setUser }
}
