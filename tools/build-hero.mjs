/**
 * AMIRTHA AI — hero
 *
 *   node tools/build-hero.mjs   ->   assets/hero.svg
 *
 * Identity block, no portrait. The right half is a lab instrument — concentric
 * ticked rings with a slow scan arc — deliberately NOT a labelled node graph,
 * so it doesn't pre-empt the Neural Core section that follows it. Everything
 * here is hairline-weight: the piece should read as an engraved technical
 * drawing, not a game HUD.
 *
 * All text is verified content pack material: the name, the title, and the
 * three focus areas. No invented tagline, no fabricated status readout.
 */
import {
  C, TYPE, TRACK, CANVAS,
  svgDocument, defs, label, display, dot, rule, node, caret,
  cornerBrackets, dotSeparated, particles,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'hero';
const W = CANVAS.width;
const H = 320;
const G = CANVAS.gutter;

/* ------------------------------------------------------------ instrument */

const IX = 790;   // instrument centre
const IY = 158;
const R_TICK = 104;
const R_MID = 76;
const R_INNER = 44;

/** Point on a circle. 0deg = 12 o'clock, clockwise. */
function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function instrument() {
  const out = [];

  // Tick ring — 48 marks, every 6th longer and brighter. Drawn as one path
  // per weight class so the whole ring is two elements, not ninety-six.
  const minor = [];
  const major = [];
  for (let i = 0; i < 48; i++) {
    const deg = i * (360 / 48);
    const isMajor = i % 6 === 0;
    const [x1, y1] = polar(IX, IY, isMajor ? R_TICK - 11 : R_TICK - 5, deg);
    const [x2, y2] = polar(IX, IY, R_TICK, deg);
    (isMajor ? major : minor).push(
      `M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`
    );
  }
  out.push(
    `<path d="${minor.join(' ')}" stroke="${C.pinkDeep}" stroke-width="1" opacity="0.45"/>`,
    `<path d="${major.join(' ')}" stroke="${C.pinkCore}" stroke-width="1.25" opacity="0.55"/>`
  );

  // Concentric rings. The mid ring is kept dim on purpose — at full strength
  // it reads as a plain circle drawn over the instrument and flattens the
  // depth the tick scale and scan arc create.
  out.push(
    `<circle cx="${IX}" cy="${IY}" r="${R_MID}" fill="none" stroke="${C.pinkDeep}" ` +
      `stroke-width="1" opacity="0.28"/>`,
    `<circle cx="${IX}" cy="${IY}" r="${R_INNER}" fill="none" stroke="${C.pinkDeep}" ` +
      `stroke-width="1" opacity="0.6" stroke-dasharray="3 7"/>`
  );

  // Scan arc: 70deg of the mid ring, one slow rotation. The only motion in
  // the upper half of the README — everything else here is still.
  const [ax, ay] = polar(IX, IY, R_MID, 0);
  const [bx, by] = polar(IX, IY, R_MID, 70);
  out.push(
    `<path d="M${ax.toFixed(2)} ${ay.toFixed(2)} A${R_MID} ${R_MID} 0 0 1 ` +
      `${bx.toFixed(2)} ${by.toFixed(2)}" fill="none" stroke="${C.pinkCore}" ` +
      `stroke-width="2" stroke-linecap="round" opacity="0.75">` +
      `<animateTransform attributeName="transform" type="rotate" ` +
        `from="0 ${IX} ${IY}" to="360 ${IX} ${IY}" dur="14s" repeatCount="indefinite"/>` +
    `</path>`
  );

  // Orbital nodes tethered to the core.
  for (const [deg, r, size, delay] of [[38, R_MID, 4, 0], [163, R_MID, 3.5, 1.4], [281, R_INNER, 3, 2.6]]) {
    const [px, py] = polar(IX, IY, r, deg);
    out.push(
      `<line x1="${IX}" y1="${IY}" x2="${px.toFixed(2)}" y2="${py.toFixed(2)}" ` +
        `stroke="${C.pinkDeep}" stroke-width="1" opacity="0.4"/>`,
      node(px, py, { r: size, idPrefix: ID, ring: false, breathe: 5, delay })
    );
  }

  // Core.
  out.push(node(IX, IY, { r: 9, idPrefix: ID, ring: true, breathe: 4.5 }));

  // Cardinal crosshair ticks just outside the tick ring.
  for (const deg of [0, 90, 180, 270]) {
    const [x1, y1] = polar(IX, IY, R_TICK + 9, deg);
    const [x2, y2] = polar(IX, IY, R_TICK + 17, deg);
    out.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" ` +
        `y2="${y2.toFixed(2)}" stroke="${C.pinkCore}" stroke-width="1" opacity="0.4"/>`
    );
  }

  return out.join('');
}

/* ------------------------------------------------------------------ body */

const parts = [];

// Substrate: a dot grid as a tiled pattern — 200 dots for the cost of one rect.
parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`,
  `<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.55"/>`,
  particles(W, H, { count: 12, seed: 21, maxOpacity: 0.26, drift: 12 })
);

// Lab chrome frame.
parts.push(cornerBrackets(24, 24, W - 48, H - 48, { len: 16, opacity: 0.4 }));

// Top rail: brand left, indicator dots right.
parts.push(
  caret(G, 48, { size: 7 }),
  label('AMIRTHA AI', G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
  dot(W - G - 4, 48, { r: 3, color: C.pinkCore, pulse: 2.6 }),
  dot(W - G - 18, 48, { r: 3, color: C.pinkDeep }),
  dot(W - G - 32, 48, { r: 3, color: C.pinkDeep })
);

// Instrument, behind nothing — the type block clears it horizontally.
parts.push(instrument());

// Data bus: type block out to the instrument.
parts.push(
  rule(430, IY, 210, { idPrefix: ID, fade: true, opacity: 0.5 }),
  dot(470, IY, { r: 2, color: C.pinkDeep }),
  dot(560, IY, { r: 2, color: C.pinkDeep })
);

// Identity block.
parts.push(
  display('AMIRTHA T', G, 172, { size: TYPE.hero, fill: C.text, track: 0.01 }),
  `<rect x="${G}" y="192" width="56" height="2" fill="${C.pinkCore}"/>`,
  label('AI DEVELOPER', G, 226, { size: 15, fill: C.pinkCore, track: 0.34, weight: 500 }),
  dotSeparated(['AI / ML', 'BIG DATA', 'COMPUTER VISION'], G, 258, {
    size: TYPE.label,
    fill: C.textMuted,
    track: TRACK.label,
  }).svg
);

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title: 'AMIRTHA T — AI Developer. AI / ML, Big Data, Computer Vision.',
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('hero.svg', svg);
