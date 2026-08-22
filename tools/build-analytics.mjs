/**
 * AMIRTHA AI — developer analytics
 *
 *   node tools/build-analytics.mjs   ->   assets/analytics.svg
 *
 * Live GitHub metrics. Every value on this panel is fetched at build time from
 * the GitHub API or derived from the real contribution calendar.
 *
 * THE RULES THIS FILE ENFORCES:
 *   - A metric that cannot be sourced has its tile OMITTED, never zeroed and
 *     never estimated. The tile row sizes itself to whatever is available, so
 *     a missing metric leaves no hole and tells no lie.
 *   - If the fetch fails the script throws and the previously committed asset
 *     stays in place. Stale-but-true beats fresh-but-invented.
 *   - The language split is labelled as bytes across public repositories,
 *     because bytes are what the API reports — they are not a measure of
 *     effort or skill, and the panel should not imply otherwise.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, mono, display, dot, rule, caret, panel, bar,
  monoWidth, displayWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';
import { fetchContributions } from './fetch-contributions.mjs';
import { fetchStats } from './fetch-github-stats.mjs';

const LOGIN = process.env.GITHUB_LOGIN || 'amirthad25';

const ID = 'anl';
const W = CANVAS.width;
const G = CANVAS.gutter;

const TILE_H = 92;
const TILE_GAP = 20;
const TILE_Y = 76;

const LANG_LABEL_Y = 206;
const LANG_Y = 224;
const ROW_H = 28;
const MAX_LANGS = 5;

/* ------------------------------------------------------------------ data */

const contributions = await fetchContributions(LOGIN);
const stats = await fetchStats(LOGIN, contributions);

const plural = (n, word) => `${word}${n === 1 ? '' : 'S'}`;

/** Ordered candidates; anything null is dropped before layout. */
const TILES = [
  { label: 'PUBLIC REPOSITORIES', value: stats.publicRepos },
  { label: 'CONTRIBUTIONS / YEAR', value: stats.totalContributions },
  { label: 'COMMITS / YEAR', value: stats.commits },
  { label: 'CURRENT STREAK', value: stats.currentStreak, unit: plural(stats.currentStreak, 'DAY') },
  { label: 'LONGEST STREAK', value: stats.longestStreak, unit: plural(stats.longestStreak, 'DAY') },
].filter((t) => t.value !== null && t.value !== undefined);

/** Top languages by bytes, with any remainder folded into a single OTHER row. */
const langs = (() => {
  const top = stats.languages.slice(0, MAX_LANGS);
  const restShare = stats.languages.slice(MAX_LANGS).reduce((s, l) => s + l.share, 0);
  if (restShare > 0.0005) top.push({ name: 'Other', share: restShare });
  return top;
})();

/* ------------------------------------------------------------------ body */

const parts = [];

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`
);

/* ---------------------------------------------------------- section head */

{
  const t = 'DEVELOPER ANALYTICS';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const synced = `SYNCED ${new Date().toISOString().slice(0, 10)}`;
  const syncW = monoWidth(synced, TYPE.meta, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  const lineEnd = W - G - syncW - 24;

  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, Math.max(0, lineEnd - lineX), { color: C.line }),
    dot(W - G - syncW - 12, 48, { r: 3, color: C.pinkCore, pulse: 2.6 }),
    label(synced, W - G - syncW, 52, { size: TYPE.meta, fill: C.textMuted, track: TRACK.label })
  );
}

/* ----------------------------------------------------------- metric tiles */

{
  const n = TILES.length;
  const tileW = (CONTENT_W - TILE_GAP * (n - 1)) / n;

  TILES.forEach((tile, i) => {
    const x = G + i * (tileW + TILE_GAP);
    const numText = String(tile.value);
    const numW = displayWidth(numText, 34, 0.01);

    parts.push(
      panel(x, TILE_Y, tileW, TILE_H, { fill: C.surface, stroke: C.line }),
      label(tile.label, x + 18, TILE_Y + 26, { size: 9, fill: C.textMuted, track: TRACK.label }),
      display(numText, x + 18, TILE_Y + 68, { size: 34, fill: C.text, track: 0.01 }),
      `<rect x="${x + 18}" y="${TILE_Y + 81}" width="24" height="2" fill="${C.pinkCore}"/>`
    );

    if (tile.unit) {
      parts.push(
        label(tile.unit, x + 18 + numW + 9, TILE_Y + 68, {
          size: 9, fill: C.pinkGlow, track: TRACK.label,
        })
      );
    }
  });
}

/* --------------------------------------------------- language distribution */

{
  const heading = 'LANGUAGE DISTRIBUTION';
  const note = `BY BYTES ACROSS ${stats.repoCountFetched} PUBLIC REPOSITORIES`;
  const noteW = monoWidth(note, 8, 0.14, { trim: true });

  parts.push(
    caret(G, LANG_LABEL_Y - 4, { size: 6 }),
    label(heading, G + 12, LANG_LABEL_Y, { size: 9, fill: C.pinkGlow, track: TRACK.label }),
    label(note, W - G - noteW, LANG_LABEL_Y, { size: 8, fill: C.textMuted, track: 0.14 })
  );

  const BAR_X = 180;
  const BAR_W = 640;

  langs.forEach((lang, i) => {
    const y = LANG_Y + i * ROW_H;
    const pct = `${(lang.share * 100).toFixed(1)}%`;
    const pctW = monoWidth(pct, 10, 0, { trim: true });

    parts.push(
      label(lang.name, G, y + 13, { size: 10, fill: C.text, track: 0.12 }),
      bar(BAR_X, y + 5, BAR_W, lang.share, { idPrefix: ID, cells: 40, height: 8, gap: 3 }),
      mono(pct, W - G - pctW, y + 13, { size: 10, fill: C.pinkGlow, weight: 500 })
    );
  });
}

const H = LANG_Y + langs.length * ROW_H + 24;
parts.unshift(`<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`);

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    `Developer analytics for ${LOGIN} — ` +
    TILES.map((t) => `${t.label.toLowerCase()}: ${t.value}`).join(', ') +
    `. Languages by bytes: ` +
    langs.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ') + '.',
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

console.log(
  `  tiles=${TILES.length} (${TILES.map((t) => t.value).join('/')}) ` +
  `langs=${langs.length} commits=${stats.commits === null ? 'unavailable' : stats.commits}`
);
await writeAsset('analytics.svg', svg);
