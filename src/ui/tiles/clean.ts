/**
 * The Clean tile set (the default): flat tiles, big corner indices, simplified traditional faces.
 * Teaching palette from docs/08-design-ideas.md: Bams and the Green Dragon share green, Craks and the
 * Red Dragon share red, Dots and Soap share blue. Color is never the only cue: every tile also carries
 * its own picture and a corner index (number plus suit letter, or N/E/W/S, R/G/0, F, J).
 *
 * The faces are our own drawings. Each kept anchor (sticks and the bird on Bams, a Chinese numeral over
 * 萬 on Craks, coins on Dots, 中 and 發, Soap's frame, flowers, JOKER) is the traditional one, so the
 * skills carry over to a real set.
 *
 * Output: SVG <symbol> markup for a hidden sprite; each tile on screen is <svg><use href="#..."/></svg>.
 */

import { FLOWER, NUM_KINDS, isSuited, kindCode, kindOfTile, numberOf, suitOf, type Kind, type TileId } from '../../engine/tiles';

export const TILE_W = 64;
export const TILE_H = 88;

const BAM = '#1E7B4A';
const BAM_DARK = '#135C36';
const CRAK = '#C7372E';
const DOT = '#1F5FAF';
const DOT_LIGHT = '#B9D2F2';
const INK = '#1E2532';
const GOLD = '#E3A23A';
const EDGE = '#C4CBD4';
const FACE = '#FFFFFF';
const OUTLINE = '#AEB6C1';
const PLUM = '#8A3B78';

const INDEX_FONT = "Lexend, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HAN_FONT = "'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', sans-serif";

const SUIT_COLOR = [BAM, CRAK, DOT];
const SUIT_LETTER = ['B', 'C', 'D'];
const HAN_NUMERAL = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function face(fill = FACE, stroke = OUTLINE): string {
  return (
    `<rect x="1" y="4" width="62" height="83" rx="7" fill="${EDGE}"/>` +
    `<rect x="1" y="1" width="62" height="83" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`
  );
}

function index(main: string, sub: string | null, color: string): string {
  const big = `<text x="6" y="24" font-family="${INDEX_FONT}" font-size="22" font-weight="700" fill="${color}">${main}</text>`;
  const small = sub ? `<text x="7" y="37" font-family="${INDEX_FONT}" font-size="11" font-weight="700" fill="${color}">${sub}</text>` : '';
  return big + small;
}

function stick(cx: number, cy: number, color = BAM, len = 18): string {
  const y = cy - len / 2;
  return (
    `<rect x="${cx - 3}" y="${y}" width="6" height="${len}" rx="3" fill="${color}"/>` +
    `<rect x="${cx - 3.6}" y="${cy - 1}" width="7.2" height="2" rx="1" fill="${BAM_DARK}"/>` +
    `<line x1="${cx}" y1="${y + 3}" x2="${cx}" y2="${cy - 2.5}" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>`
  );
}

function bird(): string {
  return (
    `<path d="M29 63 L15 74 L32 70Z" fill="${BAM}"/>` +
    `<circle cx="39" cy="58" r="12.5" fill="${BAM}"/>` +
    `<path d="M31 57 Q40 48 48 58 Q40 64 31 57Z" fill="#8FD3A6"/>` +
    `<circle cx="49" cy="42" r="7.5" fill="${BAM}"/>` +
    `<path d="M56 41 L62 43.5 L56 46Z" fill="${GOLD}"/>` +
    `<circle cx="51.5" cy="40.5" r="1.7" fill="#FFFFFF"/>` +
    `<path d="M36 70 L35 78 M42 70 L43 78" stroke="${BAM_DARK}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M24 80 L54 80" stroke="${BAM_DARK}" stroke-width="2" stroke-linecap="round"/>`
  );
}

