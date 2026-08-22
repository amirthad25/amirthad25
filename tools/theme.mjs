/**
 * AMIRTHA AI — design system
 * =========================================================================
 * Single source of truth for the profile's visual language. Every SVG in
 * assets/ is composed from these tokens and primitives, so a palette or type
 * change is one edit here rather than thirteen edits across the assets.
 *
 * Three rules this module exists to enforce:
 *
 *  1. NO GLYPHS THAT AREN'T ASCII. The embedded fonts are subset to printable
 *     ASCII, so block/box-drawing/bullet characters (U+2588, U+2500, U+25B8,
 *     U+2022 ...) would silently fall back to another font and break the grid.
 *     Use bar(), rule(), caret() and dot() instead — they draw real shapes.
 *
 *  2. MONO TEXT IS MEASURED, NOT GUESSED. JetBrains Mono has a uniform 0.6em
 *     advance (verified against the font's hmtx table), so monoWidth() returns
 *     an exact pixel width. All mono text is anchored `start` at a computed x;
 *     nothing relies on the renderer's own centring.
 *
 *  3. OUTPUT IS DETERMINISTIC. Generated assets are committed, so anything
 *     random (particle fields) is seeded — same input, byte-identical output,
 *     no churn in git history.
 */

import {
  displayBold, displayMedium, monoRegular, monoMedium, displayBoldAdvances,
} from './fonts.generated.mjs';

/* ---------------------------------------------------------------- palette */

/**
 * Neural Pink on Deep Substrate.
 * Exactly one non-pink accent (`ok`) — reserved for status indicators. Adding
 * a second accent is what turns "lab instrument" into "gaming README".
 */
export const C = {
  void: '#05040A',      // page substrate
  surface: '#0C0812',   // card fill
  surface2: '#150C1D',  // raised / inner panels
  line: '#2A1730',      // hairline borders, grid
  pinkCore: '#FF2E88',  // primary brand: node cores, headings
  pinkGlow: '#FF6FB5',  // halos, active states
  pinkDeep: '#8B1D5A',  // edges, gradient tails
  pinkDim: '#4A0D2C',   // faintest fills
  text: '#F4EAF1',      // primary text
  textMuted: '#9C8896', // labels, meta, captions
  ok: '#3ED598',        // status dots ONLY
};

/* ------------------------------------------------------------------ scale */

/** Canvas contract — every asset is authored 1000px wide on a 12-column grid. */
export const CANVAS = { width: 1000, gutter: 40, cols: 12, gap: 16 };

/** Inner content width, gutter to gutter. */
export const CONTENT_W = CANVAS.width - CANVAS.gutter * 2;

/** x position of column `i` (0-indexed) and the width of `span` columns. */
export function col(i, span = 1) {
  const colW = (CONTENT_W - CANVAS.gap * (CANVAS.cols - 1)) / CANVAS.cols;
  return {
    x: CANVAS.gutter + i * (colW + CANVAS.gap),
    w: span * colW + (span - 1) * CANVAS.gap,
  };
}

export const TYPE = {
  hero: 64,      // AMIRTHA T
  title: 30,     // section headings
  cardTitle: 22, // system names in the lab
  lead: 15,      // intro / description prose
  body: 13,
  terminal: 14,
  label: 11,     // uppercase tracked labels
  meta: 10,      // captions, timestamps
  chip: 10,
};

/** Letter-spacing in em. The tracked uppercase label is the core device. */
export const TRACK = { label: 0.18, title: 0.06, chip: 0.1, none: 0 };

export const RADIUS = { panel: 16, card: 12, chip: 4, pill: 999 };
export const SPACE = { xs: 6, sm: 10, md: 16, lg: 24, xl: 40, xxl: 64 };

/* ---------------------------------------------------------- text metrics */

/** Verified against hmtx: every JetBrains Mono glyph advances 600/1000 em. */
export const MONO_ADVANCE = 0.6;

