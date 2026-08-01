# SPEC 09 — Autenticación email+password y protección de rutas

> **Estado:** Implementado
> **Depende de:** 03-auth-screens, 08-users-table
> **Fecha:** 2026-08-01
> **Objetivo:** Implementar el login real con email y contraseña contra Supabase Auth, proteger todas las rutas de la app excepto `/login` y `/activate` mediante middleware, y cerrar sesión mostrando el perfil real del usuario en la Sidebar.

---

## Scope

**In:**

- **Login real en `/login`**: el formulario existente se conecta a `supabase.auth.signInWithPassword({ email, password })` usando el client de browser (`src/utils/supabase/client.ts`). Estados: loading (botón "Ingresando…", deshabilitado), error inline ("Email o contraseña incorrectos"), éxito → redirect a `/`.
- **Protección de rutas en middleware**: se reescribe `src/middleware.ts` para refrescar la sesión y redirigir a `/login` cualquier ruta sin sesión; y redirigir a `/` los usuarios ya logueados en `/login` o `/activate`. Validación con `auth.getUser()` (no confía en el cookie).
- **Refactor de `src/utils/supabase/middleware.ts`**: devolver `{ supabase, response }` en lugar de solo la response, para poder llamar `supabase.auth.getUser()`.
- **Logout**: el botón "Cerrar sesión" que ya existe en la Sidebar se conecta a `supabase.auth.signOut()` y redirige a `/login`.
- **Perfil real en la Sidebar**: fetch de `full_name` y `role` desde `public.users` (client browser) y display en lugar del mock `currentUser`.
- **Migración `fix_seed_auth_user_login`**: repara el seed `jose@gmail.com` para que GoTrue pueda leerlo (rellena los token columns NULL que escanea como string) y crea su identity de email en `auth.identities`. Verificado con un login real.
- **Migración `add_users_rls_select_own_row`**: policy SELECT en `public.users` (`TO authenticated` con `auth.uid() = id`) + `GRANT SELECT ... TO authenticated`.
- **Copias locales** de ambas migraciones en `supabase/migrations/<version>_*.sql` (mismo version y SQL que el remoto).
- Verificación: login real contra el proyecto, protección de rutas en browser, `get_advisors`.

**Out of scope (para futuros specs):**

- Flujo `/activate` (código de invitación, crear contraseña, signup). Usa tablas que aún no existen (`invitations`, `children`).
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" — placeholder visual).
- Redirección por rol (staff → `/`, parent → feed de familia). Solo existe un usuario staff y un feed.
- Trigger `AFTER INSERT` en `auth.users` (auto-creación de perfil en signup).
- Verificación de email para nuevos signups / pantalla "confirmá tu email".
- Grants a `anon`; solo `authenticated` y `service_role`.

---

## Data model

La feature no agrega tablas nuevas. Cambios de DB (migraciones versionadas):

**Migración 1 — `fix_seed_auth_user_login`** (repara `auth.users` + crea la identity):

```sql
-- 1) Rellena los token columns NULL que GoTrue escanea como string (evita el error
--    "converting NULL to string is unsupported" al buscar el usuario por email).
update auth.users
set confirmation_token          = coalesce(confirmation_token, ''),
    recovery_token              = coalesce(recovery_token, ''),
    email_change_token_new      = coalesce(email_change_token_new, ''),
    email_change_token_current  = coalesce(email_change_token_current, ''),
    email_change                = coalesce(email_change, ''),
    phone_change                = coalesce(phone_change, ''),
    phone_change_token          = coalesce(phone_change_token, ''),
    reauthentication_token      = coalesce(reauthentication_token, '')
where email = 'jose@gmail.com';

-- 2) Crea la identity de email que falta para que GoTrue construya la sesión.
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       now(), now(), now()
from auth.users u
where u.email = 'jose@gmail.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);
```

**Migración 2 — `add_users_rls_select_own_row`**:

```sql
create policy "users_select_own" on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

grant select on public.users to authenticated;
```

**Frontend** — tipo del perfil que consume la Sidebar:

