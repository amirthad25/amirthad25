/**
 * AMIRTHA AI — contribution stream
 *
 *   node tools/build-activity.mjs   ->   assets/activity.svg
 *
 * Renders the REAL contribution calendar for GITHUB_LOGIN, with a custom snake
 * sweeping the grid. Data comes from fetch-contributions.mjs and is never
 * synthesised — if the fetch fails, this script throws and the previously
 * committed asset stays untouched.
 *
 * WHY OUR OWN SNAKE RATHER THAN Platane/snk: the plan was to post-process that
 * action's SVG. Writing the renderer here instead means the cell ramp, the
 * head, the trail and the frame all come from theme.mjs directly, there is no
 * second visual language to fight, and nothing breaks if an upstream output
 * format changes. The path is a horizontal serpentine over the seven weekday
 * rows, so the sweep reads as a scan across the year.
 *
 * The snake dims the cells it passes over — with `animateMotion` defaulting to
 * calcMode="paced", travel is at constant speed, so each cell's arrival time is
 * just its distance along the path over the total path length.
 */
import {
  C, TYPE, TRACK, CANVAS,
  svgDocument, defs, label, mono, dot, rule, caret, monoWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';
import { fetchContributions } from './fetch-contributions.mjs';

const LOGIN = process.env.GITHUB_LOGIN || 'amirthad25';

const ID = 'act';
const W = CANVAS.width;
const G = CANVAS.gutter;

/* ------------------------------------------------------------ grid metrics */

const CELL = 12;
const GAP = 4;
const STEP = CELL + GAP;
const ROWS = 7;

const GRID_Y = 104;
const WEEKDAY_X = 44;

/** Level 0..4. Level 0 is the unlit substrate; 1..4 are the pink ramp. */
const RAMP = [C.surface2, C.pinkDim, C.pinkDeep, C.pinkCore, C.pinkGlow];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAY_LABELS = { 1: 'MON', 3: 'WED', 5: 'FRI' };

/** Snake timing. */
const DUR = 24;
const TRAIL_SEGMENTS = 12;
const TRAIL_LAG = 0.035;

/* ------------------------------------------------------------------ data */

const data = await fetchContributions(LOGIN);
const COLS = data.weeks;
const GRID_W = COLS * STEP - GAP;
const GRID_X = Math.round((W - GRID_W) / 2);
const GRID_H = ROWS * STEP - GAP;

const cellX = (col) => GRID_X + col * STEP;
const cellY = (row) => GRID_Y + row * STEP;

/* ----------------------------------------------------------- serpentine */

/** Row 0 runs left to right, row 1 right to left, and so on. */
const posInRow = (row, col) => (row % 2 === 0 ? col : COLS - 1 - col);

const RUN = (COLS - 1) * STEP;              // horizontal travel per row
const ROW_TRAVEL = RUN + STEP;              // plus the drop into the next row
const PATH_LEN = (ROWS - 1) * ROW_TRAVEL + RUN;

/** Fraction of the animation at which the head reaches a cell. */
function arrivalAt(row, col) {
  const d = row * ROW_TRAVEL + posInRow(row, col) * STEP;
  return d / PATH_LEN;
}

function snakePath() {
  const half = CELL / 2;
  const pts = [];
  for (let row = 0; row < ROWS; row++) {
    const y = cellY(row) + half;
    const from = row % 2 === 0 ? 0 : COLS - 1;
    const to = row % 2 === 0 ? COLS - 1 : 0;
    pts.push(`${pts.length ? 'L' : 'M'}${cellX(from) + half} ${y}`);
    pts.push(`L${cellX(to) + half} ${y}`);
  }
  return pts.join(' ');
}

/* ------------------------------------------------------------------ body */

const parts = [];

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`
);

/* ---------------------------------------------------------- section head */

{
  const brand = 'AMIRTHA AI';
  const tail = 'CONTRIBUTION STREAM';
  const brandW = monoWidth(brand, TYPE.label, TRACK.label, { trim: true });
  const cx = G + brandW + 12;

  parts.push(
    label(brand, G, 52, { size: TYPE.label, fill: C.text, track: TRACK.label, weight: 500 }),
    caret(cx, 48, { size: 7 }),
    label(tail, cx + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label })
  );

  // Real build timestamp. This asset is regenerated from live data, so unlike
  // the static sections it is expected to change between builds.
  const synced = `SYNCED ${new Date().toISOString().slice(0, 10)}`;
  const syncW = monoWidth(synced, TYPE.meta, TRACK.label, { trim: true });
  parts.push(
    dot(W - G - syncW - 12, 48, { r: 3, color: C.pinkCore, pulse: 2.6 }),
    label(synced, W - G - syncW, 52, { size: TYPE.meta, fill: C.textMuted, track: TRACK.label })
  );
}

/* --------------------------------------------------------- month labels */

{
  const firstOfCol = new Map();
  for (const d of data.days) {
    const prev = firstOfCol.get(d.col);
    if (!prev || d.date < prev) firstOfCol.set(d.col, d.date);
  }

  let lastMonth = null;
  let lastLabelCol = -99;
  for (let col = 0; col < COLS; col++) {
    const date = firstOfCol.get(col);
    if (!date) continue;
    const month = Number(date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      lastMonth = month;
      // Skip a label that would collide with the previous one.
      if (col - lastLabelCol >= 3) {
        parts.push(label(MONTHS[month], cellX(col), 94, {
          size: 8, fill: C.textMuted, track: 0.14,
        }));
        lastLabelCol = col;
      }
    }
  }
}

/* ------------------------------------------------------- weekday labels */

for (const [row, text] of Object.entries(WEEKDAY_LABELS)) {
  parts.push(label(text, WEEKDAY_X, cellY(Number(row)) + CELL - 2, {
    size: 8, fill: C.textMuted, track: 0.14,
  }));
}

/* ----------------------------------------------------------------- cells */

for (const d of data.days) {
  const x = cellX(d.col);
  const y = cellY(d.row);
  const fill = RAMP[d.level] ?? RAMP[0];

  if (d.level === 0) {
    parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}"/>`);
    continue;
  }

  // Active cells dim as the head passes and are restored at the loop boundary.
  const t = Math.max(0.004, arrivalAt(d.row, d.col));
  const t2 = Math.min(0.97, t + 0.01);
  parts.push(
    `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}" ` +
      `filter="url(#${ID}-soft)">` +
      `<animate attributeName="opacity" values="1;1;0.12;0.12;1" ` +
        `keyTimes="0;${t.toFixed(4)};${t2.toFixed(4)};0.985;1" ` +
        `dur="${DUR}s" repeatCount="indefinite"/>` +
    `</rect>`
  );
}

