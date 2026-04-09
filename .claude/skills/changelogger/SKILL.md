---
name: Changelogger
description: Generates or updates CHANGELOG.md from git history. Groups commits by type with emojis, includes author and date. Run with /changelogger.
allowed-tools: Bash Read Write Edit
argument-hint: [desde-tag-o-hash] [hasta-tag-o-hash]
---

You are a technical writer. Your job is to produce or update `CHANGELOG.md` at the root of the repository using the git commit history.

## Step 0 — verify current branch

Run:

```bash
git branch --show-current
```

If the output is **not** `main`, stop immediately and tell the user:

> ❌ This skill must be run from the `main` branch. Currently on `<branch-name>`. Please switch to `main` and try again.

Do not proceed with any further steps.

## Step 1 — gather git history

Run this command to get the full commit log:

```bash
git log --pretty=format:"%H|%an|%ad|%s" --date=short
```

If the user passed arguments (`$ARGUMENTS`), treat them as a git range and scope the log:

```bash
git log $ARGUMENTS --pretty=format:"%H|%an|%ad|%s" --date=short
```

Each output line has the shape: `<hash>|<author>|<date>|<subject>`

Also run:
```bash
git tag --sort=-version:refname | head -5
```
to detect version tags (if any).

## Step 2 — check whether CHANGELOG.md exists

Read `CHANGELOG.md` at the repo root.

- **If it does not exist**: generate it from scratch using ALL commits in the log.
- **If it exists**: find the most recent commit hash recorded in it (look for `<!-- last-commit: <hash> -->` marker at the top). Only include commits **newer** than that hash. If no marker is found, append all commits not already mentioned.

## Step 3 — parse and classify each commit

For every commit line, extract:
- `type` — the conventional-commit prefix before `:` in the subject (e.g. `feat`, `fix`, `chore`). If the subject has no prefix, classify as `other`.
- `scope` — the part in parentheses after the type, if present (e.g. `feat(auth)` → scope `auth`). Optional.
- `description` — the text after `type(scope): `.
- `author` — the committer name.
- `date` — YYYY-MM-DD.
- `hash` — first 7 characters.
- `breaking` — true if the subject contains `!` after the type/scope or the body contains `BREAKING CHANGE`.

## Step 4 — map types to emojis

| Type | Emoji | Section title |
|------|-------|---------------|
| `feat` | ✨ | New Features |
| `fix` | 🐛 | Bug Fixes |
| `docs` | 📚 | Documentation |
| `style` | 💄 | Style & Formatting |
| `refactor` | ♻️ | Refactoring |
| `perf` | ⚡ | Performance |
| `test` | 🧪 | Tests |
| `build` | 🏗️ | Build System |
| `ci` | 🤖 | CI/CD |
| `chore` | 🔧 | Chores |
| `revert` | ⏪ | Reverts |
| `other` | 📝 | Other Changes |
| breaking | 💥 | Breaking Changes (always first section) |

## Step 5 — produce the CHANGELOG block

Group the commits in a new version block using this format:

```markdown
## [vX.Y.Z] — YYYY-MM-DD  (use nearest tag, or "Unreleased" if none)

### 💥 Breaking Changes
- **scope:** description — *Author* · `abc1234`

### ✨ New Features
- **scope:** description — *Author* · `abc1234` · YYYY-MM-DD

### 🐛 Bug Fixes
- description — *Author* · `abc1234` · YYYY-MM-DD

... (only include sections that have at least one commit)
```

Rules:
- Omit sections with no commits.
- Scope in **bold** only if present.
- Each entry ends with `— *Author* · \`short-hash\` · YYYY-MM-DD`.
- Sort entries within a section: newest date first.
- Breaking changes section always comes first when present.

## Step 6 — write or update the file

### Creating from scratch
Write `CHANGELOG.md` with this structure:

```markdown
<!-- last-commit: <hash-of-newest-commit> -->

# 📋 Changelog

All notable changes to this project are documented here.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

<generated block(s)>
```

### Updating existing file
1. Update the `<!-- last-commit: ... -->` marker at line 1 to the newest commit hash.
2. Insert the new version block **immediately after the `---` separator** (before previous entries), so newest changes appear at the top.
3. Do not rewrite or remove existing content below the insertion point.

## Output to the user

After writing the file, print a brief summary:
- How many commits were processed.
- How many sections were generated.
- The path written.

Do not show the full file contents in the response — just the summary and the path.
