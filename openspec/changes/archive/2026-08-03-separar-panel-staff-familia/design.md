## Context

Estado actual (ver proposal.md — Why): una sola app shell. `/` (feed), `/kids` y `/kids/[id]` comparten el mismo `Sidebar` y solo diferencian por `isStaff` en `page.tsx`. `src/middleware.ts` solo redirige por autenticación, nunca por rol. El rol vive en `users.role` (`staff`/`parent`/`admin`) y también en `user_metadata.role` (el trigger `handle_new_user` y el seed lo copian a `raw_user_meta_data`, así que viaja en el JWT). `parent_children` vincula padres↔niños. El RLS actual de `posts` deja ver todos los posts del daycare a cualquier autenticado; el filtrado por hijos es responsabilidad de la query de la app.

## Goals / Non-Goals

**Goals:**
- Dos árboles de rutas independientes (`(staff)` y `(familia)`) con layouts y sidebars propios.
- Redirección por rol en middleware sin agregar dependencias ni tocar la DB.
- Feed de familia filtrado por hijos + anuncios de sala, con autor y sala visibles.
- Mantener el flujo actual de crear publicación (botón en sidebar + prompt en feed).

**Non-Goals:**
- Página "Resumen del día" (diseño `resumen-dia.dc.html`) — fuera de alcance; no se agrega a la nav de familia todavía.
- Contenido real de Avisos, Mi cuenta y cuenta familia — solo stubs.
- Cambios de RLS o migraciones (no hay DDL).
- Campo `title` para el staff (el footer muestra "Personal · Soles" con `role` existente, decisión del usuario).

## Decisions

### 1. Route groups: `(staff)` en la raíz, `(familia)` bajo `/familia`

```
src/app/
  (auth)/login, (auth)/activate
  (staff)/
    layout.tsx        → shell staff (sidebar + main + provider crear post)
    page.tsx          → /            (se mueve page.tsx actual)
    kids/page.tsx     → /kids        (se mueve)
    kids/[id]/page.tsx→ /kids/[id]   (se mueve)
    avisos/page.tsx   → /avisos      (stub)
    cuenta/page.tsx   → /cuenta      (stub)
  (familia)/
    layout.tsx        → shell familia (sidebar + main)
    page.tsx          → /familia      (feed familia)
    cuenta/page.tsx   → /familia/cuenta (stub)
```

**Por qué:** los route groups de Next.js no agregan segmentos de URL, así el staff conserva las URLs actuales (`/`, `/kids`) y la familia obtiene un namespace propio (`/familia`). Es el mismo patrón que ya usa `(auth)`. Alternativa considerada: shell adaptivo por rol (cambiar el sidebar según `isStaff`) — descartada porque el diseño define dos experiencias separadas y sin rutas propias no hay manera estructural de bloquear pantallas del staff.

### 2. Middleware: resolución de rol y clasificación de rutas

Nueva utilidad `src/lib/role.ts`:

- `resolveRole(supabase, user): Promise<Role>` — lee `user.user_metadata.role`; si falta o no es `staff`/`parent`/`admin`, hace `select role from users where id = user.id` (PK lookup, barato) como fallback; si tampoco, asume `parent` (privilegio mínimo).
- `getPanelForPath(pathname): "staff" | "family"` — `/familia` y su subárbol → family; todo lo demás autenticado → staff.

En `src/middleware.ts`, tras el chequeo de auth existente: si hay user, se resuelve el rol y:
- `parent` + panel `staff` → redirect `/familia`.
- `staff/admin` + panel `family` → redirect `/`.
- Caso consistente → `response` normal.

**Por qué metadata primero:** evita una query de DB en cada request cuando el rol ya viene en el JWT. **Por qué fallback a la tabla:** el rol en metadata puede faltar en cuentas creadas por fuera del flujo (el trigger solo crea perfil si `daycare_id` viene en metadata); la tabla `users` es la fuente de verdad del dominio. Alternativa considerada: siempre consultar la tabla — descartada por latencia innecesaria en cada navegación.

### 3. Sidebar con variante por rol

`src/components/Sidebar.tsx` gana una prop `variant: "staff" | "family"` que selecciona una config local (scope label, nav items, labels del footer) reusando los íconos y la shell visual existentes:

| | staff | family |
|---|---|---|
| scope | `Sala {room}` | `Familia` |
| botón crear | Sí | No |
| nav | Feed, Niños, Avisos, Mi cuenta | Feed, Mi cuenta |
| footer | `{fullName}` / `Personal · {sala}` | `{fullName}` / `{parentesco}` |

