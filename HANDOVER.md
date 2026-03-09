# fetchtype — Session Handover

**Last updated:** 2026-03-09
**Status:** Phase 0 complete. Site rewritten with honest copy. Ready to build Phases 1–6.

---

## What fetchtype is today

A typography token validator and exporter with CI integration. You author a token file, it checks accessibility and structure, and it outputs CSS/JSON you can ship. That's real and useful.

Everything about prompts, generation, agent integration, and font intelligence is aspirational — it belongs on the roadmap, not on the site.

## Architecture

```
Packages:
  @fetchtype/types      Zod schemas, shared types (zero deps)
  @fetchtype/fonts      Font stack helpers, Google Fonts URL builder, system stacks
  @fetchtype/core       Validation engine, CSS/JSON export, presets
  @fetchtype/cdn        Delivery manifest helpers (stubbed, not hosted)
  @fetchtype/components Placeholder registry (stubbed)
  fetchtype (cli)       init, validate, build commands
```

## What works (verified)

- `fetchtype init` — writes base preset to fetchtype.tokens.json
- `fetchtype validate -i <file>` — schema + accessibility checks, exit code 1 on fail
- `fetchtype build -i <file>` — CSS variables + JSON export with themes
- `--github` flag — GitHub workflow annotations + step summary markdown
- `--json` flag — machine-readable validation output
- Token aliases with `{path.to.token}` syntax, circular detection
- Light/dark mode + custom named themes
- WCAG AA contrast checking (4.5:1), body line-height ≥ 1.5, button ≥ 14px, prose ≤ 75ch

## What doesn't exist yet

- No prompt interface, no natural language input
- No MCP server, no agent integration
- No typography modes (display/interface/reading/mono) in the product — only the website demo
- No font catalog, no font recommendations
- No Tailwind or shadcn exporters
- No visual preview
- No computed type scale from named ratios
- Only one preset (base)

---

## Content tone — what we're doing and NOT doing

### DO

