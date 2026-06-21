#!/usr/bin/env node
// Smoke-test: проверяет что dist собран и ключевые файлы на месте.
// Запускается после `npm run build` в CI.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const checks = [
  { path: join(distDir, 'index.html'), minBytes: 500, name: 'index.html' },
];

let failed = 0;

for (const c of checks) {
  if (!existsSync(c.path)) {
    console.error(`✗ ${c.name}: missing`);
    failed++;
    continue;
  }
  const size = statSync(c.path).size;
  if (size < c.minBytes) {
    console.error(`✗ ${c.name}: too small (${size} < ${c.minBytes} bytes)`);
    failed++;
  } else {
    console.log(`✓ ${c.name}: ${size} bytes`);
  }
}

if (existsSync(join(distDir, 'assets'))) {
  console.log('✓ assets/ directory exists');
} else {
  console.error('✗ assets/ directory missing');
  failed++;
}

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');
if (indexHtml.includes('Job Interview Runner')) {
  console.log('✓ title present');
} else {
  console.error('✗ title missing');
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} smoke checks failed`);
  process.exit(1);
}

console.log('\n✓ Smoke test passed');