#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes('--' + name);

const command = getArg('command') || args.find(a => !a.startsWith('--'));
const host = getArg('host') || 'FirstfettNAS';
const user = getArg('user') || 'fettbot';
const sudo = hasFlag('sudo');

if (!command) {
  console.error(JSON.stringify({ error: 'Usage: --command "shell command" [--host FirstfettNAS] [--user fettbot] [--sudo]' }));
  process.exit(1);
}

const sshCmd = sudo ? `sudo ${command}` : command;
const ssh = spawn('ssh', [`${user}@${host}`, sshCmd], { stdio: ['inherit', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';

ssh.stdout.on('data', (data) => { stdout += data.toString(); });
ssh.stderr.on('data', (data) => { stderr += data.toString(); });

ssh.on('close', (code) => {
  console.log(JSON.stringify({ 
    success: code === 0, 
    exitCode: code, 
    stdout: stdout.trim(), 
    stderr: stderr.trim() 
  }));
  process.exit(code);
});

ssh.on('error', (err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});