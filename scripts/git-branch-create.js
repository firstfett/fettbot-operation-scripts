#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const branch = getArg('branch');
const cwd = getArg('cwd') || process.cwd();

if (!branch) {
  console.error(JSON.stringify({ error: 'Usage: --branch feature/name [--cwd /path/to/repo]' }));
  process.exit(1);
}

const git = spawn('git', ['checkout', '-b', branch], { cwd, stdio: ['inherit', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';

git.stdout.on('data', (data) => { stdout += data.toString(); });
git.stderr.on('data', (data) => { stderr += data.toString(); });

git.on('close', (code) => {
  console.log(JSON.stringify({ success: code === 0, branch, cwd, stdout: stdout.trim(), stderr: stderr.trim() }));
  process.exit(code);
});

git.on('error', (err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});