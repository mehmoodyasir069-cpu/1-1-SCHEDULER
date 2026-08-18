# Release Checklist

Use this checklist before CEO recommends push, merge, PR, release, or deploy. Yasir push/release approval triggers Safe Release Push Mode, not a simple `git push`.

## Required Checks

- [ ] Branch checked.
- [ ] Git status checked.
- [ ] Diff reviewed.
- [ ] Lint run or documented as not applicable.
- [ ] Tests run or documented as unavailable/not applicable.
- [ ] Build run or documented as not applicable.
- [ ] Typecheck run or documented as covered by lint/build.
- [ ] Preview/local route checked if available.
- [ ] Auth risk checked.
- [ ] Payment/fee risk checked.
- [ ] Database/Convex risk checked.
- [ ] Env/secrets risk checked.
- [ ] Deployment/Netlify risk checked.
- [ ] Production data risk checked.
- [ ] Push instruction checked.
- [ ] Release command checked.
- [ ] Single push/release command treated as full pipeline approval.
- [ ] No repeated approval questions needed after valid push/release command.
- [ ] Requested push target identified.
- [ ] Normal release target identified.
- [ ] Correct safe release gates written.
- [ ] Netlify production/preview deploy risk checked.
- [ ] Deployment status checked or documented as blocked.
- [ ] Merge/rebase/update-main requirement checked.
- [ ] Force-push risk checked.
- [ ] Rollback plan written.
- [ ] CEO final decision written.
- [ ] If no push/release command was given, Yasir approval requested before release actions.

## Repo-Specific Commands

- Lint/typecheck: `npm run lint`
- Build/typecheck: `npm run build`
- Local dev: `npm run dev`
- Preview built app: `npm run preview`
- Tests: no `test` script detected in `package.json`

## Scheduling Lifecycle Verification - 2026-08-18

This records feature verification only. It is not a release approval, and the feature must not be marked released.

- [x] Branch confirmed as `codex/scheduling-lifecycle`.
- [x] Git status checked; scheduling, release-preparation, Codex configuration, and repo-memory changes are uncommitted and nothing is staged.
- [x] Known `.codex/config.toml.broken-*` backups remain ignored and untouched.
- [x] Complete feature and `origin/main` release delta reviewed.
- [x] `npm run lint` passed.
- [x] Isolated production `npm run build` passed; typecheck covered by lint/build.
- [x] Focused date, duration, overlap, lifecycle, linked-note, and legacy-mutation review passed.
- [x] Static Schedule, Session Log, Student Profile, internal calendar, and responsive review passed.
- [x] Google Calendar and ICS work confirmed intentionally removed; no external-calendar implementation remains.
- [x] `git diff --check` passed.
- [x] No schema, generated API, package, lockfile, env-value, payment-calculation, auth, or production-data changes found.
- [x] Browser automatic seeding confirmed development-only.
- [x] Netlify preview seeding is configured through `--preview-run`; production browser auto-seeding is disabled.
- [x] Dedicated automated test script documented as unavailable.
- [x] `codex-cli 0.142.5` successfully loads the repo agent configuration with `[agents] max_threads = 5`.
- [x] Netlify CLI login and local folder linkage verified for site `elevate-commerce-1-1-scheduler`, site ID `5dc7fddc-90db-4983-9bb9-ec5259f2f6c6`.
- [x] Netlify production branch verified as `main`.
- [x] Netlify production `CONVEX_DEPLOY_KEY` presence verified by key-name-only probe; no value was printed, opened, copied, or retained.
- [x] Branch-preview deploy availability checked; unavailable because the Netlify allowed branches list includes only `main`.
- [ ] Browser/live Convex testing completed. Pending until a deployed production candidate exists.
- [ ] Convex cloud deploy dry-run passed. Local direct dry-run remains blocked because the Convex CLI user login is anonymous/unavailable; Netlify production deploy can use its configured key.
- [ ] Netlify production deployment status verified for this release candidate. Pending because no commit, push, or deploy has occurred.
- [ ] Production behavior verified.
- [x] Push/release approval received from Yasir.
- [ ] Released or deployed.

Current release judgment: local static verification, Codex configuration compatibility, Netlify folder linkage, production branch, and production Convex key-name presence passed. Local direct Convex dry-run remains blocked by anonymous/unavailable Convex CLI login, branch-preview QA is unavailable because only `main` is allowed, and production deploy/browser verification is pending. Nothing has been committed, pushed, merged, deployed, or run against production data.

## Risk Review Template

```markdown
- Auth touched: yes/no
- Payments touched: yes/no
- Database touched: yes/no
- Env/secrets touched: yes/no
- Deployment touched: yes/no
- Production data touched: yes/no
- Main branch touched: yes/no
- Push instruction detected: yes/no
- Release command detected: yes/no
- Clear release approval already given: yes/no
- Separate approval questions needed: yes/no
- Requested push target:
- SAFE TO PUSH CURRENT BRANCH: YES/NO
- SAFE TO RELEASE TO MAIN: YES/NO
- SAFE TO DEPLOY VIA NETLIFY: YES/NO
- SAFE TO FORCE PUSH: YES/NO
- SAFE TO RELEASE: YES/NO
- SAFE TO RELEASE/PUSH: YES/NO
```

## CEO Final Decision Template

```markdown
- Safe to push current branch: YES/NO
- Safe to release to main: YES/NO
- Safe to deploy via Netlify: YES/NO
- Safe to force push: YES/NO
- Safe to release: YES/NO
- Safe to release/push: YES/NO
- Safe to merge: YES/NO
- Safe to deploy: YES/NO
- Reason:
- Evidence:
- Remaining risk:
- Release approval source:
```

## Release Action Template

```markdown
- pushed: YES/NO
- branch pushed:
- main updated: YES/NO
- Netlify deploy triggered: YES/NO/UNKNOWN
- deployment status:
- commit hash:
- command used:
- reason:
```
