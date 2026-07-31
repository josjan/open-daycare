# SPEC 01 — Home feed estático con diseño de referencia

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-07-30
> **Objetivo:** Reemplazar `src/app/page.tsx` por una réplica visual exacta de `references/pantallas/feed.dc.html`, con layout responsive (sidebar fija en desktop, menú hamburguesa en mobile), componentes descompuestos, datos mock en `src/data/mock.ts`, y estilos convertidos a Tailwind utility classes.

---

## Scope

**In:**

- Reemplazar `src/app/page.tsx` con el layout del feed.
- Convertir todos los estilos inline del template a Tailwind utility classes (sin CSS modules ni styled-components).
- Agregar Fredoka + Nunito vía `next/font/google`.
- Layout responsive: sidebar fija de 248px en desktop, oculta detrás de menú hamburguesa en mobile.
- Descomponer la UI en componentes reutilizables (Sidebar, Post, etc.).
- Datos mock en `src/data/mock.ts` (usuario, sala, posts).
- Actualizar `globals.css` (fondo, scrollbar, reset).
- Actualizar `layout.tsx` (fonts, metadata).
- Los SVGs del template van inline en cada componente (no biblioteca de iconos externa).

**Out of scope (para futuros specs):**

- Páginas Niños, Avisos, Mi cuenta — solo existen como links visuales en la sidebar.
- Funcionalidad de crear publicación — el botón y prompt son placeholders visuales.
- Página de detalle de publicación — el link "1 comentario" es placeholder.
- Interactividad de likes/comentarios — contadores estáticos.
- Autenticación, base de datos, API routes.
- Modo oscuro — el diseño es explícitamente light.

---

## Data model

Archivo nuevo: `src/data/mock.ts`

```ts
// ── User ──
interface User {
  name: string;
  role: string;
  group: string;
  initial: string;
}

// ── Nav ──
type NavItemId = 'feed' | 'kids' | 'notices' | 'account';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: 'home' | 'users' | 'bell' | 'user';
  current?: boolean;
}

// ── Post categories ──
type PostCategory = 'achievement' | 'activity' | 'announcement';

interface PostCategoryStyle {
  badgeBg: string;
  badgeDot: string;
  badgeLabel: string;    // Spanish display text (LOGRO / ACTIVIDAD / ANUNCIO)
  badgeText: string;
  avatarBg: string;
  avatarText: string;
  icon: 'heart' | 'megaphone';
}

interface PostImage {
  label: string;
}

interface Post {
  id: string;
  childName: string;
  childInitial: string;
  childAvatarBg: string;
  category: PostCategory; // 'achievement' | 'activity' | 'announcement'
  time: string;
  audience: string;
  content: string;
  image?: PostImage;
  likes: number;
  comments: number;
}

// ── Page meta ──
interface PageInfo {
  daycareName: string;
  roomName: string;
  teacherName: string;
  childCount: number;
  date: string;
}
```

Los tres posts del template se representan como objetos del array `posts: Post[]` en el mismo archivo. Los estilos de cada categoría se definen en un map `categoryStyles: Record<PostCategory, PostCategoryStyle>`.

---

## Implementation plan

1. **Actualizar `globals.css`** — fondo `#F6ECDF`, scrollbar estilizado, reset de márgenes, quitar defaults de modo oscuro.
2. **Actualizar `layout.tsx`** — agregar Fredoka (400-700) y Nunito (400-800) con `next/font/google`, actualizar `<html lang="es">`, metadata del proyecto.
3. **Crear `src/data/mock.ts`** — datos completos del template: usuario, sala, y los 3 posts hardcodeados.
4. **Crear `src/components/Post.tsx`** — componente de post con variantes por `category` (logro con badge verde y corazón, actividad con placeholder de foto, anuncio con badge azul e icono de megáfono). Incluye acciones (like, comentarios, editar).
5. **Crear `src/components/CreatePostPrompt.tsx`** — barra "Compartí un momento…" con avatar y botón de foto.
6. **Crear `src/components/Sidebar.tsx`** — logo, navegación con items tipo `NavItem[]` (Feed activo, Niños, Avisos, Mi cuenta), tarjeta de usuario al pie.
7. **Reescribir `src/app/page.tsx`** — layout sidebar + main, componer FeedHeader, CreatePostPrompt, SectionHeader, y lista de posts.
8. **Verificar** — `npm run dev` sin errores, `npx tsc --noEmit` y `npm run lint` limpios.

Cada paso deja el proyecto funcional (compila y corre).

---

## Acceptance criteria

- [x] `npm run dev` inicia sin errores.
- [x] La página luce visualmente idéntica al template de referencia (tipografía, colores, espaciado, layout).
- [x] Sidebar visible a la izquierda en desktop (≥768px) con: logo, botón "Nueva publicación", 4 nav items (Feed activo), tarjeta de usuario al pie.
- [x] Sidebar se oculta en mobile (<768px) y se accede mediante menú hamburguesa.
- [x] Los 3 post variants (logro, actividad, anuncio) se renderizan con colores, badges, e iconos correctos.
- [x] El prompt "Compartí un momento…" se muestra con avatar y botón de foto.
- [x] "PUBLICADO HOY" con línea decorativa se muestra entre el prompt y los posts.
- [x] Encabezado muestra "GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun".
- [x] Scrollbar estilizado según el template.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] `npm run lint` pasa sin errores.

---

## Decisions

- **Sí:** Fredoka + Nunito vía `next/font/google`. El template usa esas fonts y el objetivo es réplica visual exacta.
- **Sí:** Datos mock en `src/data/mock.ts` con tipos explícitos. Sin API ni DB.
- **Sí:** Sidebar como componente independiente. Se reutilizará en futuros specs cuando existan otras páginas.
- **Sí:** Post como componente con prop `category`. Los 3 casos se cubren con variants controladas por esa prop.
- **Sí:** SVGs inline en cada componente. No se justifica una biblioteca de iconos para <15 SVGs que no se reúsan entre páginas.
- **Sí:** Layout responsive con sidebar fija. Sigue el patrón del template donde el aside es `position: sticky; height: 100vh`.
- **No:** Geist fonts. Se reemplazan por Fredoka + Nunito.
- **No:** Autenticación, DB, API — diferido a futuros specs.
- **No:** Páginas Niños, Avisos, Mi cuenta — los links existen solo como markup visual.
- **No:** Interactividad de likes/comentarios — contadores son texto estático.
- **No:** Modo oscuro — el diseño del template no lo contempla.

---

## Identified risks

| Riesgo | Mitigación |
|---|---|
| Google Fonts bloqueada por red/política | Fredoka y Nunito tienen fallback a system-ui/sans-serif. El layout no se rompe, solo cambia la tipografía. |
| El menú hamburguesa en mobile requiere lógica de estado y overlay | Se implementa con un state booleano simple y un botón toggle. Sin bibliotecas externas. |

---

## What is **not** in this spec

- Páginas Niños, Avisos, Mi cuenta.
- Crear publicación (modal/página).
- Detalle de publicación.
- Likes, comentarios, o cualquier interacción.
- Autenticación o login/logout real.
- Base de datos o API.
- Pruebas automatizadas.

Cada uno de esos, si llega, va en su propio spec.
