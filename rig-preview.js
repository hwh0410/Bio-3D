import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const el=document.getElementById('rig-view'), status=document.getElementById('rig-status');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;el.append(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(33,1,.1,100);
camera.position.set(0,2.65,9.4);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,2.12,0);orbit.enableDamping=true;orbit.update();
scene.add(new THREE.HemisphereLight(0xffffff,0x8eb887,3));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,7,9);scene.add(light);
const mats={};
const color={green:0x7bc043,dark:0x2e6b3f,ink:0x12291e,face:0x394a41,helmet:0xffd42a,glow:0xb8ff66,white:0xffffff};
for(const k in color)mats[k]=new THREE.MeshStandardMaterial({color:color[k],roughness:.52,emissive:k==='glow'?color[k]:0,emissiveIntensity:k==='glow'?.22:0,side:THREE.DoubleSide});
const root=new THREE.Group();scene.add(root);
function round(name,xyz,dim,r,material,parent=root){
 const m=new THREE.Mesh(new RoundedBoxGeometry(dim[0],dim[1],dim[2],5,r),mats[material]);
 m.name=name;m.position.set(...xyz);parent.add(m);return m;
}
function ellipse(name,p,s,material,parent=root){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mats[material]);
 m.name=name;m.position.set(...p);m.scale.set(...s);parent.add(m);return m;
}
round('BodyShell',[0,1.99,0],[1.39,1.15,.85],.36,'green');
round('BodyBorder',[0,1.45,0],[1.2,.16,.78],.06,'dark');
round('HeadShell',[0,3.25,0],[2.04,1.33,1.03],.40,'green');
round('FaceBorder',[0,3.26,.532],[1.83,1.07,.075],.27,'ink');
round('FacePanel',[0,3.27,.58],[1.75,.97,.065],.24,'face');
for(const s of [-1,1]){
 ellipse('Eye',[s*.34,3.36,.633],[.105,.206,.029],'glow');
 ellipse('EarOutside',[s*1.03,3.22,0],[.14,.30,.29],'ink');
 ellipse('EarRim',[s*1.13,3.22,0],[.08,.24,.24],'green');
 ellipse('EarCentre',[s*1.19,3.22,0],[.035,.16,.16],'dark');
 const x=s*.42;
 round('Leg'+s,[x,.92,0],[.51,.85,.54],.19,'green');
 round('Boot'+s,[x,.31,.24],[.69,.44,.87],.16,'green');
}
ellipse('HelmetTop',[0,4.01,-.03],[1.07,.45,.70],'helmet');
round('HelmetBrim',[0,3.83,.18],[2.39,.15,1.44],.07,'helmet');
ellipse('HelmetLeaf',[0,4.12,.645],[.13,.17,.045],'dark');
ellipse('ChestGauge',[0,2.17,.467],[.23,.23,.04],'white');
ellipse('ChestGaugeFace',[0,2.17,.505],[.19,.19,.028],'dark');
ellipse('Mouth',[0,3.055,.643],[.13,.047,.027],'glow');
// Skinning prototype: each arm is a single deformable mesh and is influenced by
// an upper-arm bone and a forearm bone (gradient blend at elbow).
const armRigs=[];
function skinArm(side){
 const x=side*.84, top=2.34, length=.92, rings=18, sides=16;
 const upper=new THREE.Bone();upper.name=side<0?'upperArm.L':'upperArm.R';upper.position.set(x,top,0);
 const fore=new THREE.Bone();fore.name=side<0?'forearm.L':'forearm.R';fore.position.set(side*.09,-.48,0);
 const hand=new THREE.Bone();hand.name=side<0?'hand.L':'hand.R';hand.position.set(side*.03,-.40,0);
 upper.add(fore);fore.add(hand);root.add(upper);
 const vertices=[],indices=[],skinIndices=[],skinWeights=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,y=top-length*t, radius=(t>.78?.19:.235)*(1-.10*t);
  for(let j=0;j<=sides;j++){
   const a=j/sides*2*Math.PI;
   vertices.push(x+radius*Math.cos(a),y,radius*Math.sin(a));
   const mix=THREE.MathUtils.smoothstep(t,.40,.67);
   skinIndices.push(0,1,0,0);
   skinWeights.push(1-mix,mix,0,0);
   if(i<rings&&j<sides){const u=i*(sides+1)+j,v=u+sides+1;indices.push(u,v,u+1,v,v+1,u+1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
 g.setIndex(indices);g.computeVertexNormals();
 const mesh=new THREE.SkinnedMesh(g,mats.green);mesh.name=side<0?'ArmSkinL':'ArmSkinR';mesh.frustumCulled=false;
 root.add(mesh);root.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton([upper,fore,hand]);mesh.bind(skeleton);
 ellipse('ShoulderJoint',[x,top,0],[.26,.26,.27],'dark');
 const glove=round('Glove'+side,[0,-.06,.015],[.43,.43,.48],.16,'dark',hand);
 armRigs.push({side,upper,fore,hand,mesh,glove});
}
skinArm(-1);skinArm(1);
function pose(type){
 for(const {side,upper,fore,hand} of armRigs){
  upper.rotation.set(0,0,0);fore.rotation.set(0,0,0);hand.rotation.set(0,0,0);
  if(type==='welcome'&&side===1){upper.rotation.z=1.1;fore.rotation.z=.7;hand.rotation.z=-.25;}
  if(type==='inspect'){upper.rotation.z=side<0?-.38:.38;fore.rotation.z=side<0?-.6:.6;}
 }
 root.updateMatrixWorld(true);status.textContent='Bone-driven skinning · '+type;
}
document.querySelectorAll('[data-pose]').forEach(b=>b.addEventListener('click',()=>pose(b.dataset.pose)));
const angles={front:[0,2.65,9.4],three:[5.6,3.0,7.2],side:[9.4,2.65,0],back:[0,2.65,-9.4]};
document.getElementById('rig-angle').addEventListener('change',e=>{camera.position.set(...angles[e.target.value]);orbit.update();});
function resize(){const b=el.getBoundingClientRect();if(b.width===0||b.height===0)return;renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(el);resize();
function tick(){requestAnimationFrame(tick);orbit.update();renderer.render(scene,camera);}
tick();pose('formal');
document.getElementById('rig-export').addEventListener('click',async()=>{
 const b=new THREE.Vector2();renderer.getSize(b);const ratio=renderer.getPixelRatio(),aspect=camera.aspect;
 try{
  renderer.setPixelRatio(1);renderer.setSize(2048,2048,false);camera.aspect=1;camera.updateProjectionMatrix();renderer.render(scene,camera);
  const blob=await new Promise(r=>renderer.domElement.toBlob(r,'image/png'));
  if(!blob)throw Error('PNG export failed');
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Bio_RigLab_v1_transparent.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){status.textContent=e.message;}
 finally{renderer.setPixelRatio(ratio);renderer.setSize(b.x,b.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}
});
