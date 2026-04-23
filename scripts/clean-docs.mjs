// Remove Vite-owned artifacts from docs/ while preserving docs/superpowers/.
// Runs automatically before `npm run build` via the `prebuild` npm script.

import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

// Everything Vite might produce under outDir=docs. Add more if the build
// output grows new top-level entries.
const viteArtifacts = ['index.html', 'assets', 'data', '.vite'];

for (const name of viteArtifacts) {
  const target = resolve(repoRoot, 'docs', name);
  await rm(target, { recursive: true, force: true });
}
