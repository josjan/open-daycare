# SPEC 11 — Vinculación de un padre: invitación por email (Resend) y activación de cuenta

> **Estado:** Implementado
> **Depende de:** 05-vincular-padre-modal, 08-users-table, 09-auth, 10-rooms-children-kids
> **Fecha:** 2026-08-02
> **Objetivo:** Vincular un padre a un niño de punta a punta: el staff crea una invitación desde `/kids/[id]` que persiste en `invitations` y se envía por email con Resend, y el padre activa su cuenta en `/activate` con el código de la invitación, creando su usuario, su perfil y el vínculo en `parent_children`.

---

## Por qué existe este spec

`LinkParentModal` (SPEC 05) hoy genera un código en el cliente y agrega el padre solo en memoria. `public.users` se crea manualmente vía SQL (SPEC 08, sin trigger). Este spec es el primer flujo de **signup real** de la app: persiste la invitación, la envía por email (Resend) y activa la cuenta del padre creando el auth user, su perfil y el vínculo con el niño. También introduce el trigger `AFTER INSERT` en `auth.users` que recomienda el `docs` y que se había diferido en el SPEC 08.

---

## Scope

**In:**

- Migración `create_invitations_parent_children_tables`: enums `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`); tablas `invitations` y `parent_children` exactamente como el `docs`; índices en las FKs; RLS con policies de staff; policy nueva `users_select_staff` en `public.users` (el perfil necesita leer `users` para mostrar los padres activos). Sin seed.
- Migración `add_users_profile_trigger`: función `SECURITY DEFINER handle_new_user()` + trigger `AFTER INSERT` en `auth.users` que crea la fila en `public.users` desde `raw_user_meta_data` (`daycare_id`, `role`, `full_name`), con guarda defensiva si falta `daycare_id`.
- Copias locales de ambas migraciones en `supabase/migrations/<version>_*.sql` (mismo version y SQL que el remoto).
- Route Handler `POST /api/invitations` (server): valida los datos, rechaza email duplicado con invitación pendiente (mismo child + email), verifica que el child existe, genera el código server-side (5 chars alfanuméricos en mayúsculas, único), inserta la fila en `invitations` (`invited_by` = staff autenticado, `status` = `pending`, `expires_at` = +7 días) y devuelve `{ code }`.
- Envío del email con el paquete `resend`: template HTML con nombre del padre, niño + sala, link a `/activate?code=…&email=…`, el código y "Vence en 7 días". From `RESEND_FROM` (`info@opendaycare.com`). **Best-effort**: si Resend falla o no hay API key, la invitación se persiste igual y se loguea el error.
- `LinkParentModal`: submit real (POST a la API), estados loading/error inline, y en éxito muestra en la caja CÓDIGO DE INVITACIÓN el código devuelto por el servidor. Se elimina la generación client-side del código.
- `kids/[id]/page.tsx`: carga los padres reales — activos de `parent_children` (join `users`) + pendientes de `invitations` — y los pasa a `KidProfile`; tras una invitación refresca la lista.
- `POST /api/activate` (server, service role): valida la invitación (pending, no vencida, email coincide), resuelve el `daycare_id` del child vía `rooms`, crea el auth user con Admin API (`createUser` + `email_confirm: true`) o **reutiliza** el existente, inserta `parent_children` (`ON CONFLICT (parent_id, child_id) DO NOTHING`), marca la invitación `accepted` con `accepted_at`, setea `children.photo_consent` = `true` y devuelve `{ ok: true }`.
- `/activate` real: prellena `code`/`email` desde la URL (`useSearchParams`), validaciones (password ≥ 8 chars, checkbox de fotos obligatorio), POST a `/api/activate` y redirección a `/login?activated=1`.
- `/login`: banner de éxito cuando `?activated=1`.
- Tipos/helpers nuevos: `src/types/invitation.ts`, `src/lib/relationship.ts`, `src/lib/invitationCode.ts`, `src/lib/resend.ts`, `src/lib/emailTemplates.ts`, `src/utils/supabase/admin.ts` (client service-role, solo server).
- Env: `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_FROM` agregadas a `.env` y `.env.template` (`RESEND_API_KEY` ya existe en `.env`).
- Verificación: migraciones, policies, advisors, flujo browser completo.

