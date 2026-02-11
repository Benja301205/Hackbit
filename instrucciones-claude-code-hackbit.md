# Instrucciones para Claude Code — Hackbit (Bugs + Mejoras)

Lee el archivo `CLAUDE.md` del proyecto para contexto general del stack y las reglas.

---

## BLOQUE 1: BUGS A CORREGIR

### Bug 1 — No permite tener más de 1 grupo

**Problema:** La tabla `users` tiene `session_token text UNIQUE NOT NULL`, lo que impide crear otro registro con el mismo token. Además, `useSession.js` usa `.maybeSingle()` esperando un solo resultado por token.

**Archivos a modificar:**

1. **Nueva migración SQL** (`supabase/migrations/004_multi_group.sql`):
   - Eliminar el constraint UNIQUE de `session_token` en la tabla `users`:
     ```sql
     ALTER TABLE users DROP CONSTRAINT users_session_token_key;
     ```
   - Agregar campo `created_by` a la tabla `groups` (necesario para Mejora 2 y 3):
     ```sql
     ALTER TABLE groups ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
     ```
   - Agregar políticas RLS de UPDATE y DELETE para `groups`:
     ```sql
     CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
     CREATE POLICY "groups_delete" ON groups FOR DELETE USING (true);
     ```
   - Agregar política RLS de DELETE para `completions`:
     ```sql
     CREATE POLICY "completions_delete" ON completions FOR DELETE USING (true);
     ```

2. **`src/hooks/useSession.js`** — Cambiar para soportar múltiples grupos:
   - En vez de `.maybeSingle()`, usar `.select('*, groups(*)')` sin `.maybeSingle()` para obtener TODOS los registros del token.
   - Guardar en estado un array de `userProfiles` (uno por grupo) y un `activeUser` (el perfil del grupo seleccionado).
   - Agregar `activeGroupId` en localStorage para recordar qué grupo está activo.
   - Exportar funciones: `switchGroup(groupId)`, `userProfiles`, `user` (el activo).
   - Ejemplo de lógica:
     ```js
     const { data } = await supabase
       .from('users')
       .select('*, groups(*)')
       .eq('session_token', token)
     
     if (!data || data.length === 0) { setLoading(false); return }
     
     const savedGroupId = localStorage.getItem('active_group_id')
     const active = data.find(u => u.group_id === savedGroupId) || data[0]
     setUserProfiles(data)
     setUser(active)
     ```

3. **`src/pages/Dashboard.jsx`** — Agregar selector de grupo:
   - Importar `userProfiles` y `switchGroup` desde `useSession`.
   - Si `userProfiles.length > 1`, mostrar un dropdown/selector debajo del header con los nombres de los grupos.
   - Al cambiar grupo, llamar `switchGroup(groupId)` que actualiza localStorage y recarga.

4. **`src/pages/Inicio.jsx`** — NO redirigir si ya tiene sesión:
   - Eliminar el `useEffect` que hace `navigate('/dashboard')` cuando hay usuario.
   - En su lugar, mostrar siempre la pantalla de inicio con los botones "Crear grupo" y "Unirme a un grupo".
   - Agregar un botón extra "Ir al Dashboard" si el usuario ya tiene al menos un grupo.

5. **`src/pages/UnirseGrupo.jsx`** — Permitir unirse teniendo sesión:
   - Eliminar la redirección al dashboard si ya existe token (líneas del `useEffect` que verifican `localStorage`).
   - Al unirse, reutilizar el `session_token` existente del localStorage en vez de generar uno nuevo.
   - Si el token no existe, generar uno nuevo como hace ahora.

6. **`src/pages/CrearGrupo.jsx`** — Soportar creación con sesión existente:
   - Si ya existe `session_token` en localStorage, usarlo al crear el usuario del nuevo grupo.
   - Si no existe, generar uno nuevo.
   - Después de crear, hacer `setActiveGroupId(grupo.id)` en localStorage.
   - Actualizar `created_by` del grupo con el ID del usuario recién creado (en un update posterior al insert del usuario).

7. **`src/components/BottomNav.jsx`** — Agregar botón para ir a Inicio:
   - Agregar un cuarto tab "+" o "Nuevo" que lleve a `/` para crear/unirse a otro grupo.

### Bug 2 — No se ven las fotos subidas por otros usuarios

**Problema:** El bucket `habit-photos` se creó con `public: false` en `003_storage_bucket.sql`. `getPublicUrl()` en `CompletarHabito.jsx` genera una URL pública, pero el bucket no es público, así que la URL no funciona.

**Solución (elegir UNA):**

**Opción A (recomendada — hacer el bucket público):**
- En Supabase Dashboard o via SQL:
  ```sql
  UPDATE storage.buckets SET public = true WHERE id = 'habit-photos';
  ```
- Así `getPublicUrl()` funciona correctamente.

**Opción B (signed URLs):**
- En `src/pages/CompletarHabito.jsx`, reemplazar `getPublicUrl()` por `createSignedUrl()` con una duración larga.
- En `src/pages/ValidarHabitos.jsx` y cualquier lugar donde se rendericen fotos, regenerar signed URLs al cargar.
- Más complejo de mantener. NO recomendado.

