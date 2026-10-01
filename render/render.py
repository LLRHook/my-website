"""Render room stills, roulette sprites and object details."""

import argparse
import json
import math
import subprocess
import sys
import time
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import checks, device, lighting, projection

MODES = {"preview": (1600, 900, 256, "8"), "final": (2560, 1440, 1024, "16")}
DETAILS = {
    "diploma": "diploma",
    "books": "books_shelf",
    "pokeball": "pokeball",
    "bww": "bww_carton",
    "plants": "plant_floor",
}
ROULETTE_FRAMES = 74


def parse_args() -> argparse.Namespace:
    """Parse the required render mode, optional variants and device override."""
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--preview", action="store_true")
    mode.add_argument("--final", action="store_true")
    parser.add_argument("--only", choices=lighting.VARIANTS, action="append")
    parser.add_argument("--device", choices=("auto", "optix", "cuda", "cpu"), default="auto")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])


def render_to(scene, path: Path) -> float:
    """Render one still and return its elapsed seconds."""
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    start = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    seconds = time.perf_counter() - start
    print(f"RENDER {path}: {seconds:.3f}s", flush=True)
    return seconds


def render_stills(scene, mode: str, variants: list[str], out: Path) -> dict[str, float]:
    """Render each requested full-frame lighting variant."""
    width, height, samples, depth = MODES[mode]
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.image_settings.color_depth = depth
    scene.cycles.samples = samples
    scene.render.use_border = scene.render.use_crop_to_border = False
    timings = {}
    for variant in variants:
        lighting.apply(scene, variant)
        timings[variant] = render_to(scene, out / f"{variant}.png")
    return timings


def render_roulette_frames(scene, variants: list[str], out: Path) -> dict[str, int]:
    """Render 74 rotor angles per variant at the padded native wheel crop."""
    render = scene.render
    render.resolution_x, render.resolution_y = 2560, 1440
    box, _ = projection.project_box(scene, bpy.data.objects["roulette"])
    x, y = max(0, math.floor(box["x"] * 2560) - 12), max(0, math.floor(box["y"] * 1440) - 12)
    right = min(2560, math.ceil((box["x"] + box["w"]) * 2560) + 12)
    bottom = min(1440, math.ceil((box["y"] + box["h"]) * 1440) + 12)
    render.border_min_x, render.border_max_x = x / 2560, right / 2560
    render.border_min_y, render.border_max_y = 1 - bottom / 1440, 1 - y / 1440
    render.use_border = render.use_crop_to_border = True
    rotor = bpy.data.objects["roulette_rotor"]
    for variant in variants:
        lighting.apply(scene, variant)
        for frame in range(ROULETTE_FRAMES):
            rotor.rotation_euler.z = frame * (2 * math.pi / ROULETTE_FRAMES)
            bpy.context.view_layer.update()
            render_to(scene, out / "roulette" / variant / f"{frame:03d}.png")
    rotor.rotation_euler.z = 0
    bpy.context.view_layer.update()
    render.use_border = render.use_crop_to_border = False
    return {"x": x, "y": y, "w": right - x, "h": bottom - y}


def render_details(scene, out: Path) -> None:
    """Render padded day-lamp-on detail crops with a 1600-pixel longest side."""
    render = scene.render
    lighting.apply(scene, "day_lamp_on")
    for name, object_name in DETAILS.items():
        render.resolution_x, render.resolution_y = 2560, 1440
        box, _ = projection.project_box(scene, bpy.data.objects[object_name])
        x, y = max(0, box["x"] - box["w"] / 4), max(0, box["y"] - box["h"] / 4)
        right, bottom = min(1, box["x"] + box["w"] * 1.25), min(1, box["y"] + box["h"] * 1.25)
        scale = 1600 / max((right - x) * 2560, (bottom - y) * 1440)
        render.resolution_x, render.resolution_y = (
            round(2560 * scale),
            round(1440 * scale),
        )
        render.border_min_x, render.border_max_x = x, right
        render.border_min_y, render.border_max_y = 1 - bottom, 1 - y
        render.use_border = render.use_crop_to_border = True
        render_to(scene, out / "detail" / f"{name}.png")
    render.use_border = render.use_crop_to_border = False
    render.resolution_x, render.resolution_y = 2560, 1440


def main() -> None:
    """Select the device, check framing, render and write integration metadata."""
    args = parse_args()
    root = Path(__file__).resolve().parent
    if Path(bpy.data.filepath).resolve() != root / "room.blend":
        bpy.ops.wm.open_mainfile(filepath=str(root / "room.blend"))
    scene = bpy.context.scene
    selected = device.select_device(scene, args.device)
    bpy.data.objects["roulette_ball_pocket_0"].hide_render = True
    scene.camera = bpy.data.objects["cam_landscape"]
    scene.render.resolution_x, scene.render.resolution_y = 2560, 1440
    scene.render.resolution_percentage = 100
    failures = checks.check_hotspots(scene)
    if failures:
        raise RuntimeError("; ".join(failures))
    mode = "preview" if args.preview else "final"
    variants = list(dict.fromkeys(args.only or lighting.VARIANTS))
    out = root / "out" / mode
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    start = time.perf_counter()
    timings = {"mode": mode, "device": selected}
    timings["stills"] = render_stills(scene, mode, variants, out)
    crop = {"x": 0, "y": 0, "w": 0, "h": 0}
    if mode == "final":
        stage = time.perf_counter()
        crop = render_roulette_frames(scene, variants, out)
        timings["frames"] = time.perf_counter() - stage
        stage = time.perf_counter()
        render_details(scene, out)
        timings["details"] = time.perf_counter() - stage
    else:
        subprocess.run(["node", str(root / "lib/images.mjs"), "contact", str(out)], check=True)
    scene.render.resolution_x, scene.render.resolution_y = 2560, 1440
    data = projection.scene_data(scene, crop)
    (root / "out/scene.json").write_text(json.dumps(data, indent=2) + "\n")
    timings["total"] = time.perf_counter() - start
    (root / "out/timings.json").write_text(json.dumps(timings, indent=2) + "\n")


if __name__ == "__main__":
    main()
