/**
 * AMIRTHA AI — footer
 *
 *   node tools/build-footer.mjs   ->   assets/footer.svg
 *
 * Closing plate. A short neural spine echoes the Neural Core section so the
 * page ends where it began, then the closing statement from the content pack.
 *
 * Deliberately no link text: an SVG embedded through <img> is not clickable,
 * so rendering "GITHUB / LINKEDIN / PORTFOLIO" here would look like navigation
 * that does nothing. The real links are markdown anchors in README.md.
 */
import {
  C, TYPE, TRACK, CANVAS,
  svgDocument, defs, label, display, dot, rule, node, dotSeparated, particles,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'foot';
const W = CANVAS.width;
const H = 200;
const G = CANVAS.gutter;

const parts = [];

/* -------------------------------------------------------------- backdrop */

// Kept dim: the field sits behind the centred headline, and anything brighter
// reads as a smudge across the type rather than as depth.
parts.push(particles(W, H, { count: 16, seed: 44, maxOpacity: 0.2, drift: 14 }));

/* ---------------------------------------------------- neural spine motif */

const SPINE_Y = 46;
const SPINE_X0 = 320;
const SPINE_X1 = 680;

parts.push(rule(SPINE_X0, SPINE_Y, SPINE_X1 - SPINE_X0, { idPrefix: ID, fade: true }));

const spineNodes = [
  [SPINE_X0, 2.5, 0],
  [SPINE_X0 + 90, 3, 0.8],
  [500, 5, 1.6],
  [SPINE_X1 - 90, 3, 2.4],
  [SPINE_X1, 2.5, 3.2],
];
for (const [x, r, delay] of spineNodes) {
  const isCore = r === 5;
  parts.push(
    node(x, SPINE_Y, {
      r,
      idPrefix: isCore ? ID : undefined,
      ring: isCore,
      breathe: 5,
      delay,
    })
  );
}

/* --------------------------------------------------------------- closing */

// Verified closing statement from the content pack, section 19.
parts.push(
  display('BUILDING INTELLIGENCE,', 500, 104, {
    size: 26,
    fill: C.text,
    track: 0.03,
    anchor: 'middle',
  }),
  display('ONE MODEL AT A TIME.', 500, 136, {
    size: 26,
    fill: C.pinkCore,
    track: 0.03,
    anchor: 'middle',
  })
);

/* ----------------------------------------------------------------- brand */

parts.push(
  dotSeparated(['AMIRTHA T', 'AI DEVELOPER'], 500, 168, {
    size: TYPE.meta,
    fill: C.textMuted,
    track: TRACK.label,
    anchor: 'middle',
  }).svg
);

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title: 'Building intelligence, one model at a time. AMIRTHA T — AI Developer.',
  faces: ['displayBold', 'monoRegular'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('footer.svg', svg);
