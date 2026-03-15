#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const agent = getArg('agent');
const task = getArg('task');
const status = getArg('status') || 'completed';
const model = getArg('model') || 'unknown';
const ticket = getArg('ticket');
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

if (!agent || !task) {
  console.error(JSON.stringify({ error: 'Usage: --agent name --task "description" [--status completed|failed] [--model name] [--ticket card-xxx]' }));
  process.exit(1);
}

const payload = { agent_name: agent, task_description: task, model_used: model, status };
if (ticket) payload.ticket_id = ticket;

const data = JSON.stringify(payload);

const req = http.request({
  hostname: host,
  port: parseInt(port),
  path: '/api/agent-logs',
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
      if (res.statusCode === 200 || res.statusCode === 201) {
        const r = JSON.parse(body);
        console.log(JSON.stringify({ success: true, id: r.id || r.data?.id }));
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