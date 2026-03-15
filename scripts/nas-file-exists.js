#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const filePath = getArg('path') || args.find(a => !a.startsWith('--'));

if (!filePath) {
  console.error(JSON.stringify({ error: 'Usage: --path "\\\\FirstfettNAS\\Fettbot\\path\\to\\file"' }));
  process.exit(1);
}

try {
  const exists = fs.existsSync(filePath);
  const stats = exists ? fs.statSync(filePath) : null;
  console.log(JSON.stringify({ 
    exists, 
    path: filePath,
    isFile: stats ? stats.isFile() : null,
    isDirectory: stats ? stats.isDirectory() : null,
    size: stats ? stats.size : null
  }));
  process.exit(exists ? 0 : 1);
} catch (e) {
  console.error(JSON.stringify({ error: e.message, path: filePath }));
  process.exit(1);
}