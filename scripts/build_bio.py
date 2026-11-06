"""Procedural Bio mascot v0.1. +Z up; -Y forward."""
from pathlib import Path
import math
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix
OUT = Path(__file__).resolve().parents[1] / "models"
OUT.mkdir(exist_ok=True)
C = dict(lime="#7BC043",glow="#B8FF66",dark="#2E6B3F",ink="#12291E",face="#394A41",yellow="#FFD42A",orange="#FF9A3C",red="#E53935",white="#FAFFF0")
scene = trimesh.Scene()
def put(name, mesh, color):
    h=C.get(color,color).lstrip("#")
    rgb=[int(h[i:i+2],16) for i in (0,2,4)]+[255]
    mesh.visual.vertex_colors=np.tile(rgb,(len(mesh.vertices),1))
    scene.add_geometry(mesh,geom_name=name,node_name=name)
def oval(n,p,s,c):
    m=trimesh.creation.icosphere(subdivisions=3)
    m.apply_scale(s);m.apply_translation(p);put(n,m,c)
def disk(n,p,r,h,c,axis="z"):
    m=trimesh.creation.cylinder(radius=r,height=h,sections=48)
    if axis=="y":m.apply_transform(rotation_matrix(math.pi/2,[1,0,0]))
    if axis=="x":m.apply_transform(rotation_matrix(math.pi/2,[0,1,0]))
    m.apply_translation(p);put(n,m,c)
def rod(n,a,b,r,c):
    a=np.asarray(a,float);b=np.asarray(b,float)
    m=trimesh.creation.cylinder(radius=r,height=np.linalg.norm(b-a),sections=16)
    m.apply_transform(trimesh.geometry.align_vectors([0,0,1],b-a))
    m.apply_translation((a+b)/2);put(n,m,c)
def curve(n,pts,r,c):
    for i in range(len(pts)-1):rod(n+str(i),pts[i],pts[i+1],r,c)
for side in (-1,1):
    s="left" if side<0 else "right";x=side*.42
    oval(s+"_leg_black",(x,0,1),(.31,.31,.60),"ink")
    oval(s+"_leg",(x,-.02,1),(.275,.28,.54),"lime")
    oval(s+"_ankle",(x,-.06,.49),(.29,.30,.20),"dark")
    oval(s+"_boot_outline",(x,-.2,.31),(.39,.50,.30),"ink")
    oval(s+"_boot",(x,-.23,.34),(.355,.45,.245),"lime")
    oval(s+"_toe",(x,-.48,.29),(.32,.22,.15),"glow")
oval("torso_outline",(0,0,1.95),(.81,.47,.78),"ink")
oval("torso",(0,-.025,1.98),(.755,.435,.73),"lime")
oval("waist",(0,0,1.43),(.59,.43,.17),"dark")
oval("neck",(0,0,2.62),(.29,.31,.2),"dark")
for side in (-1,1):
    s="left" if side<0 else "right";x=side
    oval(s+"_shoulder_outline",(x*.78,0,2.30),(.29,.32,.29),"ink")
    oval(s+"_shoulder",(x*.80,-.02,2.32),(.235,.29,.23),"lime")
    a=(x*.88,0,2.2);b=(x*1.05,-.025,1.79)
    rod(s+"_upper_black",a,b,.245,"ink");rod(s+"_upper",a,b,.215,"lime")
    oval(s+"_elbow",(x*1.05,-.025,1.78),(.24,.24,.23),"dark")
    rod(s+"_forearm",(x*1.06,-.035,1.75),(x*1.09,-.13,1.44),.22,"lime")
    oval(s+"_glove_outline",(x*1.09,-.13,1.34),(.25,.25,.23),"ink")
    oval(s+"_glove",(x*1.09,-.18,1.36),(.21,.20,.205),"dark")
oval("head_outline",(0,-.01,3.21),(1.02,.53,.75),"ink")
oval("head_shell",(0,-.035,3.20),(.965,.50,.705),"lime")
oval("screen_border",(0,-.463,3.22),(.805,.155,.545),"ink")
oval("screen",(0,-.548,3.24),(.750,.110,.490),"face")
for side in (-1,1):
    s="left" if side<0 else "right"
    disk(s+"_ear_rim",(side*.965,-.05,3.2),.28,.15,"ink","x")
    disk(s+"_ear",(side*1.045,-.05,3.2),.215,.07,"lime","x")
    disk(s+"_ear_center",(side*1.085,-.05,3.2),.156,.045,"dark","x")
    oval(s+"_eye",(side*.33,-.663,3.34),(.105,.036,.203),"glow")
curve("smile",[(float(x),-.678,3.085+1.6*x*x) for x in np.linspace(-.17,.17,11)],.024,"glow")
oval("helmet_outline",(0,-.005,3.91),(1.055,.66,.49),"ink")
oval("helmet_crown",(0,-.018,3.94),(1.012,.625,.44),"yellow")
oval("helmet_brim_outline",(0,-.27,3.78),(1.18,.76,.17),"ink")
oval("helmet_brim",(0,-.29,3.82),(1.14,.73,.115),"yellow")
curve("helmet_ridge",[(0,-.59,3.91),(0,-.52,4.18),(0,-.25,4.35)],.024,"orange")
oval("helmet_leaf_white",(0,-.635,4.115),(.175,.045,.205),"white")
oval("helmet_leaf_green",(0,-.674,4.126),(.125,.04,.158),"dark")
curve("helmet_leaf_vein",[(-.06,-.724,4.04),(0,-.724,4.10),(.07,-.716,4.19)],.014,"white")
disk("chest_gauge_white",(0,-.458,2.13),.247,.034,"white","y")
disk("chest_gauge_rim",(0,-.479,2.13),.201,.035,"dark","y")
disk("chest_gauge_face",(0,-.501,2.13),.168,.024,"white","y")
for i,c in enumerate(["lime","lime","yellow","orange","red"]):
    t=math.pi-(i+.5)*math.pi/5
    oval("gauge_marker_"+str(i),(.137*math.cos(t),-.523,2.13+.137*math.sin(t)),(.04,.016,.04),c)
rod("gauge_needle",(0,-.539,2.13),(.112,-.539,2.205),.016,"dark")
oval("chest_leaf",(.13,-.553,2),(.112,.022,.075),"lime")
curve("chest_leaf_vein",[(.06,-.58,1.96),(.15,-.581,2.03)],.012,"white")
scene.export(OUT/"Bio_v0.1.glb")
scene.export(OUT/"Bio_v0.1.obj")
print("Bio v0.1 generated",len(scene.geometry),"pieces")
