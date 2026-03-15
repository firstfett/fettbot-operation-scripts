#!/usr/bin/env node
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const message = getArg('message');
const cwd = getArg('cwd') || process.cwd();

if (!message) {
  console.error(JSON.stringify({ error: 'Usage: --message "commit message" [--cwd /path/to/repo]' }));
  process.exit(1);
}

const results = [];

// git add -A
let r = spawnSync('git', ['add', '-A'], { cwd, encoding: 'utf8' });
results.push({ cmd: 'git add -A', code: r.status, stderr: r.stderr?.trim() });
if (r.status !== 0) {
  console.error(JSON.stringify({ error: 'git add failed', results }));
  process.exit(1);
}

// git commit
r = spawnSync('git', ['commit', '-m', message], { cwd, encoding: 'utf8' });
results.push({ cmd: 'git commit', code: r.status, stdout: r.stdout?.trim(), stderr: r.stderr?.trim() });
if (r.status !== 0 && !r.stdout?.includes('nothing to commit')) {
  console.error(JSON.stringify({ error: 'git commit failed', results }));
  process.exit(1);
}

// git push
r = spawnSync('git', ['push'], { cwd, encoding: 'utf8' });
results.push({ cmd: 'git push', code: r.status, stderr: r.stderr?.trim() });

console.log(JSON.stringify({ success: r.status === 0, message, cwd, results }));
process.exit(r.status);