import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const view = document.getElementById('viewer');
const area = document.getElementById('canvas-area');
const status = document.getElementById('status');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.65;
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
const target = new THREE.Vector3(0, 2.15, 0);
camera.position.set(0, 2.6, 9.9);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(target);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.enablePan = false;
controls.minDistance = 4.5;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * .9;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0xb7d0a7, 3.3));
const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-4,8,7); scene.add(key);
const fill = new THREE.DirectionalLight(0xb1ffcc, 1.6); fill.position.set(6,3,-4); scene.add(fill);

const palette = { lime:0x7bc043, glow:0xb8ff66, dark:0x2e6b3f, ink:0x13291d, face:0x394a41, yellow:0xffd42a, orange:0xff9a3c, red:0xe53935, white:0xfafff0 };
const mats = {};
for (const [k,hex] of Object.entries(palette)) mats[k] = new THREE.MeshStandardMaterial({color:hex, roughness:k==='face'?.28:.4, metalness:k==='face'?.22:.02, emissive:k==='glow'?hex:0, emissiveIntensity:k==='glow'?.35:0});
const root = new THREE.Group(); scene.add(root);
function pos(x,y,z) { return new THREE.Vector3(x,z,-y); } // source asset: +Z up, -Y front
function add(mesh,name,parent=root){mesh.name=name;parent.add(mesh);return mesh;}
function oval(name,center,radii,color,parent=root){
  const m = new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mats[color]);
  m.position.copy(pos(...center)); m.scale.set(radii[0],radii[2],radii[1]);return add(m,name,parent);
}
function disk(name,center,radius,depth,color,axis='z',parent=root){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,48),mats[color]);
  if(axis==='z') m.rotation.x = Math.PI/2;
  if(axis==='x') m.rotation.z = Math.PI/2;
  m.position.copy(pos(...center));return add(m,name,parent);
}
function rod(name,a,b,r,color,parent=root){
  const A=pos(...a), B=pos(...b),d=new THREE.Vector3().subVectors(B,A);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),16),mats[color]);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  m.position.copy(A).add(B).multiplyScalar(.5);return add(m,name,parent);
}
function curve(name,pts,r,color,parent=root){
 const path = new THREE.CatmullRomCurve3(pts.map(p=>pos(...p)));
 return add(new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(12,pts.length*4),r,8,false),mats[color]),name,parent);
}
for(const side of [-1,1]){
 const s=side<0?'left':'right',x=side*.42;
 oval(s+'_leg_black',[x,0,1],[.31,.31,.60],'ink');
 oval(s+'_leg',[x,-.02,1],[.275,.28,.54],'lime');
 oval(s+'_ankle',[x,-.06,.49],[.29,.30,.20],'dark');
 oval(s+'_boot_outline',[x,-.2,.31],[.39,.50,.30],'ink');
 oval(s+'_boot',[x,-.23,.34],[.355,.45,.245],'lime');
 oval(s+'_toe',[x,-.48,.29],[.32,.22,.15],'glow');
}
oval('torso_outline',[0,0,1.95],[.81,.47,.78],'ink');
oval('torso',[0,-.025,1.98],[.755,.435,.73],'lime');
oval('waist',[0,0,1.43],[.59,.43,.17],'dark');
oval('neck',[0,0,2.62],[.29,.31,.2],'dark');
for(const side of [-1,1]){
 const s=side<0?'left':'right';
 oval(s+'_shoulder_outline',[side*.78,0,2.30],[.29,.32,.29],'ink');
 oval(s+'_shoulder',[side*.80,-.02,2.32],[.235,.29,.23],'lime');
 const a=[side*.88,0,2.2],b=[side*1.05,-.025,1.79];
 rod(s+'_upper_black',a,b,.245,'ink');rod(s+'_upper',a,b,.215,'lime');
 oval(s+'_elbow',[side*1.05,-.025,1.78],[.24,.24,.23],'dark');
 rod(s+'_forearm',[side*1.06,-.035,1.75],[side*1.09,-.13,1.44],.22,'lime');
 oval(s+'_glove_outline',[side*1.09,-.13,1.34],[.25,.25,.23],'ink');
 oval(s+'_glove',[side*1.09,-.18,1.36],[.21,.20,.205],'dark');
}
oval('head_outline',[0,-.01,3.21],[1.02,.53,.75],'ink');
oval('head_shell',[0,-.035,3.2],[.965,.50,.705],'lime');
oval('screen_border',[0,-.463,3.22],[.805,.155,.545],'ink');
oval('screen',[0,-.548,3.24],[.75,.11,.49],'face');
for(const side of [-1,1]){
 const s=side<0?'left':'right';
 disk(s+'_ear_rim',[side*.965,-.05,3.2],.28,.15,'ink','x');
 disk(s+'_ear',[side*1.045,-.05,3.2],.215,.07,'lime','x');
 disk(s+'_ear_center',[side*1.085,-.05,3.2],.156,.045,'dark','x');
}
oval('helmet_outline',[0,-.005,3.91],[1.055,.66,.49],'ink');
oval('helmet_crown',[0,-.018,3.94],[1.012,.625,.44],'yellow');
oval('helmet_brim_outline',[0,-.27,3.78],[1.18,.76,.17],'ink');
oval('helmet_brim',[0,-.29,3.82],[1.14,.73,.115],'yellow');
curve('helmet_ridge',[[0,-.59,3.91],[0,-.52,4.18],[0,-.25,4.35]],.024,'orange');
oval('helmet_leaf_white',[0,-.635,4.115],[.175,.045,.205],'white');
oval('helmet_leaf_green',[0,-.674,4.126],[.125,.04,.158],'dark');
curve('helmet_leaf_vein',[[-.06,-.724,4.04],[0,-.724,4.10],[.07,-.716,4.19]],.014,'white');
disk('chest_gauge_white',[0,-.458,2.13],.247,.034,'white','y');
disk('chest_gauge_rim',[0,-.479,2.13],.201,.035,'dark','y');
disk('chest_gauge_face',[0,-.501,2.13],.168,.024,'white','y');
['lime','lime','yellow','orange','red'].forEach((c,i)=>{ const t=Math.PI-(i+.5)*Math.PI/5;oval('marker_'+i,[.137*Math.cos(t),-.523,2.13+.137*Math.sin(t)],[.04,.016,.04],c);});
rod('gauge_needle',[0,-.539,2.13],[.112,-.539,2.205],.016,'dark');
oval('chest_leaf',[.13,-.553,2],[.112,.022,.075],'lime');
curve('chest_leaf_vein',[[.06,-.58,1.96],[.15,-.581,2.03]],.012,'white');

