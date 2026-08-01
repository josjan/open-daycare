# SPEC 10 — Tablas `rooms` y `children` y mantenimiento de niños en `/kids`

> **Estado:** Aprobado
> **Depende de:** 07-daycares-table, 08-users-table, 09-auth
> **Fecha:** 2026-08-01
> **Objetivo:** Crear las tablas `rooms` y `children` en Supabase con 3 salas por defecto (Soles, Lunas, Estrellas) y sin niños de semilla, y conectar la pantalla `/kids` a la base de datos real: grid agrupado por sala con estado vacío y "Agregar niño" que persiste en `children`.

---

## Por qué existe este spec

`/kids` hoy funciona íntegramente con datos mock (`src/data/mock.ts`, 8 niños en Soles) y estado en memoria (`AddKidModal` pierde el niño al recargar). Este spec es el primer paso del mantenimiento de niños real: crea las tablas de salas y niños siguiendo el doc `docs`, las siembra con 3 salas y sin niños, y migra la pantalla a leer/escribir contra Supabase.

---

## Scope

**In:**

- Migración versionada vía MCP `apply_migration` con nombre `create_rooms_children_tables`: enum `public.child_status` (`active`, `archived`), tabla `public.rooms` (id, `daycare_id` FK → `daycares`, `name`, `created_at`) con índice en `daycare_id`, y tabla `public.children` (id, `room_id` FK → `rooms`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags text[]`, `photo_consent`, `status`, `created_at`/`updated_at`) con índice en `room_id`.
- RLS: `rooms` con policy SELECT para `authenticated`; `children` con policies SELECT/INSERT/UPDATE/DELETE solo para staff (`role = 'staff'` vía `public.users`). Sin changes al doc `docs` (ya define estas tablas exactamente).
- Seed de 3 salas — **Soles, Lunas, Estrellas** — todas con `daycare_id` resuelto por `WHERE name = 'Guardería Sala Soles'`. **Sin seed de `children`**: la tabla arranca vacía.
- Copia local de la migración en `supabase/migrations/<version>_create_rooms_children_tables.sql` (mismo version y mismo SQL que el remoto).
- `/kids` como client component que lee de la DB con `createBrowserClient` (`src/utils/supabase/client.ts`): rooms + children, grid **agrupado por sala** (una sección SOLES/LUNAS/ESTRELLAS con su conteo y su grid) y estado vacío por sala cuando no hay niños.
- `AddKidModal`: "Guardar" inserta una fila en `children` (persistencia real). Mapeo: NOMBRE COMPLETO → `full_name`, FECHA → `birth_date` (ISO), SALA → `room_id`, ALERGIAS → `allergy_tags` (array en inglés, diccionario es→en con fallback), NOTAS MÉDICAS → `medical_notes`; `enrolled_at` = hoy, `photo_consent` = `true`, `status` = `active`. El niño nuevo se agrega al estado local del grid.
- Tipos/helpers nuevos: `src/types/child.ts` (`Room`, `ChildRow`, `NewChildForm`), `src/lib/allergyTags.ts` (traducción es→en y etiqueta de badge) y `src/lib/childMappers.ts` (`childToKid`: construye el `Kid` de UI desde la fila de `children`).
- Verificación: `list_migrations`, `list_tables`, consultas de lectura, `get_advisors` (security y performance) y flujo browser.

**Out of scope (para futuros specs):**

- Editar y archivar/eliminar niños (el botón "Editar" del perfil sigue como placeholder).
- Conectar `/kids/[id]` (perfil) a la DB; requiere `parent_children`. Hasta entonces las cards de niños reales llevan a un 404 (riesgo documentado).
- Tabla `parent_children` y padres vinculados (`parentCountLabel` siempre "sin padres vinculados").
- Feed `/` con datos reales (`CreatePostModal` sigue con mock `kids`).
- Búsqueda funcional del grid.
- Normalización de alergias a una tabla `allergies`.
- Filtrado multi-daycare: solo existe "Guardería Sala Soles".
- Verificación de nombre/email duplicado.

---

## Data model

### Migración `create_rooms_children_tables`

Base `docs/opendaycare-database-schema.md` → §3 `rooms` y §4 `children` (sin cambios al doc):

```sql
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name       text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id),
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null default current_date,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_select_authenticated" on public.rooms
  for select to authenticated
  using (true);

create policy "children_select_staff" on public.children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_update_staff" on public.children
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_delete_staff" on public.children
  for delete to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

insert into public.rooms (daycare_id, name)
select d.id, r.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as r (name)
where d.name = 'Guardería Sala Soles';
```

Convenciones:

- IDs de seed con `gen_random_uuid()`; referencias por `WHERE name = ...` (regla del skill: no hardcodear IDs).
- Índices en las columnas FK (`rooms.daycare_id`, `children.room_id`): Postgres no indexa FKs automáticamente y el advisor de performance los reporta.
- El seed no inserta filas en `children`.

### Frontend

```ts
// src/types/child.ts
export interface Room {
  id: string;
  name: string;
}

export interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;   // YYYY-MM-DD
  enrolled_at: string;  // YYYY-MM-DD
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  rooms?: Pick<Room, "id" | "name"> | null; // join embedido por el select
}

export interface NewChildForm {
  name: string;
  birthDateISO: string; // YYYY-MM-DD
  roomId: string;       // uuid de la sala
  allergyTags: string[]; // etiquetas en inglés (traducidas por el modal)
  medicalNotes: string;
}
```

```ts
// src/lib/allergyTags.ts
export const allergyTagLabels: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  soy: "SOJA",
};

// "Maní" → "peanut", "Lactosa" → "lactose";
// sin traducción conocida → la palabra en minúsculas (fallback).
export function toEnglishTag(label: string): string;

// "peanut" → "MANÍ"; etiqueta desconocida → el tag en mayúsculas.
export function toBadgeLabel(tag: string): string;
```

```ts
// src/lib/childMappers.ts
// Construye el Kid de UI desde una fila de children:
// initial → primera letra de full_name; age → de birth_date vs hoy;
// birthDate → display "12 mar 2022"; enrolledSince → "jul 2026" desde enrolled_at;
// allergyLabel → toBadgeLabel(allergy_tags[0]); parents → [];
// avatarBg/Text → avatarPalette[índice % len].
export function childToKid(child: ChildRow, avatarIndex: number): Kid;
```

---

## Implementation plan

1. **Aplicar la migración** vía MCP `apply_migration` con nombre `create_rooms_children_tables` y el SQL del data model (enum, `rooms`, `children`, índices, RLS + policies, seed de 3 salas, sin seed de children). Verificar: `list_migrations` muestra `create_rooms_children_tables`; `list_tables` muestra `rooms` y `children`.

2. **Verificar seed y RLS** — `execute_sql`: `select name from public.rooms order by created_at` devuelve exactamente Soles, Lunas y Estrellas (todas con `daycare_id` de "Guardería Sala Soles"); `select count(*) from public.children` devuelve 0; `pg_policies` confirma las 5 policies; `get_advisors` (security y performance) sin issues nuevos.

3. **Copias locales** — crear `supabase/migrations/<version>_create_rooms_children_tables.sql` con el mismo version y el mismo SQL del remoto. Verificar: el archivo existe y coincide.

4. **Tipos y helpers** — crear `src/types/child.ts`, `src/lib/allergyTags.ts` y `src/lib/childMappers.ts`. Verificar: `npx tsc --noEmit` pasa.

5. **Refactor `/kids` (lectura)** — reemplazar `useState(kids)` de mock por carga en `useEffect` con `createClient()`: `from("rooms").select("id,name")` y `from("children").select("*, rooms(name)")`. Estados `loading`/`error`. Grid agrupado por sala: una sección por room (orden Soles, Lunas, Estrellas) con header "SALA {nombre}" + "{n} niños" y su grid; una sala sin niños muestra un mensaje vacío. Pasar los `rooms` reales al modal. Verificar: `/kids` muestra 3 secciones vacías y "Agregar niño" abre el modal.

6. **Refactor `AddKidModal`** — la prop `rooms` pasa de `string[]` a `Room[]`; el modal traduce las etiquetas con `toEnglishTag` y llama `onSave({ name, birthDateISO, roomId, allergyTags, medicalNotes })` en lugar de construir el `Kid`. Verificar: `npx tsc --noEmit` pasa.

7. **Insert en `/kids`** — `handleSave(form)` hace `supabase.from("children").insert({ room_id, full_name, birth_date, enrolled_at: hoy, medical_notes, allergy_tags, photo_consent: true, status: "active" }).select("*, rooms(name)").single()`; en éxito convierte con `childToKid`, lo agrega a la sección de su sala y cierra el modal; en error muestra un mensaje inline y no cierra. Verificar: guardar un niño lo muestra en su sección; recargar lo devuelve desde la DB.

8. **Verificación final** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Browser: login Jose → `/kids`, 3 secciones vacías, agregar niño (validación, etiquetas, notas), recargar, logout → `/login`; `/kids` sin sesión redirige a `/login`.

---

## Acceptance criteria

- [ ] `list_migrations` incluye una migración `create_rooms_children_tables` aplicada.
- [ ] `public.rooms` existe con las columnas `id` (uuid PK), `daycare_id` (uuid FK → `daycares`, not null), `name` (text), `created_at` (timestamptz); RLS habilitado.
- [ ] `public.children` existe con las columnas `id`, `room_id` (uuid FK → `rooms`, not null), `full_name`, `birth_date`, `enrolled_at` (default `current_date`), `medical_notes` (nullable), `allergy_tags` (text[], default `'{}'`), `photo_consent` (boolean, default `true`), `status` (`child_status`, default `'active'`), `created_at`/`updated_at`; RLS habilitado.
- [ ] El enum `public.child_status` existe con exactamente `active` y `archived`.
- [ ] Existen los índices `rooms_daycare_id_idx` y `children_room_id_idx`.
- [ ] `SELECT name FROM public.rooms ORDER BY created_at` devuelve exactamente Soles, Lunas y Estrellas, todas con `daycare_id` de "Guardería Sala Soles".
- [ ] `SELECT count(*) FROM public.children` devuelve 0.
- [ ] Policies: `rooms_select_authenticated` (SELECT, `to authenticated`); en `children`, `children_select_staff` (SELECT), `children_insert_staff` (INSERT), `children_update_staff` (UPDATE) y `children_delete_staff` (DELETE), todas con `role = 'staff'`.
- [ ] `get_advisors` (security y performance) no reporta issues nuevos introducidos por esta migración.
- [ ] `supabase/migrations/<version>_create_rooms_children_tables.sql` existe y su contenido coincide con la migración remota.
- [ ] `/kids` carga rooms y children de la DB y muestra una sección por sala (SOLES, LUNAS, ESTRELLAS) con su conteo y estado vacío en las salas sin niños.
- [ ] El selector SALA de "Agregar niño" ofrece las 3 salas de la DB.
- [ ] Guardar un niño inserta una fila en `children` (`status` = `active`, `photo_consent` = `true`, `enrolled_at` = hoy) y la card aparece en su sección de sala.
- [ ] "Maní, Lactosa" en ALERGIAS se guarda como `{peanut, lactose}` y la card muestra el badge "MANÍ".
- [ ] NOTAS MÉDICAS se guardan en `medical_notes`.
- [ ] Recargar `/kids` mantiene los niños agregados (persistencia real en DB).
- [ ] Un error en el insert muestra un mensaje inline en el modal y no lo cierra.
- [ ] `/kids` sin sesión redirige a `/login`; logout redirige a `/login`.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Enum `child_status` y tablas `rooms`/`children` exactamente como las define el doc `docs`. El doc no cambia: ya contempla estas tablas.
- **Sí:** 3 salas por defecto — Soles, Lunas, Estrellas — todas bajo "Guardería Sala Soles" (resuelto por nombre). Decisión del usuario; coincide con las salas hardcodeadas de `mock.ts`.
- **Sí:** Sin seed de `children`; la tabla arranca vacía. Decisión del usuario.
- **Sí:** `/kids` con grid agrupado por sala y estado vacío. Decisión del usuario; ahora hay 3 rooms reales.
- **Sí:** RLS — `rooms` SELECT para `authenticated`; `children` CRUD solo para staff (`role = 'staff'`). Decisión del usuario; es una pantalla de gestión del personal.
- **Sí:** Fetch client-side con `createBrowserClient`. Decisión del usuario; consistente con la Sidebar y con el estado actual de client components.
- **Sí:** ALERGIAS → `allergy_tags text[]` con diccionario es→en y fallback (palabra en minúsculas); NOTAS MÉDICAS → `medical_notes`; la UI traduce el badge. Decisión del usuario; sigue el doc.
- **Sí:** `enrolled_at` = `current_date` al insertar. El modal no tiene campo de ingreso y el mock lo derivaba del mes actual.
- **Sí:** Índices en `rooms.daycare_id` y `children.room_id`. Regla del skill (indexar FKs); evita el aviso `unindexed_foreign_keys` del advisor.
- **Sí:** `photo_consent` = `true` y `status` = `'active'` en el insert (defaults de la tabla).
- **No:** Edición, archivado o borrado de niños. El botón "Editar" del perfil sigue placeholder.
- **No:** Conectar `/kids/[id]` a la DB. Requiere `parent_children` (spec futuro); los niños reales dan 404 hasta entonces.
- **No:** `parent_children` ni padres vinculados.
- **No:** Feed `/` con datos reales; `CreatePostModal` sigue con `mock.kids`.
- **No:** Búsqueda funcional, normalización de alergias a tabla `allergies`, multi-daycare, detección de duplicados.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| El grid pasa de 8 niños mock a vacío. | Comportamiento esperado (sin seed de children); se muestra estado vacío por sala. Documentado en los criterios. |
| RLS bloquea la lectura si el usuario no es `staff`. | Solo Jose (staff) existe hoy; se verifica con su sesión. Con padres reales se revisará el modelo de permisos. |
| Flash de pantalla vacía mientras fetcha. | Estado "Cargando…" hasta que rooms + children llegan. |
| `/kids/[id]` da 404 para niños reales (perfil fuera de alcance). | Documentado; se ataca en un spec futuro con `parent_children`. |
| Insert falla (red o RLS) y el usuario pierde el formulario. | Error inline en el modal; no se cierra y no se agrega al grid. |
| Re-ejecutar la migración duplicaría salas. | `apply_migration` es versionado: se ejecuta una sola vez por migración. |
| Copia local desincronizada del historial remoto. | Mismo `version` y mismo SQL; cualquier cambio se refleja en ambos lados. |

---

## What is **not** in this spec

- Edición, archivado o eliminación de niños.
- Conexión del perfil `/kids/[id]` a la DB (detalle, padres).
- Tabla `parent_children` y padres vinculados.
- Feed `/` con datos reales.
- Búsqueda funcional del grid.
- Normalización de alergias a una tabla `allergies`.
- Multi-daycare / duplicados.

Cada uno de esos, si llega, va en su propio spec.