const BAM_LAYOUT: Record<number, [number, number, boolean?][]> = {
  2: [
    [40, 34],
    [40, 64],
  ],
  3: [
    [40, 32],
    [31, 62],
    [49, 62],
  ],
  4: [
    [31, 34],
    [49, 34],
    [31, 64],
    [49, 64],
  ],
  5: [
    [29, 31],
    [51, 31],
    [40, 49, true],
    [29, 67],
    [51, 67],
  ],
  6: [
    [27, 36],
    [40, 36],
    [53, 36],
    [27, 66],
    [40, 66],
    [53, 66],
  ],
  7: [
    [40, 23, true],
    [27, 48],
    [40, 48],
    [53, 48],
    [27, 72],
    [40, 72],
    [53, 72],
  ],
  8: [
    [26, 36],
    [35.3, 36],
    [44.7, 36],
    [54, 36],
    [26, 66],
    [35.3, 66],
    [44.7, 66],
    [54, 66],
  ],
  9: [
    [27, 27],
    [40, 27, true],
    [53, 27],
    [27, 50],
    [40, 50, true],
    [53, 50],
    [27, 73],
    [40, 73, true],
    [53, 73],
  ],
};

function coin(cx: number, cy: number, r: number, accent = false): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${DOT}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(2)}" fill="${DOT_LIGHT}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(r * 0.3).toFixed(2)}" fill="${accent ? GOLD : DOT}"/>`
  );
}

const DOT_LAYOUT: Record<number, [number, number, number, boolean?][]> = {
  2: [
    [40, 33, 11],
    [40, 63, 11],
  ],
  3: [
    [31, 30, 8.5],
    [42.5, 50, 8.5, true],
    [54, 70, 8.5],
  ],
  4: [
    [30, 36, 9],
    [50, 36, 9],
    [30, 64, 9],
    [50, 64, 9],
  ],
  5: [
    [29, 32, 8.5],
    [51, 32, 8.5],
    [40, 50, 8.5, true],
    [29, 68, 8.5],
    [51, 68, 8.5],
  ],
  6: [
    [30, 27, 8],
    [50, 27, 8],
    [30, 50, 8],
    [50, 50, 8],
    [30, 73, 8],
    [50, 73, 8],
  ],
  7: [
    [31, 20, 6.3],
    [42.5, 28, 6.3],
    [54, 36, 6.3],
    [30, 57, 7.5],
    [50, 57, 7.5],
    [30, 75, 7.5],
    [50, 75, 7.5],
  ],
  8: [
    [30, 21, 7.3],
    [50, 21, 7.3],
    [30, 39.3, 7.3],
    [50, 39.3, 7.3],
    [30, 57.6, 7.3],
    [50, 57.6, 7.3],
    [30, 76, 7.3],
    [50, 76, 7.3],
  ],
  9: [
    [29.5, 30, 6.6],
    [42, 30, 6.6],
    [54.5, 30, 6.6],
    [29.5, 51, 6.6, true],
    [42, 51, 6.6, true],
    [54.5, 51, 6.6, true],
    [29.5, 72, 6.6],
    [42, 72, 6.6],
    [54.5, 72, 6.6],
  ],
};

function bigCoin(): string {
  return (
    `<circle cx="40" cy="52" r="21" fill="${DOT}"/>` +
    `<circle cx="40" cy="52" r="15.5" fill="#FFFFFF"/>` +
    `<circle cx="40" cy="52" r="12" fill="${DOT_LIGHT}"/>` +
    `<circle cx="40" cy="52" r="7" fill="${DOT}"/>` +
    `<circle cx="40" cy="52" r="3" fill="${GOLD}"/>`
  );
}

function suited(k: Kind): string {
  const s = suitOf(k);
  const n = numberOf(k);
  const color = SUIT_COLOR[s] as string;
  let art = '';
  if (s === 0) {
    art = n === 1 ? bird() : (BAM_LAYOUT[n] ?? []).map(([x, y, accent]) => stick(x, y, accent ? BAM_DARK : BAM)).join('');
  } else if (s === 1) {
    art =
      `<text x="40" y="40" text-anchor="middle" font-family="${HAN_FONT}" font-size="24" font-weight="600" fill="${INK}">${HAN_NUMERAL[n - 1]}</text>` +
      `<text x="38" y="77" text-anchor="middle" font-family="${HAN_FONT}" font-size="30" font-weight="600" fill="${CRAK}">萬</text>`;
  } else {
    art = n === 1 ? bigCoin() : (DOT_LAYOUT[n] ?? []).map(([x, y, r, accent]) => coin(x, y, r, accent)).join('');
  }
  return face() + art + index(String(n), SUIT_LETTER[s] as string, color);
}

