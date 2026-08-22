/**
 * AMIRTHA AI — AI terminal
 *
 *   node tools/build-terminal.mjs   ->   assets/terminal.svg
 *
 * HOW THE TYPEWRITER WORKS: an SVG in an <img> gets no scripting, so each line
 * is revealed by its own clipPath whose rect width is animated with
 * calcMode="discrete" through one keyframe per character. Discrete steps give
 * real character-by-character typing; a linear ramp would slide a soft edge
 * across the glyphs instead. All lines share one 12s cycle, so at the loop
 * boundary every clip resets at once and the screen re-runs the command.
 *
 * Because the text is monospace at a known 0.6em advance, each line is split
 * into label / dots / value and drawn as three <text> runs at computed offsets.
 * The glyphs land exactly where a single run would put them, which is what
 * lets the lines be coloured without altering a single character.
 *
 * CONTENT: the lines are reproduced verbatim from the approved text. This is
 * branding chrome — the words are a visual device, and nothing here asserts a
 * measurable fact about any system.
 */
import {
  C, TYPE, TRACK, CANVAS, CONTENT_W,
  svgDocument, defs, label, mono, dot, rule, caret, panel, monoWidth,
} from './theme.mjs';
import { writeAsset } from './io.mjs';

const ID = 'term';
const W = CANVAS.width;
const G = CANVAS.gutter;

const WIN_Y = 76;
const WIN_H = 300;
const TITLE_H = 36;
const PAD_X = 28;

const FS = TYPE.terminal;          // 14
const CHAR = FS * 0.6;             // exact mono advance
const LINE_H = 24;
const FIRST_BASELINE = WIN_Y + TITLE_H + 34;

const TOTAL = 12;                  // seconds per full cycle

/* --------------------------------------------------------------- content */

/**
 * Verbatim. `at`/`len` are the start second and typing duration; a null line
 * is a blank row and gets no animation.
 */
const LINES = [
  { text: '$ amirtha --status', at: 0.4, len: 1.2 },
  null,
  { text: 'AI SYSTEM ........ ONLINE', at: 2.0, len: 0.9 },
  { text: 'NEURAL CORE ...... ACTIVE', at: 3.0, len: 0.9 },
  { text: 'PROJECTS ......... LOADED', at: 4.0, len: 0.9 },
  { text: 'RESEARCH ......... ACTIVE', at: 5.0, len: 0.9 },
  { text: 'CONTRIBUTIONS .... TRACKING', at: 6.0, len: 0.9 },
  null,
  { text: 'SYSTEM READY', at: 7.4, len: 0.8, cursor: true },
];

/* ------------------------------------------------------------- animation */

/**
 * A clip rect that steps open one character at a time.
 * calcMode="discrete" requires the first keyTime to be 0 and the last to be 1,
 * hence the leading hidden frame and the trailing hold.
 */
function typeClip(clipId, x, y, height, text, at, len) {
  const n = text.length;
  const a = at / TOTAL;
  const b = (at + len) / TOTAL;

  const keyTimes = [0, a];
  const values = [0, 0];
  for (let k = 1; k <= n; k++) {
    keyTimes.push(a + ((b - a) * k) / n);
    values.push(k * CHAR + 1);      // +1 so the final glyph is never clipped
  }
  keyTimes.push(1);
  values.push(n * CHAR + 1);

  return (
    `<clipPath id="${clipId}">` +
      `<rect x="${x}" y="${y}" height="${height}" width="0">` +
        `<animate attributeName="width" calcMode="discrete" ` +
          `values="${values.map((v) => v.toFixed(1)).join(';')}" ` +
          `keyTimes="${keyTimes.map((t) => t.toFixed(4)).join(';')}" ` +
          `dur="${TOTAL}s" repeatCount="indefinite"/>` +
      `</rect>` +
    `</clipPath>`
  );
}

/* ------------------------------------------------------------------ body */

const parts = [];
const clips = [];
const H = WIN_Y + WIN_H + 32;

parts.push(
  `<defs><pattern id="${ID}-grid" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<circle cx="1" cy="1" r="1" fill="${C.line}"/></pattern></defs>`,
  `<rect width="${W}" height="${H}" fill="url(#${ID}-grid)" opacity="0.4"/>`
);

/* ---------------------------------------------------------- section head */