**Archivos a verificar tras el fix:**
- `src/pages/ValidarHabitos.jsx` — las imágenes usan `completion.photo_url` directamente. Verificar que rendericen.
- Cualquier nueva vista de actividad (Mejora 1) que muestre fotos.

### Bug 3 — No se puede volver a Inicio después de crear grupo

**Solución:** Cubierto en Bug 1 con los cambios a `Inicio.jsx` y `BottomNav.jsx`. Al no redirigir automáticamente y agregar un tab de navegación, el usuario siempre puede acceder a la pantalla de inicio.

### Bug 4 — Solo permite sacar foto, no elegir de galería

**Archivo:** `src/pages/CompletarHabito.jsx`

**Cambio:** En el `<input>` de archivo (cerca del final del componente), ELIMINAR el atributo `capture="environment"`:

```jsx
// ANTES:
<input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

// DESPUÉS:
<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
```

Esto permite que el dispositivo muestre la opción de elegir entre cámara o galería.

---

## BLOQUE 2: MEJORAS

### Mejora 1 — Sistema de objeción en lugar de validación previa

**Concepto:** Las fotos se auto-aprueban al subir. Los demás pueden objetar. Si hay objeción: el usuario se defiende → el objetante decide.

**1. Nueva migración SQL** (`supabase/migrations/005_disputes.sql`):
```sql
-- Tabla de disputas/objeciones
CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  completion_id uuid NOT NULL REFERENCES completions(id) ON DELETE CASCADE,
  disputed_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  objection_text text NOT NULL,
  defense_text text,
  resolution text CHECK (resolution IN ('accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_disputes_completion ON disputes(completion_id);
CREATE INDEX idx_disputes_pending ON disputes(completion_id) WHERE resolution IS NULL;

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_select" ON disputes FOR SELECT USING (true);
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "disputes_update" ON disputes FOR UPDATE USING (true);
```

**2. `src/pages/CompletarHabito.jsx`** — Cambiar status al subir:
- Cambiar `status: 'pending'` a `status: 'approved'` en el insert de completions.
- Cambiar el texto del botón de "Enviar para validación" a "Completar hábito" o "Subir foto".

**3. `src/hooks/useDashboard.js`** — Adaptar:
- El ranking ya filtra por `status: 'approved'`, así que los puntos se suman inmediatamente. ✅
- Eliminar la lógica de `pendientesValidar` (ya no hay validaciones pendientes).
- Agregar en su lugar: contar disputas pendientes donde el usuario es el afectado (`disputed` sin resolución).
- Agregar: cargar actividad reciente (últimas N completions del grupo con fotos).
- Nuevo estado: `actividadReciente`, `disputasPendientes`.

**4. Nueva página `src/pages/Actividad.jsx`** (reemplaza `ValidarHabitos.jsx`):
- Mostrar feed de todas las completions recientes del grupo (aprobadas + disputadas).
- Cada card muestra: foto, nickname del usuario, nombre del hábito, fecha, puntos.
- Botón "Objetar" en cada foto (de otros usuarios, no la propia).
- Si ya tiene una disputa abierta, no mostrar botón.
- Al objetar: abrir modal con textarea para escribir la objeción → insert en `disputes`.

**5. Nueva página `src/pages/Disputa.jsx`** (o modal):
- Flujo de 3 pasos:
  1. **Objeción enviada** (vista del objetante): muestra la foto + texto de objeción, esperando defensa.
  2. **Defensa** (vista del acusado): ve la objeción, escribe su defensa → update en `disputes`.
  3. **Resolución** (vista del objetante): ve la defensa, decide "Aceptar" (se mantienen puntos) o "Rechazar" (status de completion → 'rejected', se restan puntos) → update `resolution` y `resolved_at`.

**6. `src/pages/Dashboard.jsx`** — Adaptar sección de validaciones:
- Reemplazar "Validaciones pendientes" por "Disputas pendientes" (objeciones donde el usuario necesita defenderse).
- Agregar acceso a "Actividad reciente" (link a `/actividad` o sección inline con últimas 5 fotos del grupo).

**7. `src/App.jsx`** — Agregar rutas:
```jsx
<Route path="/actividad" element={<Actividad />} />
<Route path="/disputa/:disputaId" element={<Disputa />} />
```
Eliminar o renombrar la ruta `/validar`.

**8. `src/components/BottomNav.jsx`** — Cambiar tab "Dashboard" o agregar tab "Actividad":
- Reemplazar el ícono/label de la sección de validar por "Actividad" que lleve a `/actividad`.

### Mejora 2 — Eliminar grupo

**Archivos:**

1. **Migración `004_multi_group.sql`** (ya incluida en Bug 1): agrega `created_by` a `groups`.

2. **`src/pages/CrearGrupo.jsx`** — Después de crear el grupo y el usuario:
   ```js
   // Actualizar created_by del grupo
   await supabase.from('groups').update({ created_by: usuario.id }).eq('id', grupo.id)
   ```

