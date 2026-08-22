/**
 * AMIRTHA AI — asset writer
 *
 * Every build script ends with writeAsset(), so minification, the size
 * report and the asset budget check all live in exactly one place.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { minify } from './theme.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ASSET_DIR = join(ROOT, 'assets');

/** Per-asset ceiling from the plan. Exceeding it is a build failure, not a warning. */
const BUDGET_KB = 120;

export async function writeAsset(name, svg, { budgetKb = BUDGET_KB } = {}) {
  const out = minify(svg);
  const kb = Buffer.byteLength(out, 'utf8') / 1024;

  if (kb > budgetKb) {
    throw new Error(
      `${name} is ${kb.toFixed(1)} KB, over the ${budgetKb} KB budget. ` +
      `Drop an unused font face or simplify the artwork.`
    );
  }

  await mkdir(ASSET_DIR, { recursive: true });
  await writeFile(join(ASSET_DIR, name), out, 'utf8');
  console.log(`  ${name.padEnd(28)} ${kb.toFixed(1).padStart(6)} KB`);
  return kb;
}