/**
 * Exact rendered width of a run of mono text.
 * Letter-spacing is applied after every character including the last (CSS
 * behaviour), which is why the tracking term is multiplied by length, not
 * length - 1. `trim` drops that trailing space when you want optical width.
 */
export function monoWidth(text, size, trackEm = 0, { trim = false } = {}) {
  const n = String(text).length;
  const track = size * trackEm;
  return n * size * MONO_ADVANCE + (trim ? Math.max(0, n - 1) : n) * track;
}

/**
 * Exact rendered width of display-face text.
 *
 * Space Grotesk is proportional, so unlike mono this needs a real per-glyph
 * advance table (generated from the font's hmtx by build-fonts.mjs). Use it to
 * check that a long heading fits its container before trusting a chosen size —
 * `fitDisplaySize()` does exactly that.
 */
export function displayWidth(text, size, trackEm = 0) {
  const s = String(text);
  let em = 0;
  for (const ch of s) em += displayBoldAdvances[ch] ?? 0.6;
  return em * size + s.length * size * trackEm;
}

/** Largest size at or below `max` at which `text` fits `maxWidth`. */
export function fitDisplaySize(text, maxWidth, { max = TYPE.cardTitle, min = 12, trackEm = 0 } = {}) {
  for (let size = max; size >= min; size -= 0.5) {
    if (displayWidth(text, size, trackEm) <= maxWidth) return size;
  }
  return min;
}

/* -------------------------------------------------------------- escaping */

const XML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/** Escape a value for use in SVG text content or an attribute. */
export function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => XML[ch]);
}

/* ----------------------------------------------------------------- fonts */

export const FONT = {
  display: "'AmirthaDisplay','Space Grotesk','Segoe UI',system-ui,sans-serif",
  mono: "'AmirthaMono','JetBrains Mono',ui-monospace,Consolas,monospace",
};

const FACE_DATA = {
  displayBold: { family: 'AmirthaDisplay', weight: 700, data: displayBold },
  displayMedium: { family: 'AmirthaDisplay', weight: 500, data: displayMedium },
  monoRegular: { family: 'AmirthaMono', weight: 400, data: monoRegular },
  monoMedium: { family: 'AmirthaMono', weight: 500, data: monoMedium },
};

/**
 * @font-face rules for the named faces, as inline base64 woff2.
 * Each asset embeds only the faces it actually uses (~6 KB each) — passing all
 * four would put 24 KB of font in every file for no reason.
 */
export function fontFaceCss(faces) {
  return faces
    .map((name) => {
      const face = FACE_DATA[name];
      if (!face) throw new Error(`unknown font face: ${name}`);
      return (
        `@font-face{font-family:'${face.family}';font-style:normal;` +
        `font-weight:${face.weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${face.data}) format('woff2')}`
      );
    })
    .join('');
}

/* --------------------------------------------------------------- defs/fx */

/**
 * Shared gradients and filters. `idPrefix` namespaces them so two assets
 * embedded on the same README page can never collide on an id.
 */
export function defs(idPrefix, { glow = true, gradients = true } = {}) {
  const parts = [];

  if (gradients) {
    parts.push(
      `<linearGradient id="${idPrefix}-sweep" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0%" stop-color="${C.pinkDeep}"/>` +
        `<stop offset="55%" stop-color="${C.pinkCore}"/>` +
        `<stop offset="100%" stop-color="${C.pinkGlow}"/>` +
      `</linearGradient>`,
      `<linearGradient id="${idPrefix}-fade" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0%" stop-color="${C.pinkCore}" stop-opacity="0"/>` +
        `<stop offset="18%" stop-color="${C.pinkCore}" stop-opacity="0.85"/>` +
        `<stop offset="82%" stop-color="${C.pinkCore}" stop-opacity="0.85"/>` +
        `<stop offset="100%" stop-color="${C.pinkCore}" stop-opacity="0"/>` +
      `</linearGradient>`,
      `<radialGradient id="${idPrefix}-halo" cx="50%" cy="50%" r="50%">` +
        `<stop offset="0%" stop-color="${C.pinkGlow}" stop-opacity="0.42"/>` +
        `<stop offset="60%" stop-color="${C.pinkCore}" stop-opacity="0.12"/>` +
        `<stop offset="100%" stop-color="${C.pinkCore}" stop-opacity="0"/>` +
      `</radialGradient>`
    );
  }

  if (glow) {
    // Two strengths: `soft` for hairlines and small fills, `bloom` for node
    // cores. Both are deliberately restrained — the halo gradient carries most
    // of the light, and stacking blur on top of it turns crisp marks to mush.
    parts.push(
      `<filter id="${idPrefix}-soft" x="-60%" y="-60%" width="220%" height="220%">` +
        `<feGaussianBlur stdDeviation="1.5" result="b"/>` +
        `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>` +
      `</filter>`,
      `<filter id="${idPrefix}-bloom" x="-90%" y="-90%" width="280%" height="280%">` +
        `<feGaussianBlur stdDeviation="3" result="b"/>` +
        `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>` +
      `</filter>`
    );
  }

  return `<defs>${parts.join('')}</defs>`;
}

