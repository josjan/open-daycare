# SPEC 07 — Tabla `daycares` en Supabase (primera migración)

> **Estado:** Aprobado
> **Depende de:** — (primera tabla, sin dependencias)
> **Fecha:** 2026-08-01
> **Objetivo:** Crear y poblar la tabla `daycares` en Supabase siguiendo el esquema de `docs`, como primera migración versionada vía MCP `apply_migration`, con RLS habilitado y 4 guarderías de semilla incluyendo "Guardería Sala Soles".

---

## Scope

**In:**

- Migración versionada en el historial de Supabase vía MCP `apply_migration` (patrón ya probado con `create_test_table` / `drop_test_table`).
- Copia local de la migración en `supabase/migrations/<version>_create_daycares_table.sql` (mismo SQL y mismo `version` que la migración remota), para que el repo también tenga el historial de migraciones.
- Tabla `public.daycares` con las columnas del doc `docs` (más `address` agregada por este spec): `id` (uuid PK, default `gen_random_uuid()`), `name` (text, not null), `address` (text, nullable), `created_at` (timestamptz, default `now()`). Sin `updated_at`.
- Actualización de `docs/opendaycare-database-schema.md` (§1 `daycares`) agregando la columna `address`, para que el doc siga siendo la fuente de verdad.
- RLS habilitado sobre `daycares`, sin policies (deny-all) hasta que exista el spec de auth.
- Seed de 4 guarderías con IDs generados por `gen_random_uuid()` y dirección (text, nullable): "Guardería Sala Soles" (la importante), "Guardería Los Peques", "Guardería Arcoíris", "Guardería Estrellitas".
- Verificación: `list_tables`, consultas de lectura, `get_advisors` (security y performance).

**Out of scope (para futuros specs):**

- Las demás tablas del modelo (`users`, `rooms`, `children`, `posts`, etc.) — cada una en su propio spec.
- Policies de RLS y cualquier apertura de acceso (auth/roles) — spec de auth (03).
- Exposición a la Data API / grants a `anon` y `authenticated` — no hay cliente que consuma la tabla todavía.
- Integración del frontend (Next.js) con Supabase.
- Configuración completa de un proyecto local de Supabase (`config.toml`, stack local); solo se versiona el archivo de migración.

---

## Data model

Esquema objetivo de la migración (base `docs/opendaycare-database-schema.md` → §1 `daycares`, más `address` agregada por este spec y reflejada en el doc):

```sql
create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

Seed (4 filas):

| name                     | address                        | id                     |
| ------------------------ | ------------------------------ | ---------------------- |
| Guardería Sala Soles     | Av. del Sol 123, Centro        | `gen_random_uuid()`    |
| Guardería Los Peques     | Calle Luna 45, Villa Verde     | `gen_random_uuid()`    |
| Guardería Arcoíris       | Calle Arcoíris 89, Col. Colores| `gen_random_uuid()`    |
| Guardería Estrellitas    | Av. Estrellas 210, Norte       | `gen_random_uuid()`    |

Convención para referencias futuras: los IDs no se hardcodean. Las migraciones posteriores que necesiten el ID de una guardería lo resuelven por `WHERE name = 'Guardería Sala Soles'`.

---

## Implementation plan

1. **Actualizar el doc de referencia** — agregar `address` (text, nullable) a `docs/opendaycare-database-schema.md` (§1 `daycares`). Verificar: el doc muestra la columna.
2. **Aplicar la migración** vía MCP `apply_migration` con nombre `create_daycares_table` y SQL que hace, en orden: `CREATE TABLE public.daycares` (`id`, `name`, `address`, `created_at`), `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (sin policies), e `INSERT` de las 4 guarderías con `gen_random_uuid()` y sus direcciones. Verificar: `list_migrations` muestra `create_daycares_table`.
3. **Verificar la tabla** — `list_tables` (schema `public`, verbose) muestra `daycares` con `id`/`name`/`address`/`created_at`, sin `updated_at`. Consulta `execute_sql`:
   ```sql
   select name, address from public.daycares order by created_at;
   ```
   debe devolver exactamente las 4 guarderías con sus direcciones, incluyendo "Guardería Sala Soles".
4. **Verificar RLS** — `execute_sql` sobre `pg_class`/`pg_policies` confirma `relrowsecurity = true` y 0 policies en `daycares`.
5. **Advisors** — `get_advisors` (security y performance) para confirmar que no hay issues nuevos introducidos por el DDL.
6. **Migración a nivel local** — crear `supabase/migrations/20260801155229_create_daycares_table.sql` con el mismo SQL aplicado al remoto (tabla, RLS y seed). Verificar: el archivo existe y su contenido coincide con la migración remota.

