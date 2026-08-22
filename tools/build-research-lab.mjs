/**
 * AMIRTHA AI — research lab
 *
 *   node tools/build-research-lab.mjs   ->   assets/research-lab.svg
 *
 * The IEEE publication as the primary card, with the verified research focus
 * areas as a vertical spine beside it. The spine deliberately runs vertically:
 * it should rhyme with the Neural Core without restating it, and that section
 * owns the horizontal reading.
 *
 * CLICKABILITY — read before changing the README wiring:
 * an SVG loaded through <img> is inert. Its internal <a> does nothing in that
 * context, so the link below is progressive enhancement only (it works if the
 * file is opened directly). The section is made clickable on GitHub by
 * wrapping the IMAGE in an anchor in README.md:
 *
 *   <a href="https://ieeexplore.ieee.org/abstract/document/11140884">
 *     <img src="assets/research-lab.svg" alt="...">
 *   </a>
 *
 * That makes the whole section the click target, which is why the card carries
 * an explicit "IEEE XPLORE / VIEW PUBLICATION" affordance — the reader needs to
 * know what the click does. The raw URL is never rendered as text.
 *
 * CONTENT: the paper title, venue and the seven focus areas are verbatim from
 * content pack sections 6, 7 and 17. No metrics, no citation counts, no claims
 * about the work beyond what the pack states.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, mono, display, dot, rule, caret, panel, node,
  chipRow, statusPill, monoWidth, displayWidth, wrapMono, wrapDisplay,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'res';
const W = CANVAS.width;
const G = CANVAS.gutter;

const PANEL_Y = 76;
const PANEL_H = 288;
const COL_GAP = 24;
const LEFT_W = 552;
const RIGHT_W = CONTENT_W - LEFT_W - COL_GAP;   // 344
const RIGHT_X = G + LEFT_W + COL_GAP;
const PAD = 22;

/* --------------------------------------------------------------- content */

/** Content pack sections 6 and 7. Verbatim. */
const PAPER = {
  title: 'Drone-Based Pest Control: LiteDepthwiseNet Stem Borer Detection on Jetson Nano',
  venue:
    '8th International Conference on Computing Methodologies and Communication (ICCMC 2025)',
  chips: ['litedepthwisenet', 'jetson nano'],
  url: 'https://ieeexplore.ieee.org/abstract/document/11140884',
};

/** Content pack section 17. */
const FOCUS = [
  'GENERATIVE AI',
  'AGENTIC AI',
  'MACHINE LEARNING',
  'DEEP LEARNING',
  'NLP',
  'COMPUTER VISION',
  'BIG DATA ANALYTICS',
];

/* ------------------------------------------------------------------ body */

