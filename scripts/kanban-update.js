#!/usr/bin/env node
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const id = getArg('id');
const title = getArg('title');
const description = getArg('description');
const status = getArg('status');
const priority = getArg('priority');
const workNotes = getArg('workNotes');
const host = getArg('host') || '10.0.0.149';
const port = getArg('port') || '3100';

if (!id) {
  console.error(JSON.stringify({ error: 'Usage: --id card-xxx [--title text] [--description text] [--status todo|inprogress|done] [--priority Critical|High|Medium|Low] [--workNotes text]' }));
  process.exit(1);
}

// First get current version
const getReq = http.request({
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
      if (res.statusCode !== 200) {
        console.error(JSON.stringify({ error: r.message || body, status: res.statusCode }));
        process.exit(1);
      }
      const version = r.data?.version || r.version;
      
      // Now update with version
      const payload = { version };
      if (title) payload.title = title;
      if (description) payload.description = description;
      if (status) payload.status = status;
      if (priority) payload.priority = priority;
      if (workNotes) payload.workNotes = workNotes;
      
      const data = JSON.stringify(payload);
      
      const updateReq = http.request({
        hostname: host,
        port: parseInt(port),
        path: '/api/kanban/cards/' + id,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (updateRes) => {
        let updateBody = '';
        updateRes.on('data', chunk => updateBody += chunk);
        updateRes.on('end', () => {
          try {
            const ur = JSON.parse(updateBody);
            if (updateRes.statusCode === 200) {
              console.log(JSON.stringify({ success: true, id: id, version: ur.data?.version || ur.version }));
            } else {
              console.error(JSON.stringify({ error: ur.message || updateBody, status: updateRes.statusCode }));
              process.exit(1);
            }
          } catch (e) {
            console.error(JSON.stringify({ error: 'Parse error: ' + e.message, body: updateBody }));
            process.exit(1);
          }
        });
      });
      
      updateReq.on('error', (e) => {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      });
      
      updateReq.write(data);
      updateReq.end();
      
    } catch (e) {
      console.error(JSON.stringify({ error: 'Parse error: ' + e.message, body: body }));
      process.exit(1);
    }
  });
});

getReq.on('error', (e) => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});

getReq.end();