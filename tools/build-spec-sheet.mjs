/**
 * AMIRTHA AI — design system spec sheet
 *
 *   node tools/build-spec-sheet.mjs   ->   assets/_design-system.svg
 *
 * A visual proof of theme.mjs: every token and every primitive rendered once,
 * with its real values. Not referenced by README.md — the leading underscore
 * marks it as a development artefact. Rebuild it after changing theme.mjs to
 * see the whole system at a glance.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W, RADIUS, FONT,
  svgDocument, defs, label, mono, display, chip, chipRow, statusPill,
  bar, node, dot, caret, rule, panel, cornerBrackets, particles, monoWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'ds';
const G = CANVAS.gutter;
const W = CANVAS.width;
const parts = [];

/** Section heading: caret + tracked label + hairline out to the right margin. */
function sectionHead(title, y) {
  const t = String(title).toUpperCase();
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  return (
    caret(G, y - 4, { size: 7 }) +
    label(t, G + 14, y, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }) +
    rule(lineX, y - 4, W - G - lineX, { color: C.line })
  );
}

/* ------------------------------------------------------------------ head */

parts.push(
  particles(W, 120, { count: 10, seed: 7, maxOpacity: 0.22 }),
  display('AMIRTHA AI', G, 62, { size: 34, fill: C.text, track: 0.02 }),
  label('DESIGN SYSTEM  /  V1.0', G, 86, { size: TYPE.label, fill: C.pinkCore }),
  label('NEURAL PINK ON DEEP SUBSTRATE', W - G, 86, {
    size: TYPE.meta, fill: C.textMuted,
  }).replace('<text ', '<text text-anchor="end" ')
);

/* --------------------------------------------------------------- palette */

let y = 140;
parts.push(sectionHead('Palette', y));

const swatches = [
  ['void', C.void], ['surface', C.surface], ['surface2', C.surface2], ['line', C.line],
  ['pinkDim', C.pinkDim], ['pinkDeep', C.pinkDeep], ['pinkCore', C.pinkCore],
  ['pinkGlow', C.pinkGlow], ['text', C.text], ['textMuted', C.textMuted], ['ok', C.ok],
];
const swW = (CONTENT_W - 8 * (swatches.length - 1)) / swatches.length;

y += 22;
swatches.forEach(([name, hex], i) => {
  const x = G + i * (swW + 8);
  parts.push(
    `<rect x="${x.toFixed(2)}" y="${y}" width="${swW.toFixed(2)}" height="56" rx="6" ` +
      `fill="${hex}" stroke="${C.line}"/>`,
    label(name, x, y + 74, { size: 8, fill: C.text, track: 0.06 }),
    mono(hex.toUpperCase(), x, y + 88, { size: 8, fill: C.textMuted })
  );
});

/* ------------------------------------------------------------ typography */

y += 128;
parts.push(sectionHead('Typography', y));
y += 30;

const specimens = [
  ['display / 700 / 64', () => display('AMIRTHA T', G, y + 46, { size: TYPE.hero }), 72],
  ['display / 700 / 30', () => display('NEURAL CORE', G, y + 24, { size: TYPE.title }), 42],
  ['display / 700 / 22', () => display('KORVAGENEST', G, y + 18, { size: TYPE.cardTitle }), 34],
  ['mono / 400 / 15  lead', () => mono(
    'Motivated AI and Data Science professional.', G, y + 14, { size: TYPE.lead }), 28],
  ['mono / 400 / 13  body', () => mono(
    'Resume analysis, RAG candidate evaluation, automated shortlisting.',
    G, y + 12, { size: TYPE.body, fill: C.textMuted }), 26],
  ['mono / 500 / 11  label + 0.18em', () => label(
    'GENERATIVE AI', G, y + 10, { size: TYPE.label, fill: C.pinkCore }), 24],
  ['mono / 400 / 10  meta', () => mono(
    'AUTO-SYNCED DAILY / GITHUB ACTIONS', G, y + 9, { size: TYPE.meta, fill: C.textMuted }), 22],
];

for (const [note, render, step] of specimens) {
  parts.push(render());
  parts.push(mono(note, W - G, y + step * 0.42, {
    size: 9, fill: C.line === C.line ? '#6E5A68' : C.textMuted, anchor: 'end',
  }));
  y += step;
}

/* ------------------------------------------------------------ primitives */

y += 18;
parts.push(sectionHead('Primitives', y));
y += 26;

