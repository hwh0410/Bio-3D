#!/usr/bin/env python3
"""Crop the original 1448x1086 Bio character-sheet into four modeling references."""
from pathlib import Path
from PIL import Image
import argparse, json
CROPS = {
 "front": (380, 200, 624, 554),
 "three_quarter": (658, 200, 903, 554),
 "side": (914, 200, 1135, 554),
 "back": (1152, 200, 1382, 554)
}
p=argparse.ArgumentParser();p.add_argument("sheet",type=Path);p.add_argument("--output",type=Path,default=Path("references"));args=p.parse_args()
im=Image.open(args.sheet).convert("RGBA")
if im.size!=(1448,1086):raise ValueError(f"Expected original 1448×1086 setting sheet, got {im.size}")
args.output.mkdir(parents=True,exist_ok=True)
result={"source":args.sheet.name,"source_px":list(im.size),"notes":"Illustration reference, not an orthographic drawing.","views":{}}
for name,box in CROPS.items():
 crop=im.crop(box);crop.save(args.output/(name+".png"),optimize=True)
 result["views"][name]={"file":name+".png","crop_xyxy":list(box),"size_px":list(crop.size)}
(args.output/"manifest.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf8")
print("Created",len(CROPS),"reference images")
