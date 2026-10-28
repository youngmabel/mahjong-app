#!/usr/bin/env python3
"""Clean-style American mahjong tile faces (NMJL set, no blanks).

Draws the 43 different faces plus the tile back on a 64 x 88 unit canvas,
matching the Clean samples (big corner index, simple motif, teaching colors:
green = Bams and Green Dragon, red = Craks and Red Dragon, blue = Dots and Soap).
All lettering is converted to outlines, so the files look the same everywhere.

Writes into OUT_DIR:
  svg/<name>.svg       flat 2D tile: rounded tile outline plus the art
  tex_svg/<name>.svg   full-bleed art used as the 3D face texture (no outline)
  ink_svg/<name>.svg   the same art with no background (becomes the ink mask)
  tiles.json           list of faces with names, app codes and copies in the 152 set
"""
import json
import math
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTCollection, TTFont

OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "out"

LATIN = TTFont("/usr/share/fonts/opentype/inter/Inter-Medium.otf")
CJK = TTCollection("/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc").fonts[3]  # TC Medium

# Palette (from the Clean samples)
WHITE = "#FFFFFF"
OUTLINE = "#AEB4BE"
INK = "#222831"
GREEN = "#2F8F4E"
GREEN_LIGHT = "#8FD0A2"
BLUE = "#2B6CB0"
RED = "#C8372D"
RED_DOT = "#D9473B"
BEAK = "#E3A33A"
JOKER_BG = "#3C3489"
JOKER_EDGE = "#26215C"
JOKER_STAR = "#FAC775"
FLOWER_IDX = "#A23B72"
LEAF = "#5FA463"
LEAF_DARK = "#4A8A4F"
TEAL = "#19787D"
TEAL_EDGE = "#12595D"
TEAL_LIGHT = "#2B959A"


# ---------------------------------------------------------------- lettering
def text_path(font, text, size, x, y, anchor="start", spacing=0.0):
    """SVG path data for `text` with its baseline at y, like an SVG <text>."""
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    upem = font["head"].unitsPerEm
    s = size / upem
    names = [cmap[ord(ch)] for ch in text]
    advances = [font["hmtx"][n][0] * s for n in names]
    total = sum(advances) + spacing * (len(names) - 1)
    if anchor == "middle":
        x -= total / 2
    elif anchor == "end":
        x -= total
    parts = []
    pen_x = x
    for n, adv in zip(names, advances):
        pen = SVGPathPen(glyph_set)
        glyph_set[n].draw(TransformPen(pen, (s, 0, 0, -s, pen_x, y)))
        parts.append(pen.getCommands())
        pen_x += adv + spacing
    return " ".join(p for p in parts if p)


def latin(text, size, x, y, fill, anchor="start", spacing=0.0):
    return f'<path d="{text_path(LATIN, text, size, x, y, anchor, spacing)}" fill="{fill}"/>'


def cjk(text, size, x, y, fill):
    return f'<path d="{text_path(CJK, text, size, x, y, "middle")}" fill="{fill}"/>'


def index(main, fill, sub=None):
    """Corner index: big numeral or letter, optional small suit letter below."""
    out = latin(main, 19, 6, 23, fill)
    if sub:
        out += latin(sub, 11, 7, 36, fill)
    return out


# ---------------------------------------------------------------- motifs
def coin(cx, cy, r, center=WHITE):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{BLUE}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 0.4:.2f}" fill="{center}"/>')


def big_coin(cx, cy):
    return (f'<circle cx="{cx}" cy="{cy}" r="16.5" fill="{BLUE}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="12.6" fill="{WHITE}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="10" fill="{BLUE}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="5.2" fill="{RED_DOT}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="1.9" fill="{WHITE}"/>')


