"""Import manifest assets, bake their transforms, and place their metric bounds."""

import json
from collections.abc import Sequence
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

from lib.geometry import group

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets"


class Assets:
    def __init__(self) -> None:
        """Read the cached manifest of pinned room assets."""
        self.manifest = json.loads((BASE / "manifest.json").read_text(encoding="utf-8"))
        self.entries = {a["id"]: a for a in self.manifest["assets"]}

    def files(self, role: str) -> list[Path]:
        """List files associated with a used asset role."""
        entry = self.entries[self.manifest["roles"][role]]
        return [BASE / f["path"] for f in entry["files"]]

    def path(self, role: str) -> Path:
        """Resolve the import entrypoint for a model or environment."""
        entry = self.entries[self.manifest["roles"][role]]
        return BASE / entry["id"] / entry["entrypoint"]

    def load(self, role: str) -> list[bpy.types.Object]:
        """Import and bake model meshes into metric construction coordinates."""
        path = self.path(role)
        before = set(bpy.data.objects)
        if path.suffix == ".gltf":
            bpy.ops.import_scene.gltf(filepath=str(path))
        else:
            with bpy.data.libraries.load(str(path), link=False) as (src, dst):
                dst.objects = src.objects
            for obj in dst.objects:
                if obj and not obj.users_collection:
                    bpy.context.collection.objects.link(obj)
            for image in bpy.data.images:
                if image.source != "FILE" or image.packed_file:
                    continue
                filename = Path(image.filepath.replace("\\", "/")).name
                candidate = path.parent / "textures" / filename
                if candidate.is_file():
                    image.filepath = str(candidate)
                    image.reload()
        added = sorted(set(bpy.data.objects) - before, key=lambda o: o.name)
        bpy.context.view_layer.update()
        meshes = []
        for obj in added:
            if obj.type == "MESH":
                world = obj.matrix_world.copy()
                obj.data = obj.data.copy()
                obj.data.transform(world)
                obj.parent = None
                obj.matrix_world = Matrix.Identity(4)
                obj.hide_render = False
                obj.hide_viewport = False
                meshes.append(obj)
        for obj in added:
            if obj.type != "MESH":
                bpy.data.objects.remove(obj, do_unlink=True)
        print("ASSET", role, "meshes", len(meshes), flush=True)
        return meshes


def bounds(objects: Sequence[bpy.types.Object]) -> tuple[Vector, Vector]:
    """Measure world bounds of a nonempty mesh collection."""
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return Vector(tuple(min(p[i] for p in points) for i in range(3))), Vector(
        tuple(max(p[i] for p in points) for i in range(3))
    )


def place(
    objects: Sequence[bpy.types.Object],
    name: str,
    location: Sequence[float],
    width: float | None = None,
    height: float | None = None,
    depth: float | None = None,
    rotation: float = 0,
    mirror_uv: bool = False,
) -> bpy.types.Object:
    """Scale imported bounds and attach them to a placement root."""
    rotate = Matrix.Rotation(rotation, 4, "Z")
    for obj in objects:
        obj.data.transform(rotate)
    lo, hi = bounds(objects)
    dims = hi - lo
    scale = width / dims.x if width else height / dims.z if height else 1
    factors = Vector(
        (scale, depth / dims.y if depth else scale, height / dims.z if height and width else scale)
    )
    center = Vector(((hi.x + lo.x) / 2, (hi.y + lo.y) / 2, lo.z))
    transform = Matrix.Diagonal((*factors, 1)) @ Matrix.Translation(-center)
    root = group(name)
    for obj in objects:
        obj.data.transform(transform)
        if mirror_uv:
            # Reflect UVs via a donor surface so printing reads after the scene X reflection.
            donor = obj.copy()
            donor.data = obj.data.copy()
            bpy.context.collection.objects.link(donor)
            donor.data.transform(Matrix.Diagonal((-1, 1, 1, 1)))
            transfer = obj.modifiers.new(
                "Readable book printing after scene reflection", "DATA_TRANSFER"
            )
            transfer.object, transfer.use_loop_data = donor, True
            transfer.data_types_loops, transfer.loop_mapping = {"UV"}, "POLYINTERP_NEAREST"
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=transfer.name)
            bpy.data.objects.remove(donor, do_unlink=True)
        obj.parent = root
        obj.matrix_world = Matrix.Identity(4)
    root.location = location
    bpy.context.view_layer.update()
    return root
