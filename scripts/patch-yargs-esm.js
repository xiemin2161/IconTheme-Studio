/**
 * Workaround for environments where yargs misses lib/platform-shims files.
 * Recreates missing ESM shim by delegating to cjsPlatformShim.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const yargsEsmEntry = path.join(projectRoot, 'node_modules', 'yargs', 'index.mjs');
const yargsEsmShim = path.join(
  projectRoot,
  'node_modules',
  'yargs',
  'lib',
  'platform-shims',
  'esm.mjs',
);

if (!fs.existsSync(yargsEsmEntry)) {
  console.log('Skip yargs patch: index.mjs not found.');
  process.exit(0);
}

const shimSource =
  "import cjsBundle from '../../build/index.cjs';\n\nexport default cjsBundle.cjsPlatformShim;\n";
const shimDir = path.dirname(yargsEsmShim);
if (!fs.existsSync(shimDir)) {
  fs.mkdirSync(shimDir, { recursive: true });
}

let shimUpdated = false;
if (!fs.existsSync(yargsEsmShim) || fs.readFileSync(yargsEsmShim, 'utf8') !== shimSource) {
  fs.writeFileSync(yargsEsmShim, shimSource, 'utf8');
  shimUpdated = true;
}

const entryFallback = `'use strict';\n\nimport cjsYargs from './index.cjs';\nexport default cjsYargs;\n`;
let entryUpdated = false;
const currentEntry = fs.readFileSync(yargsEsmEntry, 'utf8');
if (currentEntry !== entryFallback && currentEntry.includes("./lib/platform-shims/esm.mjs")) {
  fs.writeFileSync(yargsEsmEntry, entryFallback, 'utf8');
  entryUpdated = true;
}

if (shimUpdated || entryUpdated) {
  console.log('Patched yargs ESM files for missing platform-shims.');
} else {
  console.log('No yargs ESM patch needed.');
}
