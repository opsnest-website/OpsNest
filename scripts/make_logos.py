"""
=========================================
OpsNest logo images
=========================================

  npm run logos          (or: python3 scripts/make_logos.py)

Needs Python 3 with Pillow:  pip install pillow

Reads brand/logo-master.png (transparent, drawn for a light background)
and writes every logo the site uses into assets/, plus a logo kit for use
outside the site into brand/. Run it again whenever the master artwork
changes, then commit the regenerated files.

Site images (assets/, published):

  logo-dark-bg.webp     hero in dark mode, 680px (340px on screen at 2x)
  logo-light-bg.webp    hero in light mode, original colours
  mark-dark-bg.png      header and footer in dark mode, symbol only
  mark-light-bg.png     header and footer in light mode, original colours
  favicon.png           browser tab, original colours on a white tile
  apple-touch-icon.png  iPhone home screen, original colours on white
  og-image.png          link previews (1200x630), original colours on white

Logo kit (brand/, not published; transparent PNGs for README, GitHub, slides):

  logo-light-bg.png     full logo for light backgrounds
  logo-dark-bg.png      full logo for dark backgrounds
  mark-light-bg.png     symbol only (512px square) for light backgrounds
  mark-dark-bg.png      symbol only (512px square) for dark backgrounds
"""

import colorsys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "brand" / "logo-master.png"
OUT = ROOT / "assets"
KIT = ROOT / "brand"

# Rows of the master that hold the symbol (cloud, infinity and nest), above the wordmark.
SYMBOL_ROWS = (186, 739)

# The navy parts (the nest, "Ops", the slogan) have brightness under ~0.35; the brand
# blues and greens sit above 0.7. Navy is swapped for the site's text colour on dark pages.
DARK_FROM, DARK_TO = 0.35, 0.50
LIGHT = (226, 232, 240)


def for_dark_background(image):
    pixels = []
    # get_flattened_data replaces getdata from Pillow 12 on.
    data = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    for r, g, b, a in data:
        value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[2]
        mix = min(1.0, max(0.0, (DARK_TO - value) / (DARK_TO - DARK_FROM)))
        pixels.append((
            round(r + (LIGHT[0] - r) * mix),
            round(g + (LIGHT[1] - g) * mix),
            round(b + (LIGHT[2] - b) * mix),
            a,
        ))
    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result


def trim_to_square(image, padding=0.04):
    image = image.crop(image.getchannel("A").getbbox())
    side = int(max(image.size) * (1 + 2 * padding))
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2), image)
    return canvas


def on_tile(image, size, radius=0):
    tile = Image.new("RGBA", (size, size))
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill="white")
    inner = image.resize((round(size * 0.86),) * 2, Image.LANCZOS)
    offset = (size - inner.width) // 2
    tile.paste(inner, (offset, offset), inner)
    return tile


def main():
    master = Image.open(MASTER).convert("RGBA")
    dark = for_dark_background(master)

    symbol = trim_to_square(master.crop((0, SYMBOL_ROWS[0], master.width, SYMBOL_ROWS[1])))
    dark_symbol = trim_to_square(dark.crop((0, SYMBOL_ROWS[0], dark.width, SYMBOL_ROWS[1])))

    # Hero keeps the full canvas so the logo sits where the layout expects it.
    for name, image, mark in (("light", master, symbol), ("dark", dark, dark_symbol)):
        image.resize((680, 680), Image.LANCZOS).save(OUT / f"logo-{name}-bg.webp", quality=88, method=6)
        mark.resize((128, 128), Image.LANCZOS).save(OUT / f"mark-{name}-bg.png", optimize=True)

    on_tile(symbol, 192, radius=40).resize((48, 48), Image.LANCZOS).save(OUT / "favicon.png", optimize=True)
    on_tile(symbol, 180).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)

    preview = Image.new("RGB", (1200, 630), "white")
    full = master.crop(master.getchannel("A").getbbox())
    full.thumbnail((1000, 520), Image.LANCZOS)
    preview.paste(full, ((1200 - full.width) // 2, (630 - full.height) // 2), full)
    preview.save(OUT / "og-image.png", optimize=True)

    for name, image in (("light", master), ("dark", dark)):
        image.crop(image.getchannel("A").getbbox()).save(KIT / f"logo-{name}-bg.png", optimize=True)
    symbol.resize((512, 512), Image.LANCZOS).save(KIT / "mark-light-bg.png", optimize=True)
    dark_symbol.resize((512, 512), Image.LANCZOS).save(KIT / "mark-dark-bg.png", optimize=True)

    for path in sorted(OUT.glob("*")) + sorted(KIT.glob("*-bg.png")):
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
