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
