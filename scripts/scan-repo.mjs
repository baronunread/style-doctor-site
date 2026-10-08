// Run manually: node scripts/scan-repo.mjs /path/to/checkout owner/repo
// Only committed files are scanned. No repository code is executed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport } from 'style-doctor';

const [checkout, repository] = process.argv.slice(2);
if (!checkout || !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) {
  throw new Error('Usage: node scripts/scan-repo.mjs /path/to/checkout owner/repo');
}
const directory = resolve(checkout);
const git = (...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
if (git('status', '--porcelain').trim()) throw new Error('Use a clean checkout for a reproducible snapshot.');
const commit = git('rev-parse', 'HEAD').trim();
const excluded = /(^|\/)(node_modules|\.git|dist|build|out|vendor|coverage|\.next|\.cache)(\/|$)/;
const extensions = /\.(md|markdown|mdx|txt|astro|jsx|tsx|html|htm|vue|svelte)$/;
const files = git('ls-files', '-z').split('\0').filter((path) => extensions.test(path) && !excluded.test(path));
if (!files.length) throw new Error('No supported tracked files found.');
const report = buildReport(directory, { files, scope: 'full', blocking: 'none' });
const publicReport = { ...report };
delete publicReport.directory;
delete publicReport.elapsedMilliseconds;
const snapshot = { repository, commit, scannedAt: new Date().toISOString(), policy: 'tracked-prose-v1', ...publicReport };
const target = fileURLToPath(new URL(`../public/scans/${repository.replace('/', '--')}.json`, import.meta.url));
mkdirSync(resolve(target, '..'), { recursive: true });
writeFileSync(target, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`${repository}: ${report.score}/100, ${report.scannedFileCount} files, ${report.words} words, ${report.summary.issues} findings → ${target}`);
