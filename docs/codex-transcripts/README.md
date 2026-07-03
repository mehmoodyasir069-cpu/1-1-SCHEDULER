# Codex Transcript Summaries

Store sanitized summaries only. Do not commit raw transcripts, secrets, tokens, `.env` values, private customer data, or credential-bearing logs.

## Rules

- Summaries must be short and operational.
- Redact secrets and sensitive data.
- Include file paths and command names when useful.
- Do not paste raw terminal output if it contains private data.
- Do not store screenshots unless Yasir explicitly asks and they contain no secrets.

## Summary Template

```markdown
# YYYY-MM-DD - Short Task Title

- Date:
- Machine:
- Branch:
- Task:
- Agents used:
- Subagent threads used:
- Push instruction detected:
- Release command detected:
- Separate approval questions asked:
- Requested push target:
- Branch before release:
- Files changed:
- Errors found:
- Fixes made:
- Checks run:
- CEO decision:
- Push action:
- Main updated:
- Netlify deploy triggered:
- Deployment status:
- Commit hash:
- Next safe step:
```
