# Room render pipeline

Build the metric Blender room and export four lighting states, roulette sprites
and close-ups for the website. Integration positions use a top-left origin and
normalised coordinates. The website draws the roulette ball.

## Requirements

Blender 5.2.2, Python 3, Node.js and the repo's existing `sharp` package.
The build regenerates print textures and the number atlas in `render/assets/generated/`
using `lib/images.mjs`; source photos and the logo come from `public/`.
Source photographs and the BWW logo are read-only. Cycles `auto` probes OptiX
in a separate process, then falls back to CUDA and CPU. All backends use OIDN.
`--device cuda` skips the OptiX probe.

## Commands

Run from the repository root in PowerShell with short script paths.

```powershell
$blender = 'C:/Users/Victor/Tools/blender-5.2.2/blender.exe'
python render/fetch_assets.py
& $blender -b --factory-startup --python-exit-code 1 --python render/build_scene.py
& $blender -b render/room.blend --python-exit-code 1 --python render/render.py -- --preview --device cuda
& $blender -b render/room.blend --python-exit-code 1 --python render/render.py -- --final --device cuda
node render/export.mjs
```

Preview uses 1600x900, 256 samples and 8-bit PNGs. Final uses 2560x1440,
1024 samples and 16-bit PNGs. Both render `day_lamp_on`, `day_lamp_off`,
`night_lamp_on` and `night_lamp_off`. Repeat `--only VARIANT` to select a subset.
Framing failures abort before rendering.

## Outputs

- `render/room.blend`: packed room with the approved landscape camera.
- `render/out/preview/`: four stills and a labelled 2x2 `contact.png`.
- `render/out/final/`: four stills; `roulette/{variant}/000.png` through
  `073.png`; `detail/{diploma,books,pokeball,bww,plants}.png`.
- Roulette crops use 12-pixel padding at native 2560 scale. Rotor angles advance
  by 2pi/74 in the same direction as increasing pocket index.
- Detail crops use 25% padding per side, clamped to the camera frame, and a
  roughly 1600-pixel longest side.
- `render/out/scene.json`: fourteen clipped hotspots, screen quad and roulette
  geometry. `render/out/timings.json`: timings and the selected device.
- `public/room/`: AVIF/WebP stills at widths 1280, 1920 and 2560; roulette sprites
  in ten columns; details with a 1200-pixel longest side.
- `app/lib/room-scene.json`: geometry, image widths, variants and detail sizes.

Run `python -m ruff check render` and `python -m ruff format --check render`.
The manifest pins download URLs and checksums; fetch reuses verified cache files.

## CC0 credits

[Poly Haven CC0 assets](https://polyhaven.com/license), pinned at 2K:
`oak_veneer_02`, `desk_lamp_arm_01`, `book_encyclopedia_set_01`,
`decorative_book_set_01`, `potted_plant_01`, `potted_plant_04`,
`wooden_bookshelf_worn`, `hanging_picture_frame_01`, `wood_floor`,
`painted_plaster_wall`, `jogging_melange`, `greenwich_park_02`, `shanghai_bund`.
Authors and source links remain in `asset_manifest.json`. The chair, charcoal
planter and personal props are procedural; prints regenerate from the source
photographs and logo.
