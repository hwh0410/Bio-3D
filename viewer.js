import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
const target = new THREE.Vector3(0, 2.18, 0);
camera.position.set(0, 2.65, 9.0);
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

/* Bio v0.4 — reference-sheet silhouette: broad visor, softened rectangular head,
   short green torso, expressive gloves, large footwear, formal standing pose. */
function rounded(name,center,size,r,color,parent=root){
 const g=new RoundedBoxGeometry(size[0],size[2],size[1],5,Math.min(r,.45*Math.min(...size)));
 const m=new THREE.Mesh(g,mats[color]);m.position.copy(pos(...center));
 return add(m,name,parent);
}
function detailCurve(name,points,r,color,parent=root){return curve(name,points,r,color,parent);}
const poseGroups=[];let pose='formal';
for(const side of [-1,1]){
 const s=side<0?'left':'right',x=side*.43;
 oval(s+'_hip',[x,0,1.40],[.31,.32,.28],'ink');
 rounded(s+'_leg_black',[x,0,1.02],[.57,.57,.9],.23,'ink');
 rounded(s+'_leg',[x,-.025,1.025],[.50,.53,.79],.22,'lime');
 oval(s+'_knee_pad',[x,-.32,.88],[.24,.075,.15],'dark');
 oval(s+'_ankle',[x,-.055,.51],[.29,.29,.19],'dark');
 rounded(s+'_boot_rim',[x,-.25,.31],[.79,1.01,.51],.24,'ink');
 rounded(s+'_boot',[x,-.27,.35],[.71,.94,.43],.21,'lime');
 rounded(s+'_toe_plate',[x,-.63,.29],[.59,.21,.14],.065,'glow');
}
oval('body_dark',[0,0,1.96],[.78,.46,.68],'ink');
rounded('body_shell',[0,-.015,1.97],[1.42,.84,1.17],.40,'lime');
oval('belly_shine',[-.26,-.445,2.10],[.30,.025,.19],'glow');
oval('waist_dark',[0,0,1.47],[.61,.43,.18],'dark');
oval('collar_dark',[0,0,2.56],[.32,.32,.14],'ink');
oval('collar_lime',[0,0,2.60],[.25,.27,.11],'lime');

