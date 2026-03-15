#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const id = getArg('id');
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

if (!id) {
  console.error(JSON.stringify({ error: 'Usage: --id card-xxx' }));
  process.exit(1);
}

const req = http.request({
  hostname: host,
  port: parseInt(port),
  path: '/api/kanban/cards/' + id,
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(body);
      if (res.statusCode === 200) {
        const card = r.data || r;
        console.log(JSON.stringify({
          id: card.id,
          title: card.title,
          status: card.status,
          priority: card.priority,
          version: card.version
        }));
      } else {
        console.error(JSON.stringify({ error: r.message || body, status: res.statusCode }));
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

req.end();