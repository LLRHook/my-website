"""Principled materials with explicit sRGB-to-linear colours and metric map scale."""

from collections.abc import Sequence
from pathlib import Path

import bpy


def linear(color: str | Sequence[float]) -> tuple[float, float, float, float]:
    """Convert an sRGB colour to linear RGBA."""
    if isinstance(color, str):
        color = tuple(int(color.lstrip("#")[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in color[:3]) + (
        1,
    )


def simple(
    name: str,
    color: str | Sequence[float],
    roughness: float = 0.5,
    metal: float = 0,
    coat: float = 0,
) -> bpy.types.Material:
    """Create a Principled surface material."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = linear(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Coat Weight"].default_value = coat
    return mat


def image_material(name: str, path: Path, roughness: float = 0.6) -> bpy.types.Material:
    """Apply a printed image to surface albedo."""
    mat = simple(name, "#ffffff", roughness)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(path), check_existing=True)
    links.new(tex.outputs["Color"], nodes.get("Principled BSDF").inputs["Base Color"])
    return mat


def mapped(
    name: str,
    files: Sequence[Path],
    tint: str | None = None,
    scale: float = 1.0,
    normal_strength: float = 0.3,
) -> bpy.types.Material:
    """Apply metric triplanar colour, roughness and normal maps."""
    mat = simple(name, tint or "#ffffff", 0.7)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    coordinates = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeVectorMath")
    mapping.operation = "SCALE"
    mapping.inputs[3].default_value = scale
    links.new(coordinates.outputs["Object"], mapping.inputs[0])
    for channel, socket in (("diff", "Base Color"), ("rough", "Roughness"), ("nor_gl", "Normal")):
        path = next((p for p in files if channel in p.name.lower()), None)
        if not path:
            continue
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(path), check_existing=True)
        tex.projection, tex.projection_blend = "BOX", 0.15
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        if channel == "diff":
            if tint:
                bw = nodes.new("ShaderNodeRGBToBW")
                mix = nodes.new("ShaderNodeMixRGB")
                mix.blend_type, mix.inputs[0].default_value = "MULTIPLY", 0.18
                mix.inputs[1].default_value = linear(tint)
                links.new(tex.outputs["Color"], bw.inputs[0])
                links.new(bw.outputs[0], mix.inputs[2])
                links.new(mix.outputs[0], shader.inputs[socket])
            else:
                links.new(tex.outputs["Color"], shader.inputs[socket])
        elif channel == "nor_gl":
            tex.image.colorspace_settings.name = "Non-Color"
            normal = nodes.new("ShaderNodeNormalMap")
            normal.inputs["Strength"].default_value = normal_strength
            links.new(tex.outputs["Color"], normal.inputs["Color"])
            links.new(normal.outputs["Normal"], shader.inputs[socket])
        else:
            tex.image.colorspace_settings.name = "Non-Color"
            links.new(tex.outputs["Color"], shader.inputs[socket])
    return mat


def wood(name: str, color: str | Sequence[float] = "#40251e") -> bpy.types.Material:
    """Create polished procedural timber."""
    mat = simple(name, color, 0.25, coat=0.3)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    noise = nodes.new("ShaderNodeTexNoise")
    mapping = nodes.new("ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = (5, 90, 7)
    coordinates = nodes.new("ShaderNodeTexCoord")
    links.new(coordinates.outputs["Generated"], mapping.inputs[0])
    links.new(mapping.outputs[0], noise.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.0003
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], nodes.get("Principled BSDF").inputs["Normal"])
    return mat


def curtain() -> bpy.types.Material:
    """Create a woven sheer material with partial transmission."""
    mat = simple("White sheer woven linen", "#f4f4f0", 0.9)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Sheen Weight"].default_value = 0.4
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    mix = nodes.new("ShaderNodeMixShader")
    mix.inputs[0].default_value = 0.55
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(shader.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], nodes.get("Material Output").inputs["Surface"])
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 650
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.2, 0.0001
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat
