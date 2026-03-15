#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const cwd = getArg('cwd') || process.cwd();

const npm = spawn('npm', ['run', 'lint'], { cwd, shell: true, stdio: ['inherit', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';

npm.stdout.on('data', (data) => { stdout += data.toString(); });
npm.stderr.on('data', (data) => { stderr += data.toString(); });

npm.on('close', (code) => {
  console.log(JSON.stringify({ success: code === 0, exitCode: code, cwd, stdout: stdout.trim(), stderr: stderr.trim() }));
  process.exit(code);
});

npm.on('error', (err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});