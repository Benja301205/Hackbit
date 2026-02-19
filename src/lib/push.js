const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function sendPushNotification(userIds, title, body) {
  if (!userIds?.length) return
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ user_ids: userIds, title, body }),
    })
  } catch {
    // Best-effort: no bloqueamos el flujo si falla
  }
}
