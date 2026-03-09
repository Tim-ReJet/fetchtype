import { describe, expect, it } from 'vitest';

import {
  applyModeOverride,
  applyThemeMode,
  buildTokenArtifacts,
  DEFAULT_TOKEN_SET,
  generateCssVariables,
  PRESETS,
  resolveDesignTokenSet,
  validateDesignTokenSet,
  validateFonts,
} from './index.js';

describe('validateDesignTokenSet', () => {
  it('passes for the bundled preset', () => {
    const report = validateDesignTokenSet(DEFAULT_TOKEN_SET);

    expect(report.pass).toBe(true);
    expect(report.counts.error).toBe(0);
  });

  it('fails when text contrast is too low', () => {
    const lowContrast = structuredClone(DEFAULT_TOKEN_SET);
    lowContrast.color.light.text.primary.value = '#9ca3af';

    const report = validateDesignTokenSet(lowContrast);

    expect(report.pass).toBe(false);
    expect(report.diagnostics.some((diagnostic) => diagnostic.rule.startsWith('contrast.'))).toBe(
      true,
    );
  });

  it('warns for spacing, size, and prose-width guidance', () => {
    const degraded = structuredClone(DEFAULT_TOKEN_SET);
    const bodyToken = degraded.typography.body;
    const buttonToken = degraded.typography.button;

    expect(bodyToken).toBeDefined();
    expect(buttonToken).toBeDefined();

    if (!bodyToken || !buttonToken) {
      throw new Error('Expected default preset to include body and button typography contexts.');
    }

    bodyToken.lineHeight = 1.2;
    buttonToken.fontSize = '0.75rem';
    degraded.layout.maxWidth.prose = '90ch';

    const report = validateDesignTokenSet(degraded);

    expect(report.counts.warning).toBeGreaterThanOrEqual(3);
    expect(report.diagnostics.map((diagnostic) => diagnostic.rule)).toEqual(
      expect.arrayContaining([
        'text-spacing.body-line-height',
        'font-size-min.button',
        'line-length.prose',
      ]),
    );
  });
});

describe('buildTokenArtifacts', () => {
  it('generates CSS variables from a valid token set', () => {
    const artifacts = buildTokenArtifacts(DEFAULT_TOKEN_SET);

    expect(artifacts.css).toContain('--ft-typography-body-font-size');
    expect(artifacts.json).toContain('"typography"');
  });

  it('resolves aliases and emits named theme blocks', () => {
    const artifacts = buildTokenArtifacts(DEFAULT_TOKEN_SET);
    const resolved = resolveDesignTokenSet(DEFAULT_TOKEN_SET);

    expect(resolved.color.light.text.accent.value).toBe(
      resolved.color.light.interactive.default.value,
    );
    expect(artifacts.css).toContain('[data-theme="brand-ocean"]');
    expect(artifacts.css).toContain('[data-theme="high-contrast-dark"]');
  });
});

describe('all presets pass validation', () => {
  for (const [name, preset] of Object.entries(PRESETS)) {
    it(`validates the ${name} preset`, () => {
      const report = validateDesignTokenSet(preset);
      expect(report.pass).toBe(true);
      expect(report.counts.error).toBe(0);
    });
  }
});

describe('heading size direction warning', () => {
  it('warns when h2 is larger than h1', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.hierarchy.headings.h2.fontSize = '5rem';

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'heading.size-direction'),
    ).toBe(true);
  });
});

describe('caption min font-size warning', () => {
  it('warns when caption font size is below 11px', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    const captionToken = broken.typography.caption;
    if (captionToken) {
      captionToken.fontSize = '0.5rem';
    }

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'font-size-min.caption'),
    ).toBe(true);
  });
});

describe('spacing scale monotonic warning', () => {
  it('warns when spacing scale is not monotonically increasing', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.spacing.scale = {
      xs: '1rem',
      sm: '0.5rem',
      md: '0.75rem',
    };

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'spacing.scale-monotonic'),
    ).toBe(true);
  });
});

describe('line-height ratio warning', () => {
  it('warns when heading line-height is >= body line-height', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.hierarchy.headings.h1.lineHeight = 2.0;
    const bodyToken = broken.typography.body;
    if (bodyToken) {
      bodyToken.lineHeight = 1.6;
    }

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'line-height.heading-vs-body'),
    ).toBe(true);
  });
});

describe('scale divergence warning', () => {
  it('warns when heading sizes diverge from computed scale', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.hierarchy.headings.h1.fontSize = '10rem';

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'heading.scale-divergence'),
    ).toBe(true);
  });
});

describe('theme dark-mode completeness warning', () => {
  it('warns when theme modifies light color but not corresponding dark color', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.themes = [
      {
        name: 'incomplete-theme',
        colorScheme: 'brand',
        tokens: {
          'color.light.interactive.default.value': '#ff0000',
        },
      },
    ];

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'theme.dark-mode-completeness'),
    ).toBe(true);
  });
});

describe('applyThemeMode', () => {
  it('applies theme overrides to a resolved token set', () => {
    const resolved = resolveDesignTokenSet(DEFAULT_TOKEN_SET);
    const oceanTheme = DEFAULT_TOKEN_SET.themes.find((theme) => theme.name === 'brand-ocean');

    expect(oceanTheme).toBeDefined();

    const themed = applyThemeMode(resolved, oceanTheme!);

    expect(themed.color.light.interactive.default.value).toBe('#0f766e');
    expect(themed.color.light.text.accent.value).toBe('#0f766e');
  });
});

