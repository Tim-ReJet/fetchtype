# Launch Strategy

## Product Thesis

Launch fetchtype as the fastest way for design-system engineers to validate and export accessible typography tokens. Do not lead with "AI-native typography OS." Lead with "your typography system now has a CI gate."

## Category

fetchtype is the agent-native typography stack for UI teams.

That means:

- not the whole UI stack
- not a generic AI builder
- not just another token compiler

It owns the typography layer:

- font decisions
- type scales and hierarchy
- typography tokens
- readability validation
- preview and export
- review and deployment guidance

## Beachhead User

- Senior frontend engineers who own a design system
- Design-system leads at product teams with multiple apps or brands
- Agencies and platform teams that need repeatable typography policy enforcement

## Viral Distribution Loop

- Make the CLI free and frictionless for local use.
- Let teams share validation output in pull requests, screenshots, and CI logs.
- Ship a public starter preset so `fetchtype init` produces something useful immediately.
- Publish a GitHub Action early so adoption can spread repo-to-repo.
- Make failure messages opinionated and educational so people share them as best-practice examples.

## Fast Revenue Path

### Free

- Unlimited local CLI usage
- Local validation and CSS/JSON export
- Public presets and docs
- OSS and personal projects at no cost

### Team

- Hosted policy packs
- Shared preset registry
- Pull-request annotations and trend reporting
- Team dashboards for validation drift and release approvals

### Enterprise

- SSO and RBAC
- Multi-brand governance
- Audit trails and policy exceptions
- Private font metadata and license controls
- Optional hosted delivery after demand is proven

## Pricing Logic

- Keep the free tier generous enough that individual engineers can adopt fetchtype without approval.
- Charge for collaboration, governance, reporting, and private policy management.
- Avoid charging for basic validation; that would slow distribution and make comparison against free incumbents too easy.

## Positioning

- Primary message: the agent-native typography stack for UI teams
- Secondary message: generate, validate, and ship real type systems with exportable artifacts
- Deferred message: hosted collaboration, AI recommendations, and private font governance

## Core Pain

The real pain is not "teams need more fonts." It is that typography is one of the most important parts of product UI, but it is still managed like scattered taste instead of a system.

### Pain Points

- Inconsistency: headings, body styles, scales, and theme variants drift across products and repos.
- Weak handoff: design intent, token structure, and implementation logic do not stay aligned.
- Low confidence: teams do not know if a typography choice is actually readable until late review or production.
- Limited expertise: most teams do not have a dedicated typographer, but still need strong type decisions.
- Prompt inefficiency: current AI tools can generate screens quickly but are bad at converging on a coherent type system in one prompt.
- Compliance risk: accessibility, readability, and brand constraints are not enforced consistently.
- Licensing ambiguity: teams often do not know which fonts are safe, licensed, or deployable across environments.
- Performance overhead: self-hosting, loading strategy, subsetting, and fallback behavior are easy to get wrong.

### What Fetchtype Fixes First

- Make typography decisions structured instead of ad hoc
- Turn readability into something teams can validate in CI
- Reduce the number of prompts needed to get to a usable type system
- Export artifacts engineers can actually ship

## Visual Direction

- Do not default to a 2x3 grid of equal cards or generic bento-box marketing blocks.
- Lead with a strong command-line hero, a distinct icon system, and asymmetric proof layouts that feel more like tooling infrastructure than lifestyle SaaS.
- Treat validation results, policy rules, and font intelligence as signals that can be visualized through diagrams, rails, and annotation strips rather than repetitive square panels.
- Use the visual system guidance in `docs/visual-direction.md` for future launch pages, dashboards, and demos.

## Launch Sequence

### Phase 1

- Ship CLI with `init`, `validate`, and `build`
- Publish starter preset and schema docs
- Seed usage through OSS, demo repos, and design-system communities

### Phase 2

- Add GitHub Action and PR annotations
- Add import/export bridges for existing token tools
- Start collecting anonymized validation pattern data from opted-in users

### Phase 3

- Launch team dashboard, private policy packs, and governance controls
- Test demand for hosted font metadata and delivery only after workflow adoption is proven

## Metrics

- Weekly active repos running `fetchtype validate`
- `init` to `validate` conversion
- Validation runs per repo per week
- Free-to-team conversion by repo count and PR annotation adoption
- Number of shared presets and policy packs

## Anti-Goals

- Do not build a font CDN before the CLI has pull.
- Do not gate the best validation logic behind paywalls.
- Do not optimize for designer-seat sales before winning engineers.
