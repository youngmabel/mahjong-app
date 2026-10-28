"""Build the Clean 3D mahjong tile set in Blender and render each tile.

Makes one rounded, two-layer tile (white front, teal back) at full-size American
proportions, puts each face drawing on its front, saves the Blender file and
renders every face plus the tile back to transparent PNG images.

Run from a terminal on the Mac:
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python build_tiles.py -- --render all

Options after "--":
  --root PATH     the "Mahjong 3D Tiles" folder (default: the folder above this script)
  --render WHAT   none | sample | all | comma-separated names such as bam-1,joker
  --width PX      image width in pixels (default 720)
  --samples N     render samples (default 256)
  --log PATH      optional progress log, one JSON line per step
"""
import argparse
import json
import math
import os
import sys
import time

import bmesh
import bpy
from mathutils import Euler, Vector

# ------------------------------------------------------------------ settings
H = 0.03025            # tile height, meters (about 30 mm)
W = H * 64 / 88        # tile width, 22 mm: the same shape as the 64 x 88 face art
T = 0.0127             # thickness, about 13 mm
FACE_LAYER = 0.55      # front 55% of the thickness is white, the back 45% is teal
BEVEL = 0.0010         # 1 mm rounded edges
SEGMENTS = 5
TILT_DEG = 14          # camera tipped toward the near edge so the thickness shows
BUMP_STRENGTH = 1.0    # slight carved look on the printed markings
BUMP_DISTANCE = 0.00009  # 0.09 mm deep
WHITE = (255, 255, 255)
TEAL = (0x19, 0x78, 0x7D)

FACES = ([f"bam-{n}" for n in range(1, 10)] + [f"crak-{n}" for n in range(1, 10)]
         + [f"dot-{n}" for n in range(1, 10)]
         + ["wind-north", "wind-east", "wind-west", "wind-south",
            "dragon-red", "dragon-green", "dragon-soap"]
         + [f"flower-{n}" for n in range(1, 9)] + ["joker"])
ALL = FACES + ["back"]
SAMPLE = ["bam-1", "dot-5", "crak-3", "dragon-red", "dragon-soap", "joker"]


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--root", default=os.path.dirname(here))
    ap.add_argument("--render", default="all")
    ap.add_argument("--width", type=int, default=720)
    ap.add_argument("--samples", type=int, default=256)
    ap.add_argument("--log", default="")
    return ap.parse_args(argv)


ARGS = parse_args()


def log(**entry):
    entry["t"] = round(time.time(), 2)
    print("TILES", json.dumps(entry), flush=True)
    if ARGS.log:
        with open(ARGS.log, "a") as fh:
            fh.write(json.dumps(entry) + "\n")


def linear(rgb):
    out = []
    for c in rgb:
        c = c / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# ------------------------------------------------------------------ scene
