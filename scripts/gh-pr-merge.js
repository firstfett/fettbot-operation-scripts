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
const tokenFile = getArg('token-file') || 'C:\\Users\\Fettbot\\.openclaw\\.env.github';

if (!owner || !repo || !pr) {
  console.error(JSON.stringify({ error: 'Usage: --owner X --repo Y --pr N' }));
  process.exit(1);
}

let token;
try {
  const tokenLine = fs.readFileSync(tokenFile, 'utf8').trim();
  token = tokenLine.includes('=') ? tokenLine.split('=')[1] : tokenLine;
} catch (e) {
  console.error(JSON.stringify({ error: 'Cannot read token file: ' + e.message }));
  process.exit(1);
}

const data = JSON.stringify({ merge_method: 'squash' });

const req = https.request({
  hostname: 'api.github.com',
  path: '/repos/' + owner + '/' + repo + '/pulls/' + pr + '/merge',
  method: 'PUT',
  headers: {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'fettbot-scripts',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const r = JSON.parse(body);
        console.log(JSON.stringify({ success: true, sha: r.sha }));
      } else {
        console.error(JSON.stringify({ error: body, status: res.statusCode }));
        process.exit(1);
      }
    } catch (e) {
      console.error(JSON.stringify({ error: 'Parse error: ' + e.message, body: body }));
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