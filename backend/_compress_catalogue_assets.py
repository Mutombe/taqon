"""One-shot: shrink catalogue JPEGs so the rendered HTML fits in Render's
worker memory budget. JPEGs are re-encoded at q=82 progressive (visually
lossless for print) and capped at the resolution they actually render at
in the A4 layout."""
import os
from PIL import Image

D = 'apps/documents/static/catalogue_assets'

# (filename, max_dimension, quality)
TARGETS = [
    ('cover_hero_house.jpg',              1800, 82),
    ('closing_sunsynk_techs.jpg',         1600, 82),
    ('bg_white_blocks.jpg',               1600, 78),
    ('closing_collage_battery_install.jpg', 900, 82),
    ('cover_collage_aircon.jpg',           700, 82),
    ('cover_collage_battery_techs.jpg',    700, 82),
    ('cover_collage_solar_pole.jpg',       700, 82),
]

for name, max_dim, q in TARGETS:
    path = os.path.join(D, name)
    before = os.path.getsize(path) // 1024
    img = Image.open(path).convert('RGB')
    w, h = img.size
    scale = min(max_dim / max(w, h), 1.0)
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    img.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
    after = os.path.getsize(path) // 1024
    print(f'{name}: {before}KB -> {after}KB  ({img.size[0]}x{img.size[1]})')

total = sum(os.path.getsize(os.path.join(D, f)) for f in os.listdir(D)
            if os.path.isfile(os.path.join(D, f)))
print(f'\nTotal catalogue_assets: {total // 1024} KB')