/* --------------------------------------------------------------- document */

/**
 * Wrap a body in a complete SVG document.
 *
 * The `void` background is painted opaquely and the whole canvas is clipped to
 * a rounded rect, so the asset reads correctly on GitHub's light theme too —
 * that is why there is no light/dark asset pair anywhere in this project.
 */
export function svgDocument({
  width = CANVAS.width,
  height,
  id,
  faces = [],
  css = '',
  body,
  title,
  rounded = true,
  background = C.void,
}) {
  if (!id) throw new Error('svgDocument requires an id (used to namespace defs)');
  if (!height) throw new Error('svgDocument requires a height');

  const r = rounded ? RADIUS.panel : 0;
  const style = `${fontFaceCss(faces)}${css}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" role="img"` +
      `${title ? ` aria-label="${esc(title)}"` : ''} ` +
      `text-rendering="geometricPrecision" font-kerning="none">` +
      (title ? `<title>${esc(title)}</title>` : '') +
      `<style>${style}</style>` +
      `<clipPath id="${id}-clip"><rect width="${width}" height="${height}" rx="${r}"/></clipPath>` +
      `<g clip-path="url(#${id}-clip)">` +
        `<rect width="${width}" height="${height}" fill="${background}"/>` +
        body +
      `</g>` +
      (rounded
        ? `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${r}" ` +
          `fill="none" stroke="${C.line}"/>`
        : '') +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ text */

/** Tracked uppercase mono label — the system's signature typographic device. */
export function label(text, x, y, {
  size = TYPE.label,
  fill = C.textMuted,
  track = TRACK.label,
  weight = 500,
  opacity = 1,
} = {}) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT.mono}" font-size="${size}" ` +
      `font-weight="${weight}" letter-spacing="${(size * track).toFixed(2)}" ` +
      `fill="${fill}" opacity="${opacity}">${esc(String(text).toUpperCase())}</text>`
  );
}

/** Mono text, left-anchored at a computed x. Used for data, code, captions. */
export function mono(text, x, y, {
  size = TYPE.body,
  fill = C.text,
  track = TRACK.none,
  weight = 400,
  opacity = 1,
  anchor = 'start',
  extra = '',
} = {}) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT.mono}" font-size="${size}" ` +
      `font-weight="${weight}" letter-spacing="${(size * track).toFixed(2)}" ` +
      `fill="${fill}" opacity="${opacity}" text-anchor="${anchor}"${extra ? ' ' + extra : ''}>` +
      `${esc(text)}</text>`
  );
}

/** Display face — headings and system names only. */
export function display(text, x, y, {
  size = TYPE.title,
  fill = C.text,
  weight = 700,
  track = TRACK.title,
  anchor = 'start',
  opacity = 1,
  extra = '',
} = {}) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT.display}" font-size="${size}" ` +
      `font-weight="${weight}" letter-spacing="${(size * track).toFixed(2)}" ` +
      `fill="${fill}" opacity="${opacity}" text-anchor="${anchor}"${extra ? ' ' + extra : ''}>` +
      `${esc(text)}</text>`
  );
}

