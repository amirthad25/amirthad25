/**
 * AMIRTHA AI — neural core
 *
 *   node tools/build-neural-core.mjs   ->   assets/neural-core.svg
 *
 * The primary spine runs GENERATIVE AI -> ML -> NLP -> COMPUTER VISION ->
 * BIG DATA, with four verified satellites tethered to it and a substrate band
 * of tooling underneath.
 *
 * Kept deliberately orthogonal to the hero instrument: that piece is a radial
 * gauge with no labels, this one is a horizontal labelled network. Two circular
 * diagrams stacked on one page would read as the same section twice.
 *
 * Motion budget for this asset: node breathing plus ONE pulse traversing the
 * spine. Nothing else moves — no particle field here, because the network is
 * already the busiest thing on the page.
 *
 * Every term is verified content pack material (sections 3, 8 and 12). The
 * tethers express topic grouping, not claimed architecture.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, dot, rule, node, caret, chipRow, monoWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'core';
const W = CANVAS.width;
const H = 410;
const G = CANVAS.gutter;

const SPINE_Y = 212;
const SPINE_X0 = 110;
const SPINE_X1 = 890;

/* --------------------------------------------------------------- content */

/** Content pack section 12. The brief spells the fourth node out in full. */
const SPINE = ['GENERATIVE AI', 'ML', 'NLP', 'COMPUTER VISION', 'BIG DATA'];

const STEP = (SPINE_X1 - SPINE_X0) / (SPINE.length - 1);
const spineX = (i) => SPINE_X0 + i * STEP;

/**
 * Verified adjacent areas (content pack sections 3 and 8).
 *
 * `band: 'upper'` tethers straight to the parent node. `band: 'lower'` tethers
 * to a TAP POINT on the spine instead, chosen to clear the spine node's caption
 * — a lower tether aimed at the node centre would cut straight through the
 * label sitting directly beneath it.
 */
const SATELLITES = [
  { text: 'AGENTIC AI', x: 170, band: 'upper', parent: 0 },
  { text: 'DATA SCIENCE', x: 820, band: 'upper', parent: 4 },
  { text: 'DEEP LEARNING', x: 380, band: 'lower', tapX: 360 },
  { text: 'EDA', x: 830, band: 'lower', tapX: 810 },
];

const UPPER_Y = 126;
const LOWER_Y = 292;

/** Content pack section 3 — the tooling the areas above are practised with. */
const SUBSTRATE = ['python', 'sql', 'groq', 'litellm', 'rag', 'tool calling', 'n8n'];

/* --------------------------------------------------------------- helpers */

/** Mono label centred on cx using the exact measured width. */
function centered(text, cx, y, opts = {}) {
  const t = String(text).toUpperCase();
  const w = monoWidth(t, opts.size ?? TYPE.label, opts.track ?? TRACK.label, { trim: true });
  return label(t, cx - w / 2, y, opts);
}

/* ------------------------------------------------------------------ body */

const parts = [];

// Substrate grid, same pattern device as the hero but dimmer — this section
// carries more ink, so the texture has to step back.
parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`,
  `<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`
);

/* ---------------------------------------------------------- section head */

{
  const t = 'NEURAL CORE';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, W - G - lineX, { color: C.line })
  );
}

/* --------------------------------------------------------------- tethers */

for (const sat of SATELLITES) {
  const isUpper = sat.band === 'upper';
  const y = isUpper ? UPPER_Y : LOWER_Y;
  const ax = isUpper ? spineX(sat.parent) : sat.tapX;

  parts.push(
    `<line x1="${sat.x}" y1="${y}" x2="${ax}" y2="${SPINE_Y}" stroke="${C.pinkDeep}" ` +
      `stroke-width="1" opacity="0.4" stroke-dasharray="2 5"/>`
  );

  // A tap mark where a lower tether meets the spine, so the join reads as
  // intentional rather than as a line that stops short of a node.
  if (!isUpper) parts.push(dot(ax, SPINE_Y, { r: 2.5, color: C.pinkCore }));
}

/* ----------------------------------------------------------------- spine */

parts.push(
  `<line x1="${SPINE_X0}" y1="${SPINE_Y}" x2="${SPINE_X1}" y2="${SPINE_Y}" ` +
    `stroke="${C.pinkDeep}" stroke-width="1.5" opacity="0.8"/>`
);

// Direction chevrons at 70% of each span. They sit off the midpoint so they
// never collide with a tether tap, and they keep the flow readable in a still
// screenshot where the pulse animation isn't running.
for (let i = 0; i < SPINE.length - 1; i++) {
  parts.push(caret(spineX(i) + STEP * 0.7, SPINE_Y, { size: 7.5, color: C.pinkCore, opacity: 0.6 }));
}

/* ------------------------------------------------------------ satellites */

for (const sat of SATELLITES) {
  const isUpper = sat.band === 'upper';
  const y = isUpper ? UPPER_Y : LOWER_Y;
  const labelY = isUpper ? y - 16 : y + 22;

  parts.push(
    `<g opacity="0.9">${node(sat.x, y, {
      r: 4.5,
      idPrefix: ID,
      ring: false,
      breathe: 6,
      delay: sat.x % 3,
    })}</g>`,
    centered(sat.text, sat.x, labelY, { size: 9, fill: C.textMuted, track: 0.14 })
  );
}

/* ----------------------------------------------------------- spine nodes */

SPINE.forEach((text, i) => {
  parts.push(node(spineX(i), SPINE_Y, { r: 9, idPrefix: ID, ring: true, breathe: 4.5, delay: i * 0.6 }));
});

/* ----------------------------------------------------------------- pulse */

// One light travelling the spine, then a pause before it repeats. Drawn after
// the nodes so it passes visibly over them rather than behind their glow.
parts.push(
  `<circle r="4" cy="${SPINE_Y}" fill="${C.pinkGlow}" opacity="0" ` +
    `filter="url(#${ID}-soft)">` +
    `<animate attributeName="cx" values="${SPINE_X0};${SPINE_X1};${SPINE_X1}" ` +
      `keyTimes="0;0.72;1" dur="5.5s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="0;1;1;0;0" ` +
      `keyTimes="0;0.06;0.66;0.74;1" dur="5.5s" repeatCount="indefinite"/>` +
  `</circle>`
);

/* ---------------------------------------------------------- spine labels */

SPINE.forEach((text, i) => {
  parts.push(centered(text, spineX(i), SPINE_Y + 34, {
    size: TYPE.label,
    fill: C.text,
    track: TRACK.label,
    weight: 500,
  }));
});

/* -------------------------------------------------------- substrate band */

const DIV_Y = 342;
parts.push(rule(G, DIV_Y, CONTENT_W, { idPrefix: ID, fade: true, opacity: 0.6 }));

const SUB_LABEL = 'SUBSTRATE';
const subLabelW = monoWidth(SUB_LABEL, TYPE.label, TRACK.label, { trim: true });
const chipsX = G + subLabelW + 26;

parts.push(
  label(SUB_LABEL, G, 378, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
  chipRow(SUBSTRATE, chipsX, 362, CONTENT_W - (chipsX - G), {
    size: 11,
    padX: 11,
    height: 24,
    gap: 8,
  }).svg
);

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    'Neural Core — Generative AI, Machine Learning, NLP, Computer Vision, Big Data. ' +
    'With Agentic AI, Deep Learning, Data Science and EDA. ' +
    'Substrate: Python, SQL, Groq, LiteLLM, RAG, Tool Calling, n8n.',
  faces: ['monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('neural-core.svg', svg);
