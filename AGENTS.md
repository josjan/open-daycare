# open-daycare

Next.js 15 (Turbopack), TypeScript, Tailwind CSS 3.

## Commands

```sh
npm run dev      # dev server at localhost:3000 (Turbopack)
npm run build    # production build
npm run lint     # ESLint (next/core-web-vitals, next/typescript)
npx tsc --noEmit # typecheck (separate from lint)
```

## Structure

- `src/app/layout.tsx` — root layout (Geist font, dark mode ready)
- `src/app/page.tsx` — home page
- `src/app/globals.css` — Tailwind directives + CSS vars for light/dark
- `@/*` alias → `./src/*` (configured in tsconfig.json)

## Conventions

- Tailwind utility classes, no CSS modules or styled-components
- PostCSS with Tailwind plugin only
- No test framework configured yet
- No pre-commit hooks, no CI
- `.env*` files are gitignored

## OpenCode

Playwright MCP is configured in `opencode.json` for browser testing.

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp. 