/**
 * Break prose into lines that fit `maxWidth`.
 * Mono only — widths come from monoWidth(), so the break points are exact.
 * Exposed separately from monoParagraph so callers can assert on line count
 * before committing to a fixed-height layout.
 */
export function wrapMono(text, maxWidth, size, trackEm = 0) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && monoWidth(next, size, trackEm) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Break display-face text into lines that fit `maxWidth`.
 * Uses the generated advance table, so breaks are exact rather than estimated.
 */
export function wrapDisplay(text, maxWidth, size, trackEm = 0) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && displayWidth(next, size, trackEm) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Wrap prose to a pixel width and emit one <text> per line. */
export function monoParagraph(text, x, y, maxWidth, {
  size = TYPE.body,
  lineHeight = 1.65,
  ...opts
} = {}) {
  return wrapMono(text, maxWidth, size, opts.track ?? 0)
    .map((l, i) => mono(l, x, y + i * size * lineHeight, { size, ...opts }))
    .join('');
}

/* ----------------------------------------------------- shapes, not glyphs */

/** Hairline rule. `fade` uses the gradient that dissolves at both ends. */
export function rule(x, y, width, { idPrefix, fade = false, color = C.line, opacity = 1 } = {}) {
  const fill = fade ? `url(#${idPrefix}-fade)` : color;
  return `<rect x="${x}" y="${y}" width="${width}" height="1" fill="${fill}" opacity="${opacity}"/>`;
}

/** Status dot. Replaces the bullet glyph; optionally breathes. */
export function dot(cx, cy, { r = 4, color = C.pinkCore, glow = false, idPrefix, pulse = 0 } = {}) {
  const filter = glow && idPrefix ? ` filter="url(#${idPrefix}-soft)"` : '';
  const anim = pulse
    ? `<animate attributeName="opacity" values="1;0.35;1" dur="${pulse}s" repeatCount="indefinite"/>`
    : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"${filter}>${anim}</circle>`;
}

/** The small right-pointing marker used before section labels. Replaces U+25B8. */
export function caret(x, y, { size = 7, color = C.pinkCore, opacity = 1 } = {}) {
  const h = size * 0.86;
  return (
    `<path d="M${x} ${y - h / 2} L${x + size * 0.72} ${y} L${x} ${y + h / 2} Z" ` +
      `fill="${color}" opacity="${opacity}"/>`
  );
}

/**
 * Segmented progress bar. Reads like the block-character bar in the brief
 * (filled/empty cells) but is drawn as real rects, so it can never fall back
 * to another font. `value` is 0..1; cells fill proportionally, never rounded up.
 */
export function bar(x, y, width, value, {
  cells = 36,
  height = 10,
  gap = 3,
  idPrefix,
  emptyColor = C.pinkDim,
  glow = true,
} = {}) {
  const cellW = (width - gap * (cells - 1)) / cells;
  const filled = Math.floor(Math.max(0, Math.min(1, value)) * cells);

  // A local gradient in USER SPACE, spanning the whole bar. The shared
  // `-sweep` gradient uses objectBoundingBox units, which would restart the
  // ramp inside every single cell instead of sweeping across the run.
  const gradId = `${idPrefix}-bar-${Math.round(x)}-${Math.round(y)}`;
  const grad =
    `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" ` +
      `x1="${x}" y1="0" x2="${x + width}" y2="0">` +
      `<stop offset="0%" stop-color="${C.pinkDeep}"/>` +
      `<stop offset="55%" stop-color="${C.pinkCore}"/>` +
      `<stop offset="100%" stop-color="${C.pinkGlow}"/>` +
    `</linearGradient>`;

  const cell = (i, fill) =>
    `<rect x="${(x + i * (cellW + gap)).toFixed(2)}" y="${y}" ` +
      `width="${cellW.toFixed(2)}" height="${height}" rx="1.5" fill="${fill}"/>`;

  const empty = [];
  const on = [];
  for (let i = 0; i < cells; i++) {
    if (i < filled) on.push(cell(i, `url(#${gradId})`));
    else empty.push(cell(i, emptyColor));
  }

  // The filled run is glowed as ONE group. Filtering each cell separately makes
  // neighbouring blurs pile up and the bar reads as a smear instead of cells.
  const lit = glow && idPrefix
    ? `<g filter="url(#${idPrefix}-soft)">${on.join('')}</g>`
    : on.join('');

  return `<defs>${grad}</defs>` + empty.join('') + lit;
}

