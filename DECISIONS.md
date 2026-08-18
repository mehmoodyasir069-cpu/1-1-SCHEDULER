# Decisions

Use this file for sanitized CEO decisions. Do not include secrets, raw private transcripts, or `.env` values.

## Decision Log Format

```markdown
## YYYY-MM-DD - Short Decision Title

- Decision owner: Yasir CEO Agent
- Decision type: approve / reject / block / route / defer
- Task:
- Context:
- Risk level: low / medium / high / blocked
- Evidence reviewed:
  - branch:
  - git status:
  - files/diff:
  - checks:
- Decision:
- Reason:
- Required follow-up:
```

## CEO Approval Format

```markdown
## YYYY-MM-DD - CEO Approval

- Approved work:
- Approved agent:
- Allowed files:
- Explicitly forbidden files/actions:
- Extra approvals required:
- Evidence required before final recommendation:
```

## CEO Rejection Format

```markdown
## YYYY-MM-DD - CEO Rejection

- Rejected work:
- Reason:
- Evidence:
- Safe alternative:
- Next step:
```

## CEO Block Format

```markdown
## YYYY-MM-DD - CEO Block

- Blocked work:
- Blocking condition:
- Evidence:
- Required Yasir input:
- Risk if bypassed:
```

## Reason And Evidence Rules

- Every approval, rejection, block, or route must cite evidence.
- Evidence can include file paths, diff summaries, command results, test/build output, or documented risk.
- CEO must not say a change is safe without verification or a clearly documented reason.
- If verification is not run, record why and what risk remains.

## 2026-07-03 - Repo-Based CEO Agent System Setup

- Decision owner: Yasir CEO Agent
- Decision type: approve setup / block app changes
- Task: Create the Yasir CEO Agent System operating-system files.
- Context: Yasir requested docs/config/skills only and explicitly forbade app code changes, commits, pushes, merges, deploys, and env/secrets edits.
- Risk level: low for docs/config setup; high if app, env, database, or deployment files were touched.
- Evidence reviewed:
  - branch: `main`
  - git status before setup: clean tracking `origin/main`
  - package manager: npm
  - stack: React, TypeScript, Vite, Convex, Netlify
  - risky areas: Convex database, fee/payment tracking, Netlify deployment, env variables
- Decision: Create only the requested repo operating-system files.
- Reason: This matches Yasir's hard rules and provides Git-tracked PC/Mac process memory.
- Required follow-up: Review final setup report and do not push without Yasir approval.

## 2026-07-03 - Subagent Threads And Push Safety Gates

- Decision owner: Yasir CEO Agent
- Decision type: approve setup / block push
- Task: Update the Yasir CEO Agent System to use true Codex subagent-thread workflow and explicit push gates.
- Context: Yasir requested operating-system files only and explicitly said not to change application code, push, merge, or deploy during this rule update.
- Risk level: low for docs/config setup; high for any accidental app, env, database, deploy, or push action.
- Evidence reviewed:
  - branch: `main`
  - git status: existing uncommitted operating-system files only
  - requested update: subagent thread workflow, role permissions, push meanings, safe-to-push gates, merge/deploy separation, final report format
- Decision: Update only the Yasir CEO Agent System files and add `.agents/skills/push-safety-gate/SKILL.md`.
- Reason: The repo needs a durable command-center workflow and a safe explicit-push exception without weakening no-merge/no-deploy defaults.
- Required follow-up: Verify the rule update and do not push unless Yasir explicitly asks and the relevant gate passes.

## 2026-07-03 - Push Request Blocked By Safety Gate

- Decision owner: Yasir CEO Agent
- Decision type: block
- Task: Yasir said `push`.
- Context: Current branch is `main`, tracking `origin/main`. Current changes are uncommitted operating-system files only. App code is not modified.
- Risk level: high for direct `main` push because `npm run lint` fails and Netlify may deploy from `main`.
- Evidence reviewed:
  - branch: `main`
  - git status: untracked OS files only
  - push target: current branch upstream, `origin/main`
  - `npm run lint`: failed with existing `src/App.tsx` ESLint errors
  - `npm run build`: passed
  - verifier subagent push gate under previous policy: unsafe to push current branch or main
  - deployment risk: `netlify.toml` exists and pushing `main` may trigger Netlify behavior
- Decision: Do not commit or push.
- Reason: Required push safety gate failed. A push to `main` with failing lint and possible deployment side effect is not safe without either fixing lint or Yasir explicitly accepting the documented exception and deployment risk.
- Required follow-up: Fix the lint errors, push a feature branch instead, or get explicit Yasir approval for the documented exception and target.

## 2026-07-03 - Safe Release Push Mode

