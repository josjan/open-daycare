# open-daycare

Plataforma web para la gestión de una guardería (daycare): feed de publicaciones, gestión de niños, salas, invitaciones de padres y activación de cuentas.

- **Framework:** Next.js 15 (App Router, Turbopack) + React 19
- **Lenguajes:** TypeScript, Tailwind CSS 3
- **Backend:** Supabase (Auth, Postgres, RLS) — ver [Supabase](#supabase)
- **Email:** Resend (invitaciones y activación de cuentas)

## Requisitos previos

- **Node.js 20 o superior** (recomendado 22+)
- **npm** (viene con Node.js)
- Acceso al proyecto de Supabase de la organización (para el entorno de desarrollo)
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) si quieres usar flujos locales o autenticarte por CLI

## Variables de entorno

Copia el archivo de entorno y completa los valores (los credenciales de Supabase y Resend te los debe compartir el owner del proyecto):

```bash
cp .env.example .env
```

Variables necesarias:

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publishable de Supabase (pública, para el cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (secreta, solo servidor, para `src/utils/supabase/admin.ts`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon legacy (opcional, por compatibilidad) |
| `RESEND_API_KEY` | API key de Resend para el envío de emails |
| `RESEND_FROM` | Remitente de los emails (default: `info@opendaycare.com`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (default: `http://localhost:3000`) |
| `SUPABASE_DB_PASSWORD` | Password de la base de datos (para uso con la CLI) |

> `.env*` está en `.gitignore`: las credenciales no se versionan. Si no existe `.env.example`, crea uno local con las claves de la tabla anterior y valores vacíos.

## Instalación

```bash
npm install
```

## Levantar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts disponibles

```bash
npm run dev       # servidor de desarrollo (Turbopack)
npm run build     # build de producción
npm run start     # servir el build de producción
npm run lint      # ESLint (next/core-web-vitals, next/typescript)
npx tsc --noEmit  # typecheck (independiente del lint)
```

Verificación pre-PR: `npm run lint` → `npx tsc --noEmit` → `npm run build`.

## Supabase

El proyecto usa Supabase como backend. Toda la lógica de base de datos (tablas, RLS, migraciones) se gestiona desde el esquema de referencia en `../07-DB-Schema` y se aplica mediante migraciones versionadas.

### Clientes en la app

- `src/utils/supabase/server.ts` — Server Components
- `src/utils/supabase/client.ts` — Browser Components
- `src/utils/supabase/middleware.ts` — refresh de sesión vía `src/middleware.ts`
- `src/utils/supabase/admin.ts` — acceso con service role (solo servidor)

Se usan los paquetes oficiales `@supabase/ssr` + `@supabase/supabase-js`. No crear clientes manuales con `createClient(supabaseUrl, key)`.

### Autenticación: MCP de Supabase (OpenCode)

El MCP de Supabase se usa desde OpenCode (y agentes de IA) para consultar la base de datos, aplicar migraciones, revisar logs, etc. El servidor usa **OAuth 2.1** (dynamic client registration): no hace falta un PAT manual.

Configuración (vive en `~/.config/opencode/opencode.json`, global, scopeado al proyecto):

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=qidqgojistqhudjifwpw&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
      "enabled": true
    }
  }
}
```

Para **autenticarse** (cada miembro del equipo debe hacerlo una vez):

```bash
opencode mcp auth supabase
```

Esto abre el navegador: inicia sesión con tu cuenta de Supabase y **concede acceso a la organización** que contiene el proyecto `qidqgojistqhudjifwpw`. Tras autorizar, recarga la sesión de OpenCode y las herramientas del MCP quedan disponibles.

> Si tu cliente de OpenCode no dispara el flujo OAuth automáticamente, usa el comando `/mcp` dentro de OpenCode y selecciona "Authenticate" en el servidor `supabase`.

### Autenticación por CLI (equipo)

Para que cada miembro del equipo pueda usar la CLI de Supabase (flujos locales, `db diff`, etc.) y quede vinculado al proyecto:

1. **Instalar la CLI** (una sola vez por máquina):

   - **Windows (Scoop):**
     ```powershell
     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
     scoop install supabase
     ```
   - **macOS (Homebrew):** `brew install supabase/tap/supabase`
   - **Como dependencia npm del proyecto:** `npm install supabase --save-dev` y usar `npx supabase <comando>`

2. **Login** — abre el navegador para iniciar sesión con tu cuenta de Supabase (la misma con acceso a la organización):

   ```bash
   supabase login
   ```

   Guarda un access token en `~/.supabase/access-token`. Verifica con `supabase projects list`.

3. **Vincular el proyecto** (desde la raíz del repo):

   ```bash
   supabase link --project-ref qidqgojistqhudjifwpw
   ```

   Te pedirá la `SUPABASE_DB_PASSWORD` (está en tu `.env`).

> Nota: el token de login es por persona. Cada integrante del equipo hace su propio `supabase login` con su cuenta, no se comparte un token único.

### Migraciones

Todo cambio de base de datos se aplica como migración versionada (`supabase/migrations/`), nunca con DDL directo. Al trabajar con el MCP se usa `apply_migration`; con la CLI, `supabase migration new <nombre>`. Cada migración remota debe quedar reflejada como archivo local con el mismo version y SQL.

## Estructura del proyecto

```
src/
├── app/            # páginas y rutas (App Router)
├── components/     # componentes reutilizables
├── data/           # mock data
├── lib/            # integraciones (Resend)
└── utils/supabase/ # clientes de Supabase
specs/              # specs de funcionalidades (markdown)
specs/database/     # specs que tocan la base de datos
references/         # mocks de diseño y screenshots
supabase/migrations/ # migraciones versionadas
```