```ts
// src/types/profile.ts
export type UserProfile = {
  fullName: string;
  role: "staff" | "parent" | "admin";
  initial: string;
};
```

Convenciones:

- El perfil se lee de `public.users` (fuente de verdad), no de `user_metadata` (editable, no apta para autorización).
- Label de rol en español en UI: `staff` → "Personal", `parent` → "Familia", `admin` → "Admin".

---

## Implementation plan

1. **Aplicar migración `fix_seed_auth_user_login`** vía MCP `apply_migration`. Verificar: `POST {url}/auth/v1/token?grant_type=password` con `jose@gmail.com`/`Abc123456@` devuelve `access_token` + `user` (hoy devuelve 500). Si GoTrue aún rechaza la fila, ajustar el UPDATE (ver Riesgos).
2. **Aplicar migración `add_users_rls_select_own_row`**. Verificar: `list_tables` muestra la policy; `GET {url}/rest/v1/users?select=full_name,role` con el `access_token` de Jose devuelve solo su fila; con `apikey` anon devuelve 0 filas. `get_advisors` sin issues nuevos.
3. **Copias locales** — tomar los `version` reales de `list_migrations` y crear `supabase/migrations/<version>_fix_seed_auth_user_login.sql` y `<version>_add_users_rls_select_own_row.sql` con el mismo SQL del remoto.
4. **Refactor `src/utils/supabase/middleware.ts`** — devolver `{ supabase, response }` (el client y la response se construyen juntos).
5. **Reescribir `src/middleware.ts`** — crear client, `await supabase.auth.getUser()`. `isPublic = pathname === "/login" || pathname === "/activate"`. Sin user y no pública → `redirect("/login")`. Con user y pública → `redirect("/")`. Si no, devolver `response` (que incluye el refresh del cookie).
6. **Login real en `src/app/(auth)/login/page.tsx`** — el botón "Iniciar sesión" pasa de `<Link>` a submit real: llama `signInWithPassword`, con `useState` de `loading`/`error`. En éxito `router.push("/")` + `router.refresh()`. Mantener "Activá tu cuenta" → `/activate` y "¿Olvidaste tu contraseña?" → `#`.
7. **Sidebar con perfil real + logout** — en `src/components/Sidebar.tsx`, cargar el perfil (client): `auth.getUser()` → `.from("users").select("full_name, role").eq("id", user.id).single()`. Mostrar nombre, label de rol e inicial (primera letra del nombre) en lugar de `currentUser`. Conectar el botón "Cerrar sesión": `signOut()` → `router.push("/login")`. Fallback: si no hay fila en `users`, usar `user_metadata`.
8. **Verificación final** — `npm run lint`, `npx tsc --noEmit`, `npm run build`. Flujo browser: `/` sin sesión → `/login`; login Jose → `/` con perfil real; `/kids` protegida; logout → `/login`; `/login` logueado → `/`.

---

## Acceptance criteria