def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights,
                 bpy.data.images, bpy.data.worlds):
        for block in list(coll):
            coll.remove(block)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def build_tile_mesh():
    """Rounded box with a split line around the sides for the two layers."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * W, v.co.y * H, v.co.z * T))
    z_split = T / 2 - FACE_LAYER * T
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                           plane_co=(0, 0, z_split), plane_no=(0, 0, 1))
    bm.normal_update()
    edges = [e for e in bm.edges
             if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > math.radians(30)]
    bmesh.ops.bevel(bm, geom=edges, offset=BEVEL, offset_type='OFFSET', segments=SEGMENTS,
                    profile=0.5, affect='EDGES', clamp_overlap=True, material=-1)
    bm.normal_update()
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n, c = f.normal, f.calc_center_median()
        if n.z > 0.5:
            mi = 0          # printed face
        elif n.z < -0.5:
            mi = 1          # tile back
        elif c.z > z_split:
            mi = 2          # white layer
        else:
            mi = 3          # teal layer
        f.material_index = mi
        f.smooth = True
        for loop in f.loops:
            u = (loop.vert.co.x + W / 2) / W
            v = (loop.vert.co.y + H / 2) / H
            loop[uv].uv = (1.0 - u if mi == 1 else u, v)
    raw = bpy.data.meshes.new("TileMeshRaw")
    bm.to_mesh(raw)
    bm.free()

    # Bake weighted normals so the flat faces shade flat and the edges shade round.
    tmp = bpy.data.objects.new("tmp", raw)
    bpy.context.scene.collection.objects.link(tmp)
    mod = tmp.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
    mod.mode = 'FACE_AREA'
    mod.weight = 50
    mod.keep_sharp = True
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg), preserve_all_data_layers=True,
                                           depsgraph=dg)
    mesh.name = "TileMesh"
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.meshes.remove(raw)
    return mesh


def principled_material(name, rgb=None, roughness=0.34):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = roughness
    if rgb:
        bsdf.inputs["Base Color"].default_value = linear(rgb)
    return mat


def printed_material(name, tex_dir, roughness=0.34):
    """Face art as the color, its ink mask as a slight engraving."""
    mat = principled_material(name, roughness=roughness)
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    col = nt.nodes.new("ShaderNodeTexImage")
    col.image = bpy.data.images.load(os.path.join(tex_dir, name + ".png"), check_existing=True)
    col.extension = 'EXTEND'
    col.location = (-700, 300)
    ink = nt.nodes.new("ShaderNodeTexImage")
    ink.image = bpy.data.images.load(os.path.join(tex_dir, name + "_ink.png"), check_existing=True)
    ink.image.colorspace_settings.name = 'Non-Color'
    ink.extension = 'EXTEND'
    ink.location = (-700, -50)
    bump = nt.nodes.new("ShaderNodeBump")
    bump.invert = True
    bump.inputs["Strength"].default_value = BUMP_STRENGTH
    bump.inputs["Distance"].default_value = BUMP_DISTANCE
    bump.location = (-300, -100)
    nt.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(ink.outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def add_sun(coll, name, toward_light, strength, angle_deg):
    data = bpy.data.lights.new(name, 'SUN')
    data.energy = strength
    data.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new(name, data)
    coll.objects.link(ob)
    ob.rotation_euler = Vector(toward_light).normalized().to_track_quat('Z', 'Y').to_euler()
    return ob


def setup_world(scene):
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.62, 0.63, 0.65, 1.0)
    bg.inputs["Strength"].default_value = 0.42
    scene.world = world


def frame_camera(scene, cam, mesh):
    """Orthographic camera tipped TILT_DEG toward the near edge, framed tightly on the tile."""
    tilt = math.radians(TILT_DEG)
    rot = Euler((tilt, 0.0, 0.0)).to_matrix()
    view = rot @ Vector((0.0, 0.0, -1.0))
    base = -view * 0.25
    pts = [rot.transposed() @ (v.co - base) for v in mesh.vertices]
    xs, ys = [p.x for p in pts], [p.y for p in pts]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    pad = 0.012 * h
    w, h = w + 2 * pad, h + 2 * pad
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    cam.rotation_euler = Euler((tilt, 0.0, 0.0))
    cam.location = base + rot @ Vector((cx, cy, 0.0))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(w, h)
    cam.data.clip_start = 0.01
    cam.data.clip_end = 1.0
    scene.render.resolution_x = ARGS.width
    scene.render.resolution_y = round(ARGS.width * h / w)
    scene.render.resolution_percentage = 100
    return {"frame_mm": [round(w * 1000, 2), round(h * 1000, 2)],
            "pixels": [scene.render.resolution_x, scene.render.resolution_y]}


def setup_render(scene):
    scene.render.engine = 'CYCLES'
    device = 'CPU'
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        try:
            prefs.refresh_devices()
        except AttributeError:
            prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            device = 'GPU'
            break
    scene.cycles.device = device
    scene.cycles.samples = ARGS.samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.004
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.render.film_transparent = True
    img = scene.render.image_settings
    img.file_format = 'PNG'
    img.color_mode = 'RGBA'
    img.color_depth = '8'
    img.compression = 90
    try:
        scene.view_settings.view_transform = 'Standard'
        scene.view_settings.look = 'None'
    except TypeError:
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    for prop in scene.render.bl_rna.properties:  # no metadata written into the images
        if prop.identifier.startswith("use_stamp"):
            setattr(scene.render, prop.identifier, False)
    return device


def setup_viewport(center):
    """Make the saved file open looking at the whole tile set, textures showing."""
    done = 0
    for screen in bpy.data.screens:
        for area in screen.areas:
            for space in area.spaces:
                if space.type != 'VIEW_3D':
                    continue
                try:
                    space.shading.type = 'MATERIAL'
                    space.clip_start = 0.0005
                    space.clip_end = 50.0
                    r3d = space.region_3d
                    r3d.view_perspective = 'PERSP'
                    r3d.view_location = center
                    r3d.view_rotation = Euler((math.radians(32), 0.0, 0.0)).to_quaternion()
                    r3d.view_distance = 0.40
                    done += 1
                except (AttributeError, TypeError):
                    pass
    return done


def main():
    root = os.path.abspath(ARGS.root)
    tex_dir = os.path.join(root, "blender", "textures")
    img_dir = os.path.join(root, "images")
    blend_path = os.path.join(root, "blender", "mahjong_tiles_clean.blend")
    os.makedirs(img_dir, exist_ok=True)
    log(step="start", root=root, blender=bpy.app.version_string)

    clear_scene()
    scene = bpy.context.scene
    scene.name = "Mahjong Tiles"
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.length_unit = 'MILLIMETERS'

    mesh = build_tile_mesh()
    for name, rgb, rough in (("Back", None, 0.36), ("White Body", WHITE, 0.34),
                             ("Teal Body", TEAL, 0.36)):
        if name == "Back":
            back = printed_material("back", tex_dir, rough)
            back.name = "Back"
        else:
            principled_material(name, rgb, rough)
    faces = {n: printed_material(n, tex_dir) for n in FACES}
    for n, m in faces.items():
        m.name = "Face " + n
    mesh.materials.append(faces["bam-1"])
    mesh.materials.append(bpy.data.materials["Back"])
    mesh.materials.append(bpy.data.materials["White Body"])
    mesh.materials.append(bpy.data.materials["Teal Body"])

    render_coll = bpy.data.collections.new("Render")
    set_coll = bpy.data.collections.new("Tile Set")
    scene.collection.children.link(render_coll)
    scene.collection.children.link(set_coll)
    set_coll.hide_render = True

    def tile_object(name, face, coll, loc=(0, 0, 0), flipped=False):
        ob = bpy.data.objects.new(name, mesh)
        coll.objects.link(ob)
        ob.location = loc
        if flipped:
            ob.rotation_euler = (0.0, math.pi, 0.0)
        ob.material_slots[0].link = 'OBJECT'
        ob.material_slots[0].material = face
        return ob

    tile = tile_object("Render Tile", faces["bam-1"], render_coll)
    gap, cols = 0.006, 9
    for i, n in enumerate(ALL):
        r, c = divmod(i, cols)
        loc = (0.08 + c * (W + gap), -r * (H + gap), 0.0)
        tile_object(n, faces.get(n, faces["bam-1"]), set_coll, loc, flipped=(n == "back"))

    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    render_coll.objects.link(cam)
    scene.camera = cam
    framing = frame_camera(scene, cam, mesh)
    add_sun(render_coll, "Key Light", (-0.45, -0.55, 0.70), 1.8, 24)
    add_sun(render_coll, "Fill Light", (0.60, -0.30, 0.74), 0.65, 30)
    add_sun(render_coll, "Rim Light", (0.0, 0.75, 0.66), 0.45, 20)
    setup_world(scene)
    device = setup_render(scene)
    scene.render.filepath = "//../images/"
    views = setup_viewport(Vector((0.08 + 4 * (W + gap), -2 * (H + gap), 0.0)))
    log(step="built", device=device, views=views, **framing)

    bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backup copies
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)
    bpy.ops.file.make_paths_relative()
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)
    log(step="saved", blend=blend_path, image_path=bpy.data.images[0].filepath)

    if ARGS.render == "none":
        names = []
    elif ARGS.render == "sample":
        names = SAMPLE
    elif ARGS.render == "all":
        names = ALL
    else:
        names = [n.strip() for n in ARGS.render.split(",") if n.strip()]
    for n in names:
        t0 = time.time()
        if n == "back":
            tile.rotation_euler = (0.0, math.pi, 0.0)
        else:
            tile.rotation_euler = (0.0, 0.0, 0.0)
            tile.material_slots[0].material = faces[n]
        scene.render.filepath = os.path.join(img_dir, n + ".png")
        bpy.ops.render.render(write_still=True)
        log(step="rendered", name=n, secs=round(time.time() - t0, 2))
    log(step="done", count=len(names))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # report the failure in the log, then exit non-zero
        import traceback
        log(step="error", error=repr(exc), trace=traceback.format_exc())
        sys.exit(1)
