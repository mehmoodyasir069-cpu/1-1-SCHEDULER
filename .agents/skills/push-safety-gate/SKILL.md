---
name: push-safety-gate
description: Legacy branch-only push safety gate. Prefer safe-release-push-mode for generic push/release approval. Use this only when Yasir explicitly says push this branch only, push feature branch only, or names a non-main branch and clearly wants branch-only push without main merge or production deploy.
---

# Push Safety Gate

Use this skill only for branch-only push requests. Use `safe-release-push-mode` for `push`, `push it`, `push now`, `push to main`, `send it live`, or `release it`.

## Detect Push Target

- `push this branch`: current branch only.
- `push this branch only`: current branch only, no main update, no production deploy.
- `push feature branch only`: feature branch only, no main update, no production deploy.
- `push to feature branch` or named non-main branch: that branch only, after confirming current branch/target handling.

Branch-only push does not mean merge. Branch-only push does not mean production deploy.

## Required Gate Checks

Before any push, CEO must verify:

1. Correct project.
2. Correct branch.
3. Requested push target.
4. `git status --short --branch`.
5. `git diff` and changed files.
6. Risky files touched.
7. Secrets and `.env` not touched.
8. Auth/payment/database/env/deploy risk reviewed.
9. Lint run where available.
10. Tests run where available or documented missing.
11. Build run where available.
12. Typecheck run where available.
13. Verifier report passed or exception documented.
14. Current build not knowingly broken.
15. Rollback plan exists.

## Gates

Write all three gates in the CEO report:

- `SAFE TO PUSH CURRENT BRANCH: YES/NO`
- `SAFE TO RELEASE/PUSH: YES/NO`

Only the relevant gate can authorize its matching push.

## If Gate Is YES

- Push only the approved target branch.
- Report exact command used.
- Report final git status.
- Do not merge.
- Do not deploy production.

## If Gate Is NO

- Do not push.
- Explain why.
- Say what must be fixed first.