**Out of scope (para futuros specs):**

- Reenvío, revocación o expiración automática de invitaciones (UI) y su estado `expired`/`cancelled` en la lista del perfil.
- Editar o eliminar padres vinculados.
- Feed del padre con datos reales / redirección por rol (`parent` → feed de familia).
- Pantalla "¿Olvidaste tu contraseña?".
- Configuración del dominio/email de Resend (verificación DNS) — es config de la cuenta, no del código.
- Rate limiting / protección de fuerza bruta del código.
- Trigger `ON UPDATE` o actualización de `updated_at` en `users`.
- Responsive mobile específico del modal.

---

## Data model

### Migración 1 — `create_invitations_parent_children_tables`

Base `docs` → §5 `parent_children` y §6 `invitations` (sin cambios al doc):

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id),
  invited_by  uuid not null references public.users (id),
  full_name   text not null,
  email       text not null,
  relationship public.relationship_type not null,
  code        text not null unique,
  status      public.invitation_status not null default 'pending',
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (email);

create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id),
  child_id     uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx  on public.parent_children (child_id);
create index parent_children_parent_id_idx on public.parent_children (parent_id);

alter table public.invitations     enable row level security;
alter table public.parent_children enable row level security;

-- staff puede leer users ajenos (necesario para el join parent_children → users en el perfil)
create policy "users_select_staff" on public.users
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));
```

Convenciones:

- Índices en las FKs (Postgres no indexa FKs; el advisor de performance los reporta). `code` ya trae UNIQUE; `invitations_email_idx` sirve a la búsqueda por email en `/api/activate`.
- Los INSERT/UPDATE de la activación (`parent_children`, `invitations.status`, `children.photo_consent`) los hace el service role (bypass RLS) en `/api/activate`.
- El `update` de `invitations → accepted` no lleva policy porque se hace con service role.

### Migración 2 — `add_users_profile_trigger`

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data is null or new.raw_user_meta_data ->> 'daycare_id' is null) then
    return new; -- signups fuera del flujo de la app no crean perfil
  end if;

  insert into public.users (
    id, daycare_id, role, status, full_name,
    avatar_url, notify_on_post, daily_summary_enabled, created_at, updated_at
  )
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'active',
    new.raw_user_meta_data ->> 'full_name',
    null,
    true,
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Frontend

```ts
// src/types/invitation.ts
export type RelationshipValue = "father" | "mother" | "guardian";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface InvitationRow {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: RelationshipValue;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface ParentLinkRow {
  parent_id: string;
  child_id: string;
  relationship: RelationshipValue;
  users?: Pick<{ id: string; full_name: string }, "id" | "full_name"> | null;
}

export interface InvitePayload {
  child_id: string;
  full_name: string;
  email: string;
  relationship: RelationshipValue;
}
```

```ts
// src/lib/relationship.ts
export const relationshipLabels: Record<RelationshipValue, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};
export const relationshipToDb: Record<string, RelationshipValue> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};
```

```ts
// src/lib/invitationCode.ts
// 5 caracteres alfanuméricos en mayúsculas (sin confundibles O/0, I/1), con loop de colisión.
export function generateInvitationCode(): string;
```

```ts
// src/utils/supabase/admin.ts  (SOLO server: route handlers)
import { createClient } from "@supabase/supabase-js";
export const adminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

Env (`.env` + `.env.template`):

```
RESEND_API_KEY=re_...            # ya existe en .env
RESEND_FROM=info@opendaycare.com
SUPABASE_SERVICE_ROLE_KEY=...    # del dashboard, nunca al cliente
```

Email (template HTML, `src/lib/emailTemplates.ts`): saludo con el nombre del padre, niño + sala, botón/link a `/activate?code=…&email=…` (origin del request, `http://localhost:3000` en dev), el código y "Vence en 7 días". From `RESEND_FROM`.

