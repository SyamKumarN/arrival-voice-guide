// run-tests.js — `npm test` (or `node tests/run-tests.js`)
// Prints every failure and a count per group; full PASS lines with --verbose.
import { readFileSync } from 'node:fs';
import { runSuite } from './suite.js';
import { runMatrix } from './matrix.js';
import { runListen } from './listen.js';
import { runUnderstand } from './understand.js';
import { runResume } from './resume.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const data = load('../public/data/airports.json');
const rates = load('../public/data/rates-sample.json');
const verbose = process.argv.includes('--verbose');

const results = [...runSuite(data, rates), ...runMatrix(data, rates), ...runListen(), ...(await runUnderstand(data, rates)), ...runResume(data, rates)];
const groups = {};
for (const r of results) {
  const g = (groups[r.group] ||= { pass: 0, fail: 0 });
  r.ok ? g.pass++ : g.fail++;
  if (!r.ok || verbose) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.group} | ${r.name}${r.ok ? '' : '\n      ' + r.detail}`);
}
console.log('');
for (const [g, c] of Object.entries(groups)) console.log(`${g.padEnd(14)} ${c.pass}/${c.pass + c.fail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
