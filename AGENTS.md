# fetchtype — AGENTS.md

> AI-native typography operating system for modern design systems
> Combines design-token management, AI font recommendations, CDN delivery, and WCAG accessibility validation.

---

## Project Overview

Fetchtype is a typography-as-infrastructure platform targeting enterprise design-system teams. The product vision:

- **Design-Token Engine**: Generate and manage typography tokens (size, weight, line-height, letter-spacing)
- **AI Font Recommendation**: ML-powered font pairing and variable-font selection based on brand attributes
- **CDN Delivery**: Low-latency font hosting with automatic subsetting and WOFF2 optimization
- **Accessibility Validation**: Built-in WCAG contrast checking, text spacing resilience, and line-length guardrails
- **CLI + API**: Developer-first tooling with CI/CD integration

### Tech Stack (Expected)

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm (workspaces)
- **Monorepo**: Turborepo for build orchestration
- **Testing**: Vitest
- **Linting**: ESLint + Biome (formatting)
- **CLI Framework**: `commander` or `clipanion`

---

## Repository Structure

```
fetchtype/
├── AGENTS.md                 # This file
├── fetchtype.md              # Product Requirements Document (PRD)
├── pnpm-workspace.yaml       # Monorepo workspace config
├── package.json              # Root package.json (workspace root)
├── pnpm-lock.yaml            # Lockfile
├── turbo.json                # Turborepo pipeline config
├── tsconfig.json             # Base TypeScript config
├── packages/
│   ├── cli/                  # fetchtype CLI (main entry point)
│   ├── core/                 # Token schema, validation, bundling
│   ├── cdn/                  # CDN endpoints (Node.js server)
│   ├── ai/                   # AI font recommendation engine
│   ├── fonts/                # Font library and metadata
│   └── presets/              # Starter token presets
└── apps/
    └── web/                  # Dashboard/landing page (optional)
```

---

## Build/Lint/Test Commands

> These commands assume the repository structure is established.

### Root Commands

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter fetchtype test

# Run a single test file
pnpm --filter @fetchtype/core test src/schema.test.ts

# Run tests in watch mode
pnpm --filter @fetchtype/core test:watch

# Lint all packages
pnpm lint

# Type-check all packages
pnpm typecheck

# Build all packages (production)
pnpm build

# Run CLI in development
pnpm --filter fetchtype dev

# Run specific CLI command
pnpm --filter fetchtype run validate --input tokens.json
```

### Turborepo Pipeline

The `turbo.json` should define:

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"], "outputs": [] },
    "lint": { "dependsOn": ["^build"], "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] }
  }
}
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled**: `strict: true`, `noUncheckedIndexedAccess: true`
- **Target**: ES2022 for Node.js backend, ES2020 for potential browser bundles
- **Module**: ESM (`"type": "module"` in package.json)
- **Imports**: Use `.js` extensions for local imports (ESM compatibility)

### Imports Order

```typescript
// 1. External packages (Node.js builtins first)
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// 2. External packages (alphabetical)
import { Command } from 'commander';
import { z } from 'zod';

// 3. Internal packages (using @fetchtype/* aliases)
import { validateTokens } from '@fetchtype/core';
import { Font } from '@fetchtype/fonts';

// 4. Relative imports (parent then child)
import { formatOutput } from '../utils/format.js';
import { localHelper } from './helper.js';
```

### Formatting (Biome)

- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line structures
- Semicolons required
- Max line width: 100 characters

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Packages | `@fetchtype/<name>` | `fetchtype` |
| Files (source) | `camelCase.ts` | `tokenSchema.ts` |
| Files (test) | `*.test.ts` | `tokenSchema.test.ts` |
| Types/Interfaces | `PascalCase` | `TokenSchema`, `FontMetadata` |
| Functions | `camelCase` | `validateToken()`, `generateCSS()` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_LINE_HEIGHT` |
| CLI commands | `kebab-case` | `fetchtype validate-tokens` |
| CSS variables | `--ft-<category>-<name>` | `--ft-font-size-md` |