describe('typography modes', () => {
  it('base preset with modes passes validation', () => {
    const report = validateDesignTokenSet(DEFAULT_TOKEN_SET);

    expect(report.pass).toBe(true);
    expect(report.counts.error).toBe(0);
  });

  it('generates mode CSS blocks with data-mode selectors', () => {
    const css = generateCssVariables(DEFAULT_TOKEN_SET);

    expect(css).toContain('[data-mode="display"]');
    expect(css).toContain('[data-mode="interface"]');
    expect(css).toContain('[data-mode="reading"]');
    expect(css).toContain('[data-mode="mono"]');
  });

  it('mode CSS blocks contain only overridden variables', () => {
    const css = generateCssVariables(DEFAULT_TOKEN_SET);

    // The display mode block should contain heading font-family but not body font-size
    const displayBlock = css.split('[data-mode="display"]')[1]?.split('}')[0] ?? '';
    expect(displayBlock).toContain('--ft-typography-heading-font-family');
    expect(displayBlock).not.toContain('--ft-typography-body-font-size');
  });

  it('applyModeOverride applies mode tokens correctly', () => {
    const resolved = resolveDesignTokenSet(DEFAULT_TOKEN_SET);
    const readingMode = DEFAULT_TOKEN_SET.modes['reading'];

    expect(readingMode).toBeDefined();

    const moded = applyModeOverride(resolved, readingMode!);

    expect(moded.typography.body?.lineHeight).toBe(1.8);
    expect(moded.typography.body?.fontSize).toBe('1.125rem');
  });

  it('warns when a mode sets body lineHeight below minimum', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.modes = {
      'tight-body': {
        name: 'tight-body',
        tokens: {
          'typography.body.lineHeight': 1.2,
        },
      },
    };

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'mode.tight-body.line-height-below-body-min'),
    ).toBe(true);
  });

  it('warns when a mode sets fontFamily without fallbacks', () => {
    const broken = structuredClone(DEFAULT_TOKEN_SET);
    broken.modes = {
      'no-fallback': {
        name: 'no-fallback',
        tokens: {
          'typography.body.fontFamily': 'Comic Sans MS',
        },
      },
    };

    const report = validateDesignTokenSet(broken);

    expect(
      report.diagnostics.some((d) => d.rule === 'mode.no-fallback.font-family-no-fallback'),
    ).toBe(true);
  });

  it('token files without modes still validate correctly', () => {
    const noModes = structuredClone(DEFAULT_TOKEN_SET);
    delete (noModes as Record<string, unknown>)['modes'];

    const report = validateDesignTokenSet(noModes);

    expect(report.pass).toBe(true);
  });
});

describe('validateFonts', () => {
  it('warns on missing fallbacks when fontFamily is a single string', () => {
    const tokenSet = structuredClone(DEFAULT_TOKEN_SET);
    tokenSet.typography.body.fontFamily = 'Inter';

    const diagnostics = validateFonts(tokenSet);

    expect(
      diagnostics.some(
        (d) => d.rule === 'font.missing-fallbacks' && d.path === 'typography.body.fontFamily',
      ),
    ).toBe(true);
  });

  it('warns on missing fallbacks when fontFamily is an array with one element', () => {
    const tokenSet = structuredClone(DEFAULT_TOKEN_SET);
    tokenSet.typography.body.fontFamily = ['Inter'];

    const diagnostics = validateFonts(tokenSet);

    expect(
      diagnostics.some(
        (d) => d.rule === 'font.missing-fallbacks' && d.path === 'typography.body.fontFamily',
      ),
    ).toBe(true);
  });

  it('warns when estimated font payload exceeds 150KB', () => {
    const tokenSet = structuredClone(DEFAULT_TOKEN_SET);
    // Use many different Google Fonts to exceed the budget
    const heavyFonts = [
      'Inter',
      'Roboto',
      'Open Sans',
      'Montserrat',
      'Playfair Display',
      'Fira Code',
      'EB Garamond',
      'Merriweather',
    ];
    const contexts = Object.keys(tokenSet.typography);
    for (let i = 0; i < contexts.length && i < heavyFonts.length; i += 1) {
      const context = contexts[i];
      if (context && tokenSet.typography[context]) {
        tokenSet.typography[context].fontFamily = [heavyFonts[i]!, 'sans-serif'];
      }
    }

    const diagnostics = validateFonts(tokenSet);

    expect(diagnostics.some((d) => d.rule === 'font.payload-estimate')).toBe(true);
  });

  it('emits info for unknown font families', () => {
    const tokenSet = structuredClone(DEFAULT_TOKEN_SET);
    tokenSet.typography.body.fontFamily = ['My Custom Font', 'sans-serif'];

    const diagnostics = validateFonts(tokenSet);

    expect(
      diagnostics.some(
        (d) => d.rule === 'font.unknown-family' && d.path === 'typography.body.fontFamily',
      ),
    ).toBe(true);
  });

  it('does not warn for system fonts', () => {
    const tokenSet = structuredClone(DEFAULT_TOKEN_SET);
    tokenSet.typography.body.fontFamily = ['system-ui', 'sans-serif'];

    const diagnostics = validateFonts(tokenSet);

    expect(diagnostics.some((d) => d.rule === 'font.unknown-family')).toBe(false);
  });
});
