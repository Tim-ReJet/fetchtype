# fetchtype

Typography validation and token build system for design-system teams.

## Session Protocol

1. Run `./init.sh`
2. Read `proj-progress.txt` and `proj-progress.json`
3. Pick the highest-priority failing item from `feature-list.json`
4. Implement one feature at a time and verify it with user-level commands
5. Update progress artifacts before ending the session

## Key Files

| File                      | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `feature-list.json`       | Source-of-truth feature tracker           |
| `proj-progress.txt`       | Append-only narrative handoff log         |
| `proj-progress.json`      | Current machine-readable project snapshot |
| `init.sh`                 | Session bootstrap and state summary       |
| `AGENTS.md`               | Repo-specific coding constraints          |
| `agent-practices.md`      | Long-running agent workflow guidance      |
| `project-setup.md`        | Project bootstrap checklist               |
| `docs/launch-strategy.md` | Positioning, launch, pricing, GTM         |

## Architecture

- `@fetchtype/types`: Zod schemas and shared contracts
- `@fetchtype/core`: validation engine, presets, exporters
- `fetchtype (cli)`: `init`, `validate`, `build`
- `@fetchtype/fonts`: font stack helpers and future catalog
- `@fetchtype/cdn`: delivery manifest helpers, not hosted infra yet
- `@fetchtype/components`: placeholder registry for future UI bindings

## Rules

- Keep the MVP focused on validation and export, not hosted font delivery.
- Use ESM with `.js` extensions for local imports.
- Treat `feature-list.json` descriptions as immutable acceptance criteria.
- Do not mark a feature `passing` without a direct user-path verification command.
- Keep launch work tied to viral distribution and a fast paid upgrade path.
