# Elevate Commerce - 1-1 Mentorship CRM

A polished local-first CRM for student scheduling, session logging, fee tracking, and backups.

## What is wired up

- Convex database and backend functions
- Seeded student records, scheduled sessions, and fee accounts
- Dashboard, students, calendar, session log, fees tracker, and backup export
- Netlify SPA config with `index.html` fallback

## Local development

```bash
npm install
npm run dev
```

Local development requires a Convex development deployment configured through
the normal Convex CLI workflow. Keep deployment credentials and generated
environment values out of source control.

## Build

```bash
npm run build
```

## Netlify

The Netlify build runs the Convex deployment first and runs `npm run build`
against the backend URL returned by Convex. Configure these variable names
directly in Netlify:

- `CONVEX_DEPLOY_KEY`
- `VITE_CONVEX_URL`

Use a production `CONVEX_DEPLOY_KEY` only in Netlify's Production context. Use
a preview deploy key in the Deploy Preview and branch-deploy contexts. Configure
the keys directly in those Netlify contexts; never commit their values.

The release pipeline is:

1. Netlify invokes `npx convex deploy` from `netlify.toml`.
2. Convex deploys backend functions for the selected Netlify context.
3. Convex runs `npm run build` with `VITE_CONVEX_URL` set for that deployment.
4. Netlify publishes `dist/` and applies the SPA route fallback.

Preview builds may run `crm:ensureSeedData` through the configured preview
deployment. Production builds do not run the preview seed command, and the
browser only attempts automatic seeding in development mode.

## Data safety

- Student, session, and fee data live in Convex, not local storage.
- The backup tab exports a JSON snapshot of the live data.
- The seed mutation is idempotent, so it will not duplicate the current eight students.
