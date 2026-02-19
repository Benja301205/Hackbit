import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(userId) {
  const [isSupported] = useState(() => 'PushManager' in window && 'serviceWorker' in navigator)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSupported || !userId) return
    checkSubscription()
  }, [userId, isSupported])

  async function checkSubscription() {
    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsSubscribed(!!data)
  }

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await supabase
        .from('push_subscriptions')
        .upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: 'user_id' })
      setIsSubscribed(true)
    } catch {
      // Ignore — usuario puede haber denegado el permiso
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  return { isSupported, isSubscribed, subscribe, unsubscribe, loading }
}