// -- chips -----------------------------------------------------------------
const chips = chipRow(
  ['python', 'sql', 'groq', 'litellm', 'rag', 'tool calling', 'n8n', 'laravel'],
  G, y, CONTENT_W
);
parts.push(chips.svg, mono('chipRow()', W - G, y + 15, { size: 9, fill: '#6E5A68', anchor: 'end' }));
y += chips.height + 20;

// -- status pills ----------------------------------------------------------
let px = G;
for (const [text, color] of [['flagship', C.pinkCore], ['ieee published', C.pinkGlow], ['online', C.ok]]) {
  const pill = statusPill(text, px, y, { color });
  parts.push(pill.svg);
  px += pill.width + 10;
}
parts.push(mono('statusPill()', W - G, y + 14, { size: 9, fill: '#6E5A68', anchor: 'end' }));
y += 36;

// -- segmented bar ---------------------------------------------------------
parts.push(
  bar(G, y, 520, 0.62, { idPrefix: ID, cells: 36 }),
  mono('62%', G + 536, y + 9, { size: TYPE.body, fill: C.pinkCore, weight: 500 }),
  mono('bar()  36 cells  no block glyphs', W - G, y + 9, { size: 9, fill: '#6E5A68', anchor: 'end' })
);
y += 34;

// -- nodes + edges ---------------------------------------------------------
const nodeY = y + 34;
const nodeLabels = ['GEN AI', 'ML', 'NLP', 'CV', 'BIG DATA'];
const nodeGap = 116;
const nodeX0 = G + 46;

for (let i = 0; i < nodeLabels.length - 1; i++) {
  parts.push(
    `<line x1="${nodeX0 + i * nodeGap}" y1="${nodeY}" x2="${nodeX0 + (i + 1) * nodeGap}" ` +
      `y2="${nodeY}" stroke="${C.pinkDeep}" stroke-width="1.25" stroke-opacity="0.7"/>`
  );
}
nodeLabels.forEach((t, i) => {
  const cx = nodeX0 + i * nodeGap;
  parts.push(
    node(cx, nodeY, { r: 7, idPrefix: ID, breathe: 4, delay: i * 0.55 }),
    label(t, cx, nodeY + 34, { size: 8, fill: C.textMuted, track: 0.12 })
      .replace('<text ', '<text text-anchor="middle" ')
  );
});
parts.push(mono('node()  breathing 4s, staggered', W - G, nodeY, {
  size: 9, fill: '#6E5A68', anchor: 'end',
}));
y = nodeY + 54;

// -- panel, brackets, rule, dots ------------------------------------------
const boxW = 280;
parts.push(
  panel(G, y, boxW, 66),
  label('panel()', G + 16, y + 26, { size: 9, fill: C.textMuted }),
  mono('surface + line hairline', G + 16, y + 44, { size: 9, fill: '#6E5A68' }),

  cornerBrackets(G + boxW + 30, y, boxW, 66),
  label('cornerBrackets()', G + boxW + 46, y + 26, { size: 9, fill: C.textMuted }),
  mono('lab chrome', G + boxW + 46, y + 44, { size: 9, fill: '#6E5A68' }),

  panel(G + (boxW + 30) * 2, y, boxW, 66, { fill: C.surface2 }),
  dot(G + (boxW + 30) * 2 + 22, y + 26, { r: 4, color: C.ok }),
  dot(G + (boxW + 30) * 2 + 40, y + 26, { r: 4, color: C.pinkCore, pulse: 2.4 }),
  dot(G + (boxW + 30) * 2 + 58, y + 26, { r: 4, color: C.pinkDeep }),
  mono('dot()  static / pulsing', G + (boxW + 30) * 2 + 22, y + 46, { size: 9, fill: '#6E5A68' })
);
y += 86;

// -- faded rule ------------------------------------------------------------
parts.push(
  rule(G, y, CONTENT_W, { idPrefix: ID, fade: true }),
  mono('rule({ fade: true })', W - G, y + 18, { size: 9, fill: '#6E5A68', anchor: 'end' })
);
y += 34;

/* ---------------------------------------------------------------- footer */

parts.push(
  rule(G, y, CONTENT_W, { color: C.line }),
  label('ASCII-ONLY TEXT  /  SHAPES NOT GLYPHS  /  DETERMINISTIC OUTPUT', G, y + 24, {
    size: TYPE.meta, fill: C.textMuted,
  })
);
const HEIGHT = y + 48;

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: HEIGHT,
  title: 'AMIRTHA AI design system specimen',
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('_design-system.svg', svg);
