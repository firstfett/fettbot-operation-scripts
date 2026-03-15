#!/usr/bin/env node
const fs = require('fs');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const filePath = getArg('path') || args.find(a => !a.startsWith('--'));
const encoding = getArg('encoding') || 'utf8';
const maxBytes = parseInt(getArg('max-bytes') || '1048576'); // 1MB default

if (!filePath) {
  console.error(JSON.stringify({ error: 'Usage: --path "\\\\FirstfettNAS\\Fettbot\\path\\to\\file" [--encoding utf8] [--max-bytes 1048576]' }));
  process.exit(1);
}

try {
  const stats = fs.statSync(filePath);
  if (stats.size > maxBytes) {
    console.error(JSON.stringify({ error: 'File too large', size: stats.size, maxBytes }));
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, encoding);
  console.log(JSON.stringify({ 
    success: true,
    path: filePath,
    size: stats.size,
    content 
  }));
} catch (e) {
  console.error(JSON.stringify({ error: e.message, path: filePath }));
  process.exit(1);
}