`src/data/mock.ts`: `navItems` se parte en `staffNavItems` y `familyNavItems` (NavItemId queda igual). Footer familia: el parentesco ("Mamá de Mateo") se arma desde `parent_children.relationship` (`relationshipLabels` ya existe en `src/lib/relationship.ts`) + el nombre del primer hijo vinculado; el sidebar staff usa `users.role` → "Personal".

**Por qué una variante y no dos componentes:** los dos sidebars comparten el 90% de estructura y estilos; una sola implementación con config evita duplicación y mantiene el patrón actual del componente.

### 4. Crear publicación: se eleva al layout staff

Hoy el modal de crear vive dentro de `page.tsx`. Como el botón "Nueva publicación" está en el sidebar (que ahora renderiza el layout), el estado se mueve a un provider en `(staff)/layout.tsx`:

- `src/components/CreatePostProvider.tsx` (client): carga perfil (id, room) y kids una vez, expone `openCreatePost()`, `feedVersion` (contador que sube al publicar) y renderiza `CreatePostModal` cuando está abierto.
- `(staff)/layout.tsx` envuelve `{children}` en el provider y renderiza `<Sidebar variant="staff" ... onCreatePost={openCreatePost} />` + `<main>`.
- `(staff)/page.tsx` consume el provider: el prompt "Compartí un momento…" llama `openCreatePost()`, y un `useEffect` dependiente de `feedVersion` recarga los posts al publicar.

**Por qué:** el sidebar del diseño incluye el botón de crear; mantener el estado en la página haría imposible abrir el modal desde el layout sin context. Alternativa considerada: quitar el botón del sidebar y dejar solo el prompt — descartada, se aleja del diseño `feed.dc.html`.

### 5. Meta del post según contexto

`Post` gana un `variant?: "staff" | "family"` y el modelo `Post` campos opcionales `authorName`/`roomName`:

- staff: `14:20 · publicado por vos`
- family: `14:20 · {authorName} · Sala {roomName}`

`FEED_SELECT` se extiende con `author_id, users(full_name)` y `rooms(name)` para alimentarlos; `src/lib/postMappers.ts` y `src/types/post.ts` se actualizan en consecuencia. El feed staff no muestra el autor propio porque el RLS/consulta no lo necesita para ese formato.

### 6. Feed de familia: consulta filtrada en la app

`(familia)/page.tsx` (client):

1. Perfil: `users` (full_name, role) + hijos vía `parent_children` join `children` (id, full_name, room_id) + `rooms(name)`.
2. Posts: query con filtro `or` de PostgREST sobre la relación embebida:
   - `post_children.child_id.in.({ids de sus hijos})` **o** `and(type.eq.announcement, room_id.eq.{sala de sus hijos})`.
3. Chips: los hijos + "Todos"; el filtro es estado de UI que filtra la lista ya cargada.
4. Encabezado: "TU FAMILIA", "Hola, {primer nombre}", "Así va el día de hoy", "HOY · {fecha}".

**Por qué filtrar en la app y no en RLS** (decisión del usuario): más rápido de implementar y el RLS de `posts` actual ya acota al mismo daycare. El costo es que el filtro depende de la app y no de la DB; si el RLS se endurece después, la query de la app no cambia.

## Risks / Trade-offs

- **Estado del modal duplicado/regresivo al migrar `page.tsx`** → El provider se crea primero y `page.tsx` se adapta después; se verifica que publicar siga refrescando el feed vía `feedVersion`.
- **Rol ausente en metadata → redirección equivocada** → `resolveRole` cae a la tabla `users` (fuente de verdad) y ante duda asume `parent` (privilegio mínimo).
- **`or` de PostgREST sobre relación embebida puede fallar por sintaxis** → Se valida la query con un script/browser contra el proyecto antes de cerrar la página; si diera problemas, se hace el filtro en dos queries (posts de hijos + anuncios) y se unen en memoria.
- **Stubs de `/avisos`, `/cuenta`, `/familia/cuenta` sin contenido** → Páginas placeholder mínimas ("En construcción") con la shell del panel; evitan enlaces muertos sin ampliar el alcance.
- **Parentesco del footer ("Mamá de Mateo") depende de datos de `parent_children`** → Si el padre no tiene hijos vinculados, se muestra solo el nombre.
