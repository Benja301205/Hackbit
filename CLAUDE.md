# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

- `npm run dev` — Servidor de desarrollo (Vite)
- `npm run build` — Build de producción
- `npm run preview` — Preview del build de producción

## Stack

- **Frontend:** React 19 + Vite
- **Estilos:** Tailwind CSS v4 (via plugin `@tailwindcss/vite`). Incluye animaciones personalizadas (`slam`, `shake`) y clases utilitarias (`.glass-card`, `.btn-aesthetic`) en `src/index.css`
- **Backend/DB:** Supabase (PostgreSQL + Storage + Realtime)
- **Routing:** React Router v7 (`BrowserRouter` en `main.jsx`)
- **Sin sistema de login:** Identidad por `session_token` (UUID v4) en localStorage. Soporta múltiples grupos por token.

## Arquitectura

App de competencia de hábitos entre amigos. Todo en español. Mobile-first (375px+). Tailwind para estilos + animaciones CSS custom.

### Estructura

```
src/
  components/   → BottomNav (nav inferior), FinDeRondaModal
  pages/        → Inicio, CrearGrupo, UnirseGrupo, Dashboard, CompletarHabito, ValidarHabitos, TablaAnual, InfoGrupo, Actividad, Disputa, EditarGrupo
  lib/          → supabase.js (cliente), utils.js (fechas, puntos, códigos), image.js (compresión), stamp.js (logica sello/watermark)
  hooks/        → useSession (auth por token multi-grupo), useDashboard (datos del dashboard), useRoundCheck (cierre automático de rondas)
  App.jsx       → Router principal (Routes)
  main.jsx      → Entry point (BrowserRouter + StrictMode)
supabase/
  migrations/   → 001_create_tables, 002_rls_policies, 003_storage_bucket, 004_multi_group, 005_disputes, 006_fix_completion_status_check
```

### Flujo principal

1. `useSession` verifica `session_token` en localStorage → busca todos los perfiles asociados (multi-grupo) y selecciona el activo.
2. `useRoundCheck` detecta si la ronda activa expiró → cierra ronda, calcula ganador, crea siguiente ronda, muestra modal.
3. `useDashboard` carga ranking (puntos de completions aprobadas), hábitos de hoy con estados, conflictos/disputas pendientes.
4. **Flujo de Disputas:** Las fotos se auto-aprueban. Otros usuarios pueden objetar (crea disputa). El usuario se defiende. El objetante resuelve (aceptar/rechazar).
5. **Gestión de Grupos:** Creador puede editar/eliminar grupo. Miembros pueden salir.

### Configuración de Supabase

Variables de entorno en `.env` (ver `.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Reglas del proyecto

- NO agregar funcionalidades no especificadas en las specs
- NO usar librerías de componentes (Material UI, Chakra, etc.)
- NO modo oscuro, NO i18n, NO tests, NO PWA, NO CI/CD
- Fotos se suben a Supabase Storage bucket `habit-photos`
- Puntos: Nivel 1 = 30pts, Nivel 2 = 20pts, Nivel 3 = 10pts
- Cada hábito se puede completar una vez por día
- Puntos solo se suman cuando otro usuario aprueba la foto
