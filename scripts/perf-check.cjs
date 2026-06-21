#!/usr/bin/env node
/**
 * Performance check — fails if bundle exceeds thresholds.
 * Used in CI pipeline.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DIST = path.join(__dirname, '..', 'dist', 'assets');

const LIMITS = {
  appMaxRaw: 200 * 1024,    // 200KB raw app chunk
  appMaxGz: 100 * 1024,     // 100KB gzipped
  pixiRequired: true,        // pixi must be in separate chunk
  supabaseLazy: true,        // supabase should be in separate chunk
};

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

if (!fs.existsSync(DIST)) {
  console.error('dist/assets not found — run `npm run build` first');
  process.exit(1);
}

console.log('\n🔍 Performance check\n');

// Find app chunk (index-*.js)
const files = fs.readdirSync(DIST);
const appFile = files.find((f) => /^index-.*\.js$/.test(f));
const pixiFile = files.find((f) => /^pixi-.*\.js$/.test(f));
const supabaseFile = files.find((f) => /^supabase-.*\.js$/.test(f) || /supabase/.test(f));

if (appFile) {
  const content = fs.readFileSync(path.join(DIST, appFile));
  const size = content.length;
  const gz = zlib.gzipSync(content).length;
  check('App chunk <200KB raw', size < LIMITS.appMaxRaw, `${(size / 1024).toFixed(1)}KB`);
  check('App chunk <100KB gz', gz < LIMITS.appMaxGz, `${(gz / 1024).toFixed(1)}KB`);
}

if (LIMITS.pixiRequired) {
  check('Pixi in separate chunk (lazy-loaded)', !!pixiFile, pixiFile ?? 'not found');
}

if (LIMITS.supabaseLazy) {
  check('Supabase in separate chunk (lazy-loaded)', !!supabaseFile, supabaseFile ?? 'not found');
}

// Count total chunks
const jsChunks = files.filter((f) => /\.js$/.test(f)).length;
check('Has 4+ JS chunks (good split)', jsChunks >= 4, `${jsChunks} chunks`);

// Check WebP screenshots exist
const screenshots = path.join(__dirname, '..', 'public', 'screenshots');
if (fs.existsSync(screenshots)) {
  const webpCount = fs.readdirSync(screenshots).filter((f) => /\.webp$/.test(f)).length;
  const pngCount = fs.readdirSync(screenshots).filter((f) => /\.png$/.test(f)).length;
  check('WebP screenshots converted', webpCount > 0, `${webpCount} webp, ${pngCount} png fallback`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}