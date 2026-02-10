# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

- `npm run dev` — Servidor de desarrollo (Vite)
- `npm run build` — Build de producción
- `npm run preview` — Preview del build de producción

## Stack

- **Frontend:** React 19 + Vite
- **Estilos:** Tailwind CSS v4 (via plugin `@tailwindcss/vite`, importado con `@import "tailwindcss"` en `src/index.css`)
- **Backend/DB:** Supabase (PostgreSQL + Storage + Realtime)
- **Routing:** React Router v7 (`BrowserRouter` en `main.jsx`)
- **Sin sistema de login:** Identidad por `session_token` (UUID v4) en localStorage

## Arquitectura

App de competencia de hábitos entre amigos. Todo en español. Mobile-first (375px+). Solo Tailwind para estilos, sin librerías de componentes externas.

### Estructura

```
src/
  components/   → BottomNav (nav inferior), FinDeRondaModal
  pages/        → Inicio, CrearGrupo, UnirseGrupo, Dashboard, CompletarHabito, ValidarHabitos, TablaAnual, InfoGrupo
  lib/          → supabase.js (cliente), utils.js (fechas, puntos, códigos), image.js (compresión)
  hooks/        → useSession (auth por token), useDashboard (datos del dashboard), useRoundCheck (cierre automático de rondas)
  App.jsx       → Router principal (Routes)
  main.jsx      → Entry point (BrowserRouter + StrictMode)
supabase/
  migrations/   → 001_create_tables, 002_rls_policies, 003_storage_bucket
```

### Flujo principal

1. `useSession` verifica `session_token` en localStorage → busca usuario en DB
2. `useRoundCheck` detecta si la ronda activa expiró → cierra ronda, calcula ganador, crea siguiente ronda, muestra modal
3. `useDashboard` carga ranking (puntos de completions aprobadas), hábitos de hoy con estados, pendientes de validación

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
