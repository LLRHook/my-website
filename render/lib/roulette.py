"""European roulette wheel geometry and radial number atlas."""

import math
from collections.abc import Sequence
from pathlib import Path

import bpy

from lib import geometry as g
from lib import materials as m

EUROPEAN_ORDER = [
    int(n)
    for n in (
        "0 32 15 19 4 21 2 25 17 34 6 27 13 36 11 30 8 23 10 5 24 16 33 1 20 14 31 9 22 18 29 7 28 12 35 3 26"
    ).split()
]

REDS = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}


def roulette(location: Sequence[float], generated: Path) -> bpy.types.Object:
    """Build an independently rotatable European wheel with radial labels."""
    root = g.group("roulette")
    rotor = g.group("roulette_rotor")
    rotor.parent = root
    wood = m.wood("Roulette polished walnut")
    chrome = m.simple("Roulette polished chrome", "#c1c8cc", 0.16, 1)
    black = m.simple("Roulette black enamel", "#131516", 0.24)
    red = m.simple("Roulette red enamel", "#b82224", 0.24)
    green = m.simple("Roulette zero green", "#177342", 0.24)
    white = m.simple("Roulette white ball", "#ffffff", 0.25)
    number_material = m.image_material(
        "Roulette number atlas", generated / "roulette_numbers.png", 0.8
    )
    radii = (0, 0.114, 0.13, 0.139, 0.14, 0.135, 0.126, 0.122, 0.102, 0.077, 0)
    heights = (0, 0, 0.008, 0.023, 0.036, 0.044, 0.044, 0.033, 0.019, 0.013, 0.013)
    bowl = g.lathe("roulette_bowl", list(zip(radii, heights)), wood)
    bowl.parent = root
    rim = g.torus("roulette_chrome_rim", (0, 0, 0.041), 0.133, 0.0012, chrome)
    rim.parent = root
    plate = g.lathe(
        "roulette_rotor_cone", [(0, 0.05), (0.018, 0.05), (0.069, 0.023), (0.079, 0.019)], wood
    )
    plate.parent = rotor
    band = g.lathe(
        "roulette_print_band_support",
        [(0.098, 0.041), (0.124, 0.041), (0.124, 0.046), (0.098, 0.046)],
        wood,
    )
    band.parent = rotor
    for i, number in enumerate(EUROPEAN_ORDER):
        angle = math.pi / 2 + i * 2 * math.pi / 37
        delta = math.pi / 37 * 0.93
        verts = [
            (r * math.cos(a), r * math.sin(a), z)
            for r, z in [(0.078, 0.020), (0.099, 0.022)]
            for a in (angle - delta, angle + delta)
        ]
        pocket = g.mesh(
            f"roulette_pocket_{number:02d}",
            verts,
            [(0, 2, 3, 1)],
            green if number == 0 else red if number in REDS else black,
        )
        pocket.parent = rotor
        divider = g.rod(
            f"roulette_divider_{number:02d}",
            (0.078 * math.cos(angle - math.pi / 37), 0.078 * math.sin(angle - math.pi / 37), 0.021),
            (0.10 * math.cos(angle - math.pi / 37), 0.10 * math.sin(angle - math.pi / 37), 0.024),
            0.00045,
            chrome,
        )
        divider.parent = rotor
        label = g.mesh(
            f"roulette_number_{number:02d}",
            [(-0.008, -0.012, 0), (0.008, -0.012, 0), (0.008, 0.012, 0), (-0.008, 0.012, 0)],
            [(0, 1, 2, 3)],
            number_material,
        )
        label.location = (0.111 * math.cos(angle), 0.111 * math.sin(angle), 0.0462)
        label.rotation_euler.z = angle + math.pi / 2
        uv = label.data.uv_layers.new(name="UVMap")
        coords = [(1, 0), (0, 0), (0, 1), (1, 1)]
        for loop in label.data.loops:
            u, v = coords[loop.vertex_index]
            col, row = number % 8, number // 8
            uv.data[loop.index].uv = ((col + 0.01 + 0.98 * u) / 8, 1 - (row + 0.99 - 0.98 * v) / 8)
        label.parent = rotor
    outer = g.torus("roulette_number_ring", (0, 0, 0.023), 0.101, 0.0008, chrome)
    outer.parent = rotor
    radii = (0.012, 0.008, 0.009, 0.006, 0.005, 0)
    heights = (0.046, 0.064, 0.067, 0.072, 0.085, 0.087)
    turret = g.lathe("roulette_turret", list(zip(radii, heights)), chrome)
    turret.parent = rotor
    for i in range(4):
        angle = i * math.pi / 2
        spoke = g.rod(
            f"roulette_turret_spoke_{i}",
            (0, 0, 0.067),
            (0.04 * math.cos(angle), 0.04 * math.sin(angle), 0.067),
            0.0015,
            chrome,
        )
        spoke.parent = rotor
    ball = g.sphere("roulette_ball_pocket_0", (0, 0.083, 0.0245), 0.0035, white)
    ball.parent = rotor
    ball.hide_render = True
    root.location = location
    return root
