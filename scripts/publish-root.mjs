import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const builtIndex = resolve(root, 'dist', 'app', 'index.html');
const builtAssets = resolve(root, 'dist', 'assets');
const distIndex = resolve(root, 'dist', 'index.html');
const rootIndex = resolve(root, 'index.html');
const rootAssets = resolve(root, 'assets');

if (!existsSync(builtIndex) || !existsSync(builtAssets)) {
  throw new Error('Build output missing. Run vite build before publishing root files.');
}

if (existsSync(rootAssets)) rmSync(rootAssets, { recursive: true, force: true });
mkdirSync(rootAssets, { recursive: true });
cpSync(builtAssets, rootAssets, { recursive: true });
cpSync(builtIndex, rootIndex);
cpSync(builtIndex, distIndex);
