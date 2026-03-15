#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const status = getArg('status');
const priority = getArg('priority');
const limit = getArg('limit') || '20';
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

let path = '/api/kanban/cards?limit=' + limit;
if (status) path += '&status=' + status;
if (priority) path += '&priority=' + priority;

const req = http.request({
  hostname: host,
  port: parseInt(port),
  path: path,
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(body);
      if (res.statusCode === 200) {
        const cards = r.data || r;
        const result = Array.isArray(cards) ? cards.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          priority: c.priority
        })) : [];
        console.log(JSON.stringify({ cards: result, count: result.length }));
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