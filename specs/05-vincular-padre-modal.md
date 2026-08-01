# SPEC 05 — Modal "Vincular padre" desde el perfil del niño

> **Estado:** Aprobado
> **Depende de:** 02-kids-pages, 04-modal-agregar-nino
> **Fecha:** 2026-07-31
> **Objetivo:** Implementar un modal que se abre desde "Vincular otro padre" en `/kids/[id]` — réplica de `vincular-padre.dc.html` — que genera un código de invitación, valida el email y, al enviar, agrega el padre como pendiente en memoria.

---

## Scope

**In:**

- Nuevo componente `src/components/LinkParentModal.tsx` (client) — modal de 520px con backdrop, réplica de `vincular-padre.dc.html`: header (Cancelar | Vincular padre | X de cierre), banner informativo azul, NOMBRE DEL PADRE/MADRE, EMAIL, PARENTESCO (Mamá/Papá/Tutor/a), caja CÓDIGO DE INVITACIÓN y botón "Enviar invitación".
- Validación de email: regex de formato en tiempo real con mensaje inline y botón "Enviar invitación" deshabilitado hasta que nombre no vacío, email válido y parentesco elegido.
- Código de invitación generado aleatoriamente (5 caracteres alfanuméricos en mayúsculas) al abrir el modal, con "Vence en 7 días".
- Convertir `src/app/kids/[id]/page.tsx` en client component con estado en memoria: `kidState`, abrir/cerrar el modal y agregar el padre enviado a `kidState.parents` con `status: "pending"`.
- Convertir `src/components/KidProfile.tsx` en client component: "Vincular otro padre" pasa de `<Link href="#">` a `<button>` que abre el modal.
- Selector de parentesco de selección única con "Mamá" preseleccionada.
- Cierre del modal por Cancelar, X, click en el backdrop y tecla Escape.

**Out of scope (para futuros specs):**

- Autenticación/activación real (validar código, marcar activo, login funcional) — spec futuro de auth; `/activate` y `/login` quedan como están (spec 03).
- Click en el badge VINCULAR del grid de `/kids`.
- Persistencia (localStorage, DB, API).
- Detección de email duplicado.
- Reenviar o revocar invitaciones; editar o eliminar padres vinculados.
- Responsive mobile específico del modal.

---

## Data model

No se modifican los tipos existentes: se reutiliza la interfaz `Parent` de `src/data/mock.ts`. Sí se agrega una constante nueva:

```ts
// src/data/mock.ts
// ── Roles de parentesco para el modal de vincular ──
export const parentRoles: string[] = ["Mamá", "Papá", "Tutor/a"];
```

El envío construye un objeto `Parent` en el modal y lo agrega a `kidState.parents`:

- `id` — slug derivado del nombre (ej. `maria-lopez`), `kebab-case`.
- `initial` — primera letra del nombre en mayúscula.
- `avatarBg` — siguiente par de `avatarPalette` según `kid.parents.length` (cíclico).
- `role` — valor del selector PARENTESCO (Mamá/Papá/Tutor/a).
- `status` — `"pending"` (muestra badge PENDIENTE e "invitación enviada" en el perfil).

Código de invitación: string local del modal (no en mock), 5 caracteres alfanuméricos en mayúsculas generado al montar (ej. `7K4P9`, `Q2M8X`), con leyenda "Vence en 7 días". No se persiste.

Convención: `slugify` se extrae a un helper compartido `src/lib/slugify.ts` (hoy está duplicado dentro de `AddKidModal.tsx`) y lo usan `AddKidModal.tsx` y `LinkParentModal.tsx`.

---

## Implementation plan

1. **Extraer `slugify`** — crear `src/lib/slugify.ts` con la función actual de `AddKidModal.tsx` y actualizar `AddKidModal.tsx` para importarla. Verificar: `npx tsc --noEmit` pasa.

2. **Agregar `parentRoles` a `src/data/mock.ts`** — `export const parentRoles: string[] = ["Mamá", "Papá", "Tutor/a"]`. Verificar: `npx tsc --noEmit` pasa.

3. **Crear `src/components/LinkParentModal.tsx`** (client) — props `{ kid: Kid; onClose: () => void; onInvite: (parent: Parent) => void }`. Estado local: `name`, `email`, `role` (default `"Mamá"`), código generado con `useState(() => generarCódigo())` (5 chars alfanuméricos en mayúsculas). Validación de email con regex + mensaje inline; "Enviar invitación" deshabilitado hasta nombre no vacío, email válido y rol elegido. Construye el `Parent` (id con `slugify`, `initial`, `avatarBg` de `avatarPalette[kid.parents.length % len]`, `status: "pending"`) y llama `onInvite`. Cierra con Cancelar, X, Escape y click en backdrop. Verificar: navegar a `/kids/mateo-fernandez`, abrir el modal, probar validación de email.

