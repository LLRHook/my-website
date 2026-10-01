"""Project room integration geometry into top-left normalised coordinates."""

import math

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

HOTSPOTS = (
    "monitor_screen roulette diploma photo_profile photo_conference photo_peru "
    "sticky_note books_shelf pokeball bww_carton plant_shelf plant_floor window desk_lamp"
).split()


def project_point(scene, world) -> tuple[float, float]:
    """Project a world point with a top-left image origin."""
    point = world_to_camera_view(scene, scene.camera, Vector(world))
    return point.x, 1 - point.y


def project_box(scene, obj) -> tuple[dict, float]:
    """Return clipped evaluated hierarchy bounds and their visible area fraction."""
    points = []
    graph = bpy.context.evaluated_depsgraph_get()
    inverse = scene.camera.matrix_world.inverted()
    near = scene.camera.data.clip_start + 0.00001
    edges = [(i, i // 4 * 4 + (i + 1) % 4) for i in range(8)] + [(i, i + 4) for i in range(4)]
    for child in [obj, *obj.children_recursive]:
        if child.type not in {"MESH", "FONT", "CURVE"} or child.hide_render:
            continue
        evaluated = child.evaluated_get(graph)
        corners = [evaluated.matrix_world @ Vector(c) for c in evaluated.bound_box]
        depths = [-(inverse @ c).z for c in corners]
        visible = [c for c, d in zip(corners, depths) if d >= near]
        for a, b in edges:
            if (depths[a] >= near) != (depths[b] >= near):
                visible.append(
                    corners[a].lerp(corners[b], (near - depths[a]) / (depths[b] - depths[a]))
                )
        points.extend(project_point(scene, c) for c in visible)
    if not points:
        return {"x": 0, "y": 0, "w": 0, "h": 0}, 0
    left, right = min(p[0] for p in points), max(p[0] for p in points)
    top, bottom = min(p[1] for p in points), max(p[1] for p in points)
    area = (right - left) * (bottom - top)
    x0, x1, y0, y1 = (max(0, min(1, v)) for v in (left, right, top, bottom))
    fraction = (x1 - x0) * (y1 - y0) / area if area else 0
    return {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}, min(1.0, fraction)


def screen_quad(scene) -> dict[str, list[float]]:
    """Project the monitor's four ordered surface vertices."""
    screen = bpy.data.objects["monitor_screen"]
    return {
        label: list(project_point(scene, screen.matrix_world @ screen.data.vertices[index].co))
        for label, index in (("tl", 3), ("tr", 2), ("br", 1), ("bl", 0))
    }


def roulette_geometry(scene) -> dict:
    """Export the rotor-local pocket ring and ball-overlay geometry."""
    rotor = bpy.data.objects["roulette_rotor"]
    radius, height = 0.0885, 0.021
    center = project_point(scene, rotor.matrix_world @ Vector((0, 0, height)))
    u = project_point(scene, rotor.matrix_world @ Vector((radius, 0, height)))
    v = project_point(scene, rotor.matrix_world @ Vector((0, radius, height)))
    ball = bpy.data.objects["roulette_ball_pocket_0"]
    diameter = 2 * max(vertex.co.length for vertex in ball.data.vertices)
    a = project_point(scene, rotor.matrix_world @ Vector((-diameter / 2, 0, height)))
    b = project_point(scene, rotor.matrix_world @ Vector((diameter / 2, 0, height)))
    return {
        "center": list(center),
        "u": [u[i] - center[i] for i in range(2)],
        "v": [v[i] - center[i] for i in range(2)],
        "pocketZero": math.pi / 2,
        "pocketStep": 2 * math.pi / 37,
        "frameStep": 2 * math.pi / 74,
        "trackScale": 0.121 / radius,
        "ballDiameter": math.dist(a, b),
    }


def scene_data(scene, roulette_crop: dict[str, int]) -> dict:
    """Export the fourteen hotspots, screen quad and roulette sprite geometry."""
    roulette = roulette_geometry(scene)
    roulette["crop"] = {
        k: v / (2560 if k in {"x", "w"} else 1440) for k, v in roulette_crop.items()
    }
    roulette["frames"], roulette["columns"] = 74, 10
    return {
        "hotspots": {name: project_box(scene, bpy.data.objects[name])[0] for name in HOTSPOTS},
        "screen": screen_quad(scene),
        "roulette": roulette,
    }
