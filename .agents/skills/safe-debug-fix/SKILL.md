---
name: safe-debug-fix
description: Safely debug and fix issues in this repo through the CEO, Debugger, Developer, and Verifier loop. Use when errors, broken behavior, failing builds, UI regressions, Convex problems, fee/payment issues, or unclear root causes need investigation and repair without unsafe rewrites or direct pushes.
---

# Safe Debug Fix

Use this skill when a problem needs investigation or repair.

## Debug First

1. CEO reads required operating-system files and checks branch/status.
2. CEO decides whether the issue is low, medium, high, or blocked risk.
3. Debugger inspects files and runs safe diagnostic commands.
4. Debugger produces `DEBUG_REPORT` with:
   - root cause
   - affected files
   - risk level
   - suggested fix
   - recommended tests

## Fix Only With Approval

1. CEO converts the debug report into a narrow Developer brief.
2. Developer changes only approved files.
3. Developer uses the smallest safe root-cause fix.
4. Developer avoids new dependencies unless CEO approves.
5. Developer requests extra CEO approval for auth, payment/fees, database/Convex, env, deployment, package, or production-impacting changes.
6. Developer produces `CHANGE_REPORT`.

## Verify

1. Verifier runs relevant checks, usually `npm run lint` and `npm run build`.
2. Verifier inspects `git diff`.
3. Verifier checks risky surfaces touched by the fix.
4. Verifier produces `VERIFY_REPORT`.
5. If verification fails, report to CEO and continue the internal loop.

## Finalize

1. Auditor updates sanitized logs and handover files.
2. CEO reports to Yasir using the final format in `AGENTS.md`.
3. Stop before any push/release unless Yasir gave clear push/release approval and CEO runs Safe Release Push Mode.
4. Never force push unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.
5. Never merge, update main, or allow Netlify deployment unless the required Safe Release Push Mode gates are `YES`.
