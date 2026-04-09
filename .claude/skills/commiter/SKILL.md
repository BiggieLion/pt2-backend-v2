---
name: Commiter
description: Analyzes staged git changes, generates a Conventional Commit message, and creates the commit. Run with /commiter.
allowed-tools: Bash
---

You are an expert developer and technical writer. Your job is to analyze the staged changes in the repository and produce a well-formed **Conventional Commit** message.

## Step 1 — verify there are staged changes

Run:

```bash
git diff --cached --stat
```

If the output is empty, stop immediately and tell the user:

> ❌ No staged changes found. Stage your changes with `git add` first and then run `/commiter` again.

Do not proceed with any further steps.

## Step 2 — get the full diff of staged changes

Run:

```bash
git diff --cached
```

Read the output carefully. Pay attention to:
- Which files were added, modified, or deleted.
- What logic or behavior changed inside each file.
- Whether any breaking changes are introduced (e.g. removed exports, renamed public APIs, changed function signatures).

## Step 3 — determine the commit type

Pick **one** type from the Conventional Commits spec that best represents the overall intent of the changes:

| Type | When to use |
|------|-------------|
| `feat` | A new feature or capability is added |
| `fix` | A bug or incorrect behavior is corrected |
| `docs` | Documentation-only changes |
| `style` | Formatting, whitespace, missing semicolons — no logic change |
| `refactor` | Code restructured without adding features or fixing bugs |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Changes to build scripts, dependencies, or tooling |
| `ci` | CI/CD pipeline configuration |
| `chore` | Maintenance tasks that don't affect production code |
| `revert` | Reverts a previous commit |

If the changes span multiple types, choose the **most significant** one.

## Step 4 — determine scope (optional)

The scope is a short noun in parentheses describing **which part of the codebase** is affected (e.g. `auth`, `requester`, `staff`, `request`, `db`, `config`).

- Use the module or domain name when clear.
- Omit scope if the change is truly cross-cutting and no single scope fits.

## Step 5 — write the commit message

Follow this format strictly:

```
type(scope): short imperative description

[optional body: explain WHAT changed and WHY, not HOW — wrap at 72 chars]

[optional footer: BREAKING CHANGE: ..., Closes #issue, etc.]
```

Rules:
- **First line** must be ≤ 72 characters.
- Description in **imperative mood** (`add`, `fix`, `remove` — not `added`, `fixes`).
- No period at the end of the first line.
- If there are breaking changes, add `!` after `type(scope)` AND include a `BREAKING CHANGE:` footer explaining the impact.
- Body and footer are optional but encouraged when the change is non-trivial.

## Step 6 — create the commit

Print the commit message inside a fenced code block so the user can see it:

```
type(scope): description
```

Then, provide a brief one-sentence explanation of why you chose that type and scope.

Finally, run the commit using a HEREDOC to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
type(scope): short imperative description

optional body...

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Always append the `Co-Authored-By` trailer as shown above.

If the commit fails (e.g. pre-commit hook), report the error to the user — do **not** retry automatically.