/* ----------------------------------------------------------------- snake */

{
  const d = snakePath();

  // rotate="0" keeps the head axis-aligned; without it animateMotion would
  // spin the diamond to face along the path at every turn.
  const motion = (lag) =>
    `<animateMotion dur="${DUR}s" repeatCount="indefinite" begin="${lag}s" ` +
      `path="${d}" rotate="0"/>`;

  // Fade at the loop boundary so the wrap from the far end back to the start
  // reads as a re-scan rather than as a jump.
  const fade = (peak) =>
    `<animate attributeName="opacity" values="0;${peak};${peak};0" ` +
      `keyTimes="0;0.03;0.95;1" dur="${DUR}s" repeatCount="indefinite"/>`;

  // Trail. Segments are spaced by TRAIL_LAG seconds; at this path length and
  // duration the head travels ~247px/s, so ~8.6px between segments — close
  // enough that the trail reads as a continuous streak rather than as beads.
  // Emitted furthest-back first so nearer segments paint over them.
  for (let i = TRAIL_SEGMENTS; i >= 1; i--) {
    const back = i / TRAIL_SEGMENTS;          // 1 = tail end
    const r = 1.2 + (1 - back) * 3.6;
    const o = 0.06 + (1 - back) * 0.5;
    parts.push(
      `<circle r="${r.toFixed(2)}" fill="${back > 0.55 ? C.pinkDeep : C.pinkCore}" opacity="0">` +
        `${fade(Number(o.toFixed(3)))}${motion((i * TRAIL_LAG).toFixed(3))}</circle>`
    );
  }

  // Head: a wake, a halo, a diamond core and a bright centre, all in one group
  // so a single animateMotion carries the whole assembly.
  parts.push(
    `<g opacity="0">` +
      fade(1) +
      `<circle r="17" fill="${C.pinkCore}" opacity="0.13" filter="url(#${ID}-bloom)"/>` +
      `<circle r="8.5" fill="${C.pinkGlow}" opacity="0.45" filter="url(#${ID}-soft)"/>` +
      `<rect x="-5.5" y="-5.5" width="11" height="11" rx="2" transform="rotate(45)" ` +
        `fill="${C.pinkGlow}" filter="url(#${ID}-soft)"/>` +
      `<rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="1" transform="rotate(45)" ` +
        `fill="${C.text}"/>` +
      motion(0) +
    `</g>`
  );
}

/* ---------------------------------------------------------------- footer */

const FOOT_Y = GRID_Y + GRID_H + 34;

parts.push(rule(G, FOOT_Y - 20, W - G * 2, { color: C.line }));

if (data.total !== null) {
  const totalText = `${data.total} CONTRIBUTIONS`;
  const totalW = monoWidth(totalText, TYPE.meta, TRACK.label, { trim: true });
  parts.push(
    label(totalText, G, FOOT_Y + 4, { size: TYPE.meta, fill: C.text, track: TRACK.label, weight: 500 }),
    label('IN THE LAST YEAR', G + totalW + 10, FOOT_Y + 4, {
      size: TYPE.meta, fill: C.textMuted, track: TRACK.label,
    })
  );
}

{
  const sw = 11;
  const gap = 4;
  const moreW = monoWidth('MORE', 8, 0.14, { trim: true });
  const lessW = monoWidth('LESS', 8, 0.14, { trim: true });
  const rampW = RAMP.length * sw + (RAMP.length - 1) * gap;
  const startX = W - G - moreW - 8 - rampW - 8 - lessW;

  parts.push(label('LESS', startX, FOOT_Y + 4, { size: 8, fill: C.textMuted, track: 0.14 }));
  RAMP.forEach((fill, i) => {
    parts.push(
      `<rect x="${startX + lessW + 8 + i * (sw + gap)}" y="${FOOT_Y - 5}" ` +
        `width="${sw}" height="${sw}" rx="2" fill="${fill}"/>`
    );
  });
  parts.push(label('MORE', W - G - moreW, FOOT_Y + 4, { size: 8, fill: C.textMuted, track: 0.14 }));
}

const H = FOOT_Y + 30;
parts.unshift(`<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`);

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    `GitHub contribution stream for ${LOGIN} — ` +
    `${data.total ?? 'unknown'} contributions in the last year, ` +
    `${data.days.filter((d) => d.level > 0).length} active days.`,
  faces: ['monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

console.log(
  `  source=${data.source} total=${data.total} ` +
  `active=${data.days.filter((d) => d.level > 0).length}/${data.days.length} cells`
);
await writeAsset('activity.svg', svg);