const WIND_FACE: Record<string, [string, string]> = { N: ['北', 'N'], E: ['東', 'E'], W: ['西', 'W'], S: ['南', 'S'] };

function honor(code: string): string {
  const wind = WIND_FACE[code];
  if (wind) {
    return (
      face() +
      `<text x="40" y="66" text-anchor="middle" font-family="${HAN_FONT}" font-size="34" font-weight="600" fill="${INK}">${wind[0]}</text>` +
      index(wind[1], null, INK)
    );
  }
  if (code === 'RD')
    return face() + `<text x="40" y="68" text-anchor="middle" font-family="${HAN_FONT}" font-size="38" font-weight="600" fill="${CRAK}">中</text>` + index('R', null, CRAK);
  if (code === 'GD')
    return face() + `<text x="40" y="67" text-anchor="middle" font-family="${HAN_FONT}" font-size="34" font-weight="600" fill="${BAM}">發</text>` + index('G', null, BAM);
  if (code === 'WD')
    return (
      face() +
      `<rect x="24" y="28" width="32" height="50" rx="3" fill="none" stroke="${DOT}" stroke-width="3"/>` +
      `<rect x="29.5" y="33.5" width="21" height="39" rx="1.5" fill="none" stroke="${DOT}" stroke-width="1.3"/>` +
      index('0', null, DOT)
    );
  if (code === 'J')
    return (
      face('#3B3486', '#2A2468') +
      `<rect x="5" y="40" width="54" height="20" rx="4" fill="#FFFFFF" fill-opacity="0.12"/>` +
      `<text x="32" y="55" text-anchor="middle" font-family="${INDEX_FONT}" font-size="12.5" font-weight="700" letter-spacing="1.4" fill="#FFFFFF">JOKER</text>` +
      `<path d="M32 63 L34.3 68 L39.7 68.5 L35.6 72 L36.9 77.4 L32 74.6 L27.1 77.4 L28.4 72 L24.3 68.5 L29.7 68Z" fill="${GOLD}"/>` +
      index('J', null, '#FFFFFF')
    );
  return face();
}

