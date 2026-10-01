"""Assemble architecture, furniture and wall decorations from the metric layout."""

import math
import random
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

from lib import furniture as f
from lib import geometry as g
from lib import lighting
from lib import materials as m
from lib import props as p
from lib.assets import Assets, bounds, place
from lib.layout import LAYOUT as L
from lib.roulette import roulette

ROOT = Path(__file__).resolve().parents[1]


def architecture(assets: Assets) -> bpy.types.Object:
    """Construct the room envelope, open window, trim and sheer curtain."""
    plaster = m.mapped("Warm grey plaster #cfcac2", assets.files("wall"), "#cfcac2", 0.5, 0.13)
    floor = m.mapped("Oak floor", assets.files("floor"), None, 1 / 1.7, 0.22)
    trim = m.simple("Window and skirting warm white", "#e1dfd9", 0.55)
    skirting = m.simple("Painted warm grey skirting", "#bbb6ae", 0.62)
    materials = {"plaster": plaster, "floor": floor, "skirting": skirting}
    for name, center, size, material in L.architecture_boxes:
        g.box(name, center, size, materials[material], 0.001 if material == "skirting" else 0)
    window = g.group("window")
    for name, center, size in L.window_frames:
        g.parent(g.box(name, center, size, trim, 0.002), window)
    verts, faces = [], []
    nx, nz = L.curtain_segments
    for j in range(nz + 1):
        for i in range(nx + 1):
            phase = i / nx * L.curtain_waves * 2 * math.pi
            y = L.curtain_y_span[0] + L.curtain_y_span[1] * i / nx
            x = L.curtain_x + L.curtain_fold * math.sin(phase)
            z = (
                L.curtain_z_span[0]
                + L.curtain_z_span[1] * j / nz
                + L.curtain_hem_wave * math.sin(phase) * (1 - j / nz)
            )
            verts.append((x, y, z))
    for j in range(nz):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    g.parent(g.mesh("window_sheer_curtain", verts, faces, m.curtain(), True), window)
    start, end, radius = L.curtain_rod
    g.parent(g.rod("curtain_rod", start, end, radius, trim), window)
    return window


def furniture(assets: Assets) -> bpy.types.Object:
    """Place furniture, task lamp and shelf contents from the room layout."""
    desk = f.desk(assets)
    f.monitor()
    f.keyboard_mouse()
    roulette(L.roulette_location, ROOT / "assets/generated")
    meshes = assets.load("desk_lamp")
    lamp = place(meshes, "desk_lamp", L.lamp_location, height=L.lamp_height, rotation=math.pi / 2)
    for part in lamp.children_recursive:
        if part.type == "MESH":
            part.data.materials.clear()
            part.data.materials.append(bpy.data.materials["Desk and lamp matte black steel"])
    mesh = lamp.children[0]
    vertices = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
    high = [v for v in vertices if v.z > L.lamp_head_slice_z]
    head_x = max(v.x for v in high) - L.lamp_head_inset_x
    head_y = sum(v.y for v in high) / len(high)
    head_z = L.lamp_head_z
    bulb_mat = m.simple("Lamp bulb warm diffuser", "#f8ead2", 0.6)
    shader = bulb_mat.node_tree.nodes.get("Principled BSDF")
    blackbody = bulb_mat.node_tree.nodes.new("ShaderNodeBlackbody")
    blackbody.inputs[0].default_value = 2700
    bulb_mat.node_tree.links.new(blackbody.outputs[0], shader.inputs["Emission Color"])
    bulb = g.sphere("lamp_bulb_diffuser", (head_x, head_y, head_z), 0.016, bulb_mat, (1, 1, 0.3))
    g.parent(bulb, lamp)
    source_center = (head_x, head_y, head_z - L.lamp_source_drop)
    source = lighting.light(
        "lamp_light", "AREA", source_center, 18, (1, 1, 1), L.lamp_target, 0.048
    )
    source.data.use_temperature = True
    source.data.temperature = 2700
    g.parent(source, lamp)
    shelf_source = assets.load("shelf")
    shelf_mat = shelf_source[0].data.materials[0]
    data = shelf_source[0].data
    face = max((p for p in data.polygons if p.normal.z > 0.9), key=lambda p: p.area)
    loops = list(face.loop_indices)[:3]
    points = [data.vertices[data.loops[i].vertex_index].co for i in loops]
    uvs = [data.uv_layers.active.data[i].uv.copy() for i in loops]
    basis = Matrix([(p.x, p.y, 1) for p in points]).inverted()
    u, v = (basis @ Vector([uv[axis] for uv in uvs]) for axis in (0, 1))
    uv_center = sum(uvs, Vector((0, 0))) / 3
    for obj in shelf_source:
        bpy.data.objects.remove(obj, do_unlink=True)
    for name, z in L.shelves:
        center = (L.shelf_x, L.shelf_y, z - L.shelf_size[2] / 2)
        shelf = g.box(f"floating_shelf_{name}", center, L.shelf_size, shelf_mat, 0.003)
        for face in shelf.data.polygons:
            for index in face.loop_indices:
                point = shelf.data.vertices[shelf.data.loops[index].vertex_index].co
                a = point.y if abs(face.normal.x) > 0.9 else point.x
                b = point.y if abs(face.normal.z) > 0.9 else point.z
                shelf.data.uv_layers.active.data[index].uv = uv_center + Vector(
                    (u.x * a + u.y * b, v.x * a + v.y * b)
                )
    books = g.group("books_shelf")
    row = assets.load("encyclopedias")
    for obj in row[L.book_count :]:
        bpy.data.objects.remove(obj, do_unlink=True)
    x = L.book_row_start_x
    for index, obj in enumerate(row[: L.book_count]):
        center = (x, L.book_row_y, L.shelves[0][1])
        root = place(
            [obj],
            f"shelf_book_{index}",
            center,
            height=L.book_height,
            rotation=math.pi,
            mirror_uv=True,
        )
        g.parent(root, books)
        x += L.book_pitch
    decorative = assets.load("decorative_books")
    selected = [obj for obj in decorative if obj.name.startswith("book_hardcover")][
        : L.book_stack_count
    ]
    for obj in set(decorative) - set(selected):
        bpy.data.objects.remove(obj, do_unlink=True)
    stack_height = L.shelves[1][1]
    for i, obj in enumerate(selected):
        obj.data.transform(Matrix.Rotation(math.pi / 2, 4, "Y"))
        center = (L.book_stack_x + L.book_stack_offset * i, L.book_row_y, stack_height)
        yaw = L.book_stack_yaw * (i - 1)
        root = place([obj], f"stacked_book_{i}", center, width=L.book_stack_width, rotation=yaw)
        g.parent(root, books)
        stack_height += bounds([obj])[1].z - bounds([obj])[0].z + L.book_stack_gap
    p.pokeball(L.pokeball_location)
    p.carton(L.carton_location, ROOT / "assets/generated")
    meshes = assets.load("shelf_plant")
    place(meshes, "plant_shelf", L.shelf_plant_location, height=L.shelf_plant_height)
    p.floor_planter(assets)
    f.rug(assets)
    f.task_chair()
    p.mug(L.mug_location)
    return desk


