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
- `specs/` — feature specs (markdown)
- `.playwright-mcp/` — Playwright screenshots

## Conventions

- Tailwind utility classes only (no CSS modules, styled-components)
- PostCSS with Tailwind plugin only

## OpenCode

Installed skills (`.agents/skills/`):
- `spec` — design spec workflow (ask clarifying questions, build spec section by section)
- `spec-impl` — implement approved spec (create branch, implement step by step, pause for diff review)

Spec checking: use `@spec-checker @specs/<file>.md` to verify acceptance criteria against the current implementation. The spec-checker agent reads the spec, inspects the codebase, runs lint/typecheck, uses Playwright to validate visually, and updates the checkboxes in the spec file.

Playwright MCP (`opencode.json`) for browser testing. Context7 MCP available globally for framework docs.

## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés 
