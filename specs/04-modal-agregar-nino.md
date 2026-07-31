# SPEC 04 — Modal "Agregar niño" desde la lista de niños

> **Estado:** Aprobado
> **Depende de:** 02-kids-pages
> **Fecha:** 2026-07-31
> **Objetivo:** Implementar un modal que se abre desde el botón "Agregar niño" de `/kids`, con nombre completo, fecha de nacimiento (máscara dd/mm/yyyy con validación), sala (Soles/Lunas/Estrellas), alergias y notas médicas, que al guardar agrega el niño a la lista en memoria.

---

## Scope

**In:**

- Nuevo componente `src/components/AddKidModal.tsx` (client) — modal de 520px con backdrop, header (Cancelar | Agregar niño | Guardar) y formulario con los campos NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS, réplica del template `agregar-nino.dc.html`.
- Máscara `dd/mm/yyyy` en el input de fecha (solo dígitos, inserta las `/`, máx. 10 caracteres).
- Validación de fecha real (días según mes, años bisiestos) con mensaje de error inline y botón Guardar deshabilitado mientras el formulario sea inválido.
- Selector de sala con valores hardcodeados `["Soles", "Lunas", "Estrellas"]` como constante en `src/data/mock.ts`.
- Convertir `src/app/kids/page.tsx` en client component con estado en memoria: abrir/cerrar modal y agregar el niño guardado al grid (se pierde al recargar).
- Cierre del modal por Cancelar, Guardar, click en el backdrop y tecla Escape.
- Alergias y notas médicas como campos opcionales.

**Out of scope (para futuros specs):**

- Persistencia (localStorage, DB, API).
- Editar o eliminar un niño desde la lista.
- Verificación de nombre duplicado.
- Reagrupar el grid de `/kids` por sala (los niños agregados a Lunas/Estrellas se muestran igual en la sección actual).
- Búsqueda funcional.
- Responsive mobile específico del modal.

---

## Data model

Extensión de `src/data/mock.ts`:

```ts
// ── Salas ──
export const rooms: string[] = ["Soles", "Lunas", "Estrellas"];

// ── Paleta de avatares (asignada por orden al nuevo kid) ──
export const avatarPalette: { bg: string; text: string }[] = [
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
];
```

El guardado construye un objeto `Kid` (tipo existente de `mock.ts`) en el modal y lo agrega al estado del grid:

- `id` — slug derivado del nombre (ej. `martina-lopez`), `kebab-case`.
- `initial` — primera letra del nombre en mayúscula.
- `avatarBg` / `avatarText` — siguiente par de `avatarPalette` según `kids.length` (cíclico).
- `age` — calculado de la fecha de nacimiento vs hoy.
- `room` — valor seleccionado del selector.
- `birthDate` — string de display `"12 mar 2022"` (mes en español abreviado), derivado de la fecha parseada.
- `enrolledSince` — mes/año actual en español (ej. `"jul 2026"`).
- `allergyLabel` — contenido de ALERGIAS en mayúsculas (opcional; badge en la card).
- `allergies` — contenido de NOTAS MÉDICAS (opcional; texto del perfil).
- `parents` — `[]` (sin padres vinculados → badge VINCULAR).

Convenciones: formato de mes en español abreviado consistente con los datos mock existentes (`mar`, `ago`, `ene`).

---

## Implementation plan

1. **Extender `src/data/mock.ts`** — agregar `export const rooms: string[]` y `export const avatarPalette`. Verificar: `npx tsc --noEmit` pasa.

2. **Crear `src/components/AddKidModal.tsx`** (client component) — props `{ rooms: string[]; onClose: () => void; onSave: (kid: Kid) => void }`. Estado local con los 5 campos. Máscara de fecha (filtro de dígitos, inserta `/`, máx. 10 chars). Validación de fecha real con mensaje inline. Guardar deshabilitado hasta que nombre no vacío, fecha válida y sala elegida. Construye el `Kid` y llama `onSave`. Cierra con Escape y click en backdrop. Verificar: navegar a `/kids`, abrir el modal, probar la máscara.