def wall_art(assets: Assets) -> None:
    """Place diploma and photographic prints with deterministic small rotations."""
    generated = ROOT / "assets/generated"
    frame_objects = assets.load("diploma_frame")
    for obj in frame_objects:
        obj.data.transform(Matrix.Rotation(math.pi / 2, 4, "Y"))
    diploma = place(
        frame_objects,
        "diploma",
        L.diploma_location,
        width=L.diploma_size[0],
        height=L.diploma_size[1],
    )
    _, upper = bounds(frame_objects)
    paper = g.panel(
        "diploma_paper",
        *L.diploma_paper_size,
        (L.diploma_paper_center[0], upper.y + 0.0004, L.diploma_paper_center[1]),
        m.image_material("Printed UMBC diploma", generated / "diploma.png"),
    )
    g.parent(paper, diploma)
    tape_mat = m.simple("Matte translucent paper tape", "#d0c8ac", 0.88)
    random.seed(L.seed)
    for name, x, z in L.photo_locations:
        root = g.group("photo_" + name)
        width, height = L.photo_sizes[0] if name == "profile" else L.photo_sizes[1]
        image = m.image_material("Photo print " + name, generated / ("photo_" + name + ".png"))
        photo = g.panel("photo_print_" + name, width, height, (0, 0, 0), image)
        solid = photo.modifiers.new("Photographic paper thickness", "SOLIDIFY")
        solid.thickness = L.photo_thickness
        photo.parent = root
        tape = g.panel("tape_" + name, 0.033, 0.014, (0, 0.001, height / 2 - 0.004), tape_mat)
        tape.rotation_euler.y = 0.04
        tape.parent = root
        root.location = (x, L.photo_depth, z)
        root.rotation_euler.y = random.uniform(-L.photo_yaw_range, L.photo_yaw_range)
    image = m.image_material("Marker on yellow sticky", generated / "sticky.png", 0.95)
    sticky = g.panel("sticky_note", L.sticky_size, L.sticky_size, L.sticky_location, image)
    sticky.rotation_euler.y = L.sticky_yaw
    mod = sticky.modifiers.new("Paper thickness", "SOLIDIFY")
    mod.thickness = L.sticky_thickness