3. **`src/pages/InfoGrupo.jsx`** — Agregar botón "Eliminar grupo":
   - Mostrar solo si `user.id === grupo.created_by`.
   - Al clickear: mostrar modal de confirmación ("¿Estás seguro? Se perderán todos los datos del grupo").
   - Si confirma, ejecutar la eliminación:
     ```js
     // 1. Listar y borrar fotos del storage
     const { data: files } = await supabase.storage
       .from('habit-photos')
       .list(grupo.id) // las fotos están en carpeta {group_id}/
     if (files?.length) {
       const paths = files.map(f => `${grupo.id}/${f.name}`)
       await supabase.storage.from('habit-photos').remove(paths)
     }
     // Nota: las fotos están en subcarpetas {group_id}/{user_id}/
     // Hay que listar recursivamente o borrar la carpeta del grupo
     
     // 2. Borrar el grupo (cascade borra habits, users, rounds, completions, disputes)
     await supabase.from('groups').delete().eq('id', grupo.id)
     
     // 3. Limpiar localStorage si era el grupo activo
     localStorage.removeItem('active_group_id')
     navigate('/', { replace: true })
     ```
   - **Importante sobre Storage:** Las fotos están organizadas como `{group_id}/{user_id}/{fecha}_{habit_id}.jpg`. Supabase Storage no soporta borrado recursivo de carpetas. Hay que listar archivos de cada sub-carpeta y borrarlos. Considerar hacer un listado recursivo primero.

### Mejora 3 — Editar grupo

**Archivos:**

1. **`src/pages/InfoGrupo.jsx`** o **nueva página `src/pages/EditarGrupo.jsx`**:
   - Mostrar botón "Editar grupo" solo si `user.id === grupo.created_by`.
   - Campos editables:
     - Nombre del grupo
     - Premio por ronda
     - Premio anual
     - Hábitos: agregar nuevos, eliminar existentes (solo si no tienen completions en la ronda activa), cambiar nombre/nivel.
   - **NO** permitir cambiar la frecuencia (period) si hay ronda activa.
   - Al guardar:
     ```js
     await supabase.from('groups').update({ name, prize, annual_prize }).eq('id', grupo.id)
     // Para hábitos nuevos:
     await supabase.from('habits').insert([...nuevos])
     // Para hábitos eliminados:
     await supabase.from('habits').delete().in('id', [idsAEliminar])
     // Para hábitos modificados:
     // update individual por cada uno
     ```

2. **`src/App.jsx`** — Si se crea página separada:
   ```jsx
   <Route path="/editar-grupo" element={<EditarGrupo />} />
   ```

### Mejora 4 — Salir del grupo

**Archivos:**

1. **`src/pages/InfoGrupo.jsx`** — Agregar botón "Salir del grupo":
   - Visible para TODOS los usuarios.
   - Modal de confirmación: "¿Estás seguro que querés salir del grupo?"
   - Si confirma:
     ```js
     // Si el usuario es el creador, transferir propiedad
     if (user.id === grupo.created_by) {
       const { data: otrosUsuarios } = await supabase
         .from('users')
         .select('id')
         .eq('group_id', grupo.id)
         .neq('id', user.id)
         .order('created_at', { ascending: true })
         .limit(1)
       
       if (otrosUsuarios?.length > 0) {
         await supabase.from('groups')
           .update({ created_by: otrosUsuarios[0].id })
           .eq('id', grupo.id)
       } else {
         // Último usuario → eliminar grupo completo (misma lógica de Mejora 2)
       }
     }
     
     // Eliminar registro del usuario de este grupo
     await supabase.from('users').delete().eq('id', user.id)
     
     // Actualizar localStorage y navegar
     localStorage.removeItem('active_group_id')
     navigate('/', { replace: true })
     ```
   - Las completions históricas se mantienen porque el `ON DELETE CASCADE` en `users` las borra. **ALTERNATIVA:** Si queremos mantener historial, cambiar el FK de completions de `ON DELETE CASCADE` a `ON DELETE SET NULL` para `user_id`. Esto requiere migración adicional y manejar usuarios null en el ranking.

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **Migración SQL** (004 + 005) — Base de datos primero.
2. **Bug 4** — Fix rápido del `capture` attribute.
3. **Bug 2** — Hacer bucket público.
4. **Bug 1 + Bug 3** — Multi-grupo + navegación (son interdependientes).
5. **Mejora 1** — Sistema de objeciones (es el cambio más grande).
6. **Mejora 2** — Eliminar grupo.
7. **Mejora 3** — Editar grupo.
8. **Mejora 4** — Salir del grupo.

---

## NOTAS IMPORTANTES

- Mantener TODO en español (UI, variables, comentarios).
- Mobile-first, solo Tailwind CSS, sin librerías de componentes.
- NO agregar auth de Supabase — seguir con `session_token` en localStorage.
- NO agregar modo oscuro, i18n, tests, PWA, CI/CD.
- Mantener la estética actual: colores emerald, bordes redondeados 2xl, sombras suaves.
