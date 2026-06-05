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

The app is linked to the isolated Convex deployment created for this repo:

- Project: `1-1-scheduler-1abee`
- Deployment: `watchful-buffalo-826`
- Cloud URL: `https://watchful-buffalo-826.eu-west-1.convex.cloud`

## Build

```bash
npm run build
```

## Netlify

Set these environment variables in Netlify:

- `VITE_CONVEX_URL=https://watchful-buffalo-826.eu-west-1.convex.cloud`
- `VITE_CONVEX_SITE_URL=https://watchful-buffalo-826.eu-west-1.convex.site`

The repo already includes `netlify.toml` so Netlify can publish `dist/` and route all paths to `index.html`.

## Data safety

- Student, session, and fee data live in Convex, not local storage.
- The backup tab exports a JSON snapshot of the live data.
- The seed mutation is idempotent, so it will not duplicate the current eight students.
