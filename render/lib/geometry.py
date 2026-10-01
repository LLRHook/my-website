"""Create metric geometry primitives for the room."""

import math
from collections.abc import Sequence

import bpy
from bpy.types import Material
from bpy.types import Object as Obj
from mathutils import Vector

Vec = Sequence[float]
Mat = Material | None


def finish(obj: Obj, name: str, mat: Mat, bevel: float = 0, smooth: bool = False) -> Obj:
    """Assign a primitive's name, material and surface treatment."""
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Soft manufactured edges", "BEVEL")
        mod.width, mod.segments = bevel, 3
        obj.modifiers.new("Weighted surface normals", "WEIGHTED_NORMAL")
    if smooth:
        obj.data.polygons.foreach_set("use_smooth", [True] * len(obj.data.polygons))
    return obj


def group(name: str, data: bpy.types.ID | None = None) -> Obj:
    """Create and link a named scene object."""
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj


def parent(obj: Obj, root: Obj) -> Obj:
    """Attach an object while preserving its world transform."""
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = root
    obj.matrix_world = world
    return obj


def box(name: str, loc: Vec, size: Vec, mat: Mat, bevel: float = 0.002) -> Obj:
    """Create a metric box with softened edges."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    bpy.context.object.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(bpy.context.object, name, mat, bevel)


def mesh(name: str, vertices: list[Vec], faces: list[tuple], mat: Mat, smooth: bool = False) -> Obj:
    """Create a mesh from vertices and faces."""
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    obj = group(name, data)
    return finish(obj, name, mat, smooth=smooth)


def panel(name: str, width: float, height: float, loc: Vec, mat: Mat) -> Obj:
    """Create a front-facing panel with unit-square UVs."""
    w, h = width / 2, height / 2
    obj = mesh(name, [(-w, 0, -h), (w, 0, -h), (w, 0, h), (-w, 0, h)], [(0, 3, 2, 1)], mat)
    obj.location = loc
    uv = obj.data.uv_layers.new(name="UVMap")
    uv.data.foreach_set("uv", (0, 0, 0, 1, 1, 1, 1, 0))
    return obj


def sphere(name: str, loc: Vec, radius: float, mat: Mat, scale: Vec = (1, 1, 1)) -> Obj:
    """Create a smooth metric sphere."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=radius, location=loc)
    bpy.context.object.scale = scale
    return finish(bpy.context.object, name, mat, smooth=True)


def cylinder(name: str, loc: Vec, radius: float, depth: float, mat: Mat, vertices: int = 96) -> Obj:
    """Create a cylinder with softened machined edges."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    return finish(bpy.context.object, name, mat, min(depth / 6, 0.001))


def torus(name: str, loc: Vec, major: float, minor: float, mat: Mat) -> Obj:
    """Create a smooth metric torus."""
    bpy.ops.mesh.primitive_torus_add(
        major_segments=128, minor_segments=12, major_radius=major, minor_radius=minor, location=loc
    )
    return finish(bpy.context.object, name, mat, smooth=True)


def lathe(name: str, profile: list[tuple[float, float]], mat: Mat, segments: int = 128) -> Obj:
    """Revolve a radius-height profile around Z."""
    vertices = [
        (r * math.cos(2 * math.pi * i / segments), r * math.sin(2 * math.pi * i / segments), z)
        for r, z in profile
        for i in range(segments)
    ]
    edges = [
        (j * segments + i, j * segments + (i + 1) % segments)
        for j in range(len(profile) - 1)
        for i in range(segments)
    ]
    faces = [(a, b, b + segments, a + segments) for a, b in edges]
    return mesh(name, vertices, faces, mat, smooth=True)


def rod(name: str, start: Vec, end: Vec, radius: float, mat: Mat) -> Obj:
    """Create a cylinder between two world points."""
    a, b = Vector(start), Vector(end)
    obj = cylinder(name, (a + b) / 2, radius, (b - a).length, mat, 16)
    obj.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
    return obj


def text(name: str, body: str, loc: Vec, size: float, mat: Mat, rotation: Vec) -> Obj:
    """Create a small printed legend."""
    curve = bpy.data.curves.new(name, "FONT")
    curve.body, curve.size, curve.align_x, curve.extrude = body, size, "CENTER", 0.000015
    obj = group(name, curve)
    obj.location, obj.rotation_euler = loc, rotation
    return finish(obj, name, mat)


def look_at(obj: Obj, target: Vec) -> None:
    """Aim local negative Z at a world-space target."""
    target = Vector(target)
    if obj.parent is not None:
        target = obj.parent.matrix_world.inverted() @ target
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
