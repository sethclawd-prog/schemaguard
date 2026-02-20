/**
 * Output formatting — human-readable and JSON reporters.
 */

import { DiffResult } from './differ';

export type OutputFormat = 'human' | 'json';

export function formatDiff(result: DiffResult, format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  return formatHuman(result);
}

function formatHuman(result: DiffResult): string {
  const lines: string[] = [];

  if (result.totalChanges === 0) {
    lines.push('✅ No changes detected between specs.');
    return lines.join('\n');
  }

  lines.push(`Found ${result.totalChanges} change(s):\n`);

  if (result.breaking.length > 0) {
    lines.push(`❌ BREAKING CHANGES (${result.breaking.length}):`);
    lines.push('─'.repeat(50));
    for (const change of result.breaking) {
      lines.push(`  ⛔ [${change.rule}]`);
      lines.push(`     ${change.message}`);
      lines.push(`     at: ${change.path}`);
      lines.push('');
    }
  }

  if (result.nonBreaking.length > 0) {
    lines.push(`ℹ️  NON-BREAKING CHANGES (${result.nonBreaking.length}):`);
    lines.push('─'.repeat(50));
    for (const change of result.nonBreaking) {
      lines.push(`  ✅ [${change.rule}]`);
      lines.push(`     ${change.message}`);
      lines.push(`     at: ${change.path}`);
      lines.push('');
    }
  }

  lines.push('─'.repeat(50));
  if (result.hasBreakingChanges) {
    lines.push(`\n🚨 ${result.breaking.length} breaking change(s) detected — deployment blocked.`);
  } else {
    lines.push(`\n✅ All changes are non-breaking — safe to deploy.`);
  }

  return lines.join('\n');
}

export function formatLint(issues: string[]): string {
  if (issues.length === 0) {
    return '✅ Spec is valid — no issues found.';
  }

  const lines = [
    `⚠️  Found ${issues.length} issue(s):\n`,
    ...issues.map(issue => `  • ${issue}`),
  ];

  return lines.join('\n');
}
