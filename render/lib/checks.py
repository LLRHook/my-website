"""Check the approved minimum hotspot framing."""

import bpy

from lib.projection import HOTSPOTS, project_box


def check_hotspots(scene) -> list[str]:
    """Return failures for clipped hotspots below their required visible fractions."""
    failures = []
    for name in HOTSPOTS:
        _, fraction = project_box(scene, bpy.data.objects[name])
        threshold = {"window": 0.35, "plant_floor": 0.5}.get(name, 1.0)
        if fraction < threshold:
            failures.append(f"{name}: visible fraction {fraction:.7f} < {threshold}")
    return failures
