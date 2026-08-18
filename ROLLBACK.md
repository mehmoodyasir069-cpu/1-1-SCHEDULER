# Rollback Guide

This guide is for planning safe rollback. Do not run destructive commands unless Yasir explicitly approves.

## Identify Last Safe Commit

1. Check current state:
   ```bash
   git status --short --branch
   git log --oneline --decorate -10
   ```
2. Identify the last known safe commit from:
   - last successful build/check report
   - Netlify deploy history
   - GitHub commit history
   - `TASK_LOG.md` and `HANDOVER.md`
3. Record the commit hash and why it is considered safe before any rollback action.

## Revert Local Uncommitted Changes

Do not discard local changes automatically. First inspect:

```bash
git status --short
git diff
```

If changes belong to Yasir or are unknown, stop and ask Yasir. Do not use destructive commands like `git reset --hard` or `git checkout --` unless Yasir clearly approves that exact action.

## Revert A Commit Safely

Prefer a non-destructive revert commit:

```bash
git revert <commit-sha>
```

Then run verification before recommending push:

```bash
npm run lint
npm run build
```

If the repo has no test script, document that gap.

## Production Rollback Reminder

- Netlify production rollback must be approved by Yasir.
- Convex production data rollback or migration must be approved by Yasir.
- Never mutate production data as part of rollback unless Yasir approves the exact operation and recovery path.
- Document the rollback plan in `DECISIONS.md`, `TASK_LOG.md`, and `HANDOVER.md`.

## Scheduling Lifecycle Feature Rollback

Scope on `codex/scheduling-lifecycle`:

- `src/App.tsx`
- `convex/crm.ts`
- `src/lib/crm-data.ts`
- `netlify.toml`
- `README.md`
- `.gitignore`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- `PROJECT_CONTEXT.md`, `HANDOVER.md`, `TASK_LOG.md`, `DECISIONS.md`, `RELEASE_CHECKLIST.md`, `ROLLBACK.md`, and `docs/risk-register.md`

Google Calendar and ICS work was intentionally removed and there is no calendar helper file to restore or roll back. Before a feature commit, inspect the complete diff and reverse only confirmed release-candidate files. Do not include the ignored `.codex/config.toml.broken-*` backups or unrelated user work. Avoid broad restore/reset commands; confirm exact file ownership and use a targeted patch or another recoverable method.

After the feature is committed, prefer:

```bash
git revert <commit>
```

Then rerun `npm run lint`, an isolated production `npm run build`, focused scheduling checks, and `git diff --check`. If the feature is later deployed, Yasir approval and deployment verification are required before production rollback actions. No schema migration or production-data rollback is expected because neither has been performed.

## After A Safe Release Push

If Yasir gave clear push/release approval and Safe Release Push Mode gates passed:

1. Record the pushed branch and command used.
2. Record the commit hash pushed.
3. Record whether `main` was updated.
4. Confirm whether the push triggered Netlify preview or production deployment.
5. Record deployment status, or record `deployment verification blocked: Netlify access/status unavailable`.
4. If a pushed commit must be undone, prefer a revert commit over rewriting history:
   ```bash
   git revert <commit-sha>
   ```
6. Do not force-push or rewrite public history unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.

Do not ask Yasir separate approval questions for commit, push, merge, or deploy actions that are part of the approved safe release path. If rollback is needed after release, report the rollback path and wait for Yasir approval before destructive or production-impacting rollback actions.

## Netlify Rollback Reminder

- If a release triggered Netlify production deploy, rollback may require Netlify access or a new revert commit.
- If Netlify status cannot be checked, report that clearly and do not pretend deployment verification passed.