/** Eight different flowers (all the same kind of tile, so all share the F index). */
function flower(variant: number): string {
  const c = 'translate(40 53)';
  const petals = (n: number, rx: number, ry: number, dist: number, fill: string) =>
    Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="${-dist}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${(360 / n) * i})"/>`).join('');
  const stem = `<path d="M40 62 Q38 72 40 82" stroke="${BAM}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M39.5 74 Q31 70 28 74 Q34 78 39.5 76Z" fill="${BAM}"/>`;
  let art = '';
  switch (variant % 8) {
    case 0: // plum blossom
      art = stem + `<g transform="${c}">${petals(5, 7, 7, 8, '#E77FA0')}<circle r="4.5" fill="${GOLD}"/></g>`;
      break;
    case 1: // orchid
      art = stem + `<g transform="${c}">${petals(3, 5, 12, 9, '#9B6BC9')}${petals(3, 3, 6, 5, '#D8C2F0')}<circle r="3" fill="${GOLD}"/></g>`;
      break;
    case 2: // chrysanthemum
      art = stem + `<g transform="${c}">${petals(14, 2.4, 9, 9, GOLD)}<circle r="5" fill="#C9781E"/></g>`;
      break;
    case 3: // lotus
      art =
        `<path d="M20 74 Q40 70 60 74" stroke="${DOT}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<g transform="translate(40 60)"><path d="M0 8 Q-6 -4 0 -18 Q6 -4 0 8Z" fill="#E46E87"/><path d="M-2 8 Q-16 0 -16 -10 Q-6 -6 -2 8Z" fill="#EE95A8"/><path d="M2 8 Q16 0 16 -10 Q6 -6 2 8Z" fill="#EE95A8"/></g>`;
      break;
    case 4: // tulip
      art = stem + `<g transform="${c}"><path d="M-10 -8 L-10 4 Q0 14 10 4 L10 -8 L5 -2 L0 -10 L-5 -2Z" fill="#E8684A"/></g>`;
      break;
    case 5: // daisy
      art =
        stem +
        `<g transform="${c}">${Array.from({ length: 10 }, (_, i) => `<ellipse cx="0" cy="-9" rx="3.2" ry="8" fill="#FFFFFF" stroke="#AEB6C1" stroke-width="0.9" transform="rotate(${36 * i})"/>`).join('')}<circle r="5" fill="${GOLD}"/></g>`;
      break;
    case 6: // bellflower
      art =
        `<path d="M40 30 Q48 34 50 44" stroke="${BAM}" stroke-width="2" fill="none"/>` +
        `<g transform="translate(36 50)"><path d="M-9 0 Q-9 -14 0 -14 Q9 -14 9 0 L12 6 L-12 6Z" fill="#6A73D9"/></g>` +
        `<g transform="translate(50 64)"><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 L9 5 L-9 5Z" fill="#8B92E6"/></g>` +
        `<path d="M40 30 Q30 36 36 36" stroke="${BAM}" stroke-width="2" fill="none"/>`;
      break;
    default: // sunflower
      art = stem + `<g transform="${c}">${petals(12, 3.6, 7.5, 10, '#F2C14E')}<circle r="7" fill="#7A4A1F"/></g>`;
  }
  return face() + art + index('F', null, PLUM);
}

function back(): string {
  return (
    `<rect x="1" y="4" width="62" height="83" rx="7" fill="#1D4A3F"/>` +
    `<rect x="1" y="1" width="62" height="83" rx="7" fill="#2F7564" stroke="#21564A" stroke-width="1.2"/>` +
    `<rect x="7" y="7" width="50" height="71" rx="4" fill="none" stroke="#7FB9A8" stroke-opacity="0.6" stroke-width="1.2"/>` +
    `<path d="M32 22 L46 42 L32 62 L18 42Z" fill="none" stroke="#9ACCBC" stroke-opacity="0.7" stroke-width="1.4"/>`
  );
}

/** The symbol id for a physical tile (flowers have eight faces). */
export function symbolId(tile: TileId): string {
  const k = kindOfTile(tile);
  if (k === FLOWER) return `t-F${(tile - 136) % 8}`;
  return `t-${kindCode(k)}`;
}

/** The symbol id for a kind of tile (flowers use the first face). */
export function kindSymbolId(k: Kind): string {
  return k === FLOWER ? 't-F0' : `t-${kindCode(k)}`;
}

export const BACK_ID = 't-back';

/** Every face as <symbol> markup, for one hidden sprite on the page. */
export function cleanSprite(): string {
  const parts: string[] = [];
  const sym = (id: string, body: string) => parts.push(`<symbol id="${id}" viewBox="0 0 ${TILE_W} ${TILE_H}">${body}</symbol>`);
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === FLOWER) continue;
    sym(`t-${kindCode(k)}`, isSuited(k) ? suited(k) : honor(kindCode(k)));
  }
  for (let v = 0; v < 8; v++) sym(`t-F${v}`, flower(v));
  sym(BACK_ID, back());
  return parts.join('');
}

/** Ids every sprite must define (used by the tests). */
export function allSymbolIds(): string[] {
  const ids: string[] = [];
  for (let k = 0; k < NUM_KINDS; k++) if (k !== FLOWER) ids.push(`t-${kindCode(k)}`);
  for (let v = 0; v < 8; v++) ids.push(`t-F${v}`);
  ids.push(BACK_ID);
  return ids;
}

