#!/usr/bin/env node
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const cwd = getArg('cwd') || process.cwd();

const status = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
const branch = spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' });

const changes = status.stdout?.trim().split('\n').filter(l => l) || [];

console.log(JSON.stringify({
  branch: branch.stdout?.trim(),
  clean: changes.length === 0,
  changes: changes.length,
  files: changes.slice(0, 20),
  cwd
}));