- **Lead with the problem, not the product.** Homepage opens with "Most of what your users do is read." The reader should feel understood before they see a product name.
- **Use specific numbers.** "Body text at 1.2 line-height fails WCAG 1.4.12" > "inconsistency." Real thresholds, real WCAG references, real contrast ratios.
- **Name real scenarios.** "Your designer specifies 1.5 line-height. Your developer ships 1.2 because the Tailwind default felt close enough." Moments of recognition.
- **Teach through the problem.** Acknowledge complexity, explain what matters, say what can be safely ignored. Builds trust. (Follows Grilli Type's guide approach.)
- **Only claim what's built.** Every word on the site must map to a working feature.

### DO NOT

- **No "agent-native typography stack."** No agent integration exists. Deferred until Phase 6.
- **No "one prompt" or "promptable."** No prompt interface exists. Deferred until Phase 6.
- **No -able word dumps.** "Promptable, reviewable, exportable, deployable" is a checklist, not communication.
- **No meta-commentary about the site.** "Everything important is on the first page" talks about IA, not value.
- **No internal ops on public pages.** Vercel steps, DNS records = internal docs only.
- **No lifestyle SaaS tone.** This is infrastructure tooling. Direct, technical, specific.
- **No selling before explaining.** Problem first, then product.
- **No generic pain labels.** "Inconsistency" is a category, not an experience. Use concrete situations.

---

## Roadmap — Phases 1–6

Full spec: `docs/build-to-launch.md`

### Phase 1 — Strengthen the validator (weeks 1–2)

**Goal:** More validation rules, computed type scale, multiple presets.

**New validation rules (in `packages/core/src/index.ts`):**

| Rule | Type | Threshold |
|------|------|-----------|
| Heading level continuity | error | No skipping h1 → h3 |
| Caption/label min font-size | warning | ≥ 11px |
| Line-height ratio | warning | Heading line-height < body line-height |
| Spacing scale consistency | warning | Monotonically increasing |
| Font-size scale direction | warning | h1 > h2 > ... > h6 |
| Dark mode completeness | error | All light groups mirrored in dark |

**Computed type scale:**
- New file: `packages/core/src/scale.ts`
- Given baseSize + named ratio (minor-second 1.067 through perfect-fifth 1.5), compute h6–h1
- `init` generates heading sizes from the scale, not hardcoded
- `validate` warns if heading sizes diverge from declared scale ratio (within ±5% tolerance)

**New presets (JSON files in `packages/core/src/`):**

| Preset | Character |
|--------|-----------|
| editorial | Serif-forward, generous spacing, content sites |
| dashboard | Compact, high-density, data-heavy apps |
| ecommerce | Clear CTAs, scannable hierarchy, product pages |
| docs | Reading-optimized, monospace code blocks |

**CLI:** `fetchtype init --preset dashboard`

**Tests:** New rules in `packages/core/src/index.test.ts`, scale in `packages/core/src/scale.test.ts`, preset selection in `packages/cli/src/index.test.ts`

**Site:** Expand "what gets checked" card, add preset names to install section, update docs checks section.

---

### Phase 2 — Make the demo real (weeks 3–4)

**Goal:** Typography modes (display/interface/reading/mono) become a real product feature.

**Schema change in `packages/types/src/tokens.ts`:**
```json
{
  "modes": {
    "display": {
      "typography.heading.fontFamily": ["Iowan Old Style", "Baskerville", "serif"],
      "typography.heading.lineHeight": 0.95
    },
    "interface": {
      "typography.heading.fontFamily": ["Inter", "system-ui", "sans-serif"],
      "typography.heading.lineHeight": 1.1
    }
  }
}
```

**Build changes in `packages/core/src/index.ts`:**
- Emit `[data-mode="display"] { ... }` CSS blocks per mode
- Run all accessibility checks against each mode independently
- Warn if a mode overrides line-height below minimum or changes font-family without fallbacks

**Modes compose with themes:** dark + reading should work.

**Site:** Homepage demo wired to real mode output. Docs updated with modes documentation.

---

### Phase 3 — Exporters (weeks 5–6)

**Goal:** Export directly to Tailwind and shadcn formats.

**New files:**
- `packages/core/src/exporters/tailwind.ts` — generates `tailwind.config.ts` partial
- `packages/core/src/exporters/shadcn.ts` — generates CSS with shadcn HSL naming

**CLI:** `--format tailwind` and `--format shadcn` flags

**Site:** Framework-specific install paths, exporter docs.

---

### Phase 4 — Visual preview (weeks 7–8)

**Goal:** See what tokens look like before shipping.

**New file:** `packages/cli/src/preview.ts`

**Commands:**
- `fetchtype preview -i tokens.json` — local dev server rendering heading hierarchy, body text, buttons, color swatches with contrast overlays, spacing scale, mode switcher
- `fetchtype build -i tokens.json --report` — standalone HTML file

**Site:** Preview screenshots, link to HTML report.

---

### Phase 5 — Font intelligence (weeks 9–12)

**Goal:** From "validate what you authored" to "help you author better."

**New files:**
- `packages/fonts/src/catalog.ts` — Google Fonts metadata snapshot
- `packages/fonts/src/suggest.ts` — font recommendation by context

**New validation rules:** font availability warnings, payload estimates, missing fallback errors

**CLI:** `fetchtype suggest --context display`

**Site:** "Font intelligence" section.

---

### Phase 6 — Agent integration (weeks 13–14)

**Goal:** Earn the "agent-native" claim.

**New files:**
- `packages/cli/src/mcp.ts` — MCP server (validate, build, suggest, init)
- Natural language init via Claude API

**CLI:** `fetchtype init --prompt "modern SaaS dashboard, high information density"`

**Site:** Only now update positioning to "agent-native." Update meta tags, OG descriptions.

---

## Feature list additions

Add to `feature-list.json` as each is implemented:

| ID | Phase | Description |
|----|-------|-------------|
| F019 | 1 | New validation rules: heading levels, caption min size, line-height ratio, spacing consistency, heading size order, dark mode completeness |
| F020 | 1 | Computed type scale from named ratio + base size |
| F021 | 1 | `--preset <name>` flag with editorial/dashboard/ecommerce/docs presets |
| F022 | 2 | Token modes section with independent accessibility validation per mode |
| F023 | 2 | Mode-aware CSS generation (`[data-mode="..."]` blocks) |
| F024 | 3 | Tailwind config exporter (`--format tailwind`) |
| F025 | 3 | shadcn CSS exporter (`--format shadcn`) |
| F026 | 4 | Preview server (`fetchtype preview`) |
| F027 | 4 | HTML report generator (`--report` flag) |
| F028 | 5 | Google Fonts catalog + system font stack database |
| F029 | 5 | Font suggestion by context (`fetchtype suggest`) |
| F030 | 5 | Font loading validation (availability, payload, fallbacks) |
| F031 | 6 | MCP server for AI agent integration |
| F032 | 6 | Natural language init (`--prompt`) |

---

## Key file map

| File | Purpose | Phases |
|------|---------|--------|
| `packages/types/src/tokens.ts` | Token Zod schemas | 1, 2 |
| `packages/core/src/index.ts` | Validation + export engine | 1, 2, 3 |
| `packages/core/src/presets.ts` | Preset registry | 1 |
| `packages/core/src/base.tokens.json` | Base preset | 1, 2 |
| `packages/cli/src/index.ts` | CLI commands | 1, 3, 4, 5, 6 |
| `packages/fonts/src/index.ts` | Font helpers | 5 |
| `apps/web/index.html` | Homepage | all |
| `apps/web/docs/index.html` | Docs page | all |
| `apps/web/script.js` | Mode switcher interaction | 2 |

## Session protocol

1. Run `./init.sh`
2. Read `proj-progress.txt` and `proj-progress.json`
3. Read this `HANDOVER.md` for tone, approach, and roadmap
4. Read `docs/build-to-launch.md` for full phase spec
5. Pick next phase/deliverable
6. Implement, test, verify with user-level commands
7. Update `feature-list.json`, `proj-progress.txt`, `proj-progress.json`
8. Update site HTML if the phase calls for it

## Verification

```bash
pnpm build                  # build everything
pnpm test                   # run all tests
pnpm typecheck              # type-check
pnpm --filter @fetchtype/web build  # build site

# CLI direct
node packages/cli/dist/bin.js init
node packages/cli/dist/bin.js validate -i fetchtype.tokens.json
node packages/cli/dist/bin.js build -i fetchtype.tokens.json
node packages/cli/dist/bin.js validate -i fetchtype.tokens.json --github
```