/* ------------------------------------------------------------ containers */

/** Card / section surface. */
export function panel(x, y, width, height, {
  fill = C.surface,
  stroke = C.line,
  radius = RADIUS.card,
  opacity = 1,
} = {}) {
  return (
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${height - 1}" ` +
      `rx="${radius}" fill="${fill}" stroke="${stroke}" opacity="${opacity}"/>`
  );
}

/** Lab chrome: four L-brackets marking a region's corners. */
export function cornerBrackets(x, y, width, height, {
  len = 14,
  color = C.pinkCore,
  opacity = 0.55,
  weight = 1.5,
} = {}) {
  const paths = [
    `M${x} ${y + len} L${x} ${y} L${x + len} ${y}`,
    `M${x + width - len} ${y} L${x + width} ${y} L${x + width} ${y + len}`,
    `M${x + width} ${y + height - len} L${x + width} ${y + height} L${x + width - len} ${y + height}`,
    `M${x + len} ${y + height} L${x} ${y + height} L${x} ${y + height - len}`,
  ];
  return paths
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="${weight}" ` +
        `opacity="${opacity}" stroke-linecap="square"/>`
    )
    .join('');
}

/** Rendered width of a chip, without building it. Used for wrap decisions. */
export function chipWidth(text, { size = TYPE.chip, padX = 9, track = TRACK.chip } = {}) {
  return monoWidth(String(text).toUpperCase(), size, track, { trim: true }) + padX * 2;
}

/** Tech chip. Width is derived from monoWidth(), so it always fits its text. */
export function chip(text, x, y, {
  size = TYPE.chip,
  padX = 9,
  height = 22,
  color = C.pinkGlow,
  border = C.pinkDim,
  fill = C.surface2,
  track = TRACK.chip,
} = {}) {
  const t = String(text).toUpperCase();
  const w = chipWidth(t, { size, padX, track });
  const svg =
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${height - 1}" ` +
      `rx="${RADIUS.chip}" fill="${fill}" stroke="${border}"/>` +
    label(t, x + padX, y + height / 2 + size * 0.36, { size, fill: color, track, weight: 400 });
  return { svg, width: w };
}

/** Lay chips out in rows that wrap at `maxWidth`. Returns svg + total height. */
export function chipRow(items, x, y, maxWidth, {
  gap = 7,
  rowGap = 7,
  height = 22,
  size = TYPE.chip,
  padX = 9,
  track = TRACK.chip,
  ...opts
} = {}) {
  const chipOpts = { size, padX, track, height, ...opts };
  let cx = x;
  let cy = y;
  const out = [];

  for (const item of items) {
    const w = chipWidth(item, { size, padX, track });
    if (cx > x && cx + w > x + maxWidth) {
      cy += height + rowGap;
      cx = x;
    }
    out.push(chip(item, cx, cy, chipOpts).svg);
    cx += w + gap;
  }

  return { svg: out.join(''), height: cy - y + height };
}

/** Outlined status pill: dot + tracked label. */
export function statusPill(text, x, y, {
  color = C.pinkCore,
  size = TYPE.meta,
  height = 20,
  padX = 9,
  track = TRACK.label,
} = {}) {
  const t = String(text).toUpperCase();
  const textW = monoWidth(t, size, track, { trim: true });
  const w = padX * 2 + 10 + textW;
  const svg =
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${height - 1}" ` +
      `rx="${RADIUS.pill}" fill="none" stroke="${color}" stroke-opacity="0.45"/>` +
    dot(x + padX + 2, y + height / 2, { r: 2.5, color }) +
    label(t, x + padX + 10, y + height / 2 + size * 0.36, { size, fill: color, track, weight: 500 });
  return { svg, width: w };
}