### Error Handling

```typescript
// Use specific error classes
class TokenValidationError extends Error {
  constructor(
    message: string,
    public readonly token: string,
    public readonly rule: string
  ) {
    super(message);
    this.name = 'TokenValidationError';
  }
}

// Prefer Result patterns for recoverable errors
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// CLI should exit with appropriate codes
// 0 = success, 1 = validation error, 2 = runtime error
```

### File Organization

```typescript
// 1. JSDoc module header (for public APIs)
/**
 * Token schema validation and transformation.
 * @module @fetchtype/core/schema
 */

// 2. Type definitions
interface Token { ... }

// 3. Constants
const DEFAULT_VALUES = { ... };

// 4. Helper functions (not exported)
function normalizePath(path: string) { ... }

// 5. Public API (exports at bottom or inline)
export { validateToken, TokenSchema };
```

---

## CLI Design Conventions

The CLI is the primary interface. Follow these patterns:

### Command Structure

```bash
fetchtype <command> [options]

Commands:
  init              Initialize a new token configuration
  validate          Validate tokens against schema and WCAG rules
  build             Compile tokens to CSS/JSON/Tailwind formats
  preview           Launch local preview server
  fonts:list        List available fonts
  fonts:suggest     AI-powered font recommendations
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation failed (user input invalid) |
| 2 | Runtime error (unexpected) |
| 3 | Configuration missing |

### Output Formatting

- **stderr**: Human-readable messages, errors with `Error:` prefix
- **stdout**: Structured output (JSON when `--json` flag)
- **Quiet mode**: `--quiet` or `-q` suppresses non-essential output
- **Verbose mode**: `--verbose` or `-v` for debugging

---

## Testing Guidelines

### Test File Location

Tests live adjacent to source files: `src/token.ts` → `src/token.test.ts`

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('validateToken', () => {
  it('should accept valid token schema', () => {
    // Arrange
    const token = { fontSize: { value: '16px' } };
    
    // Act
    const result = validateToken(token);
    
    // Assert
    expect(result.ok).toBe(true);
  });

  it('should reject tokens with invalid contrast ratio', () => {
    // ...
  });
});
```

### Coverage Target

- Minimum 80% line coverage for core packages
- Critical paths (validation, transformations) should aim for 95%+

---

## Commit Convention

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore, ci
Scopes: cli, core, cdn, ai, fonts, docs

Examples:
  feat(cli): add --format flag to build command
  fix(core): handle nested token references
  docs(readme): add installation instructions
```

---

## Security Considerations

- **Input validation**: All CLI inputs and API endpoints must validate with Zod schemas
- **Font handling**: Never trust font file uploads; validate format and sanitize file names
- **API keys**: CLI tokens stored in `~/.fetchtype/credentials` (not checked into git)
- **CDN**: Fonts served with appropriate CORS and Content-Security-Policy headers

---

## Key Domains

| Domain | Package | Description |
|--------|---------|-------------|
| Token Schema | `@fetchtype/core` | W3C Design Tokens compatible schema |
| Validation | `@fetchtype/core` | WCAG contrast, spacing, line-length rules |
| Bundling | `@fetchtype/core` | Transform tokens to CSS, JSON, Tailwind configs |
| AI Engine | `@fetchtype/ai` | Font recommendation model integration |
| CDN | `@fetchtype/cdn` | Fastify-based font and token delivery |
| CLI | `fetchtype` | Primary developer interface |

---

## Agent Instructions Summary

1. **Always type-check** after modifications: `pnpm typecheck`
2. **Run affected tests** before completing work: `pnpm --filter <package> test`
3. **Follow ESM**: Use `.js` extensions in imports, `type: "module"` in package.json
4. **Validate with Zod**: All external inputs go through schema validation
5. **Semantic exit codes**: CLI commands use documented exit codes
6. **No any**: Never use `any` or type suppressions without explicit justification
