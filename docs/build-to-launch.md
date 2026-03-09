# Build to Launch Plan

Feature development → site visuals → publish → build remaining capabilities.

## Phase 0 — Ship what exists (now)

**Goal:** Get the current site live with honest copy that matches actual product capabilities.

### Tasks

1. **Homepage + docs rewrite** — done (this session)
2. **Visual assets** — create the visual briefs embedded in the HTML comments
3. **Build and deploy** — `pnpm --filter @fetchtype/web build`, push, Vercel picks it up
4. **Publish CLI to npm** — `fetchtype` needs to be installable for the install commands to work

### Visual asset list (from HTML comments)

| Asset | Location | Description |
|-------|----------|-------------|
| Hero illustration | Homepage hero, right side | Side-by-side: UI with typography problems (annotated) vs. corrected UI. Subtle, not flashy. |
| The drift | Homepage problem card 1 | Terminal-style Figma spec vs. shipped code diff. Design intent vs. reality. |
| The numbers | Homepage problem card 2 | Four diagnostic mini-panels: line-height overlay, contrast swatches, button size comparison, character-count ruler. |
| The cause | Homepage problem card 3 | Sprint timeline showing typography drift accumulating over time. |
| The cost | Homepage problem card 4 | Annotated UI showing cumulative effect of unchecked typography. |
| Validation output | Homepage solution card 1 | Terminal screenshot of `fetchtype validate` with mixed pass/fail results. |
| Build output | Homepage solution card 2 | Two code panels: tokens.css and tokens.json side by side. |
| GitHub PR | Homepage solution card 3 | Realistic GitHub PR view with inline fetchtype annotations. |
| Checks table | Homepage solution card 4 | Clean typographic table of thresholds. Can be rendered in CSS, no image needed. |
| Token structure | Docs token format section | Tree view of the five token sections and their children. |
| Validation example | Docs checks section | Terminal output showing real failure diagnostics. |
| GitHub step summary | Docs CI section | GitHub Actions step summary tab with diagnostic markdown table. |

### Asset production approach

- Terminal screenshots: run real fetchtype commands against a token file with intentional failures, capture output
- GitHub PR screenshots: create a test repo, push a failing token change, screenshot the annotations
- UI comparisons: can be built as static HTML/CSS specimens within the site itself (no external tool needed)
- Sprint timeline: SVG diagram, hand-drawn or generated

---

## Phase 1 — Strengthen the validator (weeks 1–2)

**Goal:** Deepen credibility. The site says "specific thresholds, not opinions" — back it up with more rules.

### New validation rules

| Rule | Type | Threshold | Why |
|------|------|-----------|-----|
| Heading level continuity | error | No skipping levels (h1 → h3 without h2) | Screen readers and document outline depend on sequential headings |
| Caption/label minimum font-size | warning | ≥ 11px | Below this, text is functionally unreadable on most screens |
| Line-height ratio | warning | Heading line-height < body line-height | Headings with body-level line-height look loose and broken |
| Spacing scale consistency | warning | Each step ≥ previous step | Spacing scales should be monotonically increasing |
| Font-size scale direction | warning | h1 > h2 > h3 > h4 > h5 > h6 | Heading sizes should decrease with level |
| Dark mode completeness | error | If light mode has a color group, dark must too | Prevents shipping incomplete dark themes |

### Computed type scale

The token file stores `hierarchy.scale: "major-third"` but nothing computes from it. Implement:

- Given a baseSize and a named ratio (minor-second through perfect-fifth), compute h6–h1 sizes
- `fetchtype init` should generate heading sizes from the scale, not hardcode them
- `fetchtype validate` should warn if heading sizes don't match the declared scale ratio (within tolerance)

### Multiple presets

