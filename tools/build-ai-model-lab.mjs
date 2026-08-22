/**
 * AMIRTHA AI — AI Model Lab
 *
 *   node tools/build-ai-model-lab.mjs   ->   assets/ai-model-lab.svg
 *
 * Four verified systems on one shared card grid.
 *
 * WHY ONE SVG RATHER THAN FOUR: the plan called for four separate card images
 * in a 2x2 markdown table. Every other asset here is authored 1000px wide and
 * gets scaled to the README column by the browser, so a 448px card placed at
 * its native size would render its 12px body text at a different effective size
 * than the rest of the page. Emitting the whole grid as one 1000px asset keeps
 * the type scale identical to the hero and neural core, guarantees the columns
 * align, and removes the risk of a two-image table overflowing the column on
 * narrow screens. The cards are static content, so nothing is lost by not being
 * able to redeploy one independently.
 *
 * WHY NOTHING MOVES: motion in this system means something — the hero's scan
 * arc and the neural spine pulse both express flow. A project card has no flow
 * to express, and animating text blocks would be decoration for its own sake.
 *
 * CONTENT RULES: every string below is drawn from content pack section 6. No
 * repository links (none are verified), no metrics, no technology that isn't
 * explicitly listed for that specific project. Cards 3 and 4 carry only two
 * chips each because that is all the pack verifies for them — the gap is
 * deliberate, not an omission to be filled later.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, mono, display, rule, caret, panel, chipRow,
  statusPill, monoWidth, wrapMono, displayWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'lab';
const W = CANVAS.width;
const G = CANVAS.gutter;

/* ------------------------------------------------------------ card metrics */

const GAP = 24;
const CARD_W = (CONTENT_W - GAP) / 2;   // 448
const PAD = 20;
const INNER = CARD_W - PAD * 2;         // 408

const TITLE_SIZE = 22;
const BODY_SIZE = 12;
const BODY_LH = 20;
const BLOCK_LH = 18;

const MAX_DESC_LINES = 3;
const MAX_BLOCK_LINES = 2;
const MAX_CHIP_ROWS = 2;

// Baselines and offsets, relative to the card's top-left corner.
const Y = {
  pill: 20,
  index: 34,
  title: 76,
  domain: 98,
  divider: 114,
  desc: 138,
  blockLabel: 208,
  blockText: 230,
  chips: 268,
};
const CARD_H = 334;

/* --------------------------------------------------------------- content */

/** Content pack section 6. Nothing here is inferred. */
const SYSTEMS = [
  {
    index: 'MODEL-01',
    pill: 'FLAGSHIP',
    flagship: true,
    title: 'KORVAGENEST',
    domain: 'AI HRMS / INTERVIEW PLATFORM',
    desc:
      'AI-powered HRMS and interview platform. Resume analysis, ' +
      'RAG-based candidate evaluation, AI screening, automated ' +
      'shortlisting and an HR chatbot.',
    blockLabel: 'KEY CAPABILITY',
    blockText:
      'Interview proctoring: eye tracking, emotion tracking, ' +
      'foreign-object detection including mobile phones.',
    chips: [
      'hybrid rag', 'tool calling', 'litellm', 'groq',
      'multi-provider llm orchestration', 'structured ai workflows',
    ],
  },
  {
    index: 'MODEL-02',
    title: 'JOINHABIBI',
    domain: 'CONVERSATIONAL TRAVEL AI',
    desc:
      'AI-powered trip-planning chatbot for a tourism platform. ' +
      'Conversational trip planning with itinerary generation, place ' +
      'and activity recommendations.',
    blockLabel: 'KEY CAPABILITY',
    blockText:
      'User-preference-based planning with direct cart integration ' +
      'for selected picks.',
    chips: ['php', 'laravel', 'groq', 'litellm'],
  },
  {
    index: 'MODEL-03',
    title: 'YOUTUBE AI COMMENT MODERATOR',
    domain: 'NLP / CONTENT MODERATION',
    desc:
      'NLP- and ML-based moderation system. Toxic-comment detection, ' +
      'harassment detection and automatic removal of problematic comments.',
    blockLabel: 'KEY CAPABILITY',
    blockText: 'A safer environment for creators and viewers.',
    chips: ['nlp', 'machine learning'],
  },
  {
    index: 'MODEL-04',
    pill: 'IEEE PUBLISHED',
    title: 'DRONE-BASED PEST CONTROL',
    domain: 'COMPUTER VISION / RESEARCH',
    desc:
      'Drone-based pest control research. LiteDepthwiseNet stem borer ' +
      'detection running on Jetson Nano.',
    blockLabel: 'PUBLICATION',
    blockText:
      '8th International Conference on Computing Methodologies and ' +
      'Communication (ICCMC 2025).',
    chips: ['litedepthwisenet', 'jetson nano'],
  },
];

