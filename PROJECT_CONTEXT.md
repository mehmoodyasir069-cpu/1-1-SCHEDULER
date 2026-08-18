# Project Context

Last inspected: 2026-08-18
Last operating-system update: 2026-08-18, Netlify/Convex release-context audit recorded

## Identity

- Project: Elevate Commerce - 1-1 Mentorship CRM
- Repository: `https://github.com/mehmoodyasir069-cpu/1-1-SCHEDULER.git`
- Current branch: `codex/scheduling-lifecycle`
- Current git status at inspection: uncommitted scheduling, release-preparation, Codex-agent configuration, and repo-memory changes on `codex/scheduling-lifecycle`; nothing staged
- Known `.codex/config.toml.broken-*` backups are ignored and remain untouched
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
- Build command: Netlify invokes Convex deployment and then `npm run build` against the selected deployment URL
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`
- Verified Netlify site: `elevate-commerce-1-1-scheduler`, site ID `5dc7fddc-90db-4983-9bb9-ec5259f2f6c6`
- Verified Netlify URL: `https://elevate-commerce-1-1-scheduler.netlify.app`
- Production branch: `main`
- Release assumption: `main` is production-impacting
- Safe Release Push Mode note: pushing `main` may trigger production deploy; feature branch preview deploys are not available because the Netlify allowed branches list includes only `main`
- Netlify production context has `CONVEX_DEPLOY_KEY` present by key-name probe only; the value was not printed, opened, copied, or retained
- Convex local CLI user login remains anonymous/unavailable, so local direct Convex deploy dry-run is blocked; Netlify production deploy can use its configured key
- Netlify preview deployments may run `crm:ensureSeedData` through `--preview-run` when branch deploys are available; branch deploys are currently unavailable because only `main` is allowed
- Browser automatic seeding is guarded by `import.meta.env.DEV`, so production and preview browser bundles do not auto-seed

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

## Scheduling And Notes Capabilities

- Sessions support validated add, view, edit, complete, cancel, postpone, and guarded permanent deletion.
- Completion updates the session and optional linked completion note atomically.
- Sessions with linked notes cannot be permanently deleted or reassigned to another student.
- General and session notes support add, view, edit, and delete workflows.
- Archived sessions are retained as history and are read-only.
- Upcoming lists exclude past scheduled sessions while history remains available.

## External Calendar Scope

- Google Calendar and ICS work was intentionally removed from the release candidate at Yasir's request.
- The current source has no external-calendar export, event-link, file-download, OAuth, or synchronization implementation.
- Internal scheduling input and display continue to use the browser/device timezone.

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

- Keep the scheduling work on `codex/scheduling-lifecycle` until release readiness is established.
- Browser/cloud verification remains blocked until a real deployed production candidate is created and checked; branch preview QA is unavailable because Netlify allows only `main`.
- Local static checks passed: lint, isolated production build/typecheck, static route checks, stale-source scan, and `git diff --check`.
- Netlify CLI is logged in and this folder is linked to the existing production site. The production Convex deploy key exists in Netlify by name-only verification.
- Local direct Convex deploy dry-run remains blocked because the Convex CLI login is anonymous/unavailable in this checkout; production deployment should run through Netlify using its configured key.
- Treat authentication, schema/index work, and business-timezone persistence as separate high-risk phases.
- No commit, push, merge, production-data access, or deployment has occurred for this release candidate.
- First future task should start with CEO reading the operating-system files, checking git status, classifying risk, and routing work.
- Main Codex chat should remain the command center and spawn/use `yasir-ceo` first.
- Do not push/release unless Yasir gives clear push/release approval and Safe Release Push Mode gates pass.
- Once Yasir gives clear push/release approval, do not ask separate approval questions for commit, push, merge, or deployment actions that are part of the normal safe release path.
- If Netlify status cannot be checked during release, report `deployment verification blocked: Netlify access/status unavailable`.