Convenciones:

- Código: 5 chars alfanuméricos en mayúsculas (mismo formato del template y del SPEC 05), generado **en el servidor**.
- Email: se normaliza a minúsculas para comparaciones en `/api/activate`.
- UI: `mother` → Mamá, `father` → Papá, `guardian` → Tutor/a (consistente con `parentRoles` del SPEC 05).

---

## Implementation plan

1. **Migración 1** — `create_invitations_parent_children_tables` vía MCP `apply_migration`. Verificar: `list_migrations`, `list_tables` (enums, `invitations`, `parent_children`, policies), `get_advisors` sin issues nuevos.
2. **Migración 2** — `add_users_profile_trigger` vía MCP `apply_migration`. Verificar: el trigger existe y un `insert` en `auth.users` con metadata crea la fila en `public.users` (sin romper el login de Jose).
3. **Copias locales** — crear los dos archivos en `supabase/migrations/<version>_*.sql` con el mismo version y SQL.
4. **Dependencias y env** — `npm install resend`; agregar `RESEND_FROM` y `SUPABASE_SERVICE_ROLE_KEY` a `.env` (y `.env.template`). Pedirle al usuario el service role key del dashboard. Verificar: `npx tsc --noEmit`.
5. **Tipos y helpers** — crear `src/types/invitation.ts`, `src/lib/relationship.ts`, `src/lib/invitationCode.ts`, `src/lib/resend.ts`, `src/lib/emailTemplates.ts`, `src/utils/supabase/admin.ts`. Verificar: `npx tsc --noEmit`.
6. **`POST /api/invitations`** — validación (child_id uuid, full_name no vacío, email regex, relationship en enum), rechazo si hay invitación pendiente para el mismo child + email, código con `generateInvitationCode` (retry en colisión de UNIQUE), insert con el client SSR (RLS staff), fetch del child + room, envío best-effort con Resend, respuesta `{ code }`. Verificar con un POST real desde una sesión staff: fila `pending` con `expires_at` +7 días.
7. **`LinkParentModal`** — submit real a la API (props `{ kid, onClose, onInvited }`), estados `loading`/`error` inline, y en éxito muestra el `code` de la respuesta en la caja CÓDIGO DE INVITACIÓN y llama `onInvited()`. Se quitan `generateInviteCode` local y `onInvite`. Verificar en browser.
8. **`kids/[id]/page.tsx`** — tras cargar el child, cargar `parent_children` (con `users(full_name)`) y `invitations` (status `pending`) por `child_id`; construir los `Parent` (labels de `relationshipLabels`, `status` active/pending, avatar de `avatarPalette`); `handleInvited` refresca ambos queries. Verificar en browser que los padres reales aparecen en el perfil.
9. **`POST /api/activate`** — validar body (code, email, password ≥ 8, photo_consent true); buscar la invitación por `code` + email (minúsculas), `status = pending`, no vencida; errores claros para vencida/cancelada/usada; resolver `daycare_id` del child vía `rooms`; `admin.getUserByEmail` → si no existe `admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, role: 'parent', daycare_id } })` (el trigger crea el perfil); insert `parent_children` con `ON CONFLICT DO NOTHING`; `UPDATE invitations SET status='accepted', accepted_at=now()`; `UPDATE children SET photo_consent=true`; devolver `{ ok: true }`. Verificar: activar una invitación real crea el auth user + perfil + vínculo y marca la invitación aceptada.
10. **`/activate` real** — leer `code`/`email` de la URL (`useSearchParams`, prellenar), validar (code no vacío, email válido, password ≥ 8, checkbox obligatorio), POST a `/api/activate`, error inline, éxito → `router.push("/login?activated=1")`. Envolver el componente en `<Suspense>` (requisito de `useSearchParams` en Next 15).
11. **`/login`** — leer `activated` de la URL y mostrar banner verde "Tu cuenta fue activada. Ingresá con tu contraseña." (con `Suspense`).
12. **Verificación final** — `npm run lint`, `npx tsc --noEmit`, `npm run build`; flujo browser completo: Jose invita a un padre (email real), email enviado (o código visible si Resend falla), padre activa en `/activate`, login con el nuevo usuario, perfil del niño muestra al padre ACTIVA, invitación `accepted` en DB; `get_advisors` sin issues nuevos.

