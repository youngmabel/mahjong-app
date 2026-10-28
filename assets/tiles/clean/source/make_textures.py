#!/usr/bin/env python3
"""Turn the face drawings from make_faces.py into Blender textures.

For each face it writes two 1024 x 1408 images into blender/textures/:
  <name>.png       the full-color face art (no tile outline)
  <name>_ink.png   a soft-edged grayscale mask of the printed markings,
                   which build_tiles.py uses for the slight carved look

Needs Python with Pillow and Playwright (Chromium). Usage:
  python3 make_faces.py work
  python3 make_textures.py work ../blender/textures
"""
import os
import sys
from io import BytesIO

from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

WIDTH, HEIGHT = 1024, 1408   # 16 pixels per unit of the 64 x 88 face
INK_SOFTEN = 2.6             # blur radius in pixels for the carved edge


def rasterize(page, svg_text):
    svg = svg_text.replace('width="64" height="88"',
                           f'width="{WIDTH}" height="{HEIGHT}" style="display:block"')
    page.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
    png = page.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": WIDTH, "height": HEIGHT})
    return Image.open(BytesIO(png)).convert("RGBA")


def main(work_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    names = sorted(f[:-4] for f in os.listdir(os.path.join(work_dir, "tex_svg")) if f.endswith(".svg"))
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1)
        for n in names:
            with open(os.path.join(work_dir, "tex_svg", n + ".svg")) as fh:
                color = rasterize(page, fh.read())
            with open(os.path.join(work_dir, "ink_svg", n + ".svg")) as fh:
                ink = rasterize(page, fh.read()).getchannel("A")
            color.convert("RGB").save(os.path.join(out_dir, n + ".png"), optimize=True)
            ink.filter(ImageFilter.GaussianBlur(radius=INK_SOFTEN)).save(
                os.path.join(out_dir, n + "_ink.png"), optimize=True)
        browser.close()
    print(f"{len(names)} faces -> {2 * len(names)} textures in {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
