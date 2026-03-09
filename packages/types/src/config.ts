import { z } from 'zod';

import { SeveritySchema } from './validation.js';

// -- Config schema --

export const ExportFormatSchema = z.enum(['css', 'json', 'tailwind', 'shadcn']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const FetchTypeConfigSchema = z.object({
  tokens: z.union([z.string(), z.array(z.string())]).default('tokens/**/*.json'),
  outDir: z.string().default('dist/tokens'),
  exporters: z.array(ExportFormatSchema).default(['css', 'json']),
  themes: z
    .object({
      default: z.string().default('light'),
    })
    .default({}),
  validation: z
    .object({
      severity: z.record(z.string(), SeveritySchema).default({}),
      disable: z.array(z.string()).default([]),
    })
    .default({}),
  plugins: z.array(z.string()).default([]),
  fonts: z
    .object({
      googleFontsApiKey: z.string().optional(),
      cacheDir: z.string().default('.fetchtype/fonts'),
    })
    .default({}),
});
export type FetchTypeConfig = z.infer<typeof FetchTypeConfigSchema>;
