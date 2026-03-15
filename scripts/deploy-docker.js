#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const composePath = getArg('compose');
const envFile = getArg('env-file');
const action = getArg('action') || 'up';
const host = getArg('host') || 'FirstfettNAS';
const user = getArg('user') || 'fettbot';

if (!composePath) {
  console.error(JSON.stringify({ error: 'Usage: --compose /path/to/docker-compose.yml [--env-file /path/.env] [--action up|down|restart] [--host FirstfettNAS]' }));
  process.exit(1);
}

let cmd = `sudo /usr/local/bin/docker compose -f ${composePath}`;
if (envFile) cmd += ` --env-file ${envFile}`;
if (action === 'up') cmd += ' up -d';
else if (action === 'down') cmd += ' down';
else if (action === 'restart') cmd += ' restart';
else cmd += ` ${action}`;

const ssh = spawn('ssh', [`${user}@${host}`, cmd], { stdio: ['inherit', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';

ssh.stdout.on('data', (data) => { stdout += data.toString(); });
ssh.stderr.on('data', (data) => { stderr += data.toString(); });

ssh.on('close', (code) => {
  console.log(JSON.stringify({ success: code === 0, exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
  process.exit(code);
});

ssh.on('error', (err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});