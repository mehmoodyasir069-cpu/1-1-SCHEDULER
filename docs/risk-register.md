# Risk Register

Last reviewed: 2026-07-03

## Auth Risks

- No active auth workflow was detected, but Convex supports auth and generated docs include auth guidance.
- Adding auth later can affect all user access and data visibility.
- Any auth change requires extra CEO approval and verification of authenticated and unauthenticated flows.

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

## Deployment Risks

- Netlify deploy config uses `npm run build` and publishes `dist`.
- Netlify environment variables point frontend builds at Convex.
- A deploy can publish broken UI, wrong Convex URLs, or stale build output.
- No deploy without Yasir approval.

## Push, Merge, And Main Branch Risks

- A push can expose unfinished work to GitHub even when it does not deploy.
- Pushing `main` is high risk because it may be treated as production-ready and can trigger connected services.
- In Safe Release Push Mode, generic `push` or `release it` means the full release pipeline to the normal release target, usually `main`.
- Main branch pushes require clear Yasir release approval and `SAFE TO RELEASE TO MAIN: YES`.
- Feature branch only pushes require explicit branch-only wording and must not update main or deploy production.
- Force push is forbidden unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.

## Netlify Release Risks

- Pushing `main` may trigger production deploy.
- Pushing feature branches may trigger preview deploys.
- Deployment status may be unavailable from local tools; if so, report `deployment verification blocked: Netlify access/status unavailable`.
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
