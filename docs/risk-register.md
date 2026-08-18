# Risk Register

Last reviewed: 2026-08-18

## Auth Risks

- No active auth workflow was detected, but Convex supports auth and generated docs include auth guidance.
- Adding auth later can affect all user access and data visibility.
- Any auth change requires extra CEO approval and verification of authenticated and unauthenticated flows.
- The scheduling app currently has no authentication or ownership boundary, so access to student and session data is not user-scoped.

## Payment And Fee Risks

- The app tracks fees, paid amounts, due amounts, payment dates, and payment reminders.
- Files of concern include `src/App.tsx`, `src/lib/crm-data.ts`, `convex/crm.ts`, and `convex/schema.ts`.
- A calculation bug can misstate student balances.
- Treat all payment/fee logic as financially sensitive even though no payment processor was detected.

## Database Risks

- Convex stores students, sessions, notes, and fees.
- Schema, query, mutation, seed, backup, export, and generated API changes can affect real data.
- Never run production mutations, migrations, deletes, seed resets, or bulk updates without Yasir approval.
- Local Convex state may differ from production Convex state.
- Linked-note protection currently performs full-table checks because no session-note index/schema change was approved. This may become slow as data grows.
- Postponement preserves history but has no durable predecessor/successor relationship in the schema, limiting chain tracing.

## Deployment Risks

- Netlify deploy config invokes Convex deployment, runs `npm run build` against the selected backend URL, and publishes `dist`.
- Netlify CLI is logged in and this folder is linked to site `elevate-commerce-1-1-scheduler`, site ID `5dc7fddc-90db-4983-9bb9-ec5259f2f6c6`; production branch is `main`.
- Netlify production context has `CONVEX_DEPLOY_KEY` present by key-name-only probe; no value was printed, opened, copied, or retained.
- Convex local direct deploy dry-run remains blocked because the local Convex CLI user login is anonymous/unavailable. Netlify production deploy can use its configured key.
- A deploy can publish broken UI, wrong Convex URLs, or stale build output.
- No deploy without Yasir approval.
- Browser automatic seeding is development-only. Netlify `--preview-run` may seed a preview deployment; production browser auto-seeding is disabled.
- Browser/live Convex verification remains pending until a production candidate is deployed and checked.

## Scheduling Timezone And External Calendar Scope

- Google Calendar and ICS work was intentionally removed; the release candidate has no external-calendar export or synchronization implementation.
- Session input and display use the browser/device timezone. Users in different timezones or across DST boundaries may see unexpected wall-clock times without a stored business timezone.

## Push, Merge, And Main Branch Risks

- A push can expose unfinished work to GitHub even when it does not deploy.
- Pushing `main` is high risk because it may be treated as production-ready and can trigger connected services.
- In Safe Release Push Mode, generic `push` or `release it` means the full release pipeline to the normal release target, usually `main`.
- One clear push/release command is approval for commit, push, update-main, and deployment actions that are part of the normal safe release path; do not ask repeated approval questions after gates pass.
- Main branch pushes require clear Yasir release approval and `SAFE TO RELEASE TO MAIN: YES`.
- Feature branch only pushes require explicit branch-only wording and must not update main or deploy production.
- Force push is forbidden unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.

## Netlify Release Risks

- Pushing `main` may trigger production deploy.
- Pushing feature branches does not currently provide preview deploy QA because the Netlify allowed branches list includes only `main`.
- Preview-only seeding depends on correctly isolated Netlify and Convex contexts; branch previews are unavailable unless Netlify branch-deploy settings change.
- Deployment status should be checked through the linked Netlify site after production deploy.
- Main pushes are production-impacting unless verified project docs say otherwise.

## Subagent Coordination Risks

- Subagents must stay inside their role boundaries.
- Developer is the only role allowed to edit code after CEO approval.
- Verifier and Debugger must not patch files.
- Auditor must not edit app code, package files, deployment config, auth, payment, database, or env files.
- Main chat must remain the command center so work does not fragment across uncontrolled threads.

## Environment And Secret Risks

- `.env*` files are ignored and must not be touched, printed, committed, or summarized.
- Netlify and Convex environment variables are production-impacting.
- If a secret or missing env value blocks work, stop and ask Yasir.

## UI Regression Risks

- Main UI logic is concentrated in `src/App.tsx`.
- Schedule, student profile, fees, and backup views share state and Convex mutations.
- UI regressions can hide data, mislabel sessions, or misreport fee status.
- Verify affected views locally when UI changes.

## Data Loss Risks

- Delete, backup, export, seed, and mutation logic can affect user data.
- Convex data is source of truth according to README.
- Never overwrite production data from local, seed, export, or demo data without explicit approval.
- Before risky data work, confirm backup/export and rollback plan.

## Package And Build Risks

- Dependency or lockfile changes can alter local, Netlify, or Convex behavior.
- `npm run lint` and `npm run build` are required after package/build/tooling changes.
- New dependencies require CEO approval.
