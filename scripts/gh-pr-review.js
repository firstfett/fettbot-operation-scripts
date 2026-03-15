#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const owner = getArg('owner');
const repo = getArg('repo');
const pr = getArg('pr');
const event = getArg('event') || 'COMMENT';
const body = getArg('body') || '';
const tokenFile = getArg('token-file') || 'C:\\Users\\Fettbot\\.openclaw\\.env.github';

if (!owner || !repo || !pr) {
  console.error(JSON.stringify({ error: 'Usage: --owner X --repo Y --pr N [--event APPROVE|REQUEST_CHANGES|COMMENT] [--body text]' }));
  process.exit(1);
}

const tokenLine = fs.readFileSync(tokenFile, 'utf8').trim();
const token = tokenLine.includes('=') ? tokenLine.split('=')[1] : tokenLine;

const data = JSON.stringify({ event, body });

const req = https.request({
  hostname: 'api.github.com',
  path: '/repos/' + owner + '/' + repo + '/pulls/' + pr + '/reviews',
  method: 'POST',
  headers: {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'fettbot-scripts',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let respBody = '';
  res.on('data', chunk => respBody += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const r = JSON.parse(respBody);
      console.log(JSON.stringify({ success: true, id: r.id, state: r.state }));
    } else {
      console.error(JSON.stringify({ error: respBody, status: res.statusCode }));
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});

req.write(data);
req.end();