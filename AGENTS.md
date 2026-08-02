# open-daycare

Next.js 15 (Turbopack), TypeScript, Tailwind CSS 3. Dark mode via `prefers-color-scheme` media query (CSS vars). No test framework, no CI, no pre-commit hooks, no env files committed (`.env*` gitignored).

## Commands

```sh
npm run dev         # dev server at localhost:3000 (Turbopack)
npm run build       # production build
npm run start       # run production build
npm run lint        # ESLint (next/core-web-vitals, next/typescript)
npx tsc --noEmit    # typecheck (separate from lint)
```

Run `lint -> typecheck -> build` for pre-PR verification.

## Structure

- `src/app/layout.tsx` — root layout (Fredoka + Nunito via `next/font/google`)
- `src/app/page.tsx` — home page (single-page app, no routing yet)
- `src/app/globals.css` — Tailwind directives + CSS vars + styled scrollbar
- `src/data/mock.ts` — mock data (user, room, posts)
- `src/components/` — reusable components (Sidebar, Post, CreatePostPrompt)
- `@/*` alias → `./src/*` (tsconfig.json)
- `references/{pantallas,screenshots}/` — design mocks
- `specs/` — feature specs (markdown); los specs que tocan la base de datos van en `specs/database/`
- `.playwright-mcp/` — Playwright screenshots

## Conventions

- Tailwind utility classes only (no CSS modules, styled-components)
- PostCSS with Tailwind plugin only
- Cualquier spec que toque la base de datos (tablas, enums, RLS, migraciones) va en `specs/database/`, no en la raíz de `specs/`

## OpenCode

Installed skills (`.agents/skills/`):
- `spec` — design spec workflow (ask clarifying questions, build spec section by section)
- `spec-impl` — implement approved spec (create branch, implement step by step, pause for diff review)
- `supabase` — use for ANY task involving Supabase (Database, Auth, Edge Functions, Realtime, Storage, CLI, migrations, RLS)
- `supabase-postgres-best-practices` — load BEFORE writing/changing anything in Postgres (schema design, migrations, RLS, indexes, triggers); also for diagnosing slow queries

Installed agents (`.opencode/agents/`):
- `accessibility-checker` — audita y corrige archivos según WCAG 2.2 AA (accesibilidad, ARIA, contraste, teclado y foco); verifica con Playwright y corre el flujo pre-PR
- `react-best-practices` — aplica las mejores prácticas de React y las últimas recomendaciones de la doc oficial a los archivos indicados, verificando con Context7
- `spec-checker` — verifica los criterios de aceptación de un spec: lee el spec, inspecciona el codebase, corre lint/typecheck, valida visualmente con Playwright y actualiza los checkboxes del spec

Spec checking: use `@spec-checker @specs/<file>.md` to verify acceptance criteria against the current implementation.

Playwright MCP (`opencode.json`) for browser testing. Context7 MCP available globally for framework docs.

## Supabase

- Supabase MCP connected (via `~/.config/opencode`) for database work: schema, migrations, RLS, logs, edge functions
- DB schema reference (not implemented yet): `docs` reference → `../07-DB-Schema` (use as source of truth when creating tables)
- Always load the `supabase` skill before Supabase tasks and `supabase-postgres-best-practices` before DDL/schema work
- Prefer local Supabase CLI for dev workflows; apply changes to remote only when intended
- Run `get_advisors` after DDL changes to catch missing RLS policies and security issues
- Para interactuar con la base de datos desde la app usamos los paquetes oficiales de Supabase para Next.js (`@supabase/ssr` con `@supabase/supabase-js`). Clientes listos en `src/utils/supabase/`: `server.ts` (Server Components), `client.ts` (Browser Components) y `middleware.ts` (refresh de sesión vía `src/middleware.ts`). Usar `createServerClient` en el servidor y `createBrowserClient` en el cliente; no crear clientes manuales con `createClient(supabaseUrl, key)`.

### Migraciones (obligatorio)

Siempre se usan migraciones versionadas para CUALQUIER manipulación de la base de datos. Esta es la única vía permitida; no hay excepciones.

- **Todo cambio de base de datos** (DDL: tablas, columnas, índices, RLS, policies; y DML/seed) se aplica vía MCP `apply_migration`, nunca con DDL directo vía `execute_sql`.
- Cada migración remota debe reflejarse como archivo local en `supabase/migrations/<version>_<nombre>.sql` con el **mismo version y el mismo SQL**, para que el repo versione el historial.
- Una migración se ejecuta una sola vez (versionada); re-ejecutarla duplicaría datos o fallaría.
- No hardcodear IDs generados en migraciones de datos; las referencias futuras se resuelven por valores estables (ej. `WHERE name = '...'`).
- Verificación estándar tras aplicar: `list_migrations`, `list_tables`, consultas de lectura, y `get_advisors` (security y performance).

## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés 
