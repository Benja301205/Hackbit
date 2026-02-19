import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { usePushNotifications } from '../hooks/usePushNotifications'
import BottomNav from '../components/BottomNav'

const STORAGE_KEY = 'hackbit_notif_settings'

const DEFAULT_SETTINGS = {
  recordatorioDiario: true,
  horaDiaria: '20:00',
  ultimaChance: false,
  validacionSocial: true,
  cambioDeLider: true,
  rachaLiderazgo: true,
}

function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between py-4 cursor-pointer group">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-zinc-200 group-active:text-white transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-emerald-500 transition-colors duration-300" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-5" />
      </div>
    </label>
  )
}

export default function Notificaciones() {
  const navigate = useNavigate()
  const { user } = useSession()
  const [settings, setSettings] = useState(getSettings)
  const [permiso, setPermiso] = useState('default')
  const [testSent, setTestSent] = useState(false)
  const [isStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
  const { isSupported: isPushSupported, isSubscribed, subscribe, unsubscribe, loading: pushLoading } =
    usePushNotifications(user?.id)

  useEffect(() => {
    if ('Notification' in window) {
      setPermiso(Notification.permission)
    }
  }, [])

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  const pedirPermiso = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermiso(result)
  }

  const probarNotificacion = async () => {
    if (permiso !== 'granted') return
    try {
      const reg = await navigator.serviceWorker?.ready
      if (reg) {
        await reg.showNotification('Hackbit', {
          body: 'Las notificaciones funcionan correctamente.',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'test',
        })
      }
    } catch {
      new Notification('Hackbit', {
        body: 'Las notificaciones funcionan correctamente.',
        icon: '/icons/icon-192.png',
      })
    }
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const showIOSGuide = /iPhone|iPad|iPod/.test(navigator.userAgent) && !isStandalone

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Header */}
      <div className="bg-transparent relative px-6 pt-12 pb-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors mb-4 flex items-center gap-1.5 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Volver
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Notificaciones<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Te avisamos cuando entres a la app para mantenerte al dia
        </p>
      </div>

      <div className="px-4 space-y-4 relative z-10">

        {/* iOS Install Guide */}
        {showIOSGuide && (
          <section className="glass-card p-5 border-amber-500/20 bg-amber-500/5 animate-scaleIn">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-amber-400">Instala Hackbit en tu iPhone</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Para recibir alertas, agrega la app a tu pantalla de inicio:
                </p>
                <ol className="text-xs text-zinc-400 mt-2 space-y-1 list-decimal list-inside">
                  <li>Toca el boton <span className="text-white font-medium">Compartir</span> en Safari</li>
                  <li>Selecciona <span className="text-white font-medium">Agregar a Inicio</span></li>
                  <li>Abre Hackbit desde el icono nuevo</li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* Permission Card */}
        <section className="glass-card p-5">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
            Permisos
          </h2>

          {permiso === 'granted' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">Notificaciones activadas</p>
                <p className="text-xs text-zinc-500">Recibiras alertas al abrir la app</p>
              </div>
            </div>
          ) : permiso === 'denied' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Bloqueadas por el navegador</p>
                <p className="text-xs text-zinc-500">Activalas desde los ajustes de tu navegador</p>
              </div>
            </div>
          ) : (
            <button
              onClick={pedirPermiso}
              className="btn-aesthetic w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
              </svg>
              Activar notificaciones
            </button>
          )}

          {/* Test button */}
          {permiso === 'granted' && (
            <button
              onClick={probarNotificacion}
              className="mt-4 w-full py-2.5 text-sm font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-2xl border border-emerald-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {testSent ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Enviada
                </>
              ) : (
                'Probar alerta'
              )}
            </button>
          )}
        </section>

        {/* Settings Toggles */}
        <section className="glass-card p-5">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
            Alertas
          </h2>

          <div className="divide-y divide-white/5">
            <Toggle
              checked={settings.recordatorioDiario}
              onChange={(e) => updateSetting('recordatorioDiario', e.target.checked)}
              label="Recordatorio diario"
              description={`Te avisa a las ${settings.horaDiaria} si no completaste habitos`}
            />

            {settings.recordatorioDiario && (
              <div className="py-3 pl-4 animate-scaleIn">
                <label className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">Hora:</span>
                  <input
                    type="time"
                    value={settings.horaDiaria}
                    onChange={(e) => updateSetting('horaDiaria', e.target.value)}
                    className="bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </label>
              </div>
            )}

            <Toggle
              checked={settings.ultimaChance}
              onChange={(e) => updateSetting('ultimaChance', e.target.checked)}
              label="Ultima chance"
              description="Alerta a las 23:00 si aun no completaste nada"
            />

            <Toggle
              checked={settings.validacionSocial}
              onChange={(e) => updateSetting('validacionSocial', e.target.checked)}
              label="Validacion social"
              description="Cuando alguien valida o disputa tu foto"
            />

            <Toggle
              checked={settings.cambioDeLider}
              onChange={(e) => updateSetting('cambioDeLider', e.target.checked)}
              label="Cambio de lider"
              description="Cuando alguien toma la punta del ranking"
            />

            <Toggle
              checked={settings.rachaLiderazgo}
              onChange={(e) => updateSetting('rachaLiderazgo', e.target.checked)}
              label="Racha de liderazgo"
              description="Cuando alguien lidera 3 dias seguidos"
            />
          </div>
        </section>

        {/* Push web en tiempo real */}
        {isPushSupported && (
          <section className="glass-card p-5">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
              Notificaciones en tiempo real
            </h2>

            {isSubscribed ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">Push activado</p>
                    <p className="text-xs text-zinc-500">Recibis alertas aunque la app esté cerrada</p>
                  </div>
                </div>
                <button
                  onClick={unsubscribe}
                  disabled={pushLoading}
                  className="w-full py-2.5 text-sm font-medium text-zinc-500 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-2xl border border-white/5 transition-colors disabled:opacity-50"
                >
                  {pushLoading ? 'Desactivando...' : 'Desactivar'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Activá las notificaciones para no romper la racha del grupo — te avisamos cuando alguien sube una foto, objeta la tuya, o resuelve una disputa.
                </p>
                <button
                  onClick={subscribe}
                  disabled={pushLoading || permiso === 'denied'}
                  className="btn-aesthetic w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pushLoading ? 'Activando...' : 'Activar notificaciones push'}
                </button>
                {permiso === 'denied' && (
                  <p className="text-xs text-red-400 mt-2 text-center">
                    El navegador bloqueó los permisos. Activalos desde los ajustes del sistema.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Info card */}
        <section className="glass-card p-5 opacity-60">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Las alertas de la app (ranking, habitos) se evaluan cuando abrís Hackbit. Las notificaciones push llegan aunque tengas la app cerrada.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
