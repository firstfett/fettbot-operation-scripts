#!/usr/bin/env node
const http = require('http');
const https = require('https');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const url = getArg('url');
const timeout = parseInt(getArg('timeout') || '5000');
const expectStatus = parseInt(getArg('expect-status') || '200');

if (!url) {
  console.error(JSON.stringify({ error: 'Usage: --url http://host:port/path [--timeout 5000] [--expect-status 200]' }));
  process.exit(1);
}

const client = url.startsWith('https') ? https : http;

const req = client.get(url, { timeout }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const healthy = res.statusCode === expectStatus;
    console.log(JSON.stringify({ 
      healthy, 
      url, 
      status: res.statusCode, 
      expected: expectStatus,
      body: body.substring(0, 500)
    }));
    process.exit(healthy ? 0 : 1);
  });
});

req.on('timeout', () => {
  console.error(JSON.stringify({ error: 'Request timed out', url, timeout }));
  req.destroy();
  process.exit(1);
});

req.on('error', (e) => {
  console.error(JSON.stringify({ error: e.message, url }));
  process.exit(1);
});