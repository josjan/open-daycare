# SPEC 08 — Tabla `users` y enums en Supabase

> **Estado:** Aprobado
> **Depende de:** 07-daycares-table
> **Fecha:** 2026-08-01
> **Objetivo:** Crear la tabla `users` vinculada a `daycares` y a `auth.users`, con sus enums (`user_role`, `user_status`), RLS deny-all y un usuario staff de prueba (`jose@gmail.com`) como semilla.

---

## Scope

**In:**

- Migración versionada en el historial de Supabase vía MCP `apply_migration` con nombre `create_users_table`.
- Copia local de la migración en `supabase/migrations/<version>_create_users_table.sql` (mismo `version` y mismo SQL que la migración remota), para que el repo también tenga el historial.
- Enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`), tal como los define el doc `docs`.
- Tabla `public.users` con las columnas del doc `docs` (§2 `users`): `id` (uuid PK, FK → `auth.users(id)` ON DELETE CASCADE, mismo UUID que Supabase Auth), `daycare_id` (uuid FK → `daycares`, **NOT NULL**), `role` (`user_role`), `status` (`user_status`, default `active`), `full_name` (text), `avatar_url` (text, nullable), `notify_on_post` (boolean, default `true`), `daily_summary_enabled` (boolean, default `true`), `created_at` / `updated_at` (timestamptz).
- RLS habilitado sobre `users`, sin policies (deny-all) hasta que exista el spec de auth.
- Seed: crear el auth user `jose@gmail.com` (password `Abc123456@`, email confirmado) vía SQL en `auth.users`, e insertar una fila en `public.users` con el `id` de ese auth user, `daycare_id` resuelto por `WHERE name = 'Guardería Sala Soles'`, `role = 'staff'`, `status = 'active'`, `full_name = 'José'`.
- Verificación: `list_tables`, consultas de lectura, `get_advisors` (security y performance).

**Out of scope (para futuros specs):**

- Trigger `AFTER INSERT` en `auth.users` (recomendado por el doc `docs`). Se difiere hasta que exista flujo de signup real; mientras tanto el perfil se crea manualmente vía SQL.
- Policies de RLS y cualquier apertura de acceso (auth/roles) — spec de auth (03).
- Las demás tablas del modelo (`rooms`, `children`, `posts`, etc.) — cada una en su propio spec.
- Exposición a la Data API / grants a `anon` y `authenticated`.
- Integración del frontend (Next.js) con Supabase.

---

## Data model

Enums y tabla objetivos de la migración (base `docs/opendaycare-database-schema.md` → §2 `users`, sin cambios al doc):

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');

create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  daycare_id            uuid not null references public.daycares (id),
  role                  public.user_role not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.users enable row level security;
```

Seed — se crea primero el auth user y se usa su `id` en `public.users`. El `daycare_id` se resuelve por nombre (sin hardcodear IDs). La password se guarda cifrada con pgcrypto:

```sql
with new_auth_user as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jose@gmail.com',
    crypt('Abc123456@', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'José', 'role', 'staff'),
    now(),
    now()
  )
  returning id
)
insert into public.users (id, daycare_id, role, status, full_name, notify_on_post, daily_summary_enabled, created_at, updated_at)
select a.id, d.id, 'staff', 'active', 'José', true, true, now(), now()
from new_auth_user a
cross join public.daycares d
where d.name = 'Guardería Sala Soles';
```

Convenciones:

- `email` y password **no** se duplican en `public.users` — viven en `auth.users`.
- Relación: un usuario tiene **un** daycare (`daycare_id` NOT NULL); un daycare tiene muchos usuarios.
- El valor `admin` del enum existe pero no se usa en este spec (sigue el doc).

---

## Implementation plan

