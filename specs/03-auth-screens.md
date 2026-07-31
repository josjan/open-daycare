# SPEC 03 — Pantallas de Login y Activación de cuenta (solo diseño)

> **Estado:** Aprobado
> **Depende de:** 01-home-feed-estatico
> **Fecha:** 2026-07-31
> **Objetivo:** Implementar las páginas standalone `/login` y `/activate` (agrupadas en el route group `(auth)`) con réplica visual de `references/pantallas/login.dc.html` (sin el selector Personal/Familia) y `references/pantallas/activar-cuenta.dc.html`, con inputs editables, responsive mobile y sin autenticación real.

---

## Scope

**In:**

- Nueva página `src/app/(auth)/login/page.tsx` — pantalla standalone (sin Sidebar) de 2 columnas: panel naranja decorativo + formulario. Sin el bloque "INGRESO COMO" (sin botones Personal/Familia).
- Nueva página `src/app/(auth)/activate/page.tsx` — pantalla standalone centrada: ícono, heading, card de invitación (Mateo · Sala Soles), inputs CÓDIGO / EMAIL / CREAR CONTRASEÑA y checkbox de autorización de fotos.
- Ambas viven en el route group `(auth)`, que no aporta segmento a la URL: las rutas públicas siguen siendo `/login` y `/activate`.
- Ambas páginas como **client components** con inputs editables (estado local via `useState`).
- Responsive mobile: en `<1024px` el panel naranja de `/login` se oculta y el formulario queda a ancho completo. `/activate` es centrada y ya es responsive por sí sola.
- Valores iniciales hardcodeados en cada página (email `caro@opendaycare.com`; código `7K4P9`, email `lucia.fernandez@gmail.com`, checkbox marcada).
- Navegación: "Iniciar sesión" → `/`, "Activá tu cuenta" → `/activate`, "Activar mi cuenta" → `/`, "¿Ya tenés cuenta? Iniciar sesión" → `/login`, "¿Olvidaste tu contraseña?" → `#` (placeholder).
- Todos los estilos en Tailwind utility classes. SVGs inline en cada página. Fondo propio `#FBF4EC` por página.

**Out of scope (para futuros specs):**

- Autenticación real: validación de credenciales, sesión, redirección por rol, logout.
- Envío de formularios (no hay `onSubmit` ni lógica de submit; los botones son `<Link>`).
- Pantalla de recuperación de contraseña — el link es placeholder visual.
- Página `familia-feed` — "Activar mi cuenta" apunta a `/` como placeholder navegable hasta que exista.
- Persistencia de sesión o de datos de formulario.
- Modo oscuro.
- Pruebas automatizadas.

---

## Data model

Esta feature no introduce nuevas estructuras de datos ni modifica `src/data/mock.ts`. Los valores iniciales de los formularios se definen como estado local dentro de cada página (componentes client). El checkbox de autorización es un booleano de estado.

---

## Implementation plan

1. **Crear `src/app/(auth)/login/page.tsx`** (client component) — layout `min-h-screen` con fondo `#FBF4EC` y grid `lg:grid-cols-[1.05fr_1fr]`. Panel izquierdo con gradiente naranja, círculos decorativos, logo OpenDayCare, headline y footer "🌿 Guardería Sala Soles" (oculto en `<lg`). Columna derecha: heading "Iniciar sesión", inputs EMAIL (prellenado `caro@opendaycare.com`) y CONTRASEÑA editables, link "¿Olvidaste tu contraseña?" (`#`), botón "Iniciar sesión" (gradiente, `<Link href="/">`), link "Activá tu cuenta" (`/activate`). Verificar: `npm run dev`, navegar a `/login`, escribir en los inputs, responsive al achicar la ventana.

2. **Crear `src/app/(auth)/activate/page.tsx`** (client component) — layout `min-h-screen` centrado con fondo `#FBF4EC`, max-width 440px. Ícono de sol 58px con gradiente, heading "Bienvenida a OpenDayCare", card de invitación (avatar "M" + "Te invitaron a seguir a / Mateo · Sala Soles"), inputs CÓDIGO (valor `7K4P9`, font Fredoka, letter-spacing) / EMAIL (`lucia.fernandez@gmail.com`) / CREAR CONTRASEÑA editables, checkbox de autorización de fotos con estado, botón "Activar mi cuenta" (`<Link href="/">`), link "Iniciar sesión" (`/login`). Verificar: navegar a `/activate`, toggle del checkbox, escribir en los inputs.