def stick(cx, cy, h, color=GREEN, angle=0.0, w=6.0):
    """One bamboo stick: a rounded bar with a white joint across the middle."""
    x, y = cx - w / 2, cy - h / 2
    rot = f' transform="rotate({angle} {cx} {cy})"' if angle else ""
    return (f'<g{rot}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2.2" fill="{color}"/>'
            f'<rect x="{x}" y="{cy - 0.65}" width="{w}" height="1.3" fill="{WHITE}"/></g>')


def bird():
    """The Clean sample bird for 1 Bam."""
    return (f'<path d="M27 65 L13 75 L30 72Z" fill="{GREEN}"/>'
            f'<circle cx="37" cy="61" r="12" fill="{GREEN}"/>'
            f'<path d="M30 60 Q38 52 46 61 Q38 66 30 60Z" fill="{GREEN_LIGHT}"/>'
            f'<circle cx="47" cy="46" r="7" fill="{GREEN}"/>'
            f'<path d="M53.5 45 L60 47.5 L53.5 50Z" fill="{BEAK}"/>'
            f'<circle cx="49.5" cy="44.5" r="1.6" fill="{WHITE}"/>'
            f'<path d="M34 73 L33 80 M40 73 L41 80" stroke="{GREEN}" stroke-width="2" '
            f'stroke-linecap="round" fill="none"/>')


BAM_LAYOUTS = {
    2: [(37, 47, 20), (37, 71, 20)],
    3: [(37, 47, 20), (29, 71, 20), (45, 71, 20)],
    4: [(29, 47, 20), (45, 47, 20), (29, 71, 20), (45, 71, 20)],
    5: [(26, 46, 19), (48, 46, 19), (37, 59, 19, RED), (26, 72, 19), (48, 72, 19)],
    6: [(25, 47, 20), (37, 47, 20), (49, 47, 20), (25, 71, 20), (37, 71, 20), (49, 71, 20)],
    7: [(37, 40, 14, RED), (25, 58, 14), (37, 58, 14), (49, 58, 14),
        (25, 75, 14), (37, 75, 14), (49, 75, 14)],
    8: [(21, 47, 20), (30.5, 47, 20, GREEN, 20), (43.5, 47, 20, GREEN, -20), (53, 47, 20),
        (21, 71, 20), (30.5, 71, 20, GREEN, -20), (43.5, 71, 20, GREEN, 20), (53, 71, 20)],
    9: [(25, 40, 14), (37, 40, 14, RED), (49, 40, 14),
        (25, 58, 14), (37, 58, 14, RED), (49, 58, 14),
        (25, 75, 14), (37, 75, 14, RED), (49, 75, 14)],
}


def bams(n):
    if n == 1:
        return bird()
    out = ""
    for spec in BAM_LAYOUTS[n]:
        cx, cy, h = spec[:3]
        color = spec[3] if len(spec) > 3 else GREEN
        angle = spec[4] if len(spec) > 4 else 0
        out += stick(cx, cy, h, color, angle)
    return out


DOT_LAYOUTS = {
    2: (9.5, [(37, 47), (37, 72)]),
    3: (8.0, [(27, 44), (38.5, 59.5), (50, 75)]),
    4: (8.5, [(27, 47), (47, 47), (27, 71), (47, 71)]),
    5: (7.5, [(26, 44), (48, 44), (37, 59), (26, 74), (48, 74)]),
    6: (7.0, [(28, 40), (46, 40), (28, 59), (46, 59), (28, 75), (46, 75)]),
    7: (6.3, [(28.5, 37), (39, 43.5), (49.5, 50), (30, 62.5), (47, 62.5), (30, 77), (47, 77)]),
    8: (6.0, [(29, 37), (45, 37), (29, 51), (45, 51), (29, 65), (45, 65), (29, 79), (45, 79)]),
    9: (6.0, [(24, 42), (38, 42), (52, 42), (24, 59), (38, 59), (52, 59),
              (24, 76), (38, 76), (52, 76)]),
}


