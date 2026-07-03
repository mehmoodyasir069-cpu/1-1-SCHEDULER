---
name: safe-release-push-mode
description: Run the full safe release pipeline when Yasir says push, push it, push now, push to main, send it live, release it, or gives clear push/release approval. Verifies checks, risks, branch path, Netlify deployment risk/status, and SAFE TO RELEASE/PUSH gates before committing, pushing, updating main, or allowing deployment.
---

# Safe Release Push Mode

Use this skill when Yasir gives clear push or release approval.

## Triggers

- `push`
- `push it`
- `push now`
- `push to main`
- `send it live`
- `release it`
- any clear push/release approval

Do not treat these as a simple `git push`. Treat them as one full safe release command.

That command is already Yasir's approval for commit, push, merge/update main, and deployment actions that belong to the normal safe release path. Do not ask separate approval questions after the required gates pass.

## Pipeline

1. CEO starts first and reads required OS files.
2. CEO checks project, branch, git status, handover, risks, and requested target.
3. Verifier runs required checks:
   - git status
   - git diff
   - lint where available
   - tests where available
   - build where available
   - typecheck where available
   - route/preview checks where available
   - risky file review
4. If checks fail, Verifier reports to CEO.
5. CEO sends failed work to Debugger or Developer if the fix is safe.
6. Developer is the only role allowed to change code.
7. Verifier checks again.
8. Auditor updates logs, handover, decisions, and release checklist.
9. CEO decides `SAFE TO RELEASE: YES/NO` and `SAFE TO RELEASE/PUSH: YES/NO`.
10. If `YES`, Codex may perform only the approved release actions without asking Yasir separate commit, push, merge, or deploy questions.
11. If `NO`, Codex must not commit, push, merge, update main, or deploy; it stops and reports why.

## Default Meaning

- `push` or `push it` means full safe release pipeline to the normal release target, usually `main`.
- If currently on a feature branch and `main` is production, update `main` only after `SAFE TO RELEASE TO MAIN: YES`.
- If currently on `main`, push `main` only after `SAFE TO RELEASE TO MAIN: YES`.
- If project docs say feature branches create previews only, follow those documented rules.

## Branch-Only Requests

If Yasir says `push this branch only` or `push feature branch only`:

- push only that branch
- do not merge to main
- do not deploy production
- still run verification and risk checks

If Yasir names a branch, CEO verifies the requested branch before pushing.

## Allowed Actions After CEO Approval

- commit completed work if needed
- push current branch
- merge/rebase/update main if required by the release path
- push main
- allow connected deployment such as Netlify to trigger
- check/report deployment status if tools/access are available

If Yasir says `do not deploy`, do not allow deployment actions even if commit, push, or merge are otherwise safe.

## Never Bypass

- failed tests
- failed build
- unsafe auth/payment/database/env/deploy risk
- secrets or `.env` protection
- dirty unknown user changes
- branch protection
- remote rejection
- missing external login/auth
- data-loss risk

Never force push unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.

## Gates

Write these gates in the CEO report:

- `SAFE TO PUSH CURRENT BRANCH: YES/NO`
- `SAFE TO RELEASE TO MAIN: YES/NO`
- `SAFE TO DEPLOY VIA NETLIFY: YES/NO`
- `SAFE TO FORCE PUSH: YES/NO`
- `SAFE TO RELEASE: YES/NO`
- `SAFE TO RELEASE/PUSH: YES/NO`

If any required gate is `NO`, do not push, merge, update main, or deploy. Explain the blocker and next safe fix.

Do not ask Yasir to approve bypassing failed tests, failed build, branch protection, secrets protection, dirty unknown user changes, unsafe auth/payment/database/deploy risk, missing login/auth, remote rejection, or data-loss risk.

## Netlify

- Pushing main may trigger production deploy.
- Pushing feature branches may trigger preview deploys.
- Treat main pushes as production-impacting unless `PROJECT_CONTEXT.md` says otherwise.
- If Netlify status cannot be checked, report `deployment verification blocked: Netlify access/status unavailable`.

## Final Report Fields

Include project name, branch before release, branch pushed, whether main was updated, whether Netlify deploy was triggered, deployment status if checkable, commit hash, commands used, checks/results, files changed, risky areas touched, gates, rollback plan, current project state, and next step.
