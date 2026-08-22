/**
 * AMIRTHA AI — font fetcher
 *
 * Downloads the `latin` WOFF2 subset for every face in FACES from Google Fonts
 * and writes it to tools/fonts/. Run this once; the files are committed so the
 * build never depends on the network.
 *
 *   node tools/fetch-fonts.mjs
 *
 * Why the latin subset only: SVGs loaded through an <img> tag cannot fetch
 * external resources, so faces are base64-embedded (see build-fonts.mjs). The
 * latin subset keeps each face ~15-25 KB, which fits the asset budget. All
 * profile copy is ASCII, so no other subset is needed.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

// A desktop UA is required — Google Fonts serves ttf, not woff2, to unknown clients.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FACES = [
  { file: 'space-grotesk-500.woff2', family: 'Space Grotesk', weight: 500 },
  { file: 'space-grotesk-700.woff2', family: 'Space Grotesk', weight: 700 },
  { file: 'jetbrains-mono-400.woff2', family: 'JetBrains Mono', weight: 400 },
  { file: 'jetbrains-mono-500.woff2', family: 'JetBrains Mono', weight: 500 },
];

/** Pull the `latin` @font-face block's woff2 URL out of a Google Fonts stylesheet. */
function latinWoff2Url(css) {
  // Blocks are emitted in subset order, each preceded by a `/* subset */` comment.
  const blocks = css.split('@font-face').slice(1);
  for (const block of blocks) {
    // The latin subset is the one whose unicode-range starts at U+0000.
    if (!/unicode-range:\s*U\+0000-00FF/i.test(block)) continue;
    const match = block.match(/url\((https:\/\/[^)]+\.woff2)\)/i);
    if (match) return match[1];
  }
  throw new Error('no latin woff2 block found in stylesheet');
}

async function fetchFace({ file, family, weight }) {
  const cssUrl =
    'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(family).replace(/%20/g, '+') +
    `:wght@${weight}&display=swap`;

  const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': UA } });
  if (!cssRes.ok) throw new Error(`${family} ${weight}: css ${cssRes.status}`);

  const fontUrl = latinWoff2Url(await cssRes.text());
  const fontRes = await fetch(fontUrl, { headers: { 'User-Agent': UA } });
  if (!fontRes.ok) throw new Error(`${family} ${weight}: font ${fontRes.status}`);

  const bytes = Buffer.from(await fontRes.arrayBuffer());
  if (bytes.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`${family} ${weight}: not a woff2 file`);
  }

  await writeFile(join(OUT_DIR, file), bytes);
  return { file, bytes: bytes.length };
}

await mkdir(OUT_DIR, { recursive: true });

let total = 0;
for (const face of FACES) {
  const { file, bytes } = await fetchFace(face);
  total += bytes;
  console.log(`  ${file.padEnd(28)} ${(bytes / 1024).toFixed(1).padStart(6)} KB`);
}
console.log(`  ${'TOTAL'.padEnd(28)} ${(total / 1024).toFixed(1).padStart(6)} KB`);
