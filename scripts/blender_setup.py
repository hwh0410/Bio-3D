#!/usr/bin/env python3
"""Run in Blender 4.x/5.x: blender -b --python scripts/blender_setup.py -- --references references --output sources/Bio_Master_working.blend"""
import bpy, argparse, sys, math
from pathlib import Path
from mathutils import Vector
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
p=argparse.ArgumentParser();p.add_argument("--references",type=Path,default=Path("references"));p.add_argument("--output",type=Path,default=Path("sources/Bio_Master_working.blend"));a=p.parse_args(argv)
refs=a.references.resolve()
for view in ["front","three_quarter","side","back"]:
 if not (refs/(view+".png")).is_file():raise SystemExit("Missing "+str(refs/(view+".png"))+"; first run prepare_refs.py")
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
def new_collection(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
meshes=new_collection("MODEL_MASTER__EDIT_MESHES_HERE")
reference=new_collection("REFERENCE_IMAGES__NON_EXPORT")
# Images are temporary modeling guides, not exported meshes.
# Front looks from -Y, right side looks from +X, height uses Z.
for name,loc,rot in [
 ("front",(0,-1.0,2.22),(math.pi/2,0,0)),
 ("three_quarter",(-.8,-.8,2.22),(math.pi/2,0,-math.pi/4)),
 ("side",(1,0,2.22),(math.pi/2,0,math.pi/2)),
 ("back",(0,1,2.22),(math.pi/2,0,math.pi))]:
 img=bpy.data.images.load(str(refs/(name+".png")),check_existing=True)
 obj=bpy.data.objects.new("REF_"+name.upper(),None);reference.objects.link(obj)
 obj.empty_display_type='IMAGE';obj.data=img;obj.empty_display_size=4.4*img.size[0]/img.size[1]
 obj.location=loc;obj.rotation_euler=rot;obj.hide_render=True
palette={"BodyGreen":"#7BC043","DarkGreen":"#2E6B3F","FacePanel":"#394A41","HelmetYellow":"#FFD42A","LEDGreen":"#B8FF66","GaugeOrange":"#FF9A3C","AlertRed":"#E53935"}
for name,hex_color in palette.items():
 mat=bpy.data.materials.new("BIO_"+name);mat.use_nodes=True
 rgba=tuple(int(hex_color[i:i+2],16)/255 for i in (1,3,5))+(1,)
 mat.diffuse_color=rgba
 bsdf=mat.node_tree.nodes.get("Principled BSDF")
 if bsdf:bsdf.inputs["Base Color"].default_value=rgba
def camera(name,pos):
 data=bpy.data.cameras.new(name);ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob)
 ob.location=pos;ob.rotation_euler=(Vector((0,0,2.2))-ob.location).to_track_quat('-Z','Y').to_euler()
 data.type='ORTHO';data.ortho_scale=5.4;return ob
for name,pos in {"front":(0,-10,2.2),"three_quarter":(7,-7,3),"side":(10,0,2.2),"back":(0,10,2.2)}.items():
 ob=camera("CAM_"+name.upper(),pos)
 if name=="front":scene.camera=ob
scene.render.resolution_x=1200;scene.render.resolution_y=1200
scene.render.film_transparent=True;scene.unit_settings.system='METRIC'
try:bpy.ops.file.pack_all()
except Exception as exc:print("Pack warning",exc)
a.output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(a.output.resolve()))
print("Bio master modeling scene created:",a.output)
