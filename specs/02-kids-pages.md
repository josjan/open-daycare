# SPEC 02 — Páginas Niños y Perfil de Niño (solo diseño)

> **Estado:** Aprobado
> **Depende de:** 01-home-feed-estatico
> **Fecha:** 2026-07-30
> **Objetivo:** Implementar las páginas `/kids` (lista) y `/kids/[id]` (perfil individual) con réplica visual exacta de `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html`, reutilizando la Sidebar existente, con datos mock y sin autenticación ni base de datos.

---

## Scope

**In:**

- Nueva página `src/app/kids/page.tsx` — lista de niños con buscador, encabezado "GESTIÓN / Niños", grid de cards, botón "Agregar niño" (placeholder visual).
- Nueva página `src/app/kids/[id]/page.tsx` — perfil de niño con datos completos: avatar, nombre, edad, sala, alergias, datos básicos y padres vinculados.
- Componente `src/components/KidCard.tsx` — card individual reutilizable para el grid de la lista.
- Componente `src/components/KidProfile.tsx` — contenido del perfil de un niño individual.
- Extender `src/data/mock.ts` con el array `kids: Kid[]` (8 niños del template) y los tipos `Kid`, `Parent`, y `ParentStatus`.
- Conectar el nav item `kids` de la Sidebar al href `/kids` (actualmente apunta a `kids.dc.html`).
- La Sidebar debe recibir un prop `activeNav` (tipo `NavItemId`) para marcar el ítem activo dinámicamente, en lugar de depender del campo `current` del mock.
- Todos los estilos en Tailwind utility classes (sin CSS modules).
- SVGs inline en cada componente.

**Out of scope (para futuros specs):**

- Funcionalidad real de búsqueda (el input es placeholder visual, sin filtrado).
- Página "Agregar niño" — el botón es placeholder visual.
- Página "Editar niño" — el botón "Editar" en el perfil es placeholder visual.
- Página "Vincular padre" — el link es placeholder visual.
- Página "Resumen del día" — el botón es placeholder visual.
- Página "Avisos" y "Mi cuenta" — siguen siendo links visuales.
- Autenticación, base de datos, API routes.
- Interactividad real (búsqueda en tiempo real, modal de confirmación, etc.).
- Modo oscuro.
- Responsive mobile de las nuevas páginas (la Sidebar ya tiene hamburguesa del spec 01; el contenido principal no requiere layout específico mobile en este spec).

---

## Data model

Extensión de `src/data/mock.ts`:

```ts
// ── Parent ──
export type ParentStatus = 'active' | 'pending';

export interface Parent {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  role: string;       // e.g. "Mamá", "Papá"
  status: ParentStatus;
}

// ── Kid ──
export interface Kid {
  id: string;                  // used as route param: /kids/[id]
  name: string;
  initial: string;
  avatarBg: string;
  avatarText: string;          // text color for the avatar
  age: number;                 // in years
  room: string;                // e.g. "Soles"
  birthDate: string;           // display string, e.g. "12 mar 2022"
  enrolledSince: string;       // display string, e.g. "feb 2025"
  allergies?: string;          // free text; absent means no allergies
  parents: Parent[];
}
```

Los 8 kids del template se agregan como `export const kids: Kid[]`. El campo `id` será un slug corto (ej. `"mateo-fernandez"`) que actúa como param de ruta.

`NavItemId` ya existe en `mock.ts`. No se modifica su tipo.

El campo `current` de `NavItem` en el array `navItems` se quita o ignora — la página activa se determina por el prop `activeNav` de la Sidebar.

---

## Implementation plan

1. **Extender `src/data/mock.ts`** — agregar tipos `ParentStatus`, `Parent`, `Kid` y el array `kids` con los 8 niños del template (incluidas alergias de Mateo y Tomás, padres vinculados de cada uno, estado de vinculación). Verificar: `npx tsc --noEmit` pasa.

2. **Actualizar `src/components/Sidebar.tsx`** — agregar prop `activeNav: NavItemId` al componente; usar ese valor en lugar de `item.current` para determinar el item activo. Actualizar los hrefs de nav: `feed` → `/`, `kids` → `/kids`, `notices` y `account` siguen siendo `#` (placeholder). Verificar: `npm run dev`, la home no rompe, la sidebar funciona igual.

3. **Actualizar `src/app/page.tsx`** — pasar `activeNav="feed"` a `<Sidebar>`.

4. **Crear `src/components/KidCard.tsx`** — card con: avatar circular (inicial + colores), nombre en Fredoka, subtítulo (edad + padres vinculados), badge de alergia o chevron derecho según datos del kid. Hover: `border-[#F2A78E]` + `translateY(-2px)` con `transition-all duration-150`. Es un `<Link href={/kids/${kid.id}}>`.