/**
 * Tracked labels joined by drawn dot separators — "AI / ML . BIG DATA . CV".
 *
 * The brief writes these with U+2022, which is not in the ASCII subset, so the
 * separator is a real circle. Segment widths come from monoWidth(), so
 * `anchor: 'middle'` centres on the true optical width rather than trusting the
 * renderer. Returns the total width for callers that need to lay out around it.
 */
export function dotSeparated(segments, x, y, {
  size = TYPE.label,
  fill = C.textMuted,
  track = TRACK.label,
  dotColor = C.pinkCore,
  dotR = 2,
  gap = 11,
  weight = 400,
  anchor = 'start',
} = {}) {
  const texts = segments.map((s) => String(s).toUpperCase());
  const widths = texts.map((t) => monoWidth(t, size, track, { trim: true }));
  const sepW = gap * 2 + dotR * 2;
  const total = widths.reduce((a, b) => a + b, 0) + sepW * (texts.length - 1);

  let cx = anchor === 'middle' ? x - total / 2 : x;
  const out = [];

  texts.forEach((t, i) => {
    out.push(label(t, cx, y, { size, fill, track, weight }));
    cx += widths[i];
    if (i < texts.length - 1) {
      cx += gap;
      out.push(dot(cx + dotR, y - size * 0.32, { r: dotR, color: dotColor }));
      cx += dotR * 2 + gap;
    }
  });

  return { svg: out.join(''), width: total };
}

/** Neural node: halo + optional ring + core, with optional breathing. */
export function node(cx, cy, {
  r = 8,
  idPrefix,
  color = C.pinkCore,
  ring = true,
  breathe = 0,
  delay = 0,
  halo = true,
} = {}) {
  const parts = [];
  // `halo: false` for tightly packed nodes — once the halos overlap they merge
  // into a bright column that swamps whatever line connects the nodes.
  if (idPrefix && halo) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r * 3.4}" fill="url(#${idPrefix}-halo)"/>`);
  }
  if (ring) {
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${r * 1.95}" fill="none" stroke="${color}" ` +
        `stroke-width="1" stroke-opacity="0.35"/>`
    );
  }
  const anim = breathe
    ? `<animate attributeName="opacity" values="1;0.55;1" dur="${breathe}s" ` +
      `begin="${delay}s" repeatCount="indefinite"/>`
    : '';
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"` +
      `${idPrefix ? ` filter="url(#${idPrefix}-bloom)"` : ''}>${anim}</circle>`
  );
  return parts.join('');
}

/* --------------------------------------------------------- deterministic */

/** mulberry32 — seeded PRNG so generated assets are byte-stable across builds. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Slow-drifting particle field. Seeded, so re-running the build produces an
 * identical file and git stays quiet.
 */
export function particles(width, height, {
  count = 14,
  seed = 1,
  color = C.pinkCore,
  minR = 1,
  maxR = 2.6,
  minOpacity = 0.12,
  maxOpacity = 0.4,
  drift = 10,
} = {}) {
  const rand = rng(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const r = minR + rand() * (maxR - minR);
    const o = minOpacity + rand() * (maxOpacity - minOpacity);
    const dur = 9 + rand() * 9;
    const dy = -(drift * (0.5 + rand()));
    out.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" ` +
        `fill="${color}" opacity="${o.toFixed(3)}">` +
        `<animateTransform attributeName="transform" type="translate" ` +
          `values="0 0;0 ${dy.toFixed(1)};0 0" dur="${dur.toFixed(1)}s" ` +
          `begin="${(rand() * -dur).toFixed(1)}s" repeatCount="indefinite"/>` +
      `</circle>`
    );
  }
  return out.join('');
}

/* ---------------------------------------------------------------- output */

/** Collapse the whitespace this module's template literals introduce. */
export function minify(svg) {
  return svg.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}
