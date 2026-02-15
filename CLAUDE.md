# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Auth Policy (Override)

- Auth/Login está permitido y es parte del producto.
- Se prioriza UX Safari iPhone: re-login en 1 toque, email prellenado si se pierde sesión.
- Implementación permitida:
  * Frontend: rutas/pantallas/login/signup/estados de sesión.
  * Supabase Auth SOLO si ya está configurado en el repo (email+password, OAuth si ya existe).
- Implementación NO permitida (salvo instrucción explícita del usuario):
  * No tocar base de datos, migrations, tablas, RLS policies, Storage, ni seeds.
  * No modificar lógica de ranking/hábitos.
- Si faltan configs backend para Auth, dejar el frontend listo con TODOs claros.

## Comandos

- `npm run dev` — Servidor de desarrollo (Vite)
- `npm run build` — Build de producción
- `npm run preview` — Preview del build de producción

## Stack

- **Frontend:** React 19 + Vite
- **Estilos:** Tailwind CSS v4 (via plugin `@tailwindcss/vite`). Incluye animaciones personalizadas (`slam`, `shake`) y clases utilitarias (`.glass-card`, `.btn-aesthetic`) en `src/index.css`
- **Backend/DB:** Supabase (PostgreSQL + Storage + Realtime)
- **Routing:** React Router v7 (`BrowserRouter` en `main.jsx`)
- **Autenticación:** Supabase Auth (ver Auth Policy). Identidad legacy por `session_token` (UUID v4) en localStorage. Soporta múltiples grupos por token.

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

---

## Modos de Operación y Agentes Especializados

Antes de ejecutar cualquier tarea, Claude Code debe identificar qué perfil adoptar según los archivos involucrados. Los perfiles se activan automáticamente al detectar cambios en las rutas indicadas.

### Perfil 1: Arquitecto de Datos (Backend & Security)

- **Activación:** Cambios en `supabase/migrations/`, `src/lib/supabase.js` o configuraciones de Storage.
- **Misión:** Implementar infraestructura relacional, integridad multi-grupo y seguridad RLS. Diseñar migraciones con cascading deletes correctos, índices optimizados y políticas de acceso.
- **Skills:** `supabase-postgres-best-practices`.
- **Regla Crítica:** Supabase Auth permitido en frontend (ver Auth Policy). `session_token` se mantiene como fallback/legacy. Toda migración debe preservar aislamiento de datos por grupo. No tocar migrations/RLS/Storage salvo instrucción explícita.

### Perfil 2: Especialista en UX (Interface & Aesthetics)

- **Activación:** Cambios en `src/index.css`, `src/components/`, `src/pages/` (componentes UI).
- **Misión:** Excelencia visual mobile-first (375px+), animaciones Tailwind CSS v4 y feed de actividad con diseño coherente.
- **Skills:** `tailwindcss-mobile-first`, `tailwindcss-animations`.
- **Regla Crítica:** Prohibido usar librerías externas de componentes (MUI, Chakra, etc.). Usar exclusivamente las clases utilitarias del proyecto (`.glass-card`, `.btn-aesthetic`) y animaciones custom (`slam`, `shake`). Mantener estética: colores emerald, bordes redondeados 2xl, sombras suaves.

### Perfil 3: Gestor de Lógica de Negocio (State & Flow)

- **Activación:** Cambios en `src/hooks/`, `src/lib/utils.js` o lógica de rutas en `App.jsx`.
- **Misión:** Coordinar sesiones multi-grupo, hooks de dashboard, flujo de disputas y cierre automático de rondas. Garantizar consistencia de estado entre componentes.
- **Skills:** `react-performance-optimization`.
- **Regla Crítica:** Validar siempre que `activeGroupId` sea coherente con los perfiles en caché (`userProfiles`). Toda operación de cambio de grupo debe sincronizar localStorage y estado de React.

### Flujo de Trabajo Autónomo

1. **Declarar perfil:** Antes de cada tarea, indicar qué perfil se está adoptando y por qué.
2. **Activación múltiple:** Si una tarea toca archivos de varios perfiles, declarar todos los perfiles activos y aplicar las reglas críticas de cada uno.
3. **Validación cruzada:** Al terminar, verificar que los cambios no violen las reglas críticas de ningún perfil involucrado.
4. **Prioridad de reglas:** Las reglas del proyecto (sección anterior) siempre tienen prioridad sobre cualquier decisión de perfil.