{
  const t = 'AI TERMINAL';
  const textW = monoWidth(t, TYPE.label, TRACK.label, { trim: true });
  const lineX = G + 14 + textW + 14;
  parts.push(
    caret(G, 48, { size: 7 }),
    label(t, G + 14, 52, { size: TYPE.label, fill: C.pinkCore, track: TRACK.label }),
    rule(lineX, 48, W - G - lineX, { color: C.line })
  );
}

/* ------------------------------------------------------------ window chrome */

{
  const host = 'amirtha@ai-lab';
  const hostW = monoWidth(host, TYPE.meta, TRACK.label, { trim: true });

  parts.push(
    panel(G, WIN_Y, CONTENT_W, WIN_H, { fill: C.surface, stroke: C.line, radius: 10 }),
    `<rect x="${G}" y="${WIN_Y + TITLE_H}" width="${CONTENT_W}" height="1" fill="${C.line}"/>`,
    dot(G + 22, WIN_Y + TITLE_H / 2, { r: 4, color: C.pinkCore }),
    dot(G + 38, WIN_Y + TITLE_H / 2, { r: 4, color: C.pinkDeep }),
    dot(G + 54, WIN_Y + TITLE_H / 2, { r: 4, color: C.pinkDim }),
    label(host, G + CONTENT_W / 2 - hostW / 2, WIN_Y + TITLE_H / 2 + 4, {
      size: TYPE.meta, fill: C.textMuted, track: TRACK.label,
    })
  );
}

/* ------------------------------------------------------------------ lines */

const textX = G + PAD_X;

LINES.forEach((line, i) => {
  if (!line) return;

  const baseline = FIRST_BASELINE + i * LINE_H;
  const clipId = `${ID}-l${i}`;
  clips.push(typeClip(clipId, textX, baseline - FS, FS * 1.5, line.text, line.at, line.len));

  const runs = [];

  if (line.text.startsWith('$ ')) {
    // Prompt sigil, then the command.
    runs.push(
      mono('$', textX, baseline, { size: FS, fill: C.pinkCore, weight: 500 }),
      mono(line.text.slice(2), textX + 2 * CHAR, baseline, { size: FS, fill: C.text })
    );
  } else {
    // "LABEL ....... VALUE" -> three coloured runs at exact character offsets.
    const m = line.text.match(/^(.*?) (\.+) (.*)$/);
    if (m) {
      const [, name, dots, value] = m;
      runs.push(
        mono(name, textX, baseline, { size: FS, fill: C.text }),
        mono(dots, textX + (name.length + 1) * CHAR, baseline, { size: FS, fill: C.pinkDim }),
        mono(value, textX + (name.length + dots.length + 2) * CHAR, baseline, {
          size: FS, fill: C.pinkGlow, weight: 500,
        })
      );
    } else {
      runs.push(mono(line.text, textX, baseline, { size: FS, fill: C.text, weight: 500 }));
    }
  }

  parts.push(`<g clip-path="url(#${clipId})">${runs.join('')}</g>`);

  // Blinking cursor, gated so it only appears once its line has finished.
  if (line.cursor) {
    const gate = ((line.at + line.len) / TOTAL).toFixed(4);
    const cx = textX + line.text.length * CHAR + 3;
    parts.push(
      `<g opacity="0">` +
        `<animate attributeName="opacity" calcMode="discrete" values="0;1;1" ` +
          `keyTimes="0;${gate};1" dur="${TOTAL}s" repeatCount="indefinite"/>` +
        `<rect x="${cx.toFixed(1)}" y="${baseline + 3}" width="${(CHAR - 1).toFixed(1)}" ` +
          `height="2" fill="${C.pinkGlow}">` +
          `<animate attributeName="opacity" calcMode="discrete" values="1;0;0" ` +
            `keyTimes="0;0.5;1" dur="1.06s" repeatCount="indefinite"/>` +
        `</rect>` +
      `</g>`
    );
  }
});

/* ----------------------------------------------------------------- write */

const svg = svgDocument({
  id: ID,
  height: H,
  title:
    'AI terminal. $ amirtha --status. ' +
    LINES.filter(Boolean).slice(1).map((l) => l.text).join('. ') + '_',
  faces: ['monoRegular', 'monoMedium'],
  body: defs(ID) + `<defs>${clips.join('')}</defs>` + parts.join(''),
});

await writeAsset('terminal.svg', svg);
