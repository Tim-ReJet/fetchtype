# Project Setup Checklist

How to initialize any new project for long-running agent work. Run these steps once at project start.

## 1. Git Init

```bash
git init
```

Create `.gitignore` for the stack (secrets, OS files, build artifacts, `.claude/`).

## 2. CLAUDE.md (Project-Level)

Create a lean index at the repo root. ~30-50 lines max. Structure:

```markdown
# Project Name

One-line description.

## Session Protocol
1. Run `./init.sh`
2. Read `proj-progress.txt`
3. Pick next failing feature from `feature_list.json`
4. Work one feature, commit, test e2e, mark passing
5. Append session entry to progress log before ending

## Key Files
| File | Purpose |
|------|---------|
| `feature_list.json` | Feature tracker |
| `proj-progress.txt` | Session handoff log |
| `init.sh` | Environment bootstrap |
| ... | ... |

## Architecture
(Short diagram or bullet list)

## Rules
(3-5 project-specific constraints)
```

Don't dump everything here — link to deeper docs.

## 3. Feature List (`feature_list.json`)

Structured JSON, not markdown. Agents only change `status`, `last_tested`, `notes` — never descriptions.

```json
{
  "_meta": {
    "description": "Feature tracker. Only change status/last_tested/notes fields.",
    "statuses": ["failing", "in_progress", "passing"],
    "priority": "Lower number = higher priority."
  },
  "features": [
    {
      "id": "F001",
      "priority": 1,
      "category": "core",
      "description": "What the feature does, testable as written",
      "status": "failing",
      "last_tested": null,
      "notes": ""
    }
  ]
}
```

Tips:
- Write descriptions as testable acceptance criteria
- Group by category for readability
- Start everything as `"failing"` — agents earn `"passing"`
- 20-50 features for a medium project; 100+ for ambitious ones

## 4. Progress Log (`proj-progress.txt`)

Append-only. Each session adds one entry:

```
## Session N — YYYY-MM-DD HH:MM
**Agent:** initializer|coding
**Goal:** What was attempted
**Completed:** What was done
**Blocked:** Any blockers
**Next:** What the next session should do
**Commit:** git hash
```

## 5. Init Script (`init.sh`)

Runs at session start. Reports state so agents don't guess. Template:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Project Init ==="

# Git status
git log --oneline -10 2>/dev/null || echo "(no commits)"
git status --short

# Last session
tail -15 proj-progress.txt 2>/dev/null || echo "(no progress file)"

# Feature summary
if command -v jq &>/dev/null && [[ -f feature_list.json ]]; then
  total=$(jq '.features | length' feature_list.json)
  passing=$(jq '[.features[] | select(.status=="passing")] | length' feature_list.json)
  failing=$(jq '[.features[] | select(.status=="failing")] | length' feature_list.json)
  echo "Features: $total total, $passing passing, $failing failing"
  echo "Next:"
  jq -r '.features[] | select(.status=="failing") | "  [\(.id)] \(.description)"' feature_list.json | head -3
fi

# Stack-specific checks (customize per project)
# command -v node && node --version
# command -v python3 && python3 --version
# docker info &>/dev/null && echo "Docker: OK"

echo "=== Ready ==="
```

Make executable: `chmod +x init.sh`

## 6. Initial Commit

```bash
git add .gitignore CLAUDE.md feature_list.json proj-progress.txt init.sh
git commit -m "chore: initialize project structure for agent workflow"
```

## 7. Stack-Specific Setup (As Needed)

| If building... | Also set up |
|----------------|-------------|
| Web app | `package.json`, dev server command in init.sh, browser automation for e2e |
| API | OpenAPI spec or route list, curl-based smoke tests in init.sh |
| CLI tool | Test commands in init.sh, example invocations |
| IaC / infra | Terraform workspace isolation, `plan` before `apply` |
| Python project | `pyproject.toml`, `uv` for deps, pytest in init.sh |

## Summary

Every project gets these 5 files minimum:

```
project/
├── .gitignore
├── CLAUDE.md              # Lean index (~30 lines)
├── feature_list.json      # Structured feature tracker (JSON)
├── proj-progress.txt    # Session handoff log
└── init.sh                # Environment bootstrap (executable)
```

The pattern: **agents read state → pick one task → do it → commit clean → log progress → next agent picks up where this one left off.**
