## Why

La app hoy es un solo shell donde el staff y la familia convergen en las mismas rutas, con el mismo sidebar y el mismo feed; la única diferencia por rol es el botón "Nueva publicación". El diseño (`references/pantallas/familia-feed.dc.html`, `feed.dc.html`) define dos experiencias separadas con navegación, encabezados y feeds propios, y la base de datos ya modela `users.role` y `parent_children`. Sin separación estructural, cada feature futura (Resumen del día, Avisos, cuenta por rol) se complica y un padre puede alcanzar pantallas de gestión del staff.

## What Changes

- **Rutas por rol** con route groups de Next.js: `(staff)` mantiene las URLs actuales (`/`, `/kids`, `/kids/[id]`) y `(familia)` vive bajo `/familia`.
- **Layouts separados**: `(staff)/layout.tsx` y `(familia)/layout.tsx` que renderizan el sidebar correspondiente y el `<main>`; las páginas dejan de montar el `Sidebar` individualmente.
- **Sidebar por variante de rol**: navegación y footer distintos — staff: Sala Soles, "Nueva publicación", Feed/Niños/Avisos/Mi cuenta, "Maestra · Soles"; familia: "Familia", sin crear, Feed/Mi cuenta, "Mamá de Mateo".
- **Redirección por rol en middleware**: tras el login, `parent` → `/familia`, `staff/admin` → `/`. Un padre que toque una ruta del staff (o un staff que toque `/familia`) es redirigido.
- **Feed de familia** (`/familia`): encabezado "TU FAMILIA", chips por hijo (sus hijos + "Todos"), filtrado por hijos + anuncios de su sala (en la query de la app), y el meta de cada post muestra autor y sala ("14:20 · Maestra Caro · Sala Soles").
- **Páginas stub** para `/avisos`, `/cuenta` y `/familia/cuenta` para que la navegación no tenga enlaces muertos.
- **BREAKING**: la ruta de la familia deja de ser `/`; los padres son redirigidos a `/familia`.

## Capabilities

### New Capabilities
- `panel-separation`: separación estructural de la app en dos paneles por rol — route groups `(staff)` y `(familia)`, layouts con sidebar por rol y redirección por rol en el middleware.
- `family-feed`: feed de la familia en `/familia` — encabezado propio, chips de filtro por hijo y consulta de posts filtrada por sus hijos + anuncios de su sala, con autor y sala visibles en cada post.

### Modified Capabilities
<!-- Ninguna: no hay specs previas en openspec/specs/ (directorio vacío). El feed del staff se reubica sin cambiar sus requisitos. -->

## Impact

- `src/app/page.tsx` → se mueve a `(staff)/page.tsx`; `src/app/kids/*` → `(staff)/kids/*`.
- Nuevos `(staff)/layout.tsx`, `(familia)/layout.tsx`, `(familia)/page.tsx`, stubs de `/avisos`, `/cuenta`, `/familia/cuenta`.
- `src/middleware.ts`: resolución de rol y redirecciones por rol.
- `src/components/Sidebar.tsx`: variante por rol (nav + footer + scope label).
- `src/components/Post.tsx`, `src/lib/postMappers.ts`, `src/types/post.ts`, `src/types/post.ts`: modelo de post con `author_name` y `room_name`.
- `src/data/mock.ts`: nav items por rol.
- Sin cambios de base de datos (sin migraciones): el filtrado del feed de familia vive en la query de la app.
