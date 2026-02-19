import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore — web-push via npm specifier en Deno
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_ids, title, body } = await req.json()

    if (!user_ids?.length || !title || !body) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', user_ids)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title, body })

    const results = await Promise.allSettled(
      subs.map(async ({ user_id, subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload)
        } catch (err: any) {
          if (err.statusCode === 410) {
            // Suscripción expirada — limpiar de la tabla
            await supabase.from('push_subscriptions').delete().eq('user_id', user_id)
          }
          throw err
        }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