/* ------------------------------------------------------------------ card */

function card(sys, x, y) {
  const p = [];
  const cx = x + PAD;

  // Fixed-height cards only work if the content genuinely fits. Fail the build
  // rather than silently overflowing a card into the one beneath it.
  const descLines = wrapMono(sys.desc, INNER, BODY_SIZE);
  const blockLines = wrapMono(sys.blockText, INNER, BODY_SIZE);
  if (descLines.length > MAX_DESC_LINES) {
    throw new Error(`${sys.title}: description needs ${descLines.length} lines, max ${MAX_DESC_LINES}`);
  }
  if (blockLines.length > MAX_BLOCK_LINES) {
    throw new Error(`${sys.title}: ${sys.blockLabel} needs ${blockLines.length} lines, max ${MAX_BLOCK_LINES}`);
  }
  if (displayWidth(sys.title, TITLE_SIZE, 0.02) > INNER) {
    throw new Error(`${sys.title}: title overflows the card at ${TITLE_SIZE}px`);
  }

  // Surface. The flagship is marked by a warmer border as well as its pill, so
  // it still reads as primary in a screenshot where the pill text is small.
  p.push(
    panel(x, y, CARD_W, CARD_H, {
      fill: C.surface,
      stroke: sys.flagship ? C.pinkDeep : C.line,
    })
  );

  // Index + status pill.
  p.push(label(sys.index, cx, y + Y.index, { size: TYPE.meta, fill: C.textMuted, track: TRACK.label }));
  if (sys.pill) {
    const color = sys.flagship ? C.pinkCore : C.pinkGlow;
    const w = monoWidth(sys.pill, TYPE.meta, TRACK.label, { trim: true }) + 28;
    p.push(statusPill(sys.pill, x + CARD_W - PAD - w, y + Y.pill, { color }).svg);
  }

  // Identity.
  p.push(
    display(sys.title, cx, y + Y.title, { size: TITLE_SIZE, fill: C.text, track: 0.02 }),
    label(sys.domain, cx, y + Y.domain, { size: TYPE.meta, fill: C.pinkCore, track: TRACK.label }),
    rule(cx, y + Y.divider, INNER, { color: C.line })
  );

  // Description.
  descLines.forEach((line, i) => {
    p.push(mono(line, cx, y + Y.desc + i * BODY_LH, { size: BODY_SIZE, fill: C.textMuted }));
  });

  // Highlighted block — same slot on every card, contextual label.
  p.push(
    caret(cx, y + Y.blockLabel - 3, { size: 6 }),
    label(sys.blockLabel, cx + 12, y + Y.blockLabel, {
      size: 9, fill: C.pinkGlow, track: TRACK.label,
    })
  );
  blockLines.forEach((line, i) => {
    p.push(mono(line, cx, y + Y.blockText + i * BLOCK_LH, { size: BODY_SIZE, fill: C.text }));
  });

  // Technologies.
  const chips = chipRow(sys.chips, cx, y + Y.chips, INNER, {
    size: 9, padX: 8, height: 20, gap: 6, rowGap: 6,
  });
  if (chips.height > MAX_CHIP_ROWS * 20 + (MAX_CHIP_ROWS - 1) * 6) {
    throw new Error(`${sys.title}: chips need more than ${MAX_CHIP_ROWS} rows`);
  }
  p.push(chips.svg);

  return p.join('');
}

/* ------------------------------------------------------------------ body */

const parts = [];

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`
);

const ROW_Y = [76, 76 + CARD_H + GAP];
const H = ROW_Y[1] + CARD_H + 32;

parts.push(`<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`);

/* ---------------------------------------------------------- section head */

{
  const t = 'AI MODEL LAB';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, W - G - lineX, { color: C.line })
  );
}

/* ----------------------------------------------------------------- cards */

SYSTEMS.forEach((sys, i) => {
  const x = G + (i % 2) * (CARD_W + GAP);
  const y = ROW_Y[Math.floor(i / 2)];
  parts.push(card(sys, x, y));
});

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    'AI Model Lab — KorvageNest (AI HRMS and interview platform, flagship); ' +
    'JoinHabibi (conversational travel AI); YouTube AI Comment Moderator (NLP content moderation); ' +
    'Drone-Based Pest Control (computer vision research, IEEE ICCMC 2025).',
  faces: ['displayBold', 'monoRegular', 'monoMedium'],
  body: defs(ID) + parts.join(''),
});

await writeAsset('ai-model-lab.svg', svg);