---

## Acceptance criteria

- [x] `list_migrations` incluye `create_invitations_parent_children_tables` y `add_users_profile_trigger` aplicadas.
- [x] Los enums `public.relationship_type` (`father`, `mother`, `guardian`) e `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) existen con exactamente esos valores.
- [x] `public.invitations` existe con las columnas del `docs` (`child_id` FK, `invited_by` FK, `full_name`, `email`, `relationship`, `code` UNIQUE, `status`, `expires_at`, `accepted_at` nullable, `created_at`) y RLS habilitado.
- [x] `public.parent_children` existe con `parent_id` FK, `child_id` FK, `relationship`, `created_at`, UNIQUE (`parent_id`, `child_id`) y RLS habilitado.
- [x] Existen los índices `invitations_child_id_idx`, `invitations_email_idx`, `parent_children_child_id_idx` y `parent_children_parent_id_idx`.
- [x] Policies: `invitations_select_staff` (SELECT) e `invitations_insert_staff` (INSERT) en `invitations`; `parent_children_select_staff` (SELECT) en `parent_children`; `users_select_staff` (SELECT) en `users`.
- [x] El trigger `on_auth_user_created` existe y crea la fila en `public.users` al insertar un auth user con `raw_user_meta_data` (`daycare_id`, `role`, `full_name`); sin metadata no rompe el insert.
- [x] `supabase/migrations/<version>_create_invitations_parent_children_tables.sql` y `<version>_add_users_profile_trigger.sql` existen y coinciden con el remoto (junto con `_invitations_parent_children_initplan_fix`, `_revoke_handle_new_user_execute` y `_add_private_is_staff_function`, que la implementación agregó).
- [x] `POST /api/invitations` con sesión staff inserta una fila `pending` con `code` de 5 chars alfanuméricos en mayúsculas, `expires_at` = +7 días, `invited_by` = el staff, y responde `{ code }`.
- [x] Reinvitar el mismo email al mismo niño con invitación pendiente devuelve 400 con mensaje claro.
- [x] El envío con Resend es best-effort: si la API key no está o el envío falla, la invitación se persiste igual y el modal muestra el código.
- [x] `LinkParentModal` muestra loading/error inline, ya no genera el código en el cliente y, al enviar, muestra el código devuelto por el servidor.
- [x] El perfil `/kids/[id]` carga los padres reales: activos de `parent_children` (con nombre de `users`) y pendientes de `invitations`, con labels Mamá/Papá/Tutor-a y badges ACTIVA/PENDIENTE.
- [x] `POST /api/activate` con invitación válida crea el auth user (`email_confirm: true`), la fila en `public.users` (vía trigger), el vínculo en `parent_children` y marca la invitación `accepted` con `accepted_at`.
- [x] Activar con un email que ya tiene cuenta reutiliza el usuario (sin duplicar) y solo crea el vínculo nuevo.
- [x] Invitación vencida, cancelada o ya usada devuelve un error claro y no crea nada.
- [x] Código + email que no coinciden con ninguna invitación devuelve un error genérico.
- [x] `/activate` prellena `code`/`email` desde la URL, exige password ≥ 8 chars y el checkbox de fotos, y al activar redirige a `/login?activated=1`.
- [x] `/login` con `?activated=1` muestra el banner de cuenta activada.
- [x] `children.photo_consent` queda `true` para el niño vinculado tras la activación.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] `get_advisors` (security y performance) no reporta issues nuevos.

---

## Decisions

- **Sí:** Flujo completo end-to-end (modal → invitación → email → activación). Decisión del usuario; el registro necesita que la invitación exista en la DB.
- **Sí:** Tablas `invitations` y `parent_children` con sus enums exactamente como el `docs`. Decisión del usuario.
- **Sí:** Email disparado desde Next.js (Route Handler `POST /api/invitations`) con el paquete `resend`. Decisión del usuario.
- **Sí:** Registro con Admin API server-side (`createUser` + `email_confirm: true`). El código ya probó la identidad; evita el email de confirmación de Supabase.
- **Sí:** Trigger `AFTER INSERT` en `auth.users` (SECURITY DEFINER) para auto-crear `public.users`. Decisión del usuario; alinea con el `docs` y desbloquea signups futuros.
- **Sí:** Reutilizar el usuario si el email ya existe. La relación es many-to-many; un padre puede seguir varios hijos.
- **Sí:** El perfil `/kids/[id]` carga padres reales (activos de `parent_children` + pendientes de `invitations`). Decisión del usuario; incluye la policy `users_select_staff`.
- **Sí:** Redirigir a `/login?activated=1` tras la activación, con banner en `/login`. Decisión del usuario; el middleware ya redirige a `/` a usuarios logueados en `/activate`.
- **Sí:** Email best-effort con `RESEND_FROM` configurable. En dev/localhost Resend no está configurado; la invitación se persiste aunque el envío falle y el código queda visible en el modal. Para probar entrega real se usa el email del owner (`josealamo@gmail.com`) como destinatario.
- **Sí:** Código generado en el servidor (único, 5 chars alfanuméricos en mayúsculas) y mostrado por el modal tras el envío. El SPEC 05 lo generaba en el cliente; ahora la fuente de verdad es la DB.
- **Sí:** `relationship_type` mother/father/guardian → Mamá/Papá/Tutor-a (mismo label que `parentRoles` del SPEC 05).
- **Sí:** La activación setea `children.photo_consent = true` (el checkbox del `/activate` es obligatorio).
- **Sí:** Documento generado completo sin revisión sección por sección. Pedido explícito del usuario; se revisa en el markdown.
- **No:** Reenvío/revocación/expiración automática de invitaciones (UI), editar/eliminar padres, feed del padre, "¿Olvidaste tu contraseña?".
- **No:** Configuración de dominio Resend (verificación DNS); es config de la cuenta.
- **No:** Rate limiting del código; anotado en riesgos.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| Resend sin configurar (dominio no verificado) → el envío falla en dev. | Envío best-effort: la invitación se persiste y el código se muestra en el modal; en dev se prueba entregando a `josealamo@gmail.com`. |
| RLS de `users` (`users_select_own`) bloquea el join para mostrar los padres activos. | Policy `users_select_staff` en la migración 1. |
| El trigger rompe signups sin metadata. | Guarda defensiva: sin `daycare_id` en metadata, no crea perfil y no falla el insert. |
| Código de 5 chars → fuerza bruta sobre `/api/activate`. | Errores genéricos para código inválido; rate limiting queda anotado como futuro (fuera de alcance). |
| `createUser` con email ya existente. | `admin.getUserByEmail` primero y reutilización del id (respuesta del usuario, pregunta 2a). |
| `useSearchParams` sin `Suspense` rompe el build de Next 15. | Componentes de `/activate` y `/login` envueltos en `<Suspense>`. |
| Re-ejecutar las migraciones duplicaría objetos. | `apply_migration` versionado: se ejecuta una sola vez por migración. |
| La copia local se desincroniza del historial remoto. | Mismo `version` y mismo SQL; cualquier cambio se refleja en ambos lados. |

---

## What is **not** in this spec

- Reenvío, revocación o expiración automática de invitaciones (UI).
- Editar o eliminar padres vinculados.
- Feed del padre con datos reales / redirección por rol.
- Pantalla "¿Olvidaste tu contraseña?".
- Configuración del dominio/email de Resend (verificación DNS).
- Rate limiting del código de activación.
- Trigger `ON UPDATE` / actualización de `updated_at` en `users`.
- Responsive mobile específico del modal.

Cada uno de esos, si llega, va en su propio spec.