def dots(n):
    if n == 1:
        return big_coin(37, 59)
    r, pts = DOT_LAYOUTS[n]
    out = ""
    for i, (x, y) in enumerate(pts):
        center = RED_DOT if (n == 5 and i == 2) else WHITE
        out += coin(x, y, r, center)
    return out


NUMERALS = "一二三四五六七八九"


def craks(n):
    return cjk(NUMERALS[n - 1], 20, 39, 39, INK) + cjk("萬", 27, 35, 76, RED)


def soap_frame():
    return (f'<rect x="22" y="30" width="34" height="48" rx="3" fill="none" stroke="{BLUE}" stroke-width="3"/>'
            f'<rect x="28" y="36" width="22" height="36" rx="1.5" fill="none" stroke="{BLUE}" stroke-width="1.2"/>')


def star(cx, cy, r_out, r_in, fill, points=5):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(-90 + i * 180 / points)
        pts.append(f"{cx + r * math.cos(a):.2f} {cy + r * math.sin(a):.2f}")
    return f'<path d="M{" L".join(pts)}Z" fill="{fill}"/>'


def joker_art():
    return (latin("JOKER", 12, 32, 52, WHITE, "middle", 1.5)
            + f'<path d="M32 61 L34.1 65.8 L39.2 66.2 L35.3 69.5 L36.5 74.5 L32 71.8 L27.5 74.5 '
              f'L28.7 69.5 L24.8 66.2 L29.9 65.8Z" fill="{JOKER_STAR}"/>')


# ---------------------------------------------------------------- flowers
def petals(cx, cy, count, dist, rx, ry, fill, start=-90.0):
    out = ""
    for i in range(count):
        a = start + i * 360 / count
        px = cx + dist * math.cos(math.radians(a))
        py = cy + dist * math.sin(math.radians(a))
        out += (f'<ellipse cx="{px:.2f}" cy="{py:.2f}" rx="{rx}" ry="{ry}" fill="{fill}" '
                f'transform="rotate({a + 90:.1f} {px:.2f} {py:.2f})"/>')
    return out


def stem(x1=37, y1=60, x2=37, y2=82, leaf_side=-1, leaf_y=73):
    lx = x1 + leaf_side * 6
    return (f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{LEAF}" stroke-width="2.4" stroke-linecap="round"/>'
            f'<ellipse cx="{lx}" cy="{leaf_y}" rx="6.5" ry="2.8" fill="{LEAF}" '
            f'transform="rotate({-35 * leaf_side} {lx} {leaf_y})"/>')