4. **Convertir `src/app/kids/[id]/page.tsx` en client component** — `const [kidState, setKidState] = useState(kid)`, `const [isLinkParentOpen, setIsLinkParentOpen] = useState(false)`. Pasa `kid={kidState}` y `onLinkParent={() => setIsLinkParentOpen(true)}` a `KidProfile`. `handleInvite(parent)` hace `setKidState((prev) => ({ ...prev, parents: [...prev.parents, parent] }))` y cierra. Renderiza el modal cuando `isLinkParentOpen`. Verificar: guardar un padre lo muestra en PADRES VINCULADOS como PENDIENTE; recargar lo pierde.

5. **Convertir `src/components/KidProfile.tsx` en client component** — nueva prop `onLinkParent: () => void`; "Vincular otro padre" pasa de `<Link href="#">` a `<button onClick={onLinkParent}>`. Verificar: clic abre el modal desde el perfil.

6. **Verificar** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Navegar en el browser: apertura del modal, email inválido bloquea envío, envío agrega PENDIENTE, cierre por las 4 vías.

---

## Acceptance criteria

- [ ] `npm run dev` inicia sin errores.
- [ ] Click en "Vincular otro padre" en `/kids/[id]` abre el modal con backdrop sobre el perfil.
- [ ] El modal replica el template `vincular-padre.dc.html`: header "Vincular padre" + "a {nombre del niño}", banner informativo, NOMBRE DEL PADRE/MADRE, EMAIL, PARENTESCO (Mamá/Papá/Tutor/a), caja CÓDIGO DE INVITACIÓN con "Vence en 7 días" y botón "Enviar invitación".
- [ ] El código de invitación es aleatorio (5 caracteres alfanuméricos en mayúsculas), distinto en cada apertura del modal.
- [ ] Un email inválido (ej. `lucia@` o `lucia gmail.com`) muestra mensaje de error inline y "Enviar invitación" queda deshabilitado.
- [ ] "Enviar invitación" queda deshabilitado hasta que nombre no vacío, email válido y parentesco elegido.
- [ ] El selector PARENTESCO permite una sola selección con "Mamá" preseleccionada.
- [ ] Enviar la invitación cierra el modal y agrega el padre en PADRES VINCULADOS con badge PENDIENTE y "invitación enviada".
- [ ] El modal se cierra por Cancelar, X, click en el backdrop y tecla Escape sin agregar el padre.
- [ ] Recargar la página restaura los padres originales (el invitado se pierde).
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Modal en lugar de página dedicada. Consistente con el spec 04 y con la petición; el template `vincular-padre.dc.html` se convierte en el contenido del modal.
- **Sí:** El modal solo se abre desde "Vincular otro padre" en el perfil (`/kids/[id]`). Decisión del usuario (1.a); el badge VINCULAR del grid no es clickeable.
- **Sí:** Validación de email con regex en tiempo real + botón deshabilitado. Consistente con el patrón de `AddKidModal`.
- **Sí:** Código de invitación generado aleatoriamente (5 chars alfanuméricos en mayúsculas) en cada apertura. Decisión del usuario (3.a); el `7K4P9` fijo del template queda solo como ejemplo visual.
- **Sí:** Enviar agrega el padre con `status: "pending"` en memoria. Decisión del usuario (4.a); se pierde al recargar, consistente con el spec 04.
- **Sí:** "Mamá" preseleccionada en PARENTESCO. Coincide con el template (el botón Mamá aparece activo).
- **Sí:** Convertir `/kids/[id]/page.tsx` y `KidProfile.tsx` a client components. Necesario para el estado interactivo; son los únicos archivos que se tocan.
- **Sí:** Extraer `slugify` a `src/lib/slugify.ts`. Evita duplicar la función que hoy vive en `AddKidModal.tsx`.
- **No:** Autenticación/activación real (validar código, marcar activo, login). Decisión del usuario (5.b); va a un spec futuro de auth. `/activate` y `/login` quedan como están.
- **No:** Click en el badge VINCULAR del grid. Decisión del usuario (1.a).
- **No:** Persistencia, duplicados, reenvío/revocación, edición/eliminación de padres. Fuera de alcance.
- **No:** Biblioteca de iconos. SVGs inline, consistente con specs 01-04.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| Convertir `/kids/[id]/page.tsx` y `KidProfile.tsx` en client components puede romper el render. | El paso 4 deja el perfil funcionando con `useState(kid)` antes de tocar el modal; se verifica con build y browser. |
| El padre agregado se pierde al recargar. | Comportamiento esperado (estado en memoria, consistente con spec 04); queda documentado en los criterios. |
| Cambiar `<Link>` a `<button>` en "Vincular otro padre" altera el estilo/alineación. | El botón replica las mismas clases del `<Link>` original (flex, gap-3, mismo texto/ícono). |

---

## What is **not** in this spec

- Autenticación real: validar el código, marcar el padre como activo, login funcional.
- Click en el badge VINCULAR del grid de `/kids`.
- Persistencia de las invitaciones (localStorage, DB, API).
- Detección de email duplicado.
- Reenviar o revocar invitaciones; editar o eliminar padres vinculados.
- Responsive mobile específico del modal.

Cada uno de esos, si llega, va en su propio spec.