const parts = [];
const H = PANEL_Y + PANEL_H + 32;

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`,
  `<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`
);

/* ---------------------------------------------------------- section head */

{
  const t = 'RESEARCH LAB';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, W - G - lineX, { color: C.line })
  );
}

/* ------------------------------------------------------- publication card */

{
  const x = G;
  const inner = LEFT_W - PAD * 2;
  const cx = x + PAD;
  const card = [];

  card.push(panel(x, PANEL_Y, LEFT_W, PANEL_H, { fill: C.surface, stroke: C.pinkDeep }));

  // IEEE mark + published status.
  const markW = displayWidth('IEEE', 14, 0.08) + 22;
  card.push(
    `<rect x="${cx + 0.5}" y="${PANEL_Y + 20.5}" width="${markW}" height="23" rx="4" ` +
      `fill="none" stroke="${C.pinkCore}" stroke-opacity="0.5"/>`,
    display('IEEE', cx + 11, PANEL_Y + 37, { size: 14, fill: C.pinkCore, track: 0.08 })
  );

  const pill = statusPill('PUBLISHED', 0, 0, { color: C.pinkGlow });
  card.push(
    `<g transform="translate(${x + LEFT_W - PAD - pill.width} ${PANEL_Y + 21})">${pill.svg}</g>`
  );

  // Title.
  const titleLines = wrapDisplay(PAPER.title, inner, 18, 0.01);
  if (titleLines.length > 3) throw new Error(`paper title needs ${titleLines.length} lines, max 3`);
  titleLines.forEach((line, i) => {
    card.push(display(line, cx, PANEL_Y + 78 + i * 25, { size: 18, fill: C.text, track: 0.01 }));
  });

  const afterTitle = PANEL_Y + 78 + titleLines.length * 25;
  card.push(rule(cx, afterTitle + 8, inner, { color: C.line }));

  // Venue.
  const venueLines = wrapMono(PAPER.venue, inner, 12);
  if (venueLines.length > 3) throw new Error(`venue needs ${venueLines.length} lines, max 3`);
  venueLines.forEach((line, i) => {
    card.push(mono(line, cx, afterTitle + 32 + i * 18, { size: 12, fill: C.textMuted }));
  });

  const afterVenue = afterTitle + 32 + venueLines.length * 18;

  // Technologies.
  card.push(chipRow(PAPER.chips, cx, afterVenue + 6, inner, {
    size: 9, padX: 8, height: 20, gap: 6,
  }).svg);

  // Action affordance. Not a button the SVG can honour on its own — the README
  // anchor around this image is what makes it work.
  {
    const bx = cx;
    const by = PANEL_Y + PANEL_H - PAD - 30;
    const a = 'IEEE XPLORE';
    const b = 'VIEW PUBLICATION';
    const aW = monoWidth(a, 9, TRACK.label, { trim: true });
    const bW = monoWidth(b, 9, TRACK.label, { trim: true });
    const bw = 14 + aW + 12 + 9 + 12 + bW + 14;

    card.push(
      `<rect x="${bx + 0.5}" y="${by + 0.5}" width="${bw}" height="30" rx="6" ` +
        `fill="${C.surface2}" stroke="${C.pinkCore}" stroke-opacity="0.55"/>`,
      label(a, bx + 14, by + 19, { size: 9, fill: C.pinkCore, track: TRACK.label }),
      caret(bx + 14 + aW + 12, by + 15, { size: 7, color: C.pinkGlow }),
      label(b, bx + 14 + aW + 12 + 9 + 12, by + 19, {
        size: 9, fill: C.text, track: TRACK.label, weight: 500,
      })
    );
  }

  // Inert under <img>, live if the SVG is opened on its own.
  parts.push(
    `<a href="${PAPER.url}" target="_blank" rel="noopener">${card.join('')}</a>`
  );
}

/* ------------------------------------------------------------ focus spine */

{
  const x = RIGHT_X;
  const cx = x + PAD;

  parts.push(
    panel(x, PANEL_Y, RIGHT_W, PANEL_H, { fill: C.surface, stroke: C.line }),
    label('RESEARCH FOCUS', cx, PANEL_Y + 32, {
      size: 9, fill: C.pinkGlow, track: TRACK.label,
    }),
    rule(cx, PANEL_Y + 44, RIGHT_W - PAD * 2, { color: C.line })
  );

  const first = PANEL_Y + 74;
  const step = 30;
  const spineX = cx + 6;

  // Vertical spine behind the nodes — the Neural Core motif turned 90 degrees.
  parts.push(
    `<line x1="${spineX}" y1="${first}" x2="${spineX}" y2="${first + (FOCUS.length - 1) * step}" ` +
      `stroke="${C.pinkDeep}" stroke-width="1.25" opacity="0.9"/>`
  );

  FOCUS.forEach((area, i) => {
    const y = first + i * step;
    parts.push(
      node(spineX, y, { r: 4, idPrefix: ID, ring: false, halo: false, breathe: 6, delay: i * 0.7 }),
      label(area, spineX + 20, y + 4, { size: 9, fill: C.text, track: 0.14 })
    );
  });
}

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    `Research Lab — IEEE publication: ${PAPER.title}. Published at the ${PAPER.venue}. ` +
    `Opens on IEEE Xplore. Research focus: ${FOCUS.join(', ')}.`,
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('research-lab.svg', svg);