let faceGroup=null;
function face(kind){
 if(faceGroup){root.remove(faceGroup);faceGroup.traverse(o=>{if(o.geometry)o.geometry.dispose()});}
 faceGroup=new THREE.Group(); faceGroup.name='expressions';root.add(faceGroup);
 const eye=(side,shape='normal')=>{
   const x=side*.33;
   if(shape==='happy')curve('eye',[[x-.11,-.67,3.35],[x,-.695,3.47],[x+.11,-.67,3.35]],.035,'glow',faceGroup);
   else if(shape==='angry')curve('eye',[[x-.13,-.68,3.49-(side<0?0:.11)],[x+.13,-.68,3.49-(side<0?.11:0)]],.038,'glow',faceGroup);
   else oval('eye',[x,-.663,3.34],[.105,.036,.203],'glow',faceGroup);
 };
 if(kind==='happy'){eye(-1,'happy');eye(1,'happy');oval('mouth',[0,-.686,3.08],[.16,.03,.11],'glow',faceGroup);}
 else if(kind==='focus'||kind==='stop'){eye(-1,'angry');eye(1,'angry');rod('mouth',[-.12,-.68,3.08],[.12,-.68,3.08],.025,'glow',faceGroup);}
 else if(kind==='think'){eye(-1);eye(1);rod('mouth',[-.04,-.684,3.06],[.1,-.684,3.12],.026,'glow',faceGroup);}
 else if(kind==='alert'){eye(-1);eye(1);oval('mouth',[0,-.693,3.055],[.065,.024,.09],'glow',faceGroup);}
 else {eye(-1);eye(1);curve('smile',Array.from({length:11},(_,i)=>{let x=-.17+i*.034;return [x,-.678,3.085+1.6*x*x]}),.024,'glow',faceGroup);}
}
face('smile');

function resize(){
 const r=view.getBoundingClientRect();if(!r.width||!r.height)return;
 renderer.setSize(r.width,r.height,false);
 camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
animate();
const angles={
 front:[0,2.6,9.9],three:[6.1,3.0,7.7],side:[9.9,2.6,0],back:[0,2.6,-9.9]
};
function setView(name){
 const xyz=angles[name];camera.position.set(...xyz);controls.target.copy(target);controls.update();
 document.querySelectorAll('.viewbtn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
 const labels={front:'正面視角',three:'3/4 視角',side:'側面視角',back:'背面視角'};
 document.getElementById('angle-label').textContent=labels[name];
 const zoom=document.getElementById('zoom');zoom.value='100';document.getElementById('zoom-read').textContent='100%';
}
document.querySelectorAll('.viewbtn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('reset').addEventListener('click',()=>setView('front'));
document.getElementById('backdrop').addEventListener('change',e=>{area.className='canvas-area '+e.target.value});
document.getElementById('expression').addEventListener('change',e=>face(e.target.value));
document.getElementById('zoom').addEventListener('input',e=>{
 const v=+e.target.value; document.getElementById('zoom-read').textContent=v+'%';
 const direction=new THREE.Vector3().subVectors(camera.position,controls.target).normalize();
 camera.position.copy(controls.target).addScaledVector(direction,9.9*100/v);controls.update();
});
const download=document.getElementById('download');
download.addEventListener('click',async()=>{
 const n=Number(document.getElementById('resolution').value);
 download.disabled=true;download.textContent='正在產生透明 PNG…';
 const oldSize=new THREE.Vector2();renderer.getSize(oldSize);
 const oldPixelRatio=renderer.getPixelRatio(),oldAspect=camera.aspect;
 try{
  renderer.setPixelRatio(1);renderer.setSize(n,n,false);
  camera.aspect=1;camera.updateProjectionMatrix();
  renderer.setClearColor(0x000000,0);
  renderer.render(scene,camera);
  const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
  if(!blob)throw Error('PNG 截圖失敗');
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='Bio_'+document.getElementById('expression').value+'_transparent_'+n+'px.png';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='透明背景 PNG 已產生，可在下載資料夾查看。';
 }catch(err){status.textContent='圖片輸出失敗：'+err.message;console.error(err);}
 finally{
  renderer.setPixelRatio(oldPixelRatio);renderer.setSize(oldSize.x,oldSize.y,false);
  camera.aspect=oldAspect;camera.updateProjectionMatrix();
  download.disabled=false;download.textContent='↓ 下載透明背景 PNG';
 }
});
status.textContent='Bio 程序化 3D 模型載入完成 · 可自由旋轉與截圖';