def flower(n):
    c = (37, 50)
    if n == 1:  # plum blossom on a branch
        return ('<path d="M22 82 Q28 70 37 58" stroke="#8A5A3C" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
                '<path d="M27 71 Q22 66 21 60" stroke="#8A5A3C" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
                '<circle cx="21" cy="58.5" r="3.2" fill="#F39AC0"/>'
                + petals(37, 50, 5, 7.4, 6.2, 6.2, "#F39AC0")
                + '<circle cx="37" cy="50" r="3.8" fill="#F2C94C"/>')
    if n == 2:  # tulip
        return (stem(leaf_side=-1)
                + '<path d="M27 40 Q26 58 37 60 Q48 58 47 40 L42 46 L37 38 L32 46Z" fill="#F2784B"/>'
                + '<path d="M37 38 L41.5 46 Q41 56 37 60 Q33 56 32.5 46Z" fill="#D9583A"/>')
    if n == 3:  # daisy
        return (stem(y1=62, leaf_side=1)
                + petals(c[0], c[1], 12, 8.0, 2.7, 6.2, "#B79CEB")
                + f'<circle cx="{c[0]}" cy="{c[1]}" r="4.6" fill="#F2B632"/>')
    if n == 4:  # sunflower
        pts = []
        for i in range(32):
            r = 16 if i % 2 == 0 else 9.5
            a = math.radians(-90 + i * 360 / 32)
            pts.append(f"{c[0] + r * math.cos(a):.2f} {c[1] + r * math.sin(a):.2f}")
        return (stem(y1=64, leaf_side=-1, leaf_y=75)
                + f'<path d="M{" L".join(pts)}Z" fill="#F2B632"/>'
                + f'<circle cx="{c[0]}" cy="{c[1]}" r="8.2" fill="#8A5A2B"/>'
                + f'<circle cx="{c[0]}" cy="{c[1]}" r="4" fill="#6E4520"/>')
    if n == 5:  # lotus on a pad
        out = f'<ellipse cx="37" cy="74" rx="16" ry="4.5" fill="{LEAF}"/>'
        for a, length, w, fill in ((-52, 22, 7, "#F7B5CD"), (52, 22, 7, "#F7B5CD"),
                                   (-26, 27, 7.5, "#EE7FA8"), (26, 27, 7.5, "#EE7FA8"),
                                   (0, 31, 8, "#E2608F")):
            out += (f'<path d="M37 70 Q{37 - w} {70 - length / 2} 37 {70 - length} '
                    f'Q{37 + w} {70 - length / 2} 37 70Z" fill="{fill}" transform="rotate({a} 37 70)"/>')
        return out
    if n == 6:  # chrysanthemum
        return (stem(y1=64, leaf_side=1, leaf_y=75)
                + petals(c[0], c[1], 20, 9.0, 1.9, 6.2, "#F2994A")
                + petals(c[0], c[1], 14, 5.0, 1.8, 4.2, "#F6B26B", start=-77)
                + f'<circle cx="{c[0]}" cy="{c[1]}" r="2.6" fill="#D9822B"/>')
    if n == 7:  # orchid
        out = ('<path d="M37 62 Q33 72 40 82" stroke="#5FA463" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
               '<ellipse cx="44" cy="76" rx="6.5" ry="2.6" fill="#5FA463" transform="rotate(-30 44 76)"/>')
        for a in (-90, 30, 150):  # three sepals
            out += petals(37, 50, 1, 9.0, 3.3, 8.0, "#C99BEA", start=a)
        for a in (-30, -150):  # two petals
            out += petals(37, 50, 1, 7.6, 4.6, 6.6, "#B07CD8", start=a)
        return (out + '<path d="M31.5 52 Q37 66 42.5 52 Q37 56 31.5 52Z" fill="#8E4EC6"/>'
                + '<circle cx="37" cy="50" r="2.4" fill="#F2C94C"/>')
    if n == 8:  # peony
        out = (f'<ellipse cx="27" cy="71" rx="8" ry="3.4" fill="{LEAF}" transform="rotate(-30 27 71)"/>'
               f'<ellipse cx="47" cy="71" rx="8" ry="3.4" fill="{LEAF_DARK}" transform="rotate(30 47 71)"/>')
        out += petals(37, 53, 9, 9.5, 6.0, 6.0, "#E86FA0")
        out += '<circle cx="37" cy="53" r="10" fill="#E86FA0"/>'
        out += petals(37, 53, 6, 5.0, 4.4, 4.4, "#F39AC0", start=-60)
        out += '<circle cx="37" cy="53" r="3.6" fill="#F7C6DA"/>'
        return out
    raise ValueError(n)


def back_art():
    """Tile back: plain teal, a thin inset line and a small original knot."""
    knot = ""
    for a in (0, 90, 180, 270):
        x = 32 + 5.2 * math.cos(math.radians(a))
        y = 44 + 5.2 * math.sin(math.radians(a))
        knot += f'<circle cx="{x:.2f}" cy="{y:.2f}" r="4.4" fill="none" stroke="{TEAL_LIGHT}" stroke-width="1.6"/>'
    return (f'<rect x="7" y="7" width="50" height="74" rx="3.5" fill="none" stroke="{TEAL_LIGHT}" stroke-width="1.6"/>'
            + knot + f'<circle cx="32" cy="44" r="1.8" fill="{TEAL_LIGHT}"/>')


