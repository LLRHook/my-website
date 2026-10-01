"""Select a working Cycles backend with an isolated OptiX probe."""

import subprocess

import bpy


def select_device(scene: bpy.types.Scene, override: str) -> str:
    """Probe OptiX, then select CUDA or CPU when automatic selection needs fallback."""
    backends = ("OPTIX", "CUDA", "CPU") if override == "auto" else (override.upper(),)
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in backends:
        try:
            if backend == "OPTIX":
                code = """import bpy
s = bpy.context.scene
p = bpy.context.preferences.addons['cycles'].preferences
p.compute_device_type = 'OPTIX'
p.get_devices()
assert any(d.type == 'OPTIX' for d in p.devices)
for d in p.devices:
    d.use = d.type == 'OPTIX'
s.render.engine = 'CYCLES'
s.cycles.device = 'GPU'
s.cycles.samples = 1
s.cycles.use_denoising = True
s.cycles.denoiser = 'OPENIMAGEDENOISE'
s.render.resolution_x = s.render.resolution_y = 32
s.render.resolution_percentage = 100
bpy.ops.render.render()"""
                command = [bpy.app.binary_path, "-b", "--factory-startup"]
                command += ["--python-exit-code", "1", "--python-expr", code]
                probe = subprocess.run(command, capture_output=True)
                if probe.returncode:
                    raise RuntimeError("OptiX probe failed")
            if backend != "CPU":
                prefs.compute_device_type = backend
                prefs.get_devices()
                if not any(d.type == backend for d in prefs.devices):
                    raise RuntimeError(f"No {backend} device available")
            for gpu in prefs.devices:
                gpu.use = backend != "CPU" and gpu.type == backend
            scene.render.engine = "CYCLES"
            scene.cycles.device = "CPU" if backend == "CPU" else "GPU"
            scene.cycles.use_denoising = True
            scene.cycles.denoiser = "OPENIMAGEDENOISE"
            scene.cycles.denoising_use_gpu = backend != "CPU"
            scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
            scene.cycles.use_adaptive_sampling = False
            scene.cycles.seed = 20260930
            scene.cycles.use_animated_seed = False
            scene.cycles.max_bounces = 12
            scene.cycles.transparent_max_bounces = 16
            scene.cycles.diffuse_bounces = 6
            scene.cycles.glossy_bounces = 6
            print(f"CYCLES {backend} + OIDN", flush=True)
            return backend
        except (RuntimeError, TypeError):
            if override != "auto" or backend == "CPU":
                raise
            print(f"{backend} unavailable; trying next backend", flush=True)
    raise RuntimeError("No Cycles backend available")
