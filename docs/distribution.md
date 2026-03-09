# Distribution

fetchtype is now set up so the CLI can be distributed as a packaged artifact instead of requiring this repo layout at runtime.

## Current Distribution Options

- Local workspace development: `pnpm build`
- Packaged tarball for validation in another repo: `pnpm pack:cli`
- Future registry path: publish `fetchtype` and consume it via npm or pnpm

## Pack and Test Locally

```bash
pnpm pack:cli
```

That writes a tarball into `.fetchtype-dist/`.

In another repo or temp directory you can install and run it without the fetchtype source tree:

```bash
mkdir /tmp/fetchtype-runner
cd /tmp/fetchtype-runner
printf '{ "name": "runner", "private": true }\n' > package.json
pnpm add /absolute/path/to/fetchtype/.fetchtype-dist/fetchtype-cli-0.1.0.tgz
pnpm exec fetchtype validate --input /absolute/path/to/tokens.json
```

## GitHub Action Path

The composite action in `.github/actions/validate/action.yml` now installs a packaged CLI artifact instead of building this workspace in place. The repo workflow packs the CLI first and then validates the canonical preset from that tarball.

The action can also emit GitHub-native step summaries and workflow annotations by passing `--github` through the packaged CLI. That gives pull requests an adoption-friendly surface without requiring a hosted dashboard first.

That means the next release step is straightforward:

1. publish `fetchtype`
2. point the composite action at the published package spec
3. let external repos validate tokens without checking out this repo
