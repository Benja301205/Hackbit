import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSession() {
  const [user, setUser] = useState(null)
  const [userProfiles, setUserProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarPerfiles = useCallback(async () => {
    const token = localStorage.getItem('session_token')
    if (!token) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('users')
      .select('*, groups(*)')
      .eq('session_token', token)

    if (!data || data.length === 0) {
      setLoading(false)
      return
    }

    const savedGroupId = localStorage.getItem('active_group_id')
    const active = data.find(u => u.group_id === savedGroupId) || data[0]

    setUserProfiles(data)
    setUser(active)
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarPerfiles()
  }, [cargarPerfiles])

  const switchGroup = (groupId) => {
    const perfil = userProfiles.find(u => u.group_id === groupId)
    if (perfil) {
      localStorage.setItem('active_group_id', groupId)
      setUser(perfil)
    }
  }

  const saveSession = (token) => {
    localStorage.setItem('session_token', token)
  }

  const clearSession = () => {
    localStorage.removeItem('session_token')
    localStorage.removeItem('active_group_id')
    setUser(null)
    setUserProfiles([])
  }

  return { user, userProfiles, loading, saveSession, clearSession, setUser, switchGroup, recargar: cargarPerfiles }
}
