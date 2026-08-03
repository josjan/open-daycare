# Cron: `opencode run /db-security-audit` (viernes 18:00 UTC)

Programa la auditoría de seguridad de la base de datos Supabase (agente `db-security-auditor`, comando `.opencode/command/db-security-audit.md`) para que se ejecute **todos los viernes a las 6:00 de la tarde**.

- **Hora:** 18:00 — la documentamos en **UTC** (`0 18 * * 5`). Los schedulers locales usan la hora del sistema; GitHub Actions fuerza UTC.
- **Comando base:** `opencode run /db-security-audit` (desde la raíz del proyecto `06-open-daycare`).
- **Variable (portátil):** `opencode run --command /db-security-audit --dir /ruta/al/proyecto`.

## Requisitos comunes (local)

- El proyecto debe estar clonado y `opencode` en el `PATH` (instalado vía npm → `C:\Users\josal\AppData\Roaming\npm\opencode.cmd` en Windows, `/opt/homebrew/bin/opencode` en macOS Apple Silicon, `/usr/local/bin/opencode` en Linux).
- El run se ejecuta bajo el mismo usuario que tiene la sesión de `opencode auth login` (guarda credenciales en `~/.local/share/opencode/auth.json`) y el MCP de Supabase (configurado globalmente en `~/.config/opencode`).
- El agente **termina pidiendo aprobación antes de aplicar correcciones** — en un run programado sin supervisión esto se comporta como "solo auditoría y reporte", que es lo deseado.

---

## 1. Cron del sistema (macOS / Linux / Windows)

### 1.1 Windows Task Scheduler (GUI) — recomendado

1. Abre **Task Scheduler** (`taskschd.msc`).
2. Acción → **Create Task…**.
3. Pestaña **General**:
   - Nombre: `db-security-audit`.
   - Marca **"Run only when user is logged on"** (necesita tu perfil con auth + MCP de Supabase).
4. Pestaña **Triggers** → **New…**:
   - Begin the task: **On a schedule**.
   - Settings: **Weekly**, marca **Friday**, hora **18:00**.
5. Pestaña **Actions** → **New…**:
   - Action: **Start a program**.
   - Program/script: `C:\Users\josal\AppData\Roaming\npm\opencode.cmd`
   - Add arguments: `run /db-security-audit`
   - Start in: `C:\Users\josal\Desktop\OpenCode\06-open-daycare`
6. Pestaña **Settings**:
   - Marca **"Run task as soon as possible after a scheduled start is missed"** (por si el equipo estaba apagado).
   - Desmarca **"Stop the task if it runs longer than…"** (la auditoría puede tardar varios minutos).

> Nota: usa `opencode.cmd`, no `opencode.ps1` — el shim `.ps1` suele ser bloqueado por la Execution Policy de PowerShell en tareas programadas.

### 1.2 PowerShell (script + scheduled task)

**Wrapper** `scripts/db-security-audit.ps1`:

```powershell
# scripts/db-security-audit.ps1
param(
    [string]$Project = "C:\Users\josal\Desktop\OpenCode\06-open-daycare"
)

$ErrorActionPreference = "Stop"
$opencode = "$env:APPDATA\npm\opencode.cmd"
$logDir = "$env:USERPROFILE\logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log = "$logDir\db-security-audit.log"

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $log -Value "[$stamp] Iniciando auditoría..."

try {
    Push-Location $Project
    & $opencode run /db-security-audit 2>&1 | Out-File -FilePath $log -Append
    $exit = $LASTEXITCODE
    Pop-Location
    Add-Content -Path $log -Value "[$stamp] Fin auditoría (exit $exit)."
    exit $exit
} catch {
    Add-Content -Path $log -Value "[$stamp] ERROR: $_"
    exit 1
}
```

**Registro de la tarea** (`register-db-security-audit.ps1`):

```powershell
# register-db-security-audit.ps1
$action = New-ScheduledTaskAction -Execute "$env:APPDATA\npm\opencode.cmd" `
    -Argument "run /db-security-audit" `
    -WorkingDirectory "C:\Users\josal\Desktop\OpenCode\06-open-daycare"

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At "18:00"

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask `
    -TaskName "db-security-audit" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Auditoria de seguridad de la DB Supabase (viernes 18:00)"

# Verificar / ejecutar manualmente:
Get-ScheduledTask -TaskName "db-security-audit"
Start-ScheduledTask -TaskName "db-security-audit"
```

### 1.3 launchd (macOS — nativo)

**Archivo** `~/Library/LaunchAgents/com.opendaycare.db-security-audit.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opendaycare.db-security-audit</string>

    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/opencode</string>
        <string>run</string>
        <string>--dir</string>
        <string>/Users/you/06-open-daycare</string>
        <string>/db-security-audit</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>5</integer>
        <key>Hour</key>
        <integer>18</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/db-security-audit.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/db-security-audit.err.log</string>