3. **Verificar** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Navegar en el browser: `/login` réplica visual sin toggle, links de navegación funcionando, `/activate` réplica visual, responsive correcto.

---

## Acceptance criteria

- [x] `npm run dev` inicia sin errores.
- [x] `/login` renderiza visualmente idéntico al template `login.dc.html` **excepto** que no existe el bloque "INGRESO COMO" ni los botones Personal/Familia.
- [x] `/login` en desktop (≥1024px) muestra el panel naranja con logo, headline, copy y footer "🌿 Guardería Sala Soles".
- [x] `/login` muestra los labels EMAIL y CONTRASEÑA, inputs editables, link "¿Olvidaste tu contraseña?", botón "Iniciar sesión" y link "Activá tu cuenta".
- [x] En `<1024px` el panel naranja de `/login` se oculta y el formulario queda a ancho completo.
- [x] `/activate` renderiza visualmente idéntico al template `activar-cuenta.dc.html`: ícono, heading, card "Te invitaron a seguir a · Mateo · Sala Soles", inputs CÓDIGO/EMAIL/CREAR CONTRASEÑA, checkbox de autorización y botón "Activar mi cuenta".
- [x] Los inputs de ambas páginas son editables (se puede escribir y borrar en ellos).
- [x] El checkbox de autorización de fotos en `/activate` alterna estado al hacer click.
- [x] "Iniciar sesión" navega a `/`; "Activá tu cuenta" navega a `/activate`; "Activar mi cuenta" navega a `/`; "¿Ya tenés cuenta? Iniciar sesión" navega a `/login`.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Rutas `/login` y `/activate`. Consistente con la convención del proyecto de código y rutas en inglés.
- **Sí:** Route group `(auth)` para aislar ambas páginas. Next.js no aporta el segmento `auth` a la URL; solo agrupa los archivos sin cambiar las rutas públicas.
- **Sí:** Páginas standalone sin Sidebar. El template no las incluye; son pantallas de acceso previas a la app.
- **Sí:** Client components con inputs editables. Decisión del usuario (en lugar de `readOnly` como en specs 01/02). No hay lógica de envío, solo estado local.
- **Sí:** Valores iniciales hardcodeados en cada página. Son datos propios del flujo de acceso; no se justifica extender `mock.ts`.
- **Sí:** Responsive mobile incluido (panel oculto `<lg`). Decisión del usuario, a diferencia del spec 02.
- **Sí:** "Iniciar sesión" y "Activar mi cuenta" → `/`. Es el único feed implementado; `familia-feed` aún no existe como ruta.
- **Sí:** Botones de acción como `<Link>`, no `<button>`. No hay submit real; la navegación es la única acción.
- **No:** Selector "INGRESO COMO" (Personal/Familia). Decisión explícita del usuario.
- **No:** Autenticación, sesión, validación ni envío de formularios. Va en un spec futuro de auth real.
- **No:** Pantalla "¿Olvidaste tu contraseña?". El link es placeholder visual.
- **No:** Extensiones a `src/data/mock.ts`.
- **No:** Biblioteca de iconos. SVGs inline, consistente con specs 01/02.

---

## Identified risks

| Riesgo | Mitigación |
|---|---|
| El fondo global `#F6ECDF` de `globals.css` difiere del de los templates (`#FBF4EC`). | Cada página fija su propio `bg-[#FBF4EC]` en el contenedor raíz; no se toca `globals.css`. |
| Los inputs editables son client components en una app mayormente server-rendered. | Es solo `useState` local, sin SSR complexities; se verifica con `npm run build`. |

---

## What is **not** in this spec

- Autenticación real, sesión, validación o envío de formularios.
- Pantalla de recuperación de contraseña.
- Página `familia-feed`.
- Persistencia de datos de formulario.
- Modo oscuro.
- Pruebas automatizadas.

Cada uno de esos, si llega, va en su propio spec.
