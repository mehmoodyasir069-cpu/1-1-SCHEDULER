# Project Context

Last inspected: 2026-07-03 02:04 BST
Last operating-system update: 2026-07-03, Safe Release Push Mode added

## Identity

- Project: Elevate Commerce - 1-1 Mentorship CRM
- Repository: `https://github.com/mehmoodyasir069-cpu/1-1-SCHEDULER.git`
- Current branch: `main`
- Current commit: `30f2342`
- Current git status at inspection: clean, tracking `origin/main`
- Machine detected: `rajas-MacBook-Neo.local`
- OS detected: macOS Darwin arm64

## Tech Stack

- Package manager: npm, detected by `package-lock.json`
- Frontend: React 18, TypeScript, Vite
- Styling/UI: Tailwind CSS, Radix UI primitives, local `src/components/ui`
- Backend/data: Convex
- Deployment platform: Netlify, detected by `netlify.toml`
- Production build output: `dist`

## Commands

- Install: `npm install` or `npm ci`
- Run locally: `npm run dev`
- Local run details: `convex dev --start "vite --host 127.0.0.1 --open"`
- Build: `npm run build`
- Lint/typecheck: `npm run lint`
- Typecheck only: no standalone script detected; `npm run lint` runs `tsc`, and `npm run build` runs `tsc -b`
- Test: no dedicated test script detected
- Preview: `npm run preview`

## Important Folders

- `src/`: React app, pages, UI, scheduling, fee tracker, backup/export UI
- `src/lib/`: CRM seed/static helper data and utilities
- `src/components/`: local UI components
- `convex/`: Convex schema, queries, mutations, generated API references
- `public/`: static public assets
- `dist/`: generated Vite build output, ignored by Git
- `.convex/`: local Convex state, ignored/local
- `.codex/`: repo-based Codex agent configuration
- `.agents/skills/`: repo-based Codex workflow skills, including Autopilot Team Mode, push safety gate, and Safe Release Push Mode
- `docs/`: repo operating-system support docs

## Deployment

- Netlify config: `netlify.toml`
- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`
- Release assumption: `main` is treated as production-impacting unless a future verified Netlify/GitHub setup says otherwise
- Safe Release Push Mode note: pushing `main` may trigger production deploy; feature branch pushes may trigger preview deploys
- README lists Netlify env vars:
  - `VITE_CONVEX_URL`
  - `VITE_CONVEX_SITE_URL`

## Data Model And Backend

- Convex tables detected in `convex/schema.ts`:
  - `students`
  - `sessions`
  - `studentNotes`
  - `fees`
- Convex functions detected in `convex/crm.ts`.
- App uses `ConvexProvider` in `src/main.tsx`.
- README says student, session, and fee data live in Convex, not local storage.
- README says seed mutation is idempotent for the current seeded students.

## Risky Files And Areas

- Database/schema/backend: `convex/schema.ts`, `convex/crm.ts`, `convex/_generated/*`
- Frontend state and business logic: `src/App.tsx`
- Seed and fee/session data helpers: `src/lib/crm-data.ts`
- Convex client binding: `src/main.tsx`
- Deployment: `netlify.toml`
- Build/tooling/package surface: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`
- Environment/secrets: `.env*`, `.convex/*`, Netlify environment variables
- Generated/local outputs: `dist`, `.convex`, `node_modules`

## Auth, Payment, Database, Env, Deployment Areas

- Auth: no active app auth system detected, but Convex auth guidance exists in generated docs. Any future auth work is high risk.
- Payments: no payment processor detected, but fee/payment tracking exists in `src/App.tsx`, `src/lib/crm-data.ts`, and `convex/crm.ts`. Treat as financially sensitive.
- Database: Convex is active. Treat schema, query, mutation, seed, backup, and export changes as high risk.
- Env/secrets: `.env*` is ignored by Git. Do not touch or print env files.
- Deployment: Netlify detected. Do not deploy without Yasir approval.
- Production data: Convex cloud deployment is listed in README. Do not access or mutate production data without Yasir approval.

## Current Safe Next Step

- Keep this setup as documentation/config only.
- For future feature work, create a feature/hotfix branch before editing app code.
- First future task should start with CEO reading the operating-system files, checking git status, classifying risk, and routing work.
- Main Codex chat should remain the command center and spawn/use `yasir-ceo` first.
- Do not push/release unless Yasir gives clear push/release approval and Safe Release Push Mode gates pass.
- If Netlify status cannot be checked during release, report `deployment verification blocked: Netlify access/status unavailable`.