| Preset name | Character | Use case |
|-------------|-----------|----------|
| `base` | Neutral, Inter-family | General product UI (exists today) |
| `editorial` | Serif-forward, generous spacing | Content sites, blogs, documentation |
| `dashboard` | Compact, high-density | Data-heavy apps, admin panels |
| `ecommerce` | Clear CTAs, scannable hierarchy | Product pages, catalogs |
| `docs` | Reading-optimized, monospace code blocks | Technical documentation |

CLI: `fetchtype init --preset dashboard`

**Deliverables:**
- [ ] 6 new validation rules
- [ ] Computed type scale from named ratio
- [ ] 4 additional presets
- [ ] `--preset` flag on init
- [ ] Update docs page with new rules in "what gets checked"
- [ ] Update site to reference presets in install section

---

## Phase 2 — Make the demo real (weeks 3–4)

**Goal:** The homepage mode switcher (display/interface/reading/mono) should reflect a real product capability.

### Typography modes in the token schema

Extend the token format to support named modes:

```json
{
  "modes": {
    "display": {
      "typography.heading.fontFamily": ["Iowan Old Style", "Baskerville", "Georgia", "serif"],
      "typography.heading.lineHeight": 0.95,
      "typography.heading.letterSpacing": "-0.04em",
      "spacing.scale.xl": "2.5rem"
    },
    "interface": {
      "typography.heading.fontFamily": ["Inter", "system-ui", "sans-serif"],
      "typography.heading.lineHeight": 1.1,
      "typography.heading.letterSpacing": "-0.02em",
      "spacing.scale.xl": "1.5rem"
    },
    "reading": { ... },
    "mono": { ... }
  }
}
```

### How modes work

- Modes are optional — a token file without modes works exactly as it does today
- Each mode overrides specific token paths (same mechanism as themes)
- `fetchtype build` generates a CSS block per mode: `[data-mode="display"] { ... }`
- `fetchtype validate` runs all checks against each mode independently
- Modes compose with themes: a dark + reading combination should work

### Mode-aware validation

- Each mode must pass all accessibility checks independently
- Warn if a mode overrides line-height below minimum
- Warn if a mode changes font-family without updating fallbacks

**Deliverables:**
- [ ] `modes` section in token schema (Zod update in @fetchtype/types)
- [ ] Mode-aware CSS generation in build
- [ ] Mode-aware validation (each mode checked independently)
- [ ] Update base preset with display/interface/reading/mono modes
- [ ] Homepage demo wired to real mode output (not just CSS class switching)
- [ ] Docs page updated with modes documentation

---

## Phase 3 — Exporters (weeks 5–6)

**Goal:** "CSS and JSON" is generic. Export directly to the formats people actually use.

### Tailwind exporter

Generate a `tailwind.config.ts` partial:

```ts
export default {
  theme: {
    fontSize: {
      'heading': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
      'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
      'button': ['0.9375rem', { lineHeight: '1.4', fontWeight: '500' }],
    },
    colors: {
      'text-primary': '#111827',
      'bg-primary': '#ffffff',
    },
    spacing: {
      'xs': '0.25rem',
      'sm': '0.5rem',
    },
    maxWidth: {
      'prose': '68ch',
    },
  },
}
```

CLI: `fetchtype build -i tokens.json --format tailwind`

### shadcn/ui exporter

Generate CSS variables that map to shadcn's expected naming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

CLI: `fetchtype build -i tokens.json --format shadcn`

**Deliverables:**
- [ ] Tailwind config exporter
- [ ] shadcn CSS variables exporter
- [ ] `--format tailwind` and `--format shadcn` flags
- [ ] Docs page updated with exporter documentation
- [ ] Update site install section to show framework-specific paths

---

## Phase 4 — Visual preview (weeks 7–8)

**Goal:** Let people see what their tokens look like before shipping.

### Local preview server

`fetchtype preview -i tokens.json` starts a local dev server that renders:

- Heading hierarchy (h1–h6) with actual fonts, sizes, weights
- Body paragraph with real line-height and max-width
- Button specimens at the defined size
- Color palette: light and dark mode swatches with contrast ratio overlays
- Spacing scale: visual blocks at each step
- If modes exist: a mode switcher (same concept as the homepage demo, but rendering YOUR tokens)

