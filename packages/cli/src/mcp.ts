import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  buildTokenArtifacts,
  generateCssVariables,
  generateShadcnCss,
  generateTailwindConfig,
  getPreset,
  parseDesignTokenSet,
  PRESET_NAMES,
  PRESETS,
  resolveDesignTokenSet,
  validateDesignTokenSet,
} from '@fetchtype/core';
import { suggestFonts, type SuggestionContext } from '@fetchtype/fonts';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'fetchtype',
    version: '0.1.0',
  });

  server.tool(
    'fetchtype_validate',
    'Validate a design token set against fetchtype rules',
    { tokens: z.record(z.string(), z.unknown()) },
    async ({ tokens }) => {
      const report = validateDesignTokenSet(tokens);
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    },
  );

  server.tool(
    'fetchtype_build',
    'Build artifacts (CSS, JSON, Tailwind, shadcn) from a design token set',
    {
      tokens: z.record(z.string(), z.unknown()),
      format: z.enum(['css', 'json', 'tailwind', 'shadcn']).optional(),
    },
    async ({ tokens, format }) => {
      const artifacts = buildTokenArtifacts(tokens);

      if (!artifacts.report.pass) {
        return {
          content: [{ type: 'text', text: JSON.stringify(artifacts.report, null, 2) }],
          isError: true,
        };
      }

      let output: string;
      switch (format) {
        case 'tailwind':
          output = generateTailwindConfig(artifacts.tokenSet);
          break;
        case 'shadcn':
          output = generateShadcnCss(artifacts.tokenSet);
          break;
        case 'json':
          output = artifacts.json;
          break;
        case 'css':
        default:
          output = artifacts.css;
          break;
      }

      return { content: [{ type: 'text', text: output }] };
    },
  );

  server.tool(
    'fetchtype_suggest',
    'Suggest fonts for a given usage context',
    {
      context: z.enum(['display', 'interface', 'reading', 'mono']),
      limit: z.number().optional(),
      variableOnly: z.boolean().optional(),
    },
    async ({ context, limit, variableOnly }) => {
      const suggestions = suggestFonts(context as SuggestionContext, {
        limit: limit ?? 5,
        variableOnly: variableOnly ?? false,
      });
      return { content: [{ type: 'text', text: JSON.stringify(suggestions, null, 2) }] };
    },
  );

  server.tool(
    'fetchtype_init',
    'Get a starter token set, optionally from a named preset',
    { preset: z.string().optional() },
    async ({ preset }) => {
      const tokenSet = preset ? getPreset(preset) : getPreset('base');
      if (!tokenSet) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown preset "${preset}". Available: ${PRESET_NAMES.join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(tokenSet, null, 2) }] };
    },
  );

  server.tool(
    'fetchtype_presets',
    'List available fetchtype presets',
    {},
    async () => {
      const presetList = PRESET_NAMES.map((name) => ({
        name,
        description: getPresetDescription(name),
      }));
      return { content: [{ type: 'text', text: JSON.stringify(presetList, null, 2) }] };
    },
  );

  return server;
}

function getPresetDescription(name: string): string {
  const descriptions: Record<string, string> = {
    base: 'Clean sans-serif foundation with Inter. Good starting point for most projects.',
    editorial: 'Serif-forward layout optimized for long-form reading and articles.',
    dashboard: 'Compact, data-dense typography for admin panels and analytics.',
    ecommerce: 'Product-focused hierarchy with clear pricing and CTA typography.',
    docs: 'Technical documentation layout with strong code and prose support.',
  };
  return descriptions[name] ?? 'No description available.';
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