- Decision owner: Yasir CEO Agent
- Decision type: approve setup / block release action
- Task: Update Autopilot Team Mode so clear push/release approval runs a full safe release pipeline.
- Context: Yasir requested OS-file updates only and explicitly said not to change application code, push, merge, or deploy during this rule update.
- Risk level: low for docs/config setup; high for future release actions involving `main`, Netlify, failing checks, force push, auth, payments, database, env, deployment, or data loss.
- Evidence reviewed:
  - branch: `main`
  - git status: existing uncommitted operating-system files only
  - deployment context: Netlify config exists, so main push may be production-impacting
  - requested rule: `push` and release-like wording means full safe release pipeline
- Decision: Add Safe Release Push Mode and `.agents/skills/safe-release-push-mode/SKILL.md`.
- Reason: The previous push-only gate was too narrow for Netlify-connected release behavior.
- Procedural incident: Verifier subagent accidentally invoked a no-op `git push` while scanning. Git reported no changes to push. Local `HEAD`, `origin/main`, and remote `main` remained `30f234263e6e69b52ee2b6ded77571506943f11a`; no commit, merge, or deploy occurred.
- Required follow-up: Await Yasir's separate release/push instruction and run Safe Release Push Mode.

## 2026-07-03 - Push Is Full Pipeline Approval

- Decision owner: Yasir CEO Agent
- Decision type: approve setup / no release action
- Task: Make `push` simple again so Yasir does not need to approve commit, push, merge, and deploy separately.
- Context: Yasir requested OS-file updates only and explicitly said not to change app code, push, or deploy during this rule update.
- Risk level: low for docs/config setup; high for future release actions with failing checks, main/Netlify release, force push, secrets, dirty unknown user changes, or unsafe auth/payment/database/deploy risk.
- Evidence reviewed:
  - branch: `main`, ahead of `origin/main` by one existing CEO-agent-system commit
  - dirty state before update: untracked `.codex/config.toml.broken-*` backup files only
  - requested rule: clear push/release approval means full safe release pipeline with no repeated approval questions
- Decision: Update operating-system files so `push` runs the internal safe release pipeline; do not ask separate commit/push/merge/deploy approval after `SAFE TO RELEASE: YES`.
- Reason: Yasir's push command should authorize the normal release path while safety gates still block unsafe releases.
- Required follow-up: Validate wording and await future push/release command.

## 2026-08-18 - Scheduling Lifecycle Release Preparation

- Decision owner: Yasir CEO Agent
- Decision type: approve local work / block release
- Task: Complete scheduling and session-note workflows, remove external-calendar work, verify, and deploy when safe.
- Context: The scheduling lifecycle was hardened locally. Yasir then directed removal of Google Calendar and ICS work. Release preparation added a coordinated Convex/Netlify build path and disabled production browser auto-seeding.
- Risk level: medium for local lifecycle changes; high and pending for production Convex and Netlify deployment.
- Evidence reviewed:
  - branch: `codex/scheduling-lifecycle`
  - git status: uncommitted scheduling, release-preparation, Codex configuration, and repo-memory changes; nothing staged; known ignored backups untouched
  - files/diff: current implementation is `src/App.tsx`, `convex/crm.ts`, and `src/lib/crm-data.ts`; release preparation also changes `netlify.toml`, `README.md`, `.gitignore`, `.codex/config.toml`, and `.codex/agents/*.toml`
  - checks: lint, isolated production build/typecheck, static route check, static lifecycle review, stale-source scan, and `git diff --check` passed
  - deployment context: Netlify CLI is logged in and the folder is linked to site `elevate-commerce-1-1-scheduler`, site ID `5dc7fddc-90db-4983-9bb9-ec5259f2f6c6`, with production branch `main`
  - env/key evidence: `CONVEX_DEPLOY_KEY` is present in the Netlify production context by key-name-only probe; no value was printed, opened, copied, or retained
  - remaining blocker: local direct Convex deploy dry-run is blocked because the Convex CLI user login remains anonymous/unavailable; branch-preview deploy QA is unavailable because Netlify allows only `main`
- Decision: Approve the local scheduling lifecycle candidate and intentional removal of all Google Calendar and ICS functionality. Keep internal scheduling, completion, cancellation, postponement, history, and note protection. Continue release only through Safe Release Push Mode and the verified Netlify production path when gates pass.
- Reason: Static evidence supports the local implementation, and Netlify production linkage/key-name evidence is now verified. Production safety still requires commit/push/deploy and post-deploy status/browser verification.
- Required follow-up: Rerun release gates, commit/push/update `main` only if CEO marks required gates YES, let Netlify deploy using its configured production Convex key, then record deployment and browser evidence. No push, merge, production-data access, or deployment has occurred.
