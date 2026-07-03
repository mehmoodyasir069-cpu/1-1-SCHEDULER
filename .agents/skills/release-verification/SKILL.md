---
name: release-verification
description: Verify this repo before any CEO recommendation to release, push, merge, create a PR, or deploy. Use when Yasir asks whether work is safe, asks for release readiness, asks to push/send live/release/deploy, or when changes are finished and need lint/build/typecheck/diff/risk review plus Safe Release Push Mode gates.
---

# Release Verification

Use this skill before any release recommendation, Safe Release Push Mode decision, or branch-only push decision.

## Required Review

1. Check branch with `git status --short --branch`.
2. Review `git diff` and changed file list.
3. Run relevant checks:
   - `npm run lint`
   - `npm run build`
   - no dedicated `npm test` script is currently detected, so document the test gap unless one is added.
4. If a preview/local route check is needed, use `npm run dev` or `npm run preview` and verify affected routes.

## Risk Review

Record yes/no for:

- Auth touched
- Payments/fees touched
- Database/Convex touched
- Env/secrets touched
- Deployment/Netlify touched
- Production data touched
- Main branch touched
- Push instruction detected
- Release command detected
- Clear push/release approval already given
- Requested push target
- Netlify deploy risk
- Deployment status if checkable

## Safe Release Gate Review

If Yasir requested push/release, write the relevant gates:

- `SAFE TO PUSH CURRENT BRANCH: YES/NO`
- `SAFE TO RELEASE TO MAIN: YES/NO`
- `SAFE TO DEPLOY VIA NETLIFY: YES/NO`
- `SAFE TO FORCE PUSH: YES/NO`
- `SAFE TO RELEASE: YES/NO`
- `SAFE TO RELEASE/PUSH: YES/NO`

Set the relevant gate to `YES` only when branch, target, diff, risk review, available checks, verifier report, secrets/env safety, current build state, deployment risk/status, and rollback plan are acceptable.

## Failure Handling

- If checks fail, report to CEO, not Yasir.
- CEO decides whether Debugger investigates or Developer fixes.
- Do not approve release or push while tests/build fail, or while lint/typecheck failures are unresolved unless CEO documents a narrow exception and the required release gates remain safe.

## Release Boundary

- Default is no push, merge, release, or deploy.
- Generic `push` or `push it` runs the full safe release pipeline to the normal release target, usually `main`.
- When a clear push/release command exists and gates pass, do not ask Yasir separate approval to commit, push, merge, update main, or deploy.
- `push this branch only` or `push feature branch only` limits action to that branch.
- Main pushes may trigger Netlify production deploy and require `SAFE TO RELEASE TO MAIN: YES` and `SAFE TO DEPLOY VIA NETLIFY: YES` when Netlify is in the release path.
