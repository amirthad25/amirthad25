/**
 * AMIRTHA AI — currently training
 *
 *   node tools/build-currently-training.mjs   ->   assets/currently-training.svg
 *
 * The live academic track, rendered as a training run.
 *
 * WHAT THE BAR MEASURES, AND WHY IT IS NOT A PERCENTAGE OF ELAPSED TIME:
 * the content pack verifies the programme as "2025-2027", "currently in 2nd
 * year" — years, not term dates. Computing "58% elapsed" would require
 * inventing a start month and an end month, and would then present that
 * invention as a precise figure. So the bar measures PROGRAMME YEARS
 * COMPLETED: year 1 is done, year 2 is under way, and the fill is exactly
 * one half. Every mark on it traces back to a verified fact.
 *
 * It is labelled PROGRAM TIMELINE throughout. It is not a skill meter, not a
 * proficiency score, and not a measure of how much Big Data Analytics anyone
 * knows — a progress bar next to a subject name invites exactly that reading,
 * so the label does the work of ruling it out.
 *
 * ASCII only: the source writes "2025-2027" with a hyphen, never an en dash,
 * because the embedded font subset has no U+2013.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, mono, display, dot, rule, caret, bar, monoWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'trn';
const W = CANVAS.width;
const G = CANVAS.gutter;
const H = 296;

/* --------------------------------------------------------------- content */

/** Content pack section 4. Nothing here is inferred. */
const PROGRAM = {
  focus: 'BIG DATA ANALYTICS',
  degree: 'M.TECH',
  institution: 'VEL TECH UNIVERSITY',
  span: '2025-2027',
  totalYears: 2,
  currentYear: 2,
  cgpa: '8.7',
};

/** Pack section 16 supplies this wording; it is branding, not a claim. */
const STATUS = 'OPTIMIZING';

/* ------------------------------------------------------------ bar layout */

const CELLS = 36;
const BAR_Y = 166;
const BAR_H = 12;
const BAR_GAP = 3;

const CELL_W = (CONTENT_W - BAR_GAP * (CELLS - 1)) / CELLS;
const HALF_CELLS = CELLS / PROGRAM.totalYears;
const HALF_W = HALF_CELLS * CELL_W + (HALF_CELLS - 1) * BAR_GAP;

/** x of the segment for programme year `n` (1-indexed). */
const segX = (n) => G + (n - 1) * (HALF_W + BAR_GAP);

/* ------------------------------------------------------------------ body */

const parts = [];

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`,
  `<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`
);

/* ---------------------------------------------------------- section head */

{
  const t = 'CURRENTLY TRAINING';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const status = 'IN PROGRESS';
  const statusW = monoWidth(status, TYPE.meta, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  const lineEnd = W - G - statusW - 24;

  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, Math.max(0, lineEnd - lineX), { color: C.line }),
    dot(W - G - statusW - 12, 48, { r: 3, color: C.pinkCore, pulse: 2.6 }),
    label(status, W - G - statusW, 52, { size: TYPE.meta, fill: C.textMuted, track: TRACK.label })
  );
}

/* ---------------------------------------------------------------- focus */

parts.push(
  display(PROGRAM.focus, G, 110, { size: TYPE.title, fill: C.text, track: 0.03 }),
  label(
    `${PROGRAM.degree}   /   ${PROGRAM.institution}   /   ${PROGRAM.span}`,
    G, 134,
    { size: TYPE.meta, fill: C.textMuted, track: TRACK.label }
  )
);

/* ------------------------------------------------------------------ bar */

// Year segment captions sit above their own half of the track.
for (let n = 1; n <= PROGRAM.totalYears; n++) {
  const done = n < PROGRAM.currentYear;
  parts.push(
    label(`YEAR ${n}`, segX(n), BAR_Y - 10, {
      size: 8,
      fill: done ? C.pinkGlow : C.textMuted,
      track: 0.14,
    })
  );
}

// Completed years fill solid; the year under way stays unlit. A half-filled
// bar here means exactly "one of two programme years complete".
for (let n = 1; n <= PROGRAM.totalYears; n++) {
  const complete = n < PROGRAM.currentYear;
  parts.push(
    bar(segX(n), BAR_Y, HALF_W, complete ? 1 : 0, {
      idPrefix: ID,
      cells: HALF_CELLS,
      height: BAR_H,
      gap: BAR_GAP,
    })
  );
}

// Position marker at the boundary between completed and current year.
{
  const x = segX(PROGRAM.currentYear) - BAR_GAP / 2;

  // The diamond clears the year-caption row entirely: sitting at the tick's
  // top it overlapped the first letter of "YEAR 2", which starts at the
  // segment origin a hair to its right.
  const tickTop = BAR_Y - 18;
  parts.push(
    `<rect x="${(x - 0.75).toFixed(2)}" y="${tickTop}" width="1.5" ` +
      `height="${BAR_H + 6 + (BAR_Y - tickTop)}" fill="${C.pinkCore}" opacity="0.8"/>`,
    `<g transform="translate(${x.toFixed(2)} ${BAR_Y - 30})">` +
      `<rect x="-3.5" y="-3.5" width="7" height="7" rx="1" transform="rotate(45)" ` +
        `fill="${C.pinkGlow}" filter="url(#${ID}-soft)">` +
        `<animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite"/>` +
      `</rect></g>`
  );
}

/* ----------------------------------------------------------- bar caption */

{
  const left = `PROGRAM TIMELINE   /   ${PROGRAM.span}`;
  const right = `YEAR ${PROGRAM.currentYear} OF ${PROGRAM.totalYears}`;
  const rightW = monoWidth(right, 9, TRACK.label, { trim: true });

  parts.push(
    label(left, G, BAR_Y + 34, { size: 9, fill: C.textMuted, track: TRACK.label }),
    label(right, W - G - rightW, BAR_Y + 34, { size: 9, fill: C.pinkGlow, track: TRACK.label })
  );
}

/* --------------------------------------------------------- metric strip */

{
  const STRIP_Y = 236;
  parts.push(rule(G, STRIP_Y - 18, CONTENT_W, { color: C.line }));

  const items = [
    { label: 'EPOCH', value: `${PROGRAM.currentYear} / ${PROGRAM.totalYears}` },
    { label: 'CGPA', value: PROGRAM.cgpa },
    { label: 'STATUS', value: STATUS },
  ];

  const colW = CONTENT_W / items.length;
  items.forEach((item, i) => {
    const x = G + i * colW;
    parts.push(
      label(item.label, x, STRIP_Y + 8, { size: 9, fill: C.textMuted, track: TRACK.label }),
      mono(item.value, x, STRIP_Y + 32, { size: 15, fill: C.text, weight: 500, track: 0.06 })
    );
    if (i > 0) {
      parts.push(
        `<rect x="${x - 24}" y="${STRIP_Y - 6}" width="1" height="46" fill="${C.line}"/>`
      );
    }
  });
}

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    `Currently training — ${PROGRAM.focus}, ${PROGRAM.degree}, ${PROGRAM.institution}, ` +
    `${PROGRAM.span}. Program timeline: year ${PROGRAM.currentYear} of ${PROGRAM.totalYears}. ` +
    `CGPA ${PROGRAM.cgpa}.`,
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('currently-training.svg', svg);
