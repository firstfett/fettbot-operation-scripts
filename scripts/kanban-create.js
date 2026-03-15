#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const title = getArg('title');
const description = getArg('description') || '';
const status = getArg('status') || 'todo';
const priority = getArg('priority') || 'Medium';
const tags = getArg('tags');
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

if (!title) {
  console.error(JSON.stringify({ error: 'Usage: --title "Card title" [--description text] [--status todo] [--priority Medium] [--tags "tag1,tag2"]' }));
  process.exit(1);
}

const payload = { title, description, status, priority };
if (tags) payload.tags = tags.split(',').map(t => t.trim());

const data = JSON.stringify(payload);

const req = http.request({
  hostname: host,
  port: parseInt(port),
  path: '/api/kanban/cards',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(body);
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log(JSON.stringify({ success: true, id: r.data?.id || r.id, title: r.data?.title || r.title }));
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

req.write(data);
req.end();