### HTML report

`fetchtype build -i tokens.json --report` generates a standalone HTML file alongside the CSS/JSON:

- Same content as the preview server, but as a static file
- Can be opened in a browser, attached to a PR, or hosted
- Includes validation results inline

**Deliverables:**
- [ ] Preview server with hot reload
- [ ] Static HTML report generator
- [ ] `--report` flag on build
- [ ] `fetchtype preview` command
- [ ] Update docs with preview documentation

---

## Phase 5 — Font intelligence (weeks 9–12)

**Goal:** Move from "validate what you authored" to "help you author better."

### Font catalog

Build or import a catalog of web fonts with metadata:

- Google Fonts catalog (API or static snapshot): family, category, axes, subsets, file sizes
- System font stacks: known safe combinations per platform
- Per-font metadata: recommended sizes, known rendering issues, licensing summary

### Font loading validation

New validation checks:

| Check | What it does |
|-------|-------------|
| Font availability | Warn if a fontFamily isn't in Google Fonts or a known system stack |
| Estimated file size | Warn if total web font payload exceeds a threshold (e.g., 150KB) |
| Missing fallbacks | Error if fontFamily has no fallback chain |
| Variable font axes | If a font supports variable axes, note which are available |
| Subsetting opportunity | If a font supports subsetting and the token doesn't specify a subset |

### Font recommendations

Given the token context (display, interface, reading, mono), suggest fonts that match:

- Display: high-contrast serifs, large optical size range
- Interface: neutral sans-serifs, good tnum support, multiple weights
- Reading: serifs optimized for body text, generous x-height
- Mono: fixed-width with good ligature support

CLI: `fetchtype suggest --context display`

**Deliverables:**
- [ ] Google Fonts catalog integration (static snapshot, updated periodically)
- [ ] System font stack database
- [ ] Font loading validation rules
- [ ] `fetchtype suggest` command
- [ ] Update docs with font guidance

---

## Phase 6 — Agent integration (weeks 13–14)

**Goal:** Enable the "agent-native" claim.

### MCP server

Expose fetchtype as an MCP tool that AI agents can call:

- `fetchtype.validate` — validate a token file, return diagnostics
- `fetchtype.build` — generate output, return file paths
- `fetchtype.suggest` — recommend fonts for a context
- `fetchtype.init` — generate a starter token file with a specified preset

### Natural language init

`fetchtype init --prompt "modern SaaS dashboard, high information density, needs to work at small sizes"`

- Maps natural language to preset selection + parameter tuning
- Uses the font catalog to select appropriate families
- Generates a complete token file tuned to the description
- Requires LLM integration (Claude API or local model)

**Deliverables:**
- [ ] MCP server in fetchtype CLI
- [ ] Natural language init (requires Claude API key or similar)
- [ ] Update site to reference agent capabilities
- [ ] Only now: update positioning to include "agent-native" language

---

## Launch sequence

| Milestone | What ships | Site update |
|-----------|-----------|-------------|
| **Phase 0** | Current CLI + honest site | New homepage + docs go live |
| **Phase 1** | More rules, presets, computed scale | Add presets to install section, expand "what gets checked" |
| **Phase 2** | Typography modes | Homepage demo becomes real product feature |
| **Phase 3** | Tailwind + shadcn exporters | Framework-specific install paths on site |
| **Phase 4** | Visual preview + HTML report | Add preview screenshots to site, link report in docs |
| **Phase 5** | Font catalog + recommendations | Add "font intelligence" section to site |
| **Phase 6** | MCP + natural language init | Rebrand as "agent-native typography stack" — now it's earned |

## Principle

Every word on the site must be backed by a working feature. The site ships first with what's real. Each phase extends the product and earns the right to extend the messaging. No claims ahead of capabilities.
