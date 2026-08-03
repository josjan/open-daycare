## 1. Base de roles y redirección

- [x] 1.1 Crear `src/lib/role.ts` con `resolveRole(supabase, user)` (metadatos del JWT primero, fallback a `users.role`, default `parent`) y `getPanelForPath(pathname)` (`/familia` → family, resto → staff).
- [x] 1.2 Extender `src/middleware.ts`: tras el chequeo de auth, resolver rol y redirigir — `parent` en ruta staff → `/familia`; `staff/admin` en ruta family → `/`.

## 2. Sidebar por variante de rol

- [x] 2.1 Partir `navItems` en `src/data/mock.ts` en `staffNavItems` (Feed, Niños, Avisos, Mi cuenta) y `familyNavItems` (Feed, Mi cuenta).
- [x] 2.2 Agregar prop `variant: "staff" | "family"` a `Sidebar.tsx`: scope label (`Sala {sala}` / `Familia`), nav items según variante, botón "Nueva publicación" solo en staff, y footer — staff: "Personal · {sala}"; familia: parentesco ("Mamá de Mateo") derivado de `parent_children.relationship` + primer hijo, o solo el nombre si no hay hijos.

## 3. Route groups y layouts

- [x] 3.1 Crear `src/app/(staff)/layout.tsx` (shell staff: sidebar + main + provider de crear post) y `src/app/(familia)/layout.tsx` (shell familia: sidebar + main); calcular `activeNav` desde `usePathname`.
- [x] 3.2 Mover `src/app/page.tsx` → `src/app/(staff)/page.tsx`, `src/app/kids/page.tsx` → `src/app/(staff)/kids/page.tsx` y `src/app/kids/[id]/page.tsx` → `src/app/(staff)/kids/[id]/page.tsx`; quitar el `<Sidebar>`/wrapper de cada página (lo provee el layout).
- [x] 3.3 Crear stubs `(staff)/avisos/page.tsx`, `(staff)/cuenta/page.tsx` y `(familia)/cuenta/page.tsx` (placeholder "En construcción" con la shell del panel).

## 4. Crear publicación en el layout staff

- [x] 4.1 Crear `src/components/CreatePostProvider.tsx` (client): carga perfil (id, room) y kids, expone `openCreatePost()`, contador `feedVersion`, y renderiza `CreatePostModal` abierto.
- [x] 4.2 Adaptar `(staff)/page.tsx`: el prompt "Compartí un momento…" llama `openCreatePost()`; recargar posts cuando cambia `feedVersion`; quitar el estado local del modal/kids/perfil que migró al provider.

## 5. Meta del post y feed de familia

- [x] 5.1 Extender modelo `Post` con `authorName`/`roomName` opcionales, y `FEED_SELECT` con `users(full_name)` y `rooms(name)`; actualizar `src/lib/postMappers.ts` y `src/types/post.ts`.
- [x] 5.2 Agregar `variant?: "staff" | "family"` a `Post.tsx`: staff muestra "HH:MM · publicado por vos", familia "HH:MM · {autor} · Sala {sala}".
- [x] 5.3 Crear `(familia)/page.tsx` (feed familia): encabezado "TU FAMILIA / Hola, {nombre} / Así va el día de hoy", chips por hijo + "Todos", y consulta de posts filtrada por `post_children.child_id ∈ hijos` o anuncios de su sala (`or` de PostgREST; fallback a dos queries unidas en memoria si la sintaxis falla).

## 6. Verificación

- [x] 6.1 `npm run lint`, `npx tsc --noEmit` y `npm run build` limpios.
- [x] 6.2 Browser con jose@gmail.com (staff): redirige a `/`, sidebar staff con "Nueva publicación", post meta "publicado por vos".
- [x] 6.3 Browser con lucia@gmail.com (parent): redirige a `/familia`, sidebar familia sin crear, feed solo con posts de sus hijos + anuncios de sala, chips de filtro, meta con autor y sala, y bloqueo de rutas staff.
- [x] 6.4 Marcar checkboxes de los specs como verificados.