</dict>
</plist>
```

Carga y verificación:

```bash
launchctl load ~/Library/LaunchAgents/com.opendaycare.db-security-audit.plist
launchctl list | grep opendaycare
# Prueba manual:
launchctl start com.opendaycare.db-security-audit
tail -f /tmp/db-security-audit.log
```

> Nota: en launchd `Weekday` va de 1 (lunes) a 7 (sábado), 0 y 7 = domingo → viernes = `5`.

### 1.0 cron clásico (Linux)

**Wrapper** `/usr/local/bin/db-security-audit.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
PROJECT="/srv/open-daycare/06-open-daycare"
LOG="$HOME/logs/db-security-audit.log"
mkdir -p "$(dirname "$LOG")"
cd "$PROJECT"
echo "[$(date -Iseconds)] Iniciando auditoria" >> "$LOG"
opencode run /db-security-audit >> "$LOG" 2>&1
echo "[$(date -Iseconds)] Fin auditoria (exit $?)" >> "$LOG"
```

**Crontab** (`crontab -e`):

```
# viernes 18:00
0 18 * * 5 /usr/local/bin/db-security-audit.sh
```

---

## 2. Supabase Cron (pg_cron)

> **Límite importante:** `pg_cron` solo ejecuta SQL dentro de la base de datos — **no puede lanzar el agente LLM** (`opencode run`). Su uso correcto es programar la **parte SQL de la auditoría** (RLS, policies) y persistir el resultado. La auditoría con el agente se delega a las opciones 1 o 3.

En Supabase `pg_cron` se habilita vía migración versionada (ver `AGENTS.md`: todo cambio DDL va por `apply_migration` + espejo en `supabase/migrations/`).

```sql
-- habilitar el scheduler (solo una vez)
create extension if not exists pg_cron;

-- tabla de reportes de auditoría
create table if not exists public.audit_reports (
    id bigint generated always as identity primary key,
    checked_at timestamptz not null default now(),
    tables_without_rls text[] not null default '{}',
    tables_without_policies text[] not null default '{}'
);

-- job: viernes 18:00 UTC (pg_cron usa la zona horaria de la BD, UTC por defecto en Supabase)
select cron.schedule(
    'db-security-audit',
    '0 18 * * 5',
    $$
    insert into public.audit_reports (tables_without_rls, tables_without_policies)
    select
        coalesce((
            select array_agg(c.relname)
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relkind = 'r'
              and not c.relrowsecurity
        ), '{}'),
        coalesce((
            select array_agg(c.relname)
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relkind = 'r'
              and not exists (
                  select 1 from pg_policies p where p.tablename = c.relname
              )
        ), '{}')
    $$
);

-- listar / cancelar:
-- select * from cron.job;
-- select cron.unschedule('db-security-audit');
```

Opcional: avisar de hallazgos vía webhook con `pg_net` (también disponible):

```sql
-- dentro del mismo job, si hay tablas sin RLS, dispara un webhook (ej. Slack)
select pg_net.http_post(
    url := 'https://hooks.slack.com/services/XXX',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('text', 'ALERTA: tablas sin RLS en open-daycare')
)
from public.audit_reports
where tables_without_rls <> '{}'
order by id desc limit 1;
```

---

## 3. GitHub Actions

El repo **está en GitHub** (`josjan/open-daycare`) y ya usa `anomalyco/opencode/github@latest` con `OPENCODE_API_KEY` (ver `.github/workflows/opencode.yml`), así que la opción es viable.

**Nuevo** `.github/workflows/db-security-audit.yml`:

```yaml
name: db-security-audit

on:
  schedule:
    - cron: "0 18 * * 5" # viernes 18:00 UTC
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Run opencode (db-security-audit)
        uses: anomalyco/opencode/github@latest
        env:
          OPENCODE_API_KEY: ${{ secrets.OPENCODE_API_KEY }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
        with:
          model: opencode/deepseek-v4-flash
          prompt: |
            Ejecuta el comando `/db-security-audit` con alcance completo.
            Es una corrida programada sin supervisión: audita la base de datos,
            reporta los hallazgos y NO apliques correcciones.
```

### Requisitos / advertencias (GH Actions)

1. **MCP de Supabase en el runner**: tu MCP de Supabase está solo en `~/.config/opencode` (local). El runner no tiene ese config global, así que el agente no tendría acceso a la DB. Para que funcione hay que inyectar la configuración MCP en el runner (vía `OPENCODE_CONFIG` apuntando a un archivo de config del repo, o `OPENCODE_CONFIG_CONTENT`), usando los secrets `SUPABASE_ACCESS_TOKEN` y `SUPABASE_PROJECT_REF`. No está configurado en este repo todavía.
2. **Referencia `db-schema`**: el agente lee `docs` → `../07-DB-Schema/opendaycare-database-schema.md`, que es una carpeta hermana local y **no existe en el repo**; en el runner la auditoría corre sin ese documento (DB remota + `supabase/migrations/`).
3. **Salida**: en eventos `schedule` el output va a los logs del workflow (y se puede crear un issue/PR desde el `prompt`). No hay comentario al que responder.
4. **Prueba**: usar `workflow_dispatch` para disparar la primera corrida manualmente desde la pestaña Actions.

---

## Comparativa rápida

| Opción                | ¿Ejecuta el agente LLM? | ¿Requiere máquina encendida? | Dónde queda el reporte | Complejidad |
| --------------------- | ----------------------- | ---------------------------- | ---------------------- | ----------- |
| 1.1 Task Scheduler    | Sí                      | Sí                           | Log local              | Baja        |
| 1.2 PowerShell        | Sí                      | Sí                           | Log local              | Baja        |
| 1.3 launchd           | Sí                      | Sí                           | Log local              | Baja        |
| 1.0 cron Linux        | Sí                      | Sí                           | Log local              | Baja        |
| 2. pg_cron            | No (solo SQL)           | No                           | Tabla `audit_reports`  | Media       |
| 3. GitHub Actions     | Sí                      | No (runner de GitHub)        | Logs / issue / PR      | Media       |

**Recomendación:** opción **1.2 (PowerShell)** para tu máquina Windows (auditoría completa con el agente, cero dependencias externas) y opcionalmente **3 (GitHub Actions)** como respaldo que no depende de que tu equipo esté encendido, una vez inyectado el MCP de Supabase en el runner.
