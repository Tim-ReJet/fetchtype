# Agent Best Practices

Distilled from Anthropic (long-running agents), Stripe (Minions), OpenAI (evals/graders), and harness engineering research. Read on demand — not preloaded.

## Session Continuity

- **Feature list as source of truth.** JSON file with all features, statuses `failing|in_progress|passing`. Agents only change status fields — never remove or edit descriptions. JSON resists accidental overwrites better than markdown.
- **Progress log for handoff.** Append-only file: what was done, what's blocked, what's next. Each session reads it first.
- **Init script at session start.** Check git log, progress file, feature status, and environment health before doing any work. Catches broken state early.
- **One feature at a time.** Commit after each feature. Leave the codebase in a mergeable state — no half-implemented work across sessions.
- **Compaction loses detail.** Don't rely on compaction for cross-session memory. Use explicit artifacts (progress file, git commits with descriptive messages).

## Agent Harness Design

- **Make agents code authors, not operators.** Generate IaC/config files for review, not direct API calls. Enables `terraform plan`, git diff, PR review.
- **Repository as system of record.** All agent-accessible knowledge lives in versioned docs inside the repo. Agents can't access Slack, Google Docs, or wikis.
- **Progressive disclosure.** Short index file (~30-50 lines) points to deeper docs. Don't front-load a massive instruction manual.
- **Encode architecture as invariants, not guidance.** Lints, layering rules, and dependency constraints enforce themselves everywhere. Prose guidelines get ignored.
- **Enforce knowledge freshness.** Use linters or cleanup agents to scan for stale patterns, broken links, anti-patterns. Auto-merge obvious fixes.

## Tool Use

- **Defer loading for large tool libraries.** Load only relevant tools on demand (~500 tokens vs ~55K for full definitions). Keep 3-5 most-used tools loaded.
- **Programmatic tool calling for orchestration.** Let agents write code to loop/filter/aggregate before sending to the model. Cuts context ~37%.
- **Provide tool use examples for complex parameters.** Schema alone doesn't express format conventions. Examples lift accuracy ~72% → ~90% on nested APIs.

## Testing & Verification

- **Test as a user would.** Browser automation for web features, CLI for tools. Don't mark features passing based on unit tests alone.
- **Shift feedback left.** Pre-push linters (sub-1 second) before CI runs. Agents iterate locally against linters before pushing.
- **Limit CI rounds.** Allow 1-2 full CI runs max. Auto-apply autofixes; if failures remain after round 2, escalate to human. Diminishing returns.
- **End-to-end smoke test at session start.** Before implementing anything new, verify existing functionality still works.

## Evaluation & Quality

- **Infrastructure noise is real.** Resource differences (CPU, RAM, time limits) can exceed leaderboard margins. Treat resource specs as experimental variables.
- **3x headroom over strict specs** cuts infrastructure errors ~60% (5.8% → 2.1%) without changing what the eval measures. Above 3x, extra resources enable new strategies.
- **Run evals multiple times.** API latency varies by time of day. Pod failures, network conditions, concurrency all affect scores.
- **Differences under 3 percentage points** are within infrastructure noise + binomial uncertainty — treat with skepticism.
- **Multi-criteria grading.** Use narrowly-defined graders per output property. Combine with weighted formulas, not binary pass/fail.
- **Guard against reward hacking.** Design graders that produce smooth scores. Balance labels in training data. Verify model graders rank good > bad on your eval set.

## Environments & Isolation

- **Isolated, standardized devboxes.** Pre-warmed with repos, caches, services. Key properties: parallelizable, predictable, isolated (no production access).
- **Same environment for humans and agents.** What's good for human developers scales to agents.
- **Workspaces for environment separation.** Separate sandbox and production with workspace isolation.

## Blueprints (Stripe Pattern)

- **Interleave deterministic and agentic nodes.** Agent nodes: broad exploration (implement, debug). Deterministic nodes: guaranteed outcomes (lint, git ops, test run).
- **Example flow:** implement (agent) → lint (deterministic) → push (deterministic) → CI (deterministic) → fix failures (agent, bounded to 1 retry).
- **Scoped rule files.** Directory-scoped or pattern-scoped context. Global rules are expensive — attach context dynamically as agents traverse the filesystem.

## Observability

- **Full dev loop observability.** Expose logs, metrics, traces, and browser DevTools to agents for self-debugging.
- **Audit trail.** Log all agent decisions for post-hoc review.
- **Human escalation.** Agents handle their own feedback loops (review, respond to comments, detect build failures) and escalate only when human judgment is truly needed.
