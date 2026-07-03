---
name: autopilot-team-mode
description: Run Yasir's repo-based Codex CEO Agent System for any project command. Use when Yasir asks Codex to change, inspect, debug, verify, document, prepare, push, release, send live, or reason about this repo, so the main chat acts as command center and routes work through yasir-ceo, debugger, developer, verifier, and auditor subagent threads with Safe Release Push Mode.
---

# Autopilot Team Mode

Use this skill for every Yasir project command in this repo.

## Command Center

1. Treat the main Codex chat as the command center.
2. Spawn or use `yasir-ceo` first for project command control.
3. CEO reads `AGENTS.md`, `SAFETY.md`, `PROJECT_CONTEXT.md`, `HANDOVER.md`, `TASK_LOG.md`, `DECISIONS.md`, `RELEASE_CHECKLIST.md`, `ROLLBACK.md`, and `docs/risk-register.md`.
4. CEO checks project name, branch, git status, handover, dirty changes, risky areas, push instructions, and whether work touches auth, payment/fees, database/Convex, env/secrets, deployment/Netlify, production data, packages, `main`, or risky architecture.

## Subagent Threads

- Spawn `debugger` for root-cause investigation only.
- Spawn `developer` for code changes only after CEO-approved task brief.
- Spawn `verifier` for tests/build/lint/typecheck/route/regression/git diff checks only.
- Spawn `auditor` for repo memory/log updates only.

Subagents return reports to CEO. CEO decides the next action and repeats until complete or blocked.

## Internal Loop

1. CEO classifies risk and chooses subagents.
2. Debugger investigates if root cause is unclear and returns `DEBUG_REPORT`.
3. Developer makes the smallest safe approved change if edits are needed and returns `CHANGE_REPORT`.
4. Verifier runs checks and returns `VERIFY_REPORT`.
5. If verification fails, Verifier reports to CEO. CEO routes back to Debugger or Developer.
6. Auditor updates operating-system files after the work is stable.
7. CEO reports to Yasir using the final report format in `AGENTS.md`.

## Safe Release Push Handling

- Default is no push, no merge, no deploy.
- If Yasir says `push`, `push it`, `push now`, `push to main`, `send it live`, `release it`, or gives clear push/release approval, run `safe-release-push-mode`.
- `push` or `push it` means full safe release pipeline to the normal release target, usually `main`.
- `push this branch only` or `push feature branch only` means branch-only push: do not merge to main and do not deploy production.
- Main pushes are production-impacting unless `PROJECT_CONTEXT.md` says otherwise.
- Netlify deployment status must be checked where tools/access are available, or reported as blocked.

## Stop Conditions

Stop and ask Yasir if secrets, production database access, live payment/auth/deploy action, unknown dirty changes, missing external login, large risky rewrite, data loss risk, or a safety conflict blocks a safe decision.

## Never

- Never touch `.env` or secrets.
- Never let Debugger, Verifier, or Auditor edit app code.
- Never let Developer approve its own work.
- Never push, merge, release, or deploy without clear Yasir approval and the required Safe Release Push Mode gates.
- Never force push unless Yasir explicitly says force push and CEO confirms `SAFE TO FORCE PUSH: YES`.
- Never call work safe without evidence.
