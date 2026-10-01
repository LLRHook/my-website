"""One daylight rig, one night rig, and independently switched task light."""

import math
from collections.abc import Sequence

import bpy
import numpy as np
from mathutils import Vector

from lib import geometry as g
from lib.assets import Assets

VARIANTS = ("day_lamp_on", "day_lamp_off", "night_lamp_on", "night_lamp_off")


def light(
    name: str,
    kind: str,
    location: Sequence[float],
    energy: float,
    color: str | Sequence[float],
    target: Sequence[float] | None = None,
    size: float = 1,
) -> bpy.types.Object:
    """Create and aim a named light source."""
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, color
    if kind == "AREA":
        data.shape, data.size = "DISK", size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    if target:
        g.look_at(obj, target)
    return obj


def brightest_direction(image: bpy.types.Image) -> tuple[float, float]:
    """Locate the brightest upper-hemisphere HDR texel."""
    pixels = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(pixels)
    width, height = image.size
    rgb = pixels.reshape(height, width, 4)[..., :3]
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    luminance[: height // 2] = 0
    row, col = np.unravel_index(luminance.argmax(), luminance.shape)
    phi = (float(col) + 0.5) / width * 2 * math.pi - math.pi
    elevation = ((float(row) + 0.5) / height - 0.5) * math.pi
    return phi, elevation


def soft_city_environment(source: bpy.types.Image) -> bpy.types.Image:
    """Blur only the visible exterior; retain the original HDR for illumination."""
    width, height = source.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    source.pixels.foreach_get(pixels)
    pixels = pixels.reshape(height, width, 4)
    luminance = pixels[..., :3] @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    pixels[..., :3] /= 1 + luminance[..., None]
    rgb = pixels[..., :3]
    neutral = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    magenta = (np.minimum(rgb[..., 0], rgb[..., 2]) > rgb[..., 1] * 1.1) & (
        rgb[..., 0] > rgb[..., 2] * 0.5
    )
    warm = np.array([1.10, 0.99, 0.82], dtype=np.float32)
    warm /= warm @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    rgb[magenta] = neutral[magenta, None] * warm
    neutral = pixels[..., :3] @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    pixels[..., :3] = neutral[..., None] + 0.60 * (pixels[..., :3] - neutral[..., None])
    for _ in range(2):
        pixels = sum(np.roll(pixels, i, axis=1) for i in range(-2, 3)) / 5
        padded = np.pad(pixels, ((2, 2), (0, 0), (0, 0)), mode="edge")
        pixels = sum(padded[2 + i : 2 + i + height] for i in range(-2, 3)) / 5
    pixels[..., 3] = 1
    image = bpy.data.images.new(
        "Shanghai Bund soft distant city", width=width, height=height, float_buffer=True
    )
    image.pixels.foreach_set(pixels.ravel())
    image.pack()
    image.use_fake_user = True
    return image


def setup(scene: bpy.types.Scene, assets: Assets) -> None:
    """Create independent day and night environment lighting."""
    world = bpy.data.worlds.new("Window environment")
    world.use_nodes = True
    scene.world = world
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputWorld")
    background = nodes.new("ShaderNodeBackground")
    background.name = "Environment strength"
    environment = nodes.new("ShaderNodeTexEnvironment")
    environment.name = "Room HDRI"
    day = bpy.data.images.load(str(assets.path("day")), check_existing=True)
    night = bpy.data.images.load(str(assets.path("night")), check_existing=True)
    day.use_fake_user = night.use_fake_user = True
    environment.image = day
    coords = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.name = "Environment rotation"
    phi, elevation = brightest_direction(day)
    azimuth = math.atan2(0.45, 1)
    mapping.inputs["Rotation"].default_value.z = phi - azimuth
    links.new(coords.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], environment.inputs["Vector"])
    links.new(environment.outputs["Color"], background.inputs["Color"])
    visible_environment = nodes.new("ShaderNodeTexEnvironment")
    visible_environment.name = "Visible exterior"
    visible_mapping = nodes.new("ShaderNodeMapping")
    visible_mapping.name = "Visible exterior rotation"
    links.new(coords.outputs["Generated"], visible_mapping.inputs["Vector"])
    links.new(visible_mapping.outputs["Vector"], visible_environment.inputs["Vector"])
    visible_background = nodes.new("ShaderNodeBackground")
    visible_background.name = "Visible exterior strength"
    links.new(visible_environment.outputs["Color"], visible_background.inputs["Color"])
    rays = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(rays.outputs["Is Camera Ray"], mix.inputs[0])
    links.new(background.outputs[0], mix.inputs[1])
    links.new(visible_background.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])
    soft_night = soft_city_environment(night)
    scene["night_visible_hdri"] = soft_night.name
    source = Vector(
        (
            math.cos(azimuth) * math.cos(elevation),
            math.sin(azimuth) * math.cos(elevation),
            math.sin(elevation),
        )
    )
    sun = light("day_sun", "SUN", source * 10, 1.2, (1, 0.95, 0.86))
    sun.rotation_euler = (-source).to_track_quat("-Z", "Y").to_euler()
    sun.data.angle = math.radians(3)
    scene["day_hdri_sampling_rotation_radians"] = phi - azimuth
    light("day_interior_fill", "AREA", (0, 2.8, 2.45), 100, (0.87, 0.92, 1), (0, 0.4, 0.7), 2.5)
    scene["day_hdri"] = day.name
    scene["night_hdri"] = night.name
    scene["night_hdri_sampling_rotation_radians"] = 1.2
    apply(scene, "day_lamp_on")