3. **Convertir `src/app/kids/page.tsx` en client component** — `const [kidsList, setKidsList] = useState(kids)` (se usa `kidsList` en el grid y en el contador), `const [isAddKidOpen, setIsAddKidOpen] = useState(false)`, botón "Agregar niño" abre el modal, `handleSaveKid` hace `setKidsList((prev) => [...prev, kid])` y cierra. Verificar: guardar un niño lo agrega al grid, recargar lo pierde.

4. **Verificar** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Navegar en el browser: abrir modal, validación de fecha inválida, guardado con todos los campos y con solo los obligatorios, cierre por las 4 vías.

---

## Acceptance criteria

- [ ] `npm run dev` inicia sin errores.
- [ ] Click en "Agregar niño" en `/kids` abre el modal con backdrop sobre el grid.
- [ ] El modal replica el template `agregar-nino.dc.html`: header Cancelar | Agregar niño | Guardar, y campos NOMBRE COMPLETO, FECHA DE NACIMIENTO (placeholder `dd/mm/aaaa`), SALA, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS.
- [ ] El input de fecha solo acepta dígitos, inserta las `/` automáticamente y no supera 10 caracteres (formato `dd/mm/yyyy`).
- [ ] Una fecha inválida (ej. `32/13/2020` o `29/02/2023`) muestra mensaje de error inline y Guardar queda deshabilitado.
- [ ] Guardar queda deshabilitado hasta que nombre completo no vacío, fecha válida y sala elegida.
- [ ] El selector de sala ofrece exactamente Soles, Lunas y Estrellas.
- [ ] Guardar con solo los obligatorios cierra el modal y agrega una card al grid: avatar con inicial, nombre, edad calculada, badge VINCULAR (sin padres).
- [ ] Guardar con alergias y notas médicas muestra el badge de alergia en la card.
- [ ] El modal se cierra por Cancelar, click en el backdrop y tecla Escape sin agregar el niño; Guardar cierra y agrega.
- [ ] Recargar la página restaura la lista original (el niño agregado se pierde).
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Modal en lugar de página dedicada. El usuario pidió explícitamente el modal; el template `agregar-nino.dc.html` se convierte en el contenido del modal.
- **Sí:** Salas hardcodeadas `["Soles", "Lunas", "Estrellas"]` como constante en `mock.ts`. Decisión del usuario; se centraliza en el archivo de datos mock.
- **Sí:** Estado en memoria con `useState` en `kids/page.tsx`. Consistente con el proyecto mock; el niño desaparece al recargar.
- **Sí:** `AddKidModal.tsx` como componente separado. Aísla el formulario y su validación; el grid solo recibe el `Kid` resultante.
- **Sí:** Alergias y notas médicas opcionales. Decisión del usuario; el template las incluye.
- **Sí:** Máscara + validación de fecha real con error inline. Decisión del usuario.
- **Sí:** `allergyLabel` ← ALERGIAS, `allergies` ← NOTAS MÉDICAS. Reutiliza los campos existentes del tipo `Kid` y alimenta el badge y el perfil.
- **No:** Persistencia (localStorage/DB). Va en un spec futuro de datos reales.
- **No:** Duplicados, edición, eliminación. Fuera de alcance.
- **No:** Agrupar el grid por sala. El grid mantiene su sección única actual.
- **No:** Biblioteca de iconos. SVGs inline, consistente con specs 01-03.

---

## Identified risks

| Riesgo | Mitigación |
|---|---|
| Convertir `kids/page.tsx` en client component puede romper el render previo. | El paso 3 deja el grid funcionando con `useState(kids)` antes de tocar el modal; se verifica con build y browser. |
| Fechas con días fuera de rango según mes/año (ej. 29/02/2023). | Validación con cálculo de días por mes y bisiestos; el error inline bloquea Guardar. |

---

## What is **not** in this spec

- Persistencia de los niños agregados (localStorage, DB, API).
- Editar o eliminar un niño.
- Detección de nombres duplicados.
- Agrupar el grid de `/kids` por sala.
- Búsqueda funcional.
- Responsive mobile del modal.

Cada uno de esos, si llega, va en su propio spec.