# ---------------------------------------------------------------- catalogue
SUITS = [("bam", "Bam", "B", GREEN, bams, 0),
         ("crak", "Crak", "C", RED, craks, 1),
         ("dot", "Dot", "D", BLUE, dots, 2)]
WINDS = [("north", "North", "N", "北", 27), ("east", "East", "E", "東", 28),
         ("west", "West", "W", "西", 29), ("south", "South", "S", "南", 30)]


def catalogue():
    faces = []
    for key, name, letter, color, motif, s in SUITS:
        for n in range(1, 10):
            faces.append(dict(file=f"{key}-{n}", name=f"{n} {name}", code=f"{n}{letter}",
                              kind=s * 9 + n - 1, copies=4, bg=WHITE,
                              art=index(str(n), color, letter) + motif(n)))
    for key, name, letter, char, kind in WINDS:
        faces.append(dict(file=f"wind-{key}", name=name, code=letter, kind=kind, copies=4, bg=WHITE,
                          art=index(letter, INK) + cjk(char, 36, 36, 68, INK)))
    faces.append(dict(file="dragon-red", name="Red Dragon", code="RD", kind=31, copies=4, bg=WHITE,
                      art=index("R", RED) + cjk("中", 36, 36, 68, RED)))
    faces.append(dict(file="dragon-green", name="Green Dragon", code="GD", kind=32, copies=4, bg=WHITE,
                      art=index("G", GREEN) + cjk("發", 36, 36, 68, GREEN)))
    faces.append(dict(file="dragon-soap", name="Soap (White Dragon)", code="WD", kind=33, copies=4, bg=WHITE,
                      art=index("0", BLUE) + soap_frame()))
    for n in range(1, 9):
        faces.append(dict(file=f"flower-{n}", name=f"Flower ({n} of 8)", code="F", kind=34, copies=1,
                          tile_id=135 + n, bg=WHITE, art=index("F", FLOWER_IDX) + flower(n)))
    faces.append(dict(file="joker", name="Joker", code="J", kind=35, copies=8, bg=JOKER_BG,
                      edge=JOKER_EDGE, art=index("J", WHITE) + joker_art()))
    faces.append(dict(file="back", name="Tile back", code=None, kind=None, copies=0, bg=TEAL,
                      edge=TEAL_EDGE, art=back_art()))
    return faces


def svg_doc(body, w=64, h=88):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'{body}</svg>\n')


def main():
    for sub in ("svg", "tex_svg", "ink_svg"):
        os.makedirs(os.path.join(OUT_DIR, sub), exist_ok=True)
    faces = catalogue()
    for f in faces:
        edge = f.get("edge", OUTLINE)
        tile = f'<rect x="0.5" y="0.5" width="63" height="87" rx="5" fill="{f["bg"]}" stroke="{edge}"/>'
        with open(os.path.join(OUT_DIR, "svg", f["file"] + ".svg"), "w") as fh:
            fh.write(svg_doc(tile + f["art"]))
        with open(os.path.join(OUT_DIR, "tex_svg", f["file"] + ".svg"), "w") as fh:
            fh.write(svg_doc(f'<rect width="64" height="88" fill="{f["bg"]}"/>' + f["art"]))
        with open(os.path.join(OUT_DIR, "ink_svg", f["file"] + ".svg"), "w") as fh:
            fh.write(svg_doc(f["art"]))
    meta = [{k: v for k, v in f.items() if k not in ("art", "edge")} for f in faces]
    with open(os.path.join(OUT_DIR, "faces.json"), "w") as fh:
        json.dump(meta, fh, indent=1, ensure_ascii=False)
    total = sum(f["copies"] for f in faces)
    print(f"{len(faces)} images ({len(faces) - 1} faces + back); copies in set: {total}")


if __name__ == "__main__":
    main()
