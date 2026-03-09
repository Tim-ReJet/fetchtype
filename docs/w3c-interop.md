# W3C Interop

fetchtype is not fully W3C Design Tokens format yet, but the current model now has a deliberate bridge instead of an implicit one.

## Current Compatibility Direction

- Token aliases use `{path.to.token}` reference syntax, which maps cleanly to W3C-style token references.
- Named `themes` are now part of the token set so brand and accessibility variants can live alongside the base system.
- Theme overrides use flat dot-path keys. That keeps the current CLI practical while leaving room for a future `$value`-style nested format.

## What Exists Today

- Base token aliases resolve before validation and export.
- Theme overrides resolve against the token graph after the overrides are applied.
- Named themes can target brands or high-contrast modes without breaking default light/dark behavior.

## What Still Needs to Happen

- Introduce explicit `$type` and `$value` wrappers for closer DTCG alignment.
- Support token aliases beyond string leaf values with stricter authoring rules.
- Add an importer/exporter that round-trips fetchtype tokens into a W3C-first document shape.
- Add richer theme composition beyond flat override paths.

## Why This Order

The current choice favors a fast CLI and human-editable JSON over perfect spec fidelity. That keeps the launch wedge sharp while preserving a credible path to broader interoperability.
