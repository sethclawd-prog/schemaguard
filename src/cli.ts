#!/usr/bin/env node

/**
 * SchemGuard CLI — API Schema Drift Monitor
 */

import { Command } from 'commander';
import { parseSpec, lintSpec } from './parser';
import { diffSpecs } from './differ';
import { formatDiff, formatLint, OutputFormat } from './reporter';

const program = new Command();

program
  .name('schemaguard')
  .description('API Schema Drift Monitor — detect breaking changes in OpenAPI specs')
  .version('0.1.0');

// diff command
program
  .command('diff <old-spec> <new-spec>')
  .description('Compare two OpenAPI specs and report breaking vs non-breaking changes')
  .option('-f, --format <format>', 'Output format: human or json', 'human')
  .option('--fail-on-breaking', 'Exit with code 1 if breaking changes found', true)
  .action((oldPath: string, newPath: string, opts: { format: string; failOnBreaking: boolean }) => {
    try {
      const oldSpec = parseSpec(oldPath);
      const newSpec = parseSpec(newPath);
      const result = diffSpecs(oldSpec, newSpec);

      console.log(formatDiff(result, opts.format as OutputFormat));

      if (opts.failOnBreaking && result.hasBreakingChanges) {
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

// ci command
program
  .command('ci')
  .description('CI mode — compare spec against baseline, fail on breaking changes')
  .requiredOption('-s, --spec <path>', 'Path to current OpenAPI spec')
  .requiredOption('-b, --baseline <path>', 'Path to baseline OpenAPI spec')
  .option('-f, --format <format>', 'Output format: human or json', 'human')
  .action((opts: { spec: string; baseline: string; format: string }) => {
    try {
      const baselineSpec = parseSpec(opts.baseline);
      const currentSpec = parseSpec(opts.spec);
      const result = diffSpecs(baselineSpec, currentSpec);

      console.log(formatDiff(result, opts.format as OutputFormat));

      if (result.hasBreakingChanges) {
        console.log('\n🚫 CI check FAILED — breaking changes detected.');
        process.exit(1);
      } else if (result.totalChanges > 0) {
        console.log('\n✅ CI check PASSED — changes are non-breaking.');
      } else {
        console.log('\n✅ CI check PASSED — no changes detected.');
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

// lint command
program
  .command('lint <spec>')
  .description('Validate OpenAPI spec quality')
  .option('-f, --format <format>', 'Output format: human or json', 'human')
  .action((specPath: string, opts: { format: string }) => {
    try {
      const spec = parseSpec(specPath);
      const issues = lintSpec(spec);

      if (opts.format === 'json') {
        console.log(JSON.stringify({ issues, count: issues.length, valid: issues.length === 0 }, null, 2));
      } else {
        console.log(formatLint(issues));
      }

      if (issues.length > 0) {
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

program.parse();