function drawHand(s,at,kind,parent){
 const [x,y,z]=at;
 // The palms are softly squared like the character sheet, not circular boxing gloves.
 rounded(s+'_glove_edge',[x,y,z],[.44,.42,.43],.16,'ink',parent);
 rounded(s+'_glove',[x,y-.025,z+.02],[.38,.38,.36],.145,'dark',parent);
 for(let i=0;i<3;i++){
   const fingerX=x+(i-1)*.105;
   oval(s+'_knuckle_'+i,[fingerX,y-.245,z+.005],[.067,.079,.097],'dark',parent);
 }
 oval(s+'_thumb',[x+(x>0?-.20:.20),y-.15,z+.06],[.115,.12,.14],'dark',parent);
 if(kind==='wave'){
  // Raised open hand facing viewer, visually readable from the default camera.
  rounded(s+'_palm',[x,y-.09,z+.09],[.43,.18,.40],.08,'dark',parent);
  for(let i=0;i<4;i++){
   let finger=x-.17+i*.115;
   rod(s+'_finger_'+i,[finger,y-.09,z+.20],[finger,y-.09,z+.43-(i===0||i===3?.065:0)],.056,'dark',parent);
  }
 }
}
function drawArms(mode){
 for(const g of poseGroups){root.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
 poseGroups.length=0;
 for(const side of [-1,1]){
  const s=side<0?'left':'right';const g=new THREE.Group();g.name=s+'_arm_pose';root.add(g);poseGroups.push(g);
  const isWaving=mode==='welcome' && side===1;
  const shoulder=[side*.79,-.025,2.26];
  const elbow=isWaving?[side*1.16,-.04,2.11]:[side*1.06,-.015,1.86];
  const wrist=isWaving?[side*1.48,-.10,2.54]:[side*1.09,-.16,1.57];
  oval(s+'_shoulder_outline',shoulder,[.305,.30,.28],'ink',g);
  oval(s+'_shoulder_color',[side*.81,-.044,2.28],[.255,.267,.235],'lime',g);
  rod(s+'_upper_outline',shoulder,elbow,.247,'ink',g);
  rod(s+'_upper',shoulder,elbow,.203,'lime',g);
  oval(s+'_elbow',[...elbow],[.26,.27,.24],'dark',g);
  rod(s+'_forearm_outline',elbow,wrist,.238,'ink',g);
  rod(s+'_forearm',elbow,wrist,.195,'lime',g);
  oval(s+'_cuff',wrist,[.246,.25,.13],'ink',g);
  const hand=isWaving?[side*1.48,-.12,2.75]:[side*1.10,-.20,1.46];
  drawHand(s,hand,isWaving?'wave':'relaxed',g);
 }
 pose=mode;
}
drawArms('formal');

// Rounded-square head: the most recognizable feature in the original reference.
rounded('head_ink',[0,-.02,3.21],[2.15,1.11,1.42],.48,'ink');
rounded('head_green',[0,-.045,3.22],[2.04,1.04,1.34],.45,'lime');
rounded('face_black',[0,-.603,3.225],[1.82,.16,1.075],.36,'ink');
rounded('face_screen',[0,-.702,3.235],[1.71,.12,.962],.33,'face');
for(const side of [-1,1]){
 const s=side<0?'left':'right';
 disk(s+'_ear_black',[side*1.075,-.05,3.20],.29,.155,'ink','x');
 disk(s+'_ear_ring',[side*1.175,-.05,3.20],.224,.072,'lime','x');
 disk(s+'_ear_disc',[side*1.216,-.05,3.20],.165,.050,'dark','x');
}
// Three-dimensional yellow shell and broad front brim.
oval('helmet_dark',[0,-.035,3.96],[1.105,.72,.47],'ink');
oval('helmet_yellow',[0,-.052,3.997],[1.065,.678,.437],'yellow');
rounded('helmet_front_brim_dark',[0,-.34,3.81],[2.42,1.37,.22],.11,'ink');
rounded('helmet_front_brim',[0,-.35,3.837],[2.34,1.30,.145],.07,'yellow');
curve('helmet_centre_rib',[[0,-.703,3.96],[0,-.64,4.18],[0,-.40,4.36]],.028,'orange');
curve('helmet_side_rib_left',[[-.53,-.55,3.95],[-.49,-.46,4.18],[-.29,-.30,4.29]],.019,'orange');
curve('helmet_side_rib_right',[[.53,-.55,3.95],[.49,-.46,4.18],[.29,-.30,4.29]],.019,'orange');
// Leaf mark and small highlights.
oval('helmet_leaf_back',[0,-.727,4.115],[.193,.026,.20],'white');
oval('helmet_leaf_center',[0,-.756,4.125],[.135,.020,.145],'dark');
curve('helmet_leaf_stem',[[-.082,-.781,4.042],[-.01,-.785,4.102],[.073,-.78,4.18]],.015,'white');
oval('helmet_shine_left',[-.66,-.62,4.14],[.145,.025,.07],'white');

// Face is a separate detachable group; chest gauge is rebuilt on a flat frontal plane.
disk('gauge_outer',[0,-.485,2.14],.260,.050,'white','z');
disk('gauge_dark',[0,-.526,2.14],.219,.035,'dark','z');
disk('gauge_inner',[0,-.555,2.14],.179,.022,'white','z');
['lime','lime','yellow','orange','red'].forEach((c,i)=>{
 const theta=Math.PI-(i+.5)*Math.PI/5;
 oval('gauge_segment_'+i,[.144*Math.cos(theta),-.584,2.14+.144*Math.sin(theta)],[.031,.020,.033],c);
});
rod('gauge_hand',[0,-.60,2.14],[.118,-.60,2.205],.014,'dark');
oval('gauge_leaf',[.134,-.611,2.015],[.112,.026,.073],'lime');
curve('gauge_leaf_stem',[[.065,-.648,1.974],[.145,-.647,2.035]],.012,'white');


let faceGroup=null;
function face(kind){
 if(faceGroup){root.remove(faceGroup);faceGroup.traverse(o=>{if(o.geometry)o.geometry.dispose()});}
 faceGroup=new THREE.Group();faceGroup.name='expressions';root.add(faceGroup);
 const eye=(side,type='normal')=>{
  const x=side*.345;
  if(type==='happy'){
   curve('eye_arc_'+side,[[x-.115,-.793,3.36],[x,-.805,3.475],[x+.115,-.793,3.36]],.035,'glow',faceGroup);
  }else if(type==='angry'){
   const raise=side<0?-.085:.085;
   curve('eye_frown_'+side,[[x-.12,-.795,3.39+raise],[x+.12,-.795,3.39-raise]],.039,'glow',faceGroup);
   oval('eye_pupil_'+side,[x,-.802,3.30],[.055,.027,.104],'glow',faceGroup);
  }else{
   oval('eye_'+side,[x,-.803,3.345],[.105,.031,.212],'glow',faceGroup);
  }
 };
 if(kind==='happy'){
  eye(-1,'happy');eye(1,'happy');oval('happy_mouth',[0,-.813,3.08],[.158,.027,.103],'glow',faceGroup);
 }else if(kind==='focus'||kind==='stop'){
  eye(-1,'angry');eye(1,'angry');
  rod('focused_mouth',[-.10,-.805,3.09],[.10,-.805,3.09],.021,'glow',faceGroup);
 }else if(kind==='think'){
  eye(-1);eye(1);curve('thinking_mouth',[[-.04,-.808,3.075],[.085,-.808,3.11]],.021,'glow',faceGroup);
 }else if(kind==='alert'){
  eye(-1);eye(1);oval('alert_mouth',[0,-.816,3.075],[.057,.024,.081],'glow',faceGroup);
 }else{
  eye(-1);eye(1);curve('smile',Array.from({length:13},(_,i)=>{const x=-.16+i*.026667;return [x,-.81,3.085+1.8*x*x]}),.024,'glow',faceGroup);
 }
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
 front:[0,2.65,9.0],three:[5.7,3.08,7.05],side:[9.0,2.65,0],back:[0,2.65,-9.0]
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
document.getElementById('pose').addEventListener('change',e=>drawArms(e.target.value));
document.getElementById('zoom').addEventListener('input',e=>{
 const v=+e.target.value; document.getElementById('zoom-read').textContent=v+'%';
 const direction=new THREE.Vector3().subVectors(camera.position,controls.target).normalize();
 camera.position.copy(controls.target).addScaledVector(direction,9.0*100/v);controls.update();
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
  a.download='Bio_'+document.getElementById('expression').value+'_'+pose+'_transparent_'+n+'px.png';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='透明背景 PNG 已產生，可在下載資料夾查看。';
 }catch(err){status.textContent='圖片輸出失敗：'+err.message;console.error(err);}
 finally{
  renderer.setPixelRatio(oldPixelRatio);renderer.setSize(oldSize.x,oldSize.y,false);
  camera.aspect=oldAspect;camera.updateProjectionMatrix();
  download.disabled=false;download.textContent='↓ 下載透明背景 PNG';
 }
});
status.textContent='Bio v0.4 正式站姿已載入 · 可切換動作、旋轉與透明截圖';
