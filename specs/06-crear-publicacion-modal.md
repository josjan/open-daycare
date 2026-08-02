# SPEC 06 — Modal "Nueva publicación" desde el feed

> **Estado:** Aprobado
> **Depende de:** 01-home-feed-estatico
> **Fecha:** 2026-08-01
> **Objetivo:** Implementar un modal que se abre desde el prompt de nueva publicación en `/` — réplica de `crear-publicacion.dc.html` — con selección de destinatario (niño o toda la sala), tipo (7 categorías), descripción precargada y subida de fotos por selección o drag & drop con preview real, que al publicar agrega el post al top del feed en memoria.

---

## Scope

**In:**

- Nuevo componente `src/components/CreatePostModal.tsx` (client) — modal de 580px con backdrop, réplica de `crear-publicacion.dc.html`: header (Cancelar | Nueva publicación | Publicar) y secciones PARA, TIPO, DESCRIPCIÓN y FOTOS.
- Convertir `src/app/page.tsx` en client component con estado en memoria: `postsState`, abrir/cerrar el modal y agregar el post publicado al top del feed.
- Convertir `src/components/CreatePostPrompt.tsx` en un botón (hoy es `<a href="crear-publicacion.dc.html">`) que abre el modal.
- Sección PARA de selección única: pills con todos los niños de `kids` + "Toda la sala". `audience` del post = `"familia de {nombre}"` o `"toda la sala"`.
- Sección TIPO: 7 pills (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con los colores del template, selección única y "Comida" preseleccionada.
- Extender `PostCategory` a los 7 tipos y `categoryStyles` con los colores del template; `Post.tsx` los renderiza sin cambios de lógica de badge.
- DESCRIPCIÓN: textarea precargada con el texto hardcodeado del template ("Pintamos con témperas esta mañana…").
- FOTOS: subida por selector de archivos (`<input type="file">`) y drag & drop, con preview real (`URL.createObjectURL`), máximo 4 fotos, tiles de 96×96 como el template y posibilidad de quitar una foto.
- Extender `PostImage` con `src?` (URL de objeto) y `Post.tsx` renderiza `<img>` cuando `src` existe (mantiene el placeholder actual si no).
- "Publicar" deshabilitado hasta que DESCRIPCIÓN no esté vacía.
- Cierre del modal por Cancelar, Publicar, click en el backdrop y tecla Escape.

**Out of scope (para futuros specs):**

- Persistencia (localStorage, DB, API); el post y las fotos se pierden al recargar.
- Edición del post publicado (el "Editar" del feed sigue como link al template).
- Likes/comentarios funcionales en el post nuevo.
- Subida real a servidor o almacenamiento de imágenes (solo preview en memoria).
- Responsive mobile específico del modal.
- Detalle de publicación (página `detalle-publicacion`).

---

## Data model

Modificación de `src/data/mock.ts`:

```ts
export type PostCategory =
  | "food" | "nap" | "activity" | "achievement"
  | "mood" | "photo" | "announcement";

export interface PostImage {
  label: string;
  src?: string; // URL de objeto; sin src → placeholder actual
}
```

`categoryStyles` extendido con los colores del template (para `food` y `activity`, `badgeText` y `badgeDot` blancos):

```ts
food: { badgeBg: "#9A7B1E", badgeDot: "#fff", badgeLabel: "COMIDA",    badgeText: "#fff",     avatarBg: "#F4E7C6", avatarText: "#9A7B1E", icon: "heart" }
nap:  { badgeBg: "#E7DCF6", badgeDot: "#7B5FC0", badgeLabel: "SIESTA",  badgeText: "#7B5FC0",  avatarBg: "#E7DCF6", avatarText: "#7B5FC0", icon: "heart" }
activity:    { badgeBg: "#2E89A6", badgeDot: "#fff", badgeLabel: "ACTIVIDAD", badgeText: "#fff",  avatarBg: "#C7E7F1", avatarText: "#2E89A6", icon: "heart" }
achievement: { badgeBg: "#CFEBD8", badgeDot: "#3E9B6C", badgeLabel: "LOGRO",  badgeText: "#3E9B6C", avatarBg: "#A9D9E8", avatarText: "#1F7A93", icon: "heart" }
mood:  { badgeBg: "#F9D2DE", badgeDot: "#C56486", badgeLabel: "ÁNIMO", badgeText: "#C56486", avatarBg: "#F9D2DE", avatarText: "#C56486", icon: "heart" }
photo: { badgeBg: "#FBD8CC", badgeDot: "#D9684A", badgeLabel: "FOTO",  badgeText: "#D9684A", avatarBg: "#FBD8CC", avatarText: "#D9684A", icon: "heart" }
announcement: { badgeBg: "#CCD8F4", badgeDot: "#4E72C8", badgeLabel: "ANUNCIO", badgeText: "#4E72C8", avatarBg: "#CCD8F4", avatarText: "#4E72C8", icon: "megaphone" }
```

El post publicado construye un `Post`:

- `id` — `post-${Date.now()}`.
- Destinatario niño: `childName`/`childInitial`/`childAvatarBg` del `Kid`; `audience` = `"familia de {nombre}"`.
- "Toda la sala": `childName` = `"Anuncio general"`, `childInitial` = `""`, `childAvatarBg` = `"#CCD8F4"`, `audience` = `"toda la sala"`.
- `time` — `HH:MM` actual (`new Date()`).
- `content` — DESCRIPCIÓN.
- `image` — `{ label, src }` con la primera foto (o `undefined`).
- `likes: 0`, `comments: 0`.

Descripción precargada (constante local del modal): `"Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón."`

---

## Implementation plan

1. **Extender `src/data/mock.ts`** — `PostCategory` a los 7 tipos, `PostImage.src?`, y `categoryStyles` con los 7 colores (para `food`/`activity`: `badgeText` y `badgeDot` blancos). Verificar: `npx tsc --noEmit` pasa.
2. **Actualizar `src/components/Post.tsx`** — cuando `post.image.src` existe renderizar `<img>` (cover, h-[200px], rounded-2xl) en vez del placeholder dashed; mantener el placeholder actual si no hay `src`. Verificar: navegar `/`, los 3 posts existentes siguen igual.
3. **Crear `src/components/CreatePostModal.tsx`** (client) — props `{ kids: Kid[]; onClose: () => void; onPublish: (post: Post) => void }`. Estado local: `audience` (default Mateo), `category` (default `"food"`), `description` (precargada), `photos` (object URLs). Fotos: hidden `<input type="file" multiple accept="image/*">`, click en tile "Agregar" abre el diálogo, dropzone con `onDragOver`/`onDrop`, preview con `URL.createObjectURL`, máx. 4 fotos, tile con "×" para quitar, revocar URL al quitar y en cleanup. Publicar deshabilitado con DESCRIPCIÓN vacía. Construye el `Post` y llama `onPublish`. Cierra con Cancelar, Escape y backdrop.
4. **Convertir `src/components/CreatePostPrompt.tsx`** — nueva prop `onOpen: () => void`, pasa de `<a>` a `<button>` manteniendo las mismas clases.
5. **Convertir `src/app/page.tsx` en client component** — `useState(posts)`, `useState(false)` para el modal; `handlePublish` hace `[post, ...prev]` y cierra. Renderiza `CreatePostModal` con `kids`.
6. **Verificar** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Browser: apertura del modal, validación de descripción, fotos por selector y drag & drop (máx 4), quitar fotos, publicación en el feed, cierre por las 4 vías.

---

## Acceptance criteria

- [x] `npm run dev` inicia sin errores.
- [x] Click en el prompt "Compartí un momento…" en `/` abre el modal con backdrop sobre el feed.
- [x] El modal replica `crear-publicacion.dc.html`: header Cancelar | Nueva publicación | Publicar, y secciones PARA, TIPO, DESCRIPCIÓN y FOTOS.
- [x] PARA muestra un pill por cada niño de `kids` (8) + "Toda la sala", con selección única y Mateo preseleccionado.
- [x] TIPO muestra exactamente los 7 pills (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con sus colores del template, selección única y Comida preseleccionada.
- [x] La textarea DESCRIPCIÓN viene precargada con el texto hardcodeado del template.
- [x] Publicar queda deshabilitado si se borra todo el texto de DESCRIPCIÓN.
- [x] FOTOS: se pueden agregar fotos por selector de archivos y por drag & drop, con preview real; no se superan 4 fotos; cada foto se puede quitar.
- [x] Publicar cierra el modal y agrega el post al top del feed con badge del tipo elegido, hora actual y audiencia correcta (`familia de {niño}` / `toda la sala`).
- [x] Un post con foto muestra la imagen real (src) en lugar del placeholder dashed; sin foto mantiene el placeholder.
- [x] Un post "Toda la sala" muestra "Anuncio general" con ícono de megáfono.
- [x] El modal se cierra por Cancelar, click en el backdrop y tecla Escape sin publicar.
- [x] Recargar la página restaura el feed original (el post publicado se pierde).
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Modal en lugar de página dedicada. Consistente con specs 04/05; el template se convierte en el contenido del modal.
- **Sí:** Selección simple en PARA y TIPO. Coincide con el template.
- **Sí:** PARA muestra todos los niños de `kids` (8) + "Toda la sala". Decisión del usuario.
- **Sí:** Extender `PostCategory` a los 7 tipos con los colores del template. Decisión del usuario.
- **Sí:** DESCRIPCIÓN precargada hardcodeada. Decisión del usuario.
- **Sí:** Fotos con preview real (`URL.createObjectURL`), máx. 4, por selector y drag & drop. Decisión del usuario.
- **Sí:** `PostImage.src?` y `Post.tsx` renderiza `<img>` cuando existe.
- **Sí:** Publicar agrega el post al top del feed en memoria. Decisión del usuario; se pierde al recargar.
- **Sí:** Publicar deshabilitado con DESCRIPCIÓN vacía.
- **Sí:** Badges de Comida/Actividad con texto y dot blancos sobre fondo oscuro.
- **No:** Persistencia, subida real de imágenes, edición del post, likes/comentarios funcionales, detalle de publicación.
- **No:** Biblioteca de iconos. SVGs inline.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| Convertir `page.tsx` en client component puede romper el render previo. | El paso 5 deja el feed funcionando con `useState(posts)` antes de tocar el modal; se verifica con build y browser. |
| `URL.createObjectURL` genera memoria sin liberar. | Se revocan las URL al quitar una foto y al cerrar el modal (cleanup). |
| Extender `PostCategory` rompe `categoryStyles` o renders existentes. | Los 3 tipos existentes conservan sus valores; `Post.tsx` no cambia su lógica de badge. |
| Fotos y post publicado se pierden al recargar. | Comportamiento esperado (estado en memoria); documentado en los criterios. |

---

## What is **not** in this spec

- Persistencia del post o las fotos (localStorage, DB, API).
- Subida real de imágenes a servidor.
- Editar el post publicado.
- Likes y comentarios funcionales en el post nuevo.
- Detalle de publicación (página `detalle-publicacion`).
- Responsive mobile específico del modal.

Cada uno de esos, si llega, va en su propio spec.
