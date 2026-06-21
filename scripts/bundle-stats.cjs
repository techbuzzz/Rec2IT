#!/usr/bin/env node
/**
 * Bundle stats — reports JS/CSS sizes from dist/.
 * Run after `npm run build`.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DIST = path.join(__dirname, '..', 'dist', 'assets');

if (!fs.existsSync(DIST)) {
  console.error('dist/assets not found — run `npm run build` first');
  process.exit(1);
}

const files = fs.readdirSync(DIST).filter((f) => /\.(js|css|html)$/.test(f));

console.log('\n## Bundle Stats\n');
console.log('| File | Size | Gzipped | % of total |');
console.log('|------|------|---------|------------|');

let totalSize = 0;
let totalGzip = 0;
const stats = [];

for (const file of files) {
  const filePath = path.join(DIST, file);
  const content = fs.readFileSync(filePath);
  const size = content.length;
  const gz = zlib.gzipSync(content).length;
  stats.push({ file, size, gz });
  totalSize += size;
  totalGzip += gz;
}

stats.sort((a, b) => b.size - a.size);

for (const { file, size, gz } of stats) {
  const pct = ((size / totalSize) * 100).toFixed(1);
  console.log(`| ${file} | ${formatBytes(size)} | ${formatBytes(gz)} | ${pct}% |`);
}

console.log(`\n**Total:** ${formatBytes(totalSize)} raw / ${formatBytes(totalGzip)} gzipped\n`);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}