def apply(scene: bpy.types.Scene, variant: str) -> None:
    """Apply a named lighting variant without altering geometry."""
    if variant not in VARIANTS:
        raise ValueError(variant)
    night, lamp_on = variant.startswith("night"), variant.endswith("_on")
    nodes = scene.world.node_tree.nodes
    nodes["Room HDRI"].image = bpy.data.images[scene["night_hdri"] if night else scene["day_hdri"]]
    nodes["Environment strength"].inputs["Strength"].default_value = 0.03 if night else 0.65
    nodes["Environment rotation"].inputs["Rotation"].default_value.z = scene[
        "night_hdri_sampling_rotation_radians" if night else "day_hdri_sampling_rotation_radians"
    ]
    nodes["Visible exterior"].image = bpy.data.images[
        scene["night_visible_hdri"] if night else scene["day_hdri"]
    ]
    nodes["Visible exterior rotation"].inputs["Rotation"].default_value = (
        (0, 0, 0) if night else (0, 0, scene["day_hdri_sampling_rotation_radians"])
    )
    nodes["Visible exterior strength"].inputs["Strength"].default_value = 0.15 if night else 0.65
    bpy.data.objects["day_sun"].hide_render = night
    bpy.data.objects["day_interior_fill"].hide_render = night
    source = bpy.data.objects["lamp_light"]
    source.hide_render = not lamp_on
    source.data.type = "SPOT" if night and lamp_on else "AREA"
    source.data.energy = 110 if night else 18
    source.data.temperature = 3000 if night and lamp_on else 2700
    g.look_at(source, (0.07, 0.634, 0.776) if night and lamp_on else (0, 0.53, 0.75))
    if source.data.type == "SPOT":
        source.data.spot_size = math.radians(70)
        source.data.spot_blend = 0.65
        source.data.shadow_soft_size = 0.024
    else:
        source.data.shape, source.data.size = "DISK", 0.048
        source.data.spread = math.radians(110 if night else 180)
    diffuser = bpy.data.materials["Lamp bulb warm diffuser"].node_tree.nodes
    emission = diffuser.get("Principled BSDF")
    emission.inputs["Emission Strength"].default_value = (12 if night else 5) if lamp_on else 0
    scene.view_settings.exposure = 0.4 if night else -0.25
    diffuser.get("Blackbody").inputs[0].default_value = source.data.temperature
    bpy.context.view_layer.update()
