#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const endpoint = getArg('endpoint');
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

if (!endpoint) {
  console.error(JSON.stringify({ error: 'Usage: --endpoint "/api/path?params" [--host 10.0.0.149] [--port 3100]' }));
  process.exit(1);
}

const req = http.request({
  hostname: host,
  port: parseInt(port),
  path: endpoint.startsWith('/') ? endpoint : '/' + endpoint,
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(body);
      console.log(JSON.stringify({ success: res.statusCode === 200, status: res.statusCode, data: r }));
      process.exit(res.statusCode === 200 ? 0 : 1);
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

req.end();