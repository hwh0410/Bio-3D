#!/usr/bin/env python3
"""Export approved mesh collection as GLB. Refuse to export empty placeholders."""
import bpy,sys,argparse
from pathlib import Path
args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
p=argparse.ArgumentParser();p.add_argument("--output",type=Path,default=Path("models/Bio_Master.glb"));a=p.parse_args(args)
coll=bpy.data.collections.get("MODEL_MASTER__EDIT_MESHES_HERE")
if not coll:raise SystemExit("Missing MODEL_MASTER collection")
objects=[o for o in coll.all_objects if o.type=="MESH"]
if not objects:raise SystemExit("No mesh in MODEL_MASTER — modeling is not complete; refusing an empty GLB")
bpy.ops.object.select_all(action='DESELECT')
for obj in coll.all_objects:
 if obj.type in ("MESH","ARMATURE"):obj.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
a.output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(a.output.resolve()),export_format='GLB',use_selection=True)
print("GLB exported",a.output)