---

## Acceptance criteria

- [ ] `list_migrations` incluye una migración `create_daycares_table` aplicada al proyecto.
- [ ] `list_tables` muestra `public.daycares` con exactamente las columnas `id` (uuid, PK, default `gen_random_uuid()`), `name` (text, not null), `address` (text, nullable), `created_at` (timestamptz, default `now()`); no existe `updated_at`.
- [ ] `docs/opendaycare-database-schema.md` (§1 `daycares`) incluye la columna `address` (text, nullable).
- [ ] `SELECT name, address FROM public.daycares ORDER BY created_at` devuelve exactamente 4 filas con sus direcciones: "Guardería Sala Soles", "Guardería Los Peques", "Guardería Arcoíris", "Guardería Estrellitas".
- [ ] Los 4 IDs son UUID distintos (no repetidos).
- [ ] `daycares` tiene RLS habilitado (`relrowsecurity = true`).
- [ ] `daycares` no tiene policies (deny-all para `anon`/`authenticated`).
- [ ] `get_advisors` (security y performance) no reporta issues nuevos introducidos por esta migración.
- [ ] `supabase/migrations/20260801155229_create_daycares_table.sql` existe en el repo y su contenido coincide con la migración remota `create_daycares_table`.

---

## Decisions

- **Sí:** Seguir el doc `docs` como base para `daycares` (`id`, `name`, `created_at`; sin `updated_at`) y agregar `address` (text, nullable). Decisión del usuario (pregunta 1 + pedido de `address`); el doc se actualiza en el mismo spec para mantenerse como fuente de verdad.
- **Sí:** `address` nullable (text) en lugar de obligatoria. Decisión del usuario; el doc original no la contemplaba y no es crítica para operar.
- **Sí:** Habilitar RLS ahora, sin policies (deny-all). Recomendación del skill de Supabase (toda tabla en schema expuesto lleva RLS); las policies se abren en el spec de auth (03).
- **Sí:** Seed de 4 guarderías con "Guardería Sala Soles" como la importante. Decisión del usuario (pregunta 3); coincide con el nombre que ya usa el frontend (mock, login, layout).
- **Sí:** Migración aplicada con MCP `apply_migration` directo al remoto. Decisión del usuario (pregunta 4); patrón ya probado con `create_test_table`/`drop_test_table`, sin proyecto local.
- **Sí:** Copia local de la migración en `supabase/migrations/20260801155229_create_daycares_table.sql`. Pedido explícito del usuario durante la implementación; el repo versiona el historial de migraciones aunque el proyecto remoto siga siendo la fuente aplicada.
- **Sí:** IDs de seed con `gen_random_uuid()`; referencias futuras por `WHERE name = ...`. Regla del skill: no hardcodear IDs generados en migraciones de datos.
- **No:** `updated_at` en `daycares`. No está en el doc; si el modelo lo requiere más adelante, se agrega con su propia migración.
- **No:** Policies de RLS en esta migración. Sin tablas de auth/usuarios aún no hay nada que expresar.
- **No:** Grants/exposición a la Data API para `anon`/`authenticated`. No hay cliente conectado; RLS deny-all deja la tabla cerrada.
- **No:** Proyecto local `supabase/` en el repo. La migración vive en el historial remoto del proyecto.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| RLS habilitado sin policies deja la tabla inaccesible para `anon`/`authenticated`. | Comportamiento esperado hasta el spec de auth; `service_role` sigue con acceso. Documentado en los criterios. |
| Referencias futuras a "Guardería Sala Soles" por nombre podrían fallar si cambia el texto. | El nombre está anclado al frontend actual; cualquier renombrado debe tocarse en todas las capas. |
| Re-ejecutar el INSERT duplicaría guarderías. | `apply_migration` es versionado: se ejecuta una sola vez por migración. |
| La copia local puede desincronizarse del historial remoto. | La copia usa el mismo `version` y el mismo SQL; cualquier cambio en el remoto debe reflejarse en el archivo local (o viceversa) y revisarse en cada migración. |

---

## What is **not** in this spec

- Las demás tablas del modelo (`users`, `rooms`, `children`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`, `invitations`, `parent_children`).
- Policies de RLS y apertura de acceso/auth.
- Exposición de `daycares` a la Data API (grants).
- Integración del frontend con Supabase.
- `updated_at` en `daycares`.
- Configuración completa de un proyecto local de Supabase (solo se versiona el archivo de migración).

Cada uno de esos, si llega, va en su propio spec.