5. **Crear `src/app/kids/page.tsx`** — layout con `<Sidebar activeNav="kids" />` + main. Contenido: encabezado `GESTIÓN / Niños` + botón "Agregar niño" (placeholder), input de búsqueda, sección `SALA SOLES · 8 niños` con línea decorativa, grid 2 columnas de `<KidCard>` para cada kid del mock.

6. **Crear `src/components/KidProfile.tsx`** — componente que recibe un `Kid` y renderiza: back link "Volver a Niños", avatar grande (84px), nombre + edad + sala, bloque de alergias (solo si `kid.allergies` existe), tabla de datos básicos (fecha de nacimiento, sala, ingreso), columna derecha con botón "Resumen del día" (placeholder) y card de padres vinculados con sus badges de estado.

7. **Crear `src/app/kids/[id]/page.tsx`** — busca el kid por `params.id` en el array `kids`; si no existe retorna `notFound()`. Renderiza `<Sidebar activeNav="kids" />` + `<KidProfile kid={kid} />`.

8. **Verificar** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Navegar en el browser: `/kids` lista todos los niños, click en Mateo lleva a `/kids/mateo-fernandez` con su perfil.

---

## Acceptance criteria

- [ ] `npm run dev` inicia sin errores.
- [ ] `/kids` renderiza visualmente idéntico al template `ninos.dc.html`: encabezado, buscador, sección con línea decorativa y grid de 8 cards.
- [ ] Cada card muestra: avatar con color e inicial correctos, nombre en Fredoka, edad y cantidad de padres, badge de alergia (Mateo: MANÍ, Tomás: LACTOSA) o chevron si no tiene alergia, badge VINCULAR para Valentina (sin padres).
- [ ] Hover en una card levanta 2px y cambia el borde a `#F2A78E`.
- [ ] Hacer click en cualquier card navega a `/kids/[id]` con los datos de ese niño específico.
- [ ] `/kids/[id]` renderiza visualmente idéntico al template `perfil-nino.dc.html`: back link, avatar grande, nombre, bloque de alergias (solo para Mateo y Tomás), tabla de datos básicos, padres vinculados con badges ACTIVA/PENDIENTE.
- [ ] El nav item "Niños" aparece activo (fondo `#FBE3D8`, texto `#D9583C`) en ambas páginas `/kids` y `/kids/[id]`.
- [ ] El nav item "Feed" aparece activo en `/` (home), sin romper el comportamiento previo.
- [ ] Un id inexistente en `/kids/[id]` retorna 404 (Next.js `notFound()`).
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Ruta `/kids` (inglés). Consistente con la convención del proyecto de código en inglés.
- **Sí:** Ruta dinámica `/kids/[id]` con slug como param (ej. `mateo-fernandez`). Legible en la URL y no requiere DB para el mock.
- **Sí:** Prop `activeNav` en Sidebar. Elimina el acoplamiento entre el mock estático (`navItems[].current`) y el estado de navegación real. Cualquier página puede marcar su propio ítem activo.
- **Sí:** `kids` array en `src/data/mock.ts`. Centraliza todos los datos mock en un solo archivo, consistente con el spec 01.
- **Sí:** `KidCard` y `KidProfile` como componentes separados. `KidCard` se usa en el grid; `KidProfile` encapsula el contenido del perfil y facilita futura conexión a DB.
- **No:** `/kids/[slug]` como nombre del param. Usamos `[id]` porque en el futuro cuando haya DB el param será un ID real; el slug actual es temporal.
- **No:** Búsqueda funcional. El input es solo visual; la lógica de filtrado va en otro spec.
- **No:** Responsive mobile del contenido principal. El layout de la sidebar ya cubre mobile; el grid y el perfil no tienen diseño mobile en el template de referencia.
- **No:** Biblioteca de iconos. Se mantiene la convención del spec 01 de SVGs inline.

---

## Identified risks

| Riesgo | Mitigación |
|---|---|
| La Sidebar actual tiene `item.current` hardcodeado en el mock; cambiar a prop puede romper la home. | El paso 3 del plan actualiza `page.tsx` inmediatamente después de modificar la Sidebar, dejando el sistema funcional antes de continuar. |
| `notFound()` en Next.js 15 requiere importación explícita de `next/navigation`. | Se documenta en el paso 7; si el build falla por eso es un error de importación, no de lógica. |

---

## What is **not** in this spec

- Búsqueda o filtrado real de niños.
- Formulario para agregar o editar un niño.
- Flujo de vinculación de padres.
- Página "Resumen del día".
- Páginas Avisos y Mi cuenta.
- Autenticación o sesión real.
- Base de datos o API.
- Pruebas automatizadas.

Cada uno de esos, si llega, va en su propio spec.
