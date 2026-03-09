import { access, appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

import chalk from 'chalk';
import { Command, CommanderError, Option } from 'commander';
import { lilconfig } from 'lilconfig';

import {
  buildTokenArtifacts,
  DEFAULT_TOKEN_SET,
  exportW3cTokens,
  generateHtmlReport,
  generateShadcnCss,
  generateTailwindConfig,
  getPreset,
  importW3cTokens,
  parseDesignTokenSet,
  PRESET_NAMES,
  validateDesignTokenSet,
  validateFonts,
} from '@fetchtype/core';
import { suggestFonts, type SuggestionContext } from '@fetchtype/fonts';
import { startMcpServer } from './mcp.js';
import { startPreviewServer } from './preview.js';
import { resolvePromptToTokenSet } from './prompt-init.js';
import {
  FetchTypeConfigSchema,
  type FetchTypeConfig,
  type ValidationReport,
} from '@fetchtype/types';

type Logger = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

type BuildFormat = 'all' | 'css' | 'json' | 'tailwind' | 'shadcn' | 'w3c';
type DiagnosticLevel = 'error' | 'warning' | 'notice';

const defaultLogger: Logger = {
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  },
};

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadJsonFile(path: string): Promise<unknown> {
  const contents = await readFile(path, 'utf8');
  return JSON.parse(contents);
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function loadConfig(cwd: string): Promise<FetchTypeConfig | undefined> {
  const explorer = lilconfig('fetchtype', {
    searchPlaces: ['fetchtype.config.json', '.fetchtyperc.json', '.fetchtyperc'],
  });
  const result = await explorer.search(cwd);
  return result ? FetchTypeConfigSchema.parse(result.config) : undefined;
}

function formatReport(report: ValidationReport): string {
  const lines = [`Validation ${report.pass ? 'passed' : 'failed'}.`];

  if (report.diagnostics.length === 0) {
    lines.push('No diagnostics found.');
    return `${lines.join('\n')}\n`;
  }

  for (const diagnostic of report.diagnostics) {
    const actual = diagnostic.actual ? ` (${diagnostic.actual})` : '';
    lines.push(
      `- ${diagnostic.severity.toUpperCase()} ${diagnostic.rule} ${diagnostic.path || '<root>'}: ${diagnostic.message}${actual}`,
    );
  }

  lines.push(
    `Errors: ${report.counts.error}, warnings: ${report.counts.warning}, info: ${report.counts.info}`,
  );

  return `${lines.join('\n')}\n`;
}

function escapeGithubCommandData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeGithubCommandProperty(value: string): string {
  return escapeGithubCommandData(value).replace(/,/g, '%2C').replace(/:/g, '%3A');
}

function toGithubDiagnosticLevel(
  severity: ValidationReport['diagnostics'][number]['severity'],
): DiagnosticLevel {
  if (severity === 'error') {
    return 'error';
  }

  if (severity === 'warning') {
    return 'warning';
  }

  return 'notice';
}

function formatGithubSummary(report: ValidationReport, source: string): string {
  const lines = [
    `## Fetchtype Validation ${report.pass ? 'Passed' : 'Failed'}`,
    '',
    `Source: \`${source}\``,
    '',
    '| Level | Count |',
    '| --- | ---: |',
    `| error | ${report.counts.error} |`,
    `| warning | ${report.counts.warning} |`,
    `| info | ${report.counts.info} |`,
  ];

  if (report.diagnostics.length === 0) {
    lines.push('', 'No diagnostics found.');
    return `${lines.join('\n')}\n`;
  }

  lines.push('', '### Diagnostics', '');

  for (const diagnostic of report.diagnostics) {
    const actual = diagnostic.actual ? ` (actual: ${diagnostic.actual})` : '';
    const location = diagnostic.path ? ` at \`${diagnostic.path}\`` : '';
    lines.push(
      `- [${diagnostic.severity}] \`${diagnostic.rule}\`${location}: ${diagnostic.message}${actual}`,
    );
  }

  return `${lines.join('\n')}\n`;
}

async function emitGithubReport(
  report: ValidationReport,
  source: string,
  logger: Logger,
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (summaryPath) {
    await appendFile(summaryPath, formatGithubSummary(report, source), 'utf8');
  }

  for (const diagnostic of report.diagnostics) {
    const level = toGithubDiagnosticLevel(diagnostic.severity);
    const title = escapeGithubCommandProperty(`fetchtype ${diagnostic.rule}`);
    const file = escapeGithubCommandProperty(source);
    const message = escapeGithubCommandData(
      `${diagnostic.message}${diagnostic.path ? ` (path: ${diagnostic.path})` : ''}${diagnostic.actual ? ` (actual: ${diagnostic.actual})` : ''}`,
    );
    logger.stderr(`::${level} title=${title},file=${file}::${message}\n`);
  }
}

async function handleInit(
  output: string,
  force: boolean,
  presetName: string | undefined,
  prompt: string | undefined,
  cwd: string,
  logger: Logger,
): Promise<number> {
  const target = resolve(cwd, output);
  if (!force && (await pathExists(target))) {
    logger.stderr(chalk.red(`Error: ${output} already exists. Use --force to overwrite.\n`));
    return 2;
  }

  let tokenSet = DEFAULT_TOKEN_SET;
  if (prompt && !presetName) {
    const result = resolvePromptToTokenSet(prompt);
    tokenSet = result.tokenSet;
    logger.stderr(chalk.cyan(`Inferred: ${result.reasoning}\n`));
  } else if (presetName) {
    const preset = getPreset(presetName);
    if (!preset) {
      logger.stderr(
        chalk.red(
          `Error: Unknown preset "${presetName}". Available presets: ${PRESET_NAMES.join(', ')}\n`,
        ),
      );
      return 2;
    }
    tokenSet = preset;
  }

  await writeJsonFile(target, tokenSet);
  logger.stdout(`${chalk.green('Created')} ${output}\n`);
  return 0;
}

async function handleValidate(
  input: string,
  asJson: boolean,
  github: boolean,
  cwd: string,
  logger: Logger,
): Promise<number> {
  const target = resolve(cwd, input);
  const raw = await loadJsonFile(target);
  const report = validateDesignTokenSet(raw);

  // Run font validation and append diagnostics (non-blocking — warnings/info only)
  try {
    const tokenSet = parseDesignTokenSet(raw);
    const fontDiagnostics = validateFonts(tokenSet);
    report.diagnostics.push(...fontDiagnostics);
    for (const diagnostic of fontDiagnostics) {
      report.counts[diagnostic.severity] += 1;
    }
  } catch {
    // If parsing fails, font validation is skipped (schema errors already reported)
  }

  if (asJson) {
    logger.stdout(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    logger.stdout(formatReport(report));
  }

  if (github) {
    await emitGithubReport(report, input, logger);
  }

  return report.pass ? 0 : 1;
}

async function handleBuild(
  input: string,
  outDir: string | undefined,
  prefix: string,
  format: BuildFormat,
  asJson: boolean,
  withReport: boolean,
  cwd: string,
  logger: Logger,
): Promise<number> {
  const config = await loadConfig(cwd);
  const target = resolve(cwd, input);
  const artifacts = buildTokenArtifacts(await loadJsonFile(target), { prefix });

  if (!artifacts.report.pass) {
    if (asJson) {
      logger.stdout(`${JSON.stringify(artifacts.report, null, 2)}\n`);
    } else {
      logger.stdout(formatReport(artifacts.report));
    }

    return 1;
  }

  const outputDirectory = resolve(cwd, outDir ?? config?.outDir ?? 'dist/tokens');
  await mkdir(outputDirectory, { recursive: true });

  const cssPath = resolve(outputDirectory, 'tokens.css');
  const jsonPath = resolve(outputDirectory, 'tokens.json');
  const builtPaths: string[] = [];

  if (format === 'all' || format === 'css') {
    await writeFile(cssPath, `${artifacts.css}\n`, 'utf8');
    builtPaths.push(cssPath);
  }

  if (format === 'all' || format === 'json') {
    await writeFile(jsonPath, `${artifacts.json}\n`, 'utf8');
    builtPaths.push(jsonPath);
  }

  if (format === 'tailwind') {
    const tailwindPath = resolve(outputDirectory, 'tailwind.config.ts');
    const tailwindConfig = generateTailwindConfig(artifacts.tokenSet, { prefix });
    await writeFile(tailwindPath, `${tailwindConfig}\n`, 'utf8');
    builtPaths.push(tailwindPath);
  }

  if (format === 'shadcn') {
    const shadcnPath = resolve(outputDirectory, 'shadcn.css');
    const shadcnCss = generateShadcnCss(artifacts.tokenSet);
    await writeFile(shadcnPath, `${shadcnCss}\n`, 'utf8');
    builtPaths.push(shadcnPath);
  }

  if (format === 'w3c') {
    const w3cPath = resolve(outputDirectory, 'tokens.w3c.json');
    const w3cTokens = exportW3cTokens(artifacts.tokenSet);
    await writeFile(w3cPath, `${JSON.stringify(w3cTokens, null, 2)}\n`, 'utf8');
    builtPaths.push(w3cPath);
  }

  if (withReport) {
    const reportPath = resolve(outputDirectory, 'report.html');
    const htmlReport = generateHtmlReport(artifacts.tokenSet, artifacts.report, artifacts.css);
    await writeFile(reportPath, htmlReport, 'utf8');
    builtPaths.push(reportPath);
  }

  if (asJson) {
    logger.stdout(
      `${JSON.stringify(
        {
          builtPaths,
          report: artifacts.report,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    for (const builtPath of builtPaths) {
      logger.stdout(`${chalk.green('Built')} ${builtPath}\n`);
    }
  }

  return 0;
}

export function createProgram(logger: Logger = defaultLogger, cwd = process.cwd()): Command {
  const program = new Command();

  program
    .name('fetchtype')
    .description('Validate and export typography tokens.')
    .showHelpAfterError();

  program
    .command('init')
    .description('Write a starter token file.')
    .argument('[output]', 'Output file path', 'fetchtype.tokens.json')
    .option('-f, --force', 'Overwrite existing file')
    .option('-p, --preset <name>', 'Use a named preset (base, editorial, dashboard, ecommerce, docs)')
    .option('--prompt <description>', 'Natural language description to infer token configuration')
    .action(async (output: string, options: { force?: boolean; preset?: string; prompt?: string }) => {
      program.setOptionValueWithSource(
        '_result',
        await handleInit(output, Boolean(options.force), options.preset, options.prompt, cwd, logger),
        'cli',
      );
    });

  program
    .command('validate')
    .description('Validate a token file.')
    .requiredOption('-i, --input <path>', 'Path to the token JSON file')
    .option('--github', 'Emit GitHub step summaries and workflow annotations')
    .option('--json', 'Print machine-readable JSON output')
    .action(async (options: { input: string; github?: boolean; json?: boolean }) => {
      program.setOptionValueWithSource(
        '_result',
        await handleValidate(
          options.input,
          Boolean(options.json),
          Boolean(options.github),
          cwd,
          logger,
        ),
        'cli',
      );
    });

  program
    .command('build')
    .description('Generate CSS and JSON bundles from tokens.')
    .requiredOption('-i, --input <path>', 'Path to the token JSON file')
    .option('-o, --out-dir <path>', 'Output directory')
    .option('--prefix <value>', 'CSS variable prefix', 'ft')
    .addOption(
      new Option('--format <type>', 'Artifact format (all, css, json, tailwind, shadcn, w3c)')
        .choices(['all', 'css', 'json', 'tailwind', 'shadcn', 'w3c'])
        .default('all'),
    )
    .option('--json', 'Print machine-readable JSON output')
    .option('--report', 'Generate an HTML report alongside build artifacts')
    .action(
      async (options: {
        input: string;
        outDir?: string;
        prefix: string;
        format: BuildFormat;
        json?: boolean;
        report?: boolean;
      }) => {
        program.setOptionValueWithSource(
          '_result',
          await handleBuild(
            options.input,
            options.outDir,
            options.prefix,
            options.format,
            Boolean(options.json),
            Boolean(options.report),
            cwd,
            logger,
          ),
          'cli',
        );
      },
    );

  program
    .command('import')
    .description('Import a W3C Design Tokens file into fetchtype format.')
    .requiredOption('-i, --input <path>', 'Path to the W3C token JSON file')
    .option('-o, --output <path>', 'Output file path', 'fetchtype.tokens.json')
    .action(async (options: { input: string; output: string }) => {
      const inputPath = resolve(cwd, options.input);
      const outputPath = resolve(cwd, options.output);
      try {
        const raw = await loadJsonFile(inputPath);
        const tokenSet = importW3cTokens(raw);
        const report = validateDesignTokenSet(tokenSet);
        await writeJsonFile(outputPath, tokenSet);
        logger.stdout(`${chalk.green('Imported')} ${options.output}\n`);
        if (!report.pass) {
          logger.stderr(formatReport(report));
        }
        program.setOptionValueWithSource('_result', report.pass ? 0 : 1, 'cli');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.stderr(chalk.red(`Error: ${message}\n`));
        program.setOptionValueWithSource('_result', 2, 'cli');
      }
    });

  program
    .command('suggest')
    .description('Suggest fonts for a given usage context.')
    .requiredOption('-c, --context <type>', 'Usage context (display, interface, reading, mono)')
    .option('-l, --limit <number>', 'Maximum number of suggestions', '5')
    .option('--variable-only', 'Only suggest variable fonts')
    .option('--json', 'Print machine-readable JSON output')
    .action(
      async (options: {
        context: string;
        limit: string;
        variableOnly?: boolean;
        json?: boolean;
      }) => {
        const validContexts = ['display', 'interface', 'reading', 'mono'];
        if (!validContexts.includes(options.context)) {
          logger.stderr(
            chalk.red(
              `Error: Invalid context "${options.context}". Valid contexts: ${validContexts.join(', ')}\n`,
            ),
          );
          program.setOptionValueWithSource('_result', 2, 'cli');
          return;
        }

        const suggestions = suggestFonts(options.context as SuggestionContext, {
          limit: Number(options.limit),
          variableOnly: Boolean(options.variableOnly),
        });

        if (Boolean(options.json)) {
          logger.stdout(`${JSON.stringify(suggestions, null, 2)}\n`);
        } else {
          if (suggestions.length === 0) {
            logger.stdout('No fonts found matching the criteria.\n');
          } else {
            const header = `${'Family'.padEnd(24)} ${'Category'.padEnd(14)} ${'Variable'.padEnd(10)} ${'Size'.padEnd(8)} Reason`;
            logger.stdout(`${header}\n${'─'.repeat(header.length)}\n`);
            for (const suggestion of suggestions) {
              logger.stdout(
                `${suggestion.family.padEnd(24)} ${suggestion.category.padEnd(14)} ${(suggestion.variable ? 'yes' : 'no').padEnd(10)} ${`${suggestion.sizeKb}KB`.padEnd(8)} ${suggestion.reason}\n`,
              );
            }
          }
        }

        program.setOptionValueWithSource('_result', 0, 'cli');
      },
    );

  program
    .command('preview')
    .description('Start a live preview server for token visualization.')
    .requiredOption('-i, --input <path>', 'Path to the token JSON file')
    .option('--port <number>', 'Port to listen on', '3000')
    .action(async (options: { input: string; port: string }) => {
      const target = resolve(cwd, options.input);
      try {
        await startPreviewServer(target, Number(options.port));
        program.setOptionValueWithSource('_result', 0, 'cli');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.stderr(chalk.red(`Error: ${message}\n`));
        program.setOptionValueWithSource('_result', 2, 'cli');
      }
    });

  program
    .command('mcp')
    .description('Start MCP server for AI agent integration (stdio transport).')
    .action(async () => {
      await startMcpServer();
      program.setOptionValueWithSource('_result', 0, 'cli');
    });

  program.exitOverride();
  return program;
}

export async function runCli(
  argv: string[] = process.argv.slice(2),
  logger: Logger = defaultLogger,
  cwd = process.cwd(),
): Promise<number> {
  const program = createProgram(logger, cwd);

  try {
    await program.parseAsync(argv, { from: 'user' });
    return Number(program.getOptionValue('_result') ?? 0);
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.stderr(chalk.red(`Error: ${message}\n`));
    return 2;
  }
}