- [x] `jose@gmail.com` / `Abc123456@` inicia sesión contra Supabase Auth real (token endpoint devuelve `access_token`).
- [x] `auth.identities` tiene la fila email para `jose@gmail.com`.
- [x] `public.users` tiene la policy `users_select_own` (SELECT, `TO authenticated`, `auth.uid() = id`).
- [x] `GET /rest/v1/users` con el access_token de Jose devuelve solo su fila; con key `anon` devuelve 0 filas (RLS).
- [x] `supabase/migrations/20260801174100_fix_seed_auth_user_login.sql` y `20260801174105_add_users_rls_select_own_row.sql` existen y coinciden con el remoto.
- [x] Sin sesión, `GET /` y `GET /kids` redirigen a `/login`.
- [x] Con sesión, `GET /login` redirige a `/`.
- [x] Credenciales inválidas en `/login` muestran error inline y no navegan.
- [x] Credenciales válidas en `/login` inician sesión y redirigen a `/`.
- [x] La Sidebar muestra el nombre real de Jose y su rol (no "Caro Giménez").
- [x] El botón "Cerrar sesión" cierra la sesión y redirige a `/login`; luego `/` vuelve a redirigir a `/login`.
- [x] `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan sin errores.
- [x] `get_advisors` (security y performance) no reporta issues nuevos.

---

## Decisions

- **Sí:** Middleware con `auth.getUser()` para la protección. Es el patrón oficial de `@supabase/ssr` (crear el client en middleware, `await getUser()`, redirigir a `/login` si no hay user). `getUser()` valida el token contra el servidor de auth (los cookies de servidor son untrusted); no se usa `getSession()` para autorización.
- **Sí:** Defense in depth diferido a un spec futuro de rol/feed. `@supabase/ssr` recomienda además chequear `getUser()` en el layout server, porque el middleware no siempre se ejecuta (streaming, respuestas ya iniciadas). Las páginas actuales son client components y no exponen datos sensibles reales (todo mock), por eso en este spec basta el middleware; el gate server se agrega cuando se consuma DB en server.
- **Sí:** Proteger todo excepto `/login` y `/activate`. Decisión del usuario.
- **Sí:** Logout en la Sidebar (el botón ya existía como placeholder). Decisión del usuario.
- **Sí:** Perfil real desde `public.users` abriendo RLS (SELECT propia fila). Decisión del usuario; fuente de verdad y desbloquea specs futuros.
- **Sí:** Reparar el seed en lugar de recrearlo. Los token columns NULL rompen el scan de GoTrue (`converting NULL to string is unsupported`, verificado en logs).
- **Sí:** `GRANT SELECT ... TO authenticated` en la migración RLS. Resultó redundante en la práctica (la Data API ya auto-expone `users` con grants completos a `anon`/`authenticated`); el RLS es lo que controla las filas. Se mantiene por claridad y defensa en profundidad.
- **Sí:** Versiones de migración `20260801174100` (`fix_seed_auth_user_login`) y `20260801174105` (`add_users_rls_select_own_row`), según el historial remoto.
- **Sí:** Mantener `src/middleware.ts`. El rename `middleware.ts` → `proxy.ts` es de Next.js 16 (en 15 el nombre del archivo y del export cambian y Next 15.0.2 solo reconoce `middleware`; renombrar rompería la protección en silencio). Se migra a `proxy.ts` cuando el proyecto suba a Next 16, usando `npx @next/codemod@latest middleware-to-proxy .`.
- **No:** Flujo `/activate` por código de invitación. Requiere tablas que no existen; spec propio.
- **No:** Recuperación de contraseña.
- **No:** Redirección por rol. Solo hay un feed y un usuario staff.
- **No:** Trigger `AFTER INSERT` en `auth.users`.
- **No:** Grants a `anon`; solo `authenticated` y `service_role`.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| El `UPDATE` a `auth.users` no cubra todos los tokens que GoTrue escanea y el login siga fallando. | Verificación con token endpoint tras la migración; si falla, recrear el usuario con Admin API (`service_role`, `createUser`) y re-vincular `public.users.id`. |
| `public.users` no expuesta a la Data API (falta grant). | La migración incluye `GRANT SELECT ... TO authenticated`; si la config de Data API la bloquea, ajustar ahí. |
| El fetch del perfil es client-side → posible flash del mock al cargar. | Aceptado; el layout server que elimina el flash vendrá en un spec futuro de rol/feed. |
| Middleware no siempre se ejecuta (streaming, respuestas ya iniciadas) → una ruta sin sesión podría renderizar parcialmente. | Aceptado por ahora: las páginas usan mock y no exponen datos reales. Cuando se consuma DB en server, agregar gate con `getUser()` en el layout (defense in depth de `@supabase/ssr`). |
| Policy con `auth.uid() = id` usa el `sub` del JWT (no editable por el usuario). | Bajo control; sin decisiones de autorización basadas en `user_metadata`. |

---

## What is **not** in this spec

- Flujo de activación `/activate` (código de invitación).
- Recuperación y cambio de contraseña.
- Redirección por rol (staff vs parent).
- Trigger `AFTER INSERT` en `auth.users`.
- Grants a `anon`.
- "Recordarme"/sesión de larga duración.
- Verificación de email para nuevos signups.

Cada uno de esos, si llega, va en su propio spec.
