#!/usr/bin/env node
// Runs every suite in one go, then prints + saves a per-suite summary.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = ['playwright', 'test', ...process.argv.slice(2)];
const run = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });

const jsonPath = path.join('results', 'results.json');
if (!fs.existsSync(jsonPath)) {
  console.error('\nNo results/results.json produced - the run did not complete.');
  process.exit(run.status || 1);
}
const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const suites = {};
const failures = [];
(function walk(node) {
  for (const spec of node.specs || []) {
    const m = spec.file.replace(/\\/g, '/').match(/^(?:tests\/)?([^/]+)\//);
    const suite = m ? m[1] : 'other';
    suites[suite] ||= { passed: 0, failed: 0, flaky: 0, skipped: 0, duration: 0 };
    for (const t of spec.tests) {
      const s = t.status; // expected | unexpected | flaky | skipped
      if (s === 'expected') suites[suite].passed++;
      else if (s === 'unexpected') { suites[suite].failed++; failures.push(`[${suite}] ${spec.title} :: ${(t.results.at(-1)?.error?.message || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0]}`); }
      else if (s === 'flaky') suites[suite].flaky++;
      else suites[suite].skipped++;
      suites[suite].duration += t.results.reduce((a, r) => a + r.duration, 0);
    }
  }
  (node.suites || []).forEach(walk);
})({ suites: report.suites });

const rows = Object.entries(suites).sort();
const tot = rows.reduce((a, [, v]) => ({ passed: a.passed + v.passed, failed: a.failed + v.failed, flaky: a.flaky + v.flaky, skipped: a.skipped + v.skipped }), { passed: 0, failed: 0, flaky: 0, skipped: 0 });

let md = `# Test Results\n\n_Run: ${new Date().toISOString()}_\n\n| Suite | Passed | Failed | Flaky | Skipped | Time (s) |\n|---|---:|---:|---:|---:|---:|\n`;
for (const [name, v] of rows) md += `| ${name} | ${v.passed} | ${v.failed} | ${v.flaky} | ${v.skipped} | ${(v.duration / 1000).toFixed(1)} |\n`;
md += `| **TOTAL** | **${tot.passed}** | **${tot.failed}** | **${tot.flaky}** | **${tot.skipped}** | |\n`;
if (failures.length) md += `\n## Failures\n\n${failures.map((f) => `- ${f}`).join('\n')}\n`;

fs.writeFileSync(path.join('results', 'summary.md'), md);
console.log('\n' + md);
process.exit(run.status || 0);