1. **Aplicar la migración** vía MCP `apply_migration` con nombre `create_users_table` y SQL que hace, en orden: `CREATE TYPE public.user_role`, `CREATE TYPE public.user_status`, `CREATE TABLE public.users` (con las 2 FKs), `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (sin policies), y el seed (auth user + fila). Verificar: `list_migrations` muestra `create_users_table`.
2. **Verificar la tabla y enums** — `list_tables` (schema `public`, verbose) muestra `users` con las columnas exactas del data model. `execute_sql` sobre `pg_type`/`pg_enum` confirma los valores de `user_role` y `user_status`.
3. **Verificar el seed** — `execute_sql`:
   ```sql
   select u.full_name, u.role, u.status, d.name as daycare
   from public.users u
   join public.daycares d on d.id = u.daycare_id;
   ```
   debe devolver 1 fila: `José` / `staff` / `active` / `Guardería Sala Soles`. Además `select email, email_confirmed_at from auth.users where email = 'jose@gmail.com'` devuelve el usuario con email confirmado.
4. **Verificar RLS** — `execute_sql` sobre `pg_class`/`pg_policies` confirma `relrowsecurity = true` y 0 policies en `users`.
5. **Advisors** — `get_advisors` (security y performance) para confirmar que no hay issues nuevos introducidos por el DDL.
6. **Migración a nivel local** — tomar el `version` real de `list_migrations` (patrón `20260801...`), crear `supabase/migrations/<version>_create_users_table.sql` con el mismo SQL aplicado al remoto. Verificar: el archivo existe y su contenido coincide con la migración remota.

---

## Acceptance criteria

- [ ] `list_migrations` incluye una migración `create_users_table` aplicada al proyecto.
- [ ] `list_tables` muestra `public.users` con exactamente las columnas: `id` (uuid PK, FK → `auth.users` ON DELETE CASCADE), `daycare_id` (uuid, FK → `daycares`, not null), `role` (`user_role`), `status` (`user_status`, default `active`), `full_name` (text, not null), `avatar_url` (text, nullable), `notify_on_post` (boolean, default `true`), `daily_summary_enabled` (boolean, default `true`), `created_at` / `updated_at` (timestamptz).
- [ ] Los enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`) existen con exactamente esos valores.
- [ ] `public.users` tiene RLS habilitado (`relrowsecurity = true`) y 0 policies.
- [ ] `SELECT u.full_name, u.role, u.status, d.name FROM public.users u JOIN public.daycares d ON d.id = u.daycare_id` devuelve exactamente 1 fila: `José` / `staff` / `active` / `Guardería Sala Soles`.
- [ ] Existe el auth user `jose@gmail.com` en `auth.users` con email confirmado y su password configurada.
- [ ] `get_advisors` (security y performance) no reporta issues nuevos introducidos por esta migración.
- [ ] `supabase/migrations/<version>_create_users_table.sql` existe en el repo y su contenido coincide con la migración remota `create_users_table`.

---

## Decisions

- **Sí:** Opción (b) — FK real a `auth.users` + seed creando el auth user vía SQL. Decisión del usuario (pregunta 1); cumple la FK del doc sin introducir el trigger todavía.
- **Sí:** `daycare_id` NOT NULL. Decisión del usuario (pregunta 2); todo usuario pertenece a un daycare.
- **Sí:** RLS habilitado sin policies (deny-all), igual que SPEC 07. Decisión del usuario (pregunta 3); las policies se abren en el spec de auth (03).
- **Sí:** Un único seed staff: `full_name` "José", `role` `staff`, `status` `active`, vinculado a "Guardería Sala Soles", credenciales `jose@gmail.com` / `Abc123456@`. Decisión del usuario (pregunta 4). Email y password viven en `auth.users`, no en `public.users`.
- **Sí:** Enums con los valores exactos del doc (`user_role` incluye `admin` aunque no se use aún).
- **Sí:** `updated_at` en `users`. Está en el doc (§2), a diferencia de `daycares`.
- **No:** Trigger `AFTER INSERT` en `auth.users`. Lo recomienda el doc, pero sin flujo de signup real el seed manual vía SQL es suficiente por ahora.
- **No:** Policies de RLS. Sin auth implementado aún no hay nada que expresar.
- **No:** Grants/exposición a la Data API para `anon`/`authenticated`.
- **No:** Cambios al doc `docs`. El esquema de `users` del doc no se modifica; la decisión de `daycare_id` NOT NULL ya está implícita en la relación.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| Insertar en `auth.users` vía SQL puede chocar con triggers/hooks del esquema `auth`. | Se usan las columnas mínimas requeridas; si el INSERT falla, se crea el usuario con la Admin API y se inserta la fila de `public.users` por separado. |
| La password queda visible en texto plano en el historial de migraciones. | Es un usuario de prueba con credenciales de desarrollo; documentado en este spec. |
| Si "Guardería Sala Soles" no existiera, el `cross join` no insertaría la fila. | SPEC 07 ya creó la guardería; se verifica con la consulta del paso 3. |
| Re-ejecutar la migración duplicaría el auth user y la fila. | `apply_migration` es versionado: se ejecuta una sola vez por migración. |
| La copia local puede desincronizarse del historial remoto. | La copia usa el mismo `version` y el mismo SQL; cualquier cambio en el remoto debe reflejarse en el archivo local (o viceversa). |

---

## What is **not** in this spec

- Trigger `AFTER INSERT` en `auth.users` (onboarding automático de perfiles).
- Policies de RLS y apertura de acceso/auth.
- Las demás tablas del modelo (`rooms`, `children`, `posts`, etc.).
- Exposición de `users` a la Data API (grants).
- Integración del frontend con Supabase.

Cada uno de esos, si llega, va en su propio spec.
