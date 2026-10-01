"""Build and pack the deterministic metric room from its source layout."""

import math
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from lib import lighting, room
from lib.assets import Assets
from lib.layout import LAYOUT as L


def create_camera(scene: bpy.types.Scene) -> None:
    """Create the level 32 mm landscape camera used on desktop and mobile."""
    data = bpy.data.cameras.new("cam_landscape")
    data.lens = L.camera_lens_mm
    data.sensor_width = L.camera_sensor_mm
    data.sensor_fit = "HORIZONTAL"
    data.shift_y = L.camera_shift_y
    camera = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = L.camera_location
    camera.rotation_euler = (math.pi / 2, 0, math.pi)
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 2560, 1440
    scene.render.resolution_percentage = 100


def main() -> None:
    """Assemble and save the packed room scene."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.data.orphans_purge(do_recursive=True)
    scene = bpy.context.scene
    scene.unit_settings.system, scene.unit_settings.scale_length = "METRIC", 1
    subprocess.run(["node", str(ROOT / "lib/images.mjs")], check=True)
    assets = Assets()
    room.architecture(assets)
    room.furniture(assets)
    room.wall_art(assets)
    bpy.context.view_layer.update()
    mirror = Matrix.Diagonal((-1, 1, 1, 1))
    for obj in list(scene.objects):
        if obj.parent is None:
            obj.matrix_world = mirror @ obj.matrix_world
    create_camera(scene)
    lighting.setup(scene, assets)
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    scene.render.use_persistent_data = True
    bpy.data.orphans_purge(do_recursive=True)
    bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "room.blend"))
    print(f"BUILD COMPLETE: {ROOT / 'room.blend'}", flush=True)


if __name__ == "__main__":
    main()
