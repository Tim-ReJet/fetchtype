import { z } from 'zod';

// -- Validation types --

export const SeveritySchema = z.enum(['error', 'warning', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;

export const DiagnosticSchema = z.object({
  rule: z.string(),
  severity: SeveritySchema,
  path: z.string(),
  message: z.string(),
  expected: z.string().optional(),
  actual: z.string().optional(),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

export const ValidationReportSchema = z.object({
  diagnostics: z.array(DiagnosticSchema),
  counts: z.object({
    error: z.number(),
    warning: z.number(),
    info: z.number(),
  }),
  pass: z.boolean(),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;

// -- Validator interface --

export type Validator = {
  name: string;
  run: (tokenSet: unknown, config: ValidatorConfig) => Diagnostic[];
};

export type ValidatorConfig = {
  severity: Record<string, Severity>;
  disable: string[];
};
