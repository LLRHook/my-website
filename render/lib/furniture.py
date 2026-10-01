"""Metric furniture and surface materials."""

import math

import bpy

from lib import geometry as g
from lib import materials as m
from lib.assets import Assets
from lib.layout import LAYOUT as L


def task_chair() -> bpy.types.Object:
    """Five-star modern mesh chair, seat top 0.46m above the room floor."""
    root = g.group("office_chair")
    plastic = m.simple("Chair matte black polymer", "#17191b", 0.7)
    cloth = m.simple("Chair black woven seat", "#101214", 0.95)
    nodes, links = cloth.node_tree.nodes, cloth.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Specular IOR Level"].default_value = 0.15
    fibre = nodes.new("ShaderNodeTexNoise")
    fibre.inputs["Scale"].default_value = 240
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.35, 0.0005
    links.new(fibre.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    steel = m.simple("Chair satin black gas lift", "#202226", 0.38, 0.7)
    parts = [
        g.box("chair_seat", (0, 0, 0.429), (0.49, 0.46, 0.062), cloth, 0.025),
        g.cylinder("chair_gas_lift", (0, 0, 0.245), 0.026, 0.29, steel),
        g.box("chair_seat_mechanism", (0, 0.025, 0.383), (0.20, 0.22, 0.035), plastic, 0.012),
    ]
    for index in range(5):
        a = 2 * math.pi * index / 5
        x, y = 0.285 * math.cos(a), 0.285 * math.sin(a)
        parts.append(
            g.rod(f"chair_base_spoke_{index}", (0, 0, 0.12), (x, y, 0.082), 0.018, plastic)
        )
        parts.append(
            g.rod(f"chair_caster_stem_{index}", (x, y, 0.060), (x, y, 0.086), 0.012, steel)
        )
        for side in (-1, 1):
            caster = (x + side * 0.014, y, 0.032)
            wheel = g.cylinder(f"chair_caster_{index}_{side}", caster, 0.024, 0.013, plastic, 32)
            wheel.rotation_euler.y = math.pi / 2
            parts.append(wheel)
    parts.append(g.rod("chair_back_support", (0, 0.12, 0.38), (0, 0.245, 0.61), 0.020, plastic))

    def point(u: float, v: float) -> tuple[float, float, float]:
        return (u * (0.205 - 0.012 * v), 0.245 + 0.025 * v - 0.026 * (1 - u * u), 0.505 + 0.5 * v)

    corners = [point(-1, 0), point(1, 0), point(1, 1), point(-1, 1)]
    for index in range(4):
        a, b = corners[index], corners[(index + 1) % 4]
        parts.append(g.rod(f"chair_back_frame_{index}", a, b, 0.013, plastic))
    for axis, count in (("vertical", 49), ("horizontal", 61)):
        for index in range(count):
            value = -1 + 2 * index / 48 if axis == "vertical" else index / 60
            a, b = (
                (point(value, 0), point(value, 1))
                if axis == "vertical"
                else (point(-1, value), point(1, value))
            )
            parts.append(g.rod(f"chair_mesh_{axis}_{index}", a, b, 0.00085, cloth))
    for side in (-1, 1):
        x = side * 0.25
        start, end = (x, 0.045, 0.405), (x, 0.045, 0.665)
        parts.append(g.rod(f"chair_arm_support_{side}", start, end, 0.013, plastic))
        size = (0.058, 0.27, 0.025)
        parts.append(g.box(f"chair_arm_pad_{side}", (x, 0.025, 0.674), size, plastic, 0.012))
    for obj in parts:
        g.parent(obj, root)
    root.location = L.chair_location
    root.rotation_euler.z = math.radians(L.chair_yaw_degrees)
    return root


def rug(assets: Assets) -> bpy.types.Object:
    """Build a soft-edged fibre rug at its metric dimensions."""
    fabric = m.mapped("Warm grey wool rug", assets.files("rug_fabric"), "#6e6a66", 1 / 0.3, 0.65)
    nodes, links = fabric.node_tree.nodes, fabric.node_tree.links
    shader = fabric.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Sheen Weight"].default_value = 0.15
    shader.inputs["Sheen Roughness"].default_value = 0.8
    fibre = nodes.new("ShaderNodeTexNoise")
    fibre.name = "Metric wool pile"
    fibre.inputs["Scale"].default_value = 85
    fibre.inputs["Detail"].default_value = 3
    coords = nodes.new("ShaderNodeTexCoord")
    links.new(coords.outputs["Object"], fibre.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.name = "Visible wool pile bump"
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.85, 0.004
    links.new(shader.inputs["Normal"].links[0].from_socket, bump.inputs["Normal"])
    links.new(fibre.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    variation = nodes.new("ShaderNodeMapRange")
    for name, value in (("From Min", 0.35), ("From Max", 0.65), ("To Min", 0.65), ("To Max", 1.35)):
        variation.inputs[name].default_value = value
    links.new(fibre.outputs["Fac"], variation.inputs["Value"])
    pile_colour = nodes.new("ShaderNodeMixRGB")
    pile_colour.name = "Shadow-readable wool fibres"
    pile_colour.blend_type = "MULTIPLY"
    pile_colour.inputs[0].default_value = 0.35
    links.new(shader.inputs["Base Color"].links[0].from_socket, pile_colour.inputs[1])
    links.new(variation.outputs["Result"], pile_colour.inputs[2])
    links.new(pile_colour.outputs[0], shader.inputs["Base Color"])
    return g.box("office_rug", (0, 0.93, 0.004), (2.0, 1.4, 0.008), fabric, 0.003)


def desk(assets: Assets) -> bpy.types.Object:
    """Build the timber desk and four slim steel legs."""
    root = g.group("desk")
    oak = m.mapped(
        "Desk light oak natural grain", assets.files("desk_wood"), scale=1, normal_strength=0.12
    )
    steel = m.simple("Desk and lamp matte black steel", "#161819", 0.62, 0.85)
    g.parent(g.box("desk_top", (0, 0.375, 0.735), (1.50, 0.70, 0.030), oak, 0.003), root)
    for side, x in (("left", -0.695), ("right", 0.695)):
        for end, y in (("rear", 0.080), ("front", 0.670)):
            size = (0.030, 0.030, 0.720)
            leg = g.box(f"desk_leg_{side}_{end}", (x, y, 0.36), size, steel, 0.001)
            g.parent(leg, root)
    g.parent(
        g.box("desk_rear_crossbar", (0, 0.080, 0.64), (1.39, 0.020, 0.020), steel, 0.001), root
    )
    return root


def monitor() -> bpy.types.Object:
    """Build a monitor with a non-emissive screen."""
    root = g.group("monitor")
    aluminium = m.simple("Monitor anodised dark aluminium", "#34373b", 0.32, 0.8)
    black = m.simple("Black monitor bezel", "#101214", 0.4)
    glass = m.simple("Unlit black screen glass", "#080b0d", 0.16, 0.08, 0.16)
    glass.node_tree.nodes.get("Principled BSDF").inputs["Specular IOR Level"].default_value = 0.28
    parts = [
        g.box("monitor_back", (0, 0.35, 1.068), (0.621, 0.020, 0.360), aluminium, 0.006),
        g.box("monitor_bezel", (0, 0.363, 1.068), (0.613, 0.010, 0.352), black, 0.003),
        g.panel("monitor_screen", 0.597, 0.336, (0, 0.369, 1.068), glass),
        g.box("monitor_stand", (0, 0.346, 0.846), (0.025, 0.027, 0.18), aluminium, 0.004),
        g.box("monitor_foot", (0, 0.390, 0.757), (0.23, 0.16, 0.014), aluminium, 0.005),
    ]
    for obj in parts:
        g.parent(obj, root)
    return root


def keyboard_mouse() -> tuple[bpy.types.Object, bpy.types.Object]:
    """Build the six-row keyboard and separate mouse."""
    aluminium = m.simple("Keyboard brushed aluminium", "#888e92", 0.38, 0.75)
    keys = m.simple("Dark low profile keycaps", "#292d30", 0.62)
    printing = m.simple("Key legends", "#b7baba", 0.8)
    root = g.group("keyboard")
    g.parent(
        g.box("keyboard_frame", (-0.07, 0.634, 0.761), (0.36, 0.12, 0.022), aluminium, 0.004), root
    )
    rows = [
        "esc|F1|F2|F3|F4|F5|F6|F7|F8|F9|F10|F11|F12|del|",
        "`|1|2|3|4|5|6|7|8|9|0|-|=|back|",
        "tab|Q|W|E|R|T|Y|U|I|O|P|[|]|\\|",
        "caps|A|S|D|F|G|H|J|K|L|;|'|enter||",
        "shift|Z|X|C|V|B|N|M|,|.|/|shift||up|",
        "ctrl|win|alt|||||||alt|fn|ctrl|left|down|right",
    ]
    pitch, depth = 0.023, 0.0175
    for row, labels in enumerate(rows):
        for column, label in enumerate(labels.split("|")):
            if not label:
                continue
            x = -0.07 + (column - 7) * pitch
            y = 0.634 + (row - 2.5) * depth
            key = g.box(f"keycap_{row}_{column}", (x, y, 0.776), (0.020, 0.015, 0.008), keys, 0.002)
            g.parent(key, root)
            if len(label) == 1:
                name = f"legend_{row}_{column}"
                legend = g.text(name, label, (x, y, 0.7801), 0.0045, printing, (0, 0, math.pi))
                g.parent(legend, root)
    size = (0.135, 0.015, 0.008)
    space = g.box("keycap_space", (-0.07 - pitch, 0.678, 0.776), size, keys, 0.002)
    g.parent(space, root)
    mouse_mat = m.simple("Mouse matte graphite", "#41464a", 0.62)
    mouse = g.sphere("mouse", (0.228, 0.63, 0.768), 1, mouse_mat, (0.031, 0.054, 0.021))
    g.box("mouse_center_seam", (0.228, 0.608, 0.788), (0.001, 0.03, 0.001), keys, 0)
    wheel = g.cylinder("mouse_scroll_wheel", (0.228, 0.609, 0.789), 0.007, 0.008, keys, 32)
    wheel.rotation_euler.y = math.pi / 2
    return root, mouse
