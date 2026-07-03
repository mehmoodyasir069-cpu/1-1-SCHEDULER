# Handover

Last updated: 2026-07-03 03:10 BST

## Current Machine And Session

- Machine detected: `rajas-MacBook-Neo.local`
- OS detected: macOS Darwin arm64
- Session type: Codex desktop workspace
- Current branch: `main`
- Current git status before setup: clean, tracking `origin/main`
- Current commit before setup: `30f2342`

## Latest Setup Action

Yasir asked to fix Safe Release Push Mode so `push` is simple again: one clear push/release command means approval for the full safe release pipeline.

This update changed documentation, workflow, and agent configuration files only. It did not change app code, package files, `.env` files, Netlify deployment, Convex production data, commits, pushes, merges, or deploys.

Core behavior now documented:

- Main Codex chat is the command center.
- Spawn or use `yasir-ceo` first.
- Route work to `debugger`, `developer`, `verifier`, and `auditor` subagent threads as needed.
- `push`, `push it`, `push now`, `push to main`, `send it live`, `release it`, or clear push/release approval starts the full safe release pipeline.
- Codex must not ask separate follow-up approval questions for commit, push, merge, or deploy after a clear push/release command.
- Safe Release Push Mode may commit, push, update main, and allow Netlify deployment only after CEO gates pass.
- `push this branch only` or `push feature branch only` remains branch-only and must not merge to main or deploy production.
- Main pushes are production-impacting unless project context says otherwise.

## Files Created Or Updated

- `AGENTS.md`
- `SAFETY.md`
- `PROJECT_CONTEXT.md`
- `TASK_LOG.md`
- `HANDOVER.md`
- `DECISIONS.md`
- `RELEASE_CHECKLIST.md`
- `ROLLBACK.md`
- `docs/risk-register.md`
- `docs/codex-transcripts/README.md`
- `.codex/config.toml`
- `.codex/agents/yasir-ceo.toml`
- `.codex/agents/debugger.toml`
- `.codex/agents/developer.toml`
- `.codex/agents/verifier.toml`
- `.codex/agents/auditor.toml`
- `.agents/skills/autopilot-team-mode/SKILL.md`
- `.agents/skills/safe-debug-fix/SKILL.md`
- `.agents/skills/release-verification/SKILL.md`
- `.agents/skills/push-safety-gate/SKILL.md`
- `.agents/skills/safe-release-push-mode/SKILL.md`

## What Is Safe Next

- Review the created operating-system files.
- Keep app code untouched unless Yasir gives a new task and CEO opens Autopilot Team Mode.
- For future app work, create a feature/hotfix branch before modifying code.
- Run `npm run lint` and `npm run build` when app code or build config changes.
- For future push requests, run the push safety gate before any `git push`.
- For future release/push requests, run Safe Release Push Mode and record Netlify deployment status or why it is blocked.
- If `SAFE TO RELEASE: YES`, continue the release path without repeated approval questions.

## What Must Not Be Touched Without Explicit Yasir Approval

- `.env`, `.env.local`, secrets, tokens, and Netlify environment variables
- Live Convex data or production database
- Netlify deploys or production configuration
- Payment/fee calculation behavior
- Auth/access control behavior
- Main branch pushes, merges, or production deploys
- Any push/release unless Yasir gives clear push/release approval and CEO records the required Safe Release Push Mode gates as `YES`
