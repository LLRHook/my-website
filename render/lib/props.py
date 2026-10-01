"""Personal desk and shelf props."""

from collections.abc import Sequence
from math import atan, cos, pi, radians, sin
from pathlib import Path

import bpy

from lib import geometry as g
from lib import materials as m
from lib.assets import Assets, bounds, place
from lib.layout import LAYOUT as L


def floor_planter(assets: Assets) -> bpy.types.Object:
    """Retain imported foliage in a charcoal ceramic planter."""
    meshes = assets.load("floor_plant")
    plant = place(meshes, "plant_floor", L.floor_plant_location, height=L.floor_plant_height)
    old_pot = next(obj for obj in meshes if obj.name.startswith("potted_plant_01_pot"))
    pebbles = next(obj for obj in meshes if obj.name.startswith("potted_plant_01_pebbles"))
    offset = 0.321 - bounds([pebbles])[1].z
    retained = [obj for obj in meshes if obj != old_pot]
    bpy.data.objects.remove(old_pot, do_unlink=True)
    for obj in retained:
        obj.location.z += offset
    # Keep every pebble inside the opening and below its inner lip.
    center = (bounds([pebbles])[0] + bounds([pebbles])[1]) / 2
    center = pebbles.matrix_world.inverted() @ center
    radius = max((v.co.xy - center.xy).length for v in pebbles.data.vertices)
    for vertex in pebbles.data.vertices:
        vertex.co.x = (vertex.co.x - center.x) * 0.125 / radius
        vertex.co.y = (vertex.co.y - center.y) * 0.125 / radius
    pebbles.location.x = pebbles.location.y = 0
    ceramic = m.simple("Planter matte charcoal ceramic", "#303236", 0.86)
    nodes, links = ceramic.node_tree.nodes, ceramic.node_tree.links
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.10
    bump.inputs["Distance"].default_value = 0.00025
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], nodes.get("Principled BSDF").inputs["Normal"])
    radii = (0, 0.135, 0.137, 0.15, 0.15, 0.14, 0.138, 0.126, 0)
    heights = (0, 0, 0.004, 0.335, 0.34, 0.34, 0.331, 0.018, 0.018)
    pot = g.lathe("floor_planter", list(zip(radii, heights)), ceramic)
    pot.parent = plant
    return plant


def mug(location: Sequence[float]) -> bpy.types.Object:
    """Build a matte ceramic mug with a tubular handle."""
    root = g.group("coffee_mug")
    ceramic = m.simple("Mug matte white ceramic", "#f3f2ee", 0.72)
    radii = (0, 0.032, 0.035, 0.037, 0.037, 0.036, 0.034, 0.033, 0.031, 0)
    heights = (0, 0, 0.003, 0.074, 0.078, 0.08, 0.08, 0.078, 0.009, 0.009)
    body = g.lathe("mug_body", list(zip(radii, heights)), ceramic)
    body.parent = root
    vertices, faces = [], []
    for i in range(65):
        angle = radians(-110 + 220 * i / 64)
        for j in range(12):
            tube = 2 * pi * j / 12
            radius = 0.023 + 0.005 * cos(tube)
            vertices.append(
                (
                    0.043 + radius * cos(angle),
                    0.005 * sin(tube),
                    0.041 + radius * sin(angle),
                )
            )
    for i in range(64):
        for j in range(12):
            a, b = i * 12 + j, i * 12 + (j + 1) % 12
            faces.append((a, b, b + 12, a + 12))
    handle = g.mesh("mug_handle", vertices, faces, ceramic, True)
    handle.parent = root
    root.location = location
    return root


def pokeball(location: Sequence[float]) -> bpy.types.Object:
    """Build the shelf Poke Ball prop."""
    root = g.group("pokeball")
    red, white, black = (
        m.simple("Poke Ball red lacquer", "#c5232b", 0.18, coat=0.4),
        m.simple("Poke Ball white lacquer", "#f5f5f0", 0.2, coat=0.4),
        m.simple("Poke Ball black band", "#131517", 0.35),
    )
    shell = g.sphere("pokeball_shell", (0, 0, 0.035), 0.035, white)
    shell.data.materials.append(red)
    for polygon in shell.data.polygons:
        if polygon.center.z > 0.0005:
            polygon.material_index = 1
    shell.parent = root
    band = g.lathe(
        "pokeball_band", [(0.0352, 0.032), (0.0354, 0.034), (0.0354, 0.036), (0.0352, 0.038)], black
    )
    band.parent = root
    ring = g.cylinder("pokeball_button_ring", (0, 0.0338, 0.035), 0.009, 0.004, black, 64)
    ring.rotation_euler.x = pi / 2
    ring.parent = root
    button = g.cylinder("pokeball_white_button", (0, 0.036, 0.035), 0.0064, 0.002, white, 64)
    button.rotation_euler.x = pi / 2
    button.parent = root
    root.location = location
    return root


def carton(location: Sequence[float], generated: Path) -> bpy.types.Object:
    """Build a folded branded takeaway carton."""
    root = g.group("bww_carton")
    paper = m.simple("BWW carton yellow paperboard", "#ecb12b", 0.78)
    dark = m.simple("Fold shadows", "#ae802a", 0.9)
    vertices = [
        (x * w, y * d, z)
        for w, d, z in [(0.043, 0.034, 0), (0.05, 0.04, 0.064)]
        for x, y in [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    ]
    shell = g.mesh(
        "carton_folded_body",
        vertices,
        [(0, 1, 2, 3), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)],
        paper,
    )
    shell.parent = root
    for side in (-1, 1):
        flap = g.box(
            f"carton_lid_flap_{side}", (side * 0.024, 0, 0.066), (0.05, 0.08, 0.001), paper, 0.0003
        )
        flap.rotation_euler.y = side * 0.06
        flap.parent = root
    seam = g.box("carton_lid_fold", (0, 0, 0.067), (0.0008, 0.079, 0.001), dark, 0)
    seam.parent = root
    image = m.image_material("BWW printed logo", generated / "carton-front.png", 0.78)
    logo = g.panel("carton_logo_front", 0.089, 0.057, (0, 0.038, 0.033), image)
    logo.rotation_euler.x = -atan(0.006 / 0.064)
    logo.parent = root
    root.location = location
    return root
