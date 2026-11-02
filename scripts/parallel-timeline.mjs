// Builds parallel-execution evidence from reports/results.json:
// which worker ran each test, when it started/ended, and the peak number of
// tests running at the same moment. Writes evidence/parallel-timeline.md.
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] ?? 'reports/results.json';
const output = process.argv[3] ?? 'evidence/parallel-timeline.md';
const report = JSON.parse(fs.readFileSync(input, 'utf8'));

const runs = [];
function walk(suite, file) {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      for (const r of t.results) {
        if (r.status === 'skipped') continue;
        const start = Date.parse(r.startTime);
        runs.push({ title: spec.title, project: t.projectName, worker: r.parallelIndex, start, end: start + r.duration, status: r.status, file });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, file ?? child.file);
}
report.suites.forEach((s) => walk(s, s.file));
if (!runs.length) throw new Error('No executed tests in ' + input);

runs.sort((a, b) => a.start - b.start);
const t0 = runs[0].start;
const tEnd = Math.max(...runs.map((r) => r.end));

// Peak concurrency: sweep over start/end events.
const events = runs.flatMap((r) => [[r.start, 1], [r.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
let current = 0, peak = 0;
for (const [, delta] of events) { current += delta; peak = Math.max(peak, current); }

const workers = [...new Set(runs.map((r) => r.worker))].sort((a, b) => a - b);
const width = 60;
const bar = (r) => {
  const from = Math.floor(((r.start - t0) / (tEnd - t0)) * width);
  const to = Math.max(from + 1, Math.ceil(((r.end - t0) / (tEnd - t0)) * width));
  return ' '.repeat(from) + '█'.repeat(to - from);
};

const sumDurations = runs.reduce((s, r) => s + (r.end - r.start), 0);
const lines = [
  '# Parallel execution evidence',
  '',
  `Source: \`${input}\` · generated ${new Date().toISOString()}`,
  '',
  `- Tests executed: **${runs.length}** (${runs.filter((r) => r.status === 'passed').length} passed)`,
  `- Workers used: **${workers.length}** (parallel indexes ${workers.join(', ')})`,
  `- Peak tests running at the same time: **${peak}**`,
  `- Wall-clock time: **${((tEnd - t0) / 1000).toFixed(1)} s** vs. sum of test durations **${(sumDurations / 1000).toFixed(1)} s**`,
  '',
  '## Timeline (each bar = one test, rows grouped by worker)',
  '',
  '```text',
];
for (const w of workers) {
  lines.push(`worker ${w}`);
  for (const r of runs.filter((x) => x.worker === w)) {
    lines.push(`  |${bar(r).padEnd(width)}| ${r.title.slice(0, 70)}`);
  }
}
lines.push('```', '', '## Detail', '', '| Worker | Start (+s) | Duration (s) | Project | Status | Test |', '|---|---|---|---|---|---|');
for (const r of runs) {
  lines.push(`| ${r.worker} | ${((r.start - t0) / 1000).toFixed(2)} | ${((r.end - r.start) / 1000).toFixed(2)} | ${r.project} | ${r.status} | ${r.title.replace(/\|/g, '\\|')} |`);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lines.join('\n') + '\n');
console.log(`workers=${workers.length} peakConcurrency=${peak} tests=${runs.length} -> ${output}`);
