import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const area=document.querySelector('#surface-view'),status=document.querySelector('#surface-status');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
area.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,60);
camera.position.set(0,2.52,9.0);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,2.17,0);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=4.5;orbit.maxDistance=15;orbit.update();
scene.add(new THREE.HemisphereLight(0xffffff,0x9db5a4,2.1));
const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-3,7,7);scene.add(sun);
const rim=new THREE.DirectionalLight(0xccffb9,1.2);rim.position.set(4,3,-5);scene.add(rim);
const colors={green:'#7BC043',light:'#A1DD58',shadow:'#2E6B3F',dark:'#183F29',ink:'#15261C',screen:'#394A41',yellow:'#FFD42A',yellowlight:'#FFE879',orange:'#FF9A3C',white:'#FCFFF6',led:'#B8FF66',red:'#E53935'};
const mats={};for(const [key,color] of Object.entries(colors)){
 mats[key]=new THREE.MeshStandardMaterial({color,roughness:key==='screen'?.5:.73,metalness:0,side:THREE.DoubleSide,emissive:key==='led'?color:0,emissiveIntensity:key==='led'?.18:0});
}
const toon=new THREE.Group();scene.add(toon);
function mesh(name,geometry,color,parent=toon,p=[0,0,0]){
 const o=new THREE.Mesh(geometry,mats[color]);o.name=name;o.position.set(...p);parent.add(o);return o;
}
function round(name,p,size,r,color,parent=toon){
 return mesh(name,new RoundedBoxGeometry(...size,6,r),color,parent,p);
}
function oval(name,p,size,color,parent=toon){
 const g=new THREE.SphereGeometry(1,48,32);g.scale(...size);return mesh(name,g,color,parent,p);
}
function capsule(name,p,r,length,color,parent=toon){
 return mesh(name,new THREE.CapsuleGeometry(r,length,10,20),color,parent,p);
}
// A continuous superellipsoid, unlike stacking 3D spheres. Exponents below 1
// flatten the faces and create a smooth cartoon-friendly rounded rectangle.
function signedPow(n,e){return Math.sign(n)*Math.pow(Math.abs(n),e);}
function superBody(name,p,size,shape,color,parent=toon){
 const g=new THREE.SphereGeometry(1,72,44),v=g.attributes.position;
 for(let i=0;i<v.count;i++){
  const x=v.getX(i),y=v.getY(i),z=v.getZ(i);
  const lat=Math.asin(THREE.MathUtils.clamp(y,-1,1)),lon=Math.atan2(z,x);
  const cl=signedPow(Math.cos(lat),shape[1]);
  v.setXYZ(i,size[0]*cl*signedPow(Math.cos(lon),shape[0]),size[1]*signedPow(Math.sin(lat),shape[1]),size[2]*cl*signedPow(Math.sin(lon),shape[0]));
 }
 v.needsUpdate=true;g.computeVertexNormals();return mesh(name,g,color,parent,p);
}
function pipe(name,points,r,color,parent=toon){
 const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return mesh(name,new THREE.TubeGeometry(c,Math.max(28,points.length*7),r,9,false),color,parent);
}
function tapered(name,p1,p2,r1,r2,color,parent=toon){
 const a=new THREE.Vector3(...p1),b=new THREE.Vector3(...p2),delta=b.clone().sub(a);
 const o=mesh(name,new THREE.CylinderGeometry(r2,r1,delta.length(),32),color,parent);
 o.position.copy(a).add(b).multiplyScalar(.5);
 o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;
}
function helmetDome(){
 // Horizontal elliptical rings; explicit front/back, not a flattened sphere.
 const levels=24,around=80,verts=[],indices=[];
 for(let j=0;j<=levels;j++){
  const t=j/levels,angle=t*Math.PI/2;
  const rad=Math.cos(angle),h=Math.sin(angle);
  for(let i=0;i<=around;i++){
   const a=i/around*Math.PI*2;
   const r=rad*.985+(.015*(1-t));
   verts.push(r*Math.cos(a),3.86+.57*h,-.025+r*.67*Math.sin(a));
  }
 }
 for(let j=0;j<levels;j++)for(let i=0;i<around;i++){
  const a=j*(around+1)+i,b=a+around+1;indices.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return mesh('HelmetShell',g,'yellow');
}
function visor(){
 // Elliptical, shallowly swept double-sided brim with a slightly raised back.
 const N=96,verts=[],ind=[];
 for(let layer=0;layer<2;layer++)for(let j=0;j<=1;j++)for(let i=0;i<=N;i++){
  let a=i/N*Math.PI*2;
  let rx=j?1.19:.93,rz=j?.84:.56;
  let x=rx*Math.cos(a),z=.13+rz*Math.sin(a);
  let y=3.825+(layer?-.102:.025)+.025*Math.cos(a);
  verts.push(x,y,z);
 }
 const stride=N+1;
 for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++){
  let a=layer*2*stride+i,b=a+stride;ind.push(a,b,a+1,b,b+1,a+1);
 }
 for(let j=0;j<2;j++)for(let i=0;i<N;i++){
  let a=j*stride+i,b=2*stride+j*stride+i;
  ind.push(a,a+1,b,b,a+1,b+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ind);g.computeVertexNormals();mesh('HelmetBrim',g,'yellow');
 pipe('HelmetBrimOuterTrim',Array.from({length:49},(_,i)=>{
  let a=i/48*Math.PI*2;return [1.19*Math.cos(a),3.85+.025*Math.cos(a),.13+.84*Math.sin(a)];
 }),.029,'ink');
}
superBody('BodyDark',[0,1.96,-.01],[.79,.65,.46],[.63,.75],'dark');
superBody('BodyShell',[0,1.98,.018],[.74,.595,.455],[.65,.77],'green');
superBody('LowerTorso',[0,1.49,.005],[.56,.20,.39],[.75,.7],'shadow');
oval('Neck',[0,2.63,-.025],[.28,.15,.28],'dark');
for(const s of [-1,1]){
 const x=s*.44;
 superBody('Thigh'+s,[x,1.01,-.02],[.27,.43,.29],[.78,.72],'green');
 oval('Knee'+s,[x,.84,.225],[.22,.12,.088],'shadow');
 oval('Ankle'+s,[x,.50,.05],[.255,.14,.26],'dark');
 superBody('BootBorder'+s,[x,.285,.235],[.407,.28,.50],[.58,.52],'ink');
 superBody('Boot'+s,[x,.307,.25],[.36,.245,.455],[.59,.55],'green');
 round('BootHighlight'+s,[x,.34,.658],[.52,.12,.045],.035,'light');
}
// Head and screen are one smooth silhouette with a recessed front-panel accent.
superBody('HeadOuter',[0,3.20,-.04],[1.09,.755,.57],[.50,.55],'ink');
superBody('HeadShell',[0,3.22,-.023],[1.035,.713,.548],[.55,.58],'green');
superBody('ScreenRim',[0,3.24,.51],[.868,.545,.084],[.50,.49],'ink');
superBody('FacePanel',[0,3.255,.581],[.803,.480,.055],[.49,.48],'screen');
for(const s of [-1,1]){
 const x=s*1.045;
 const ear=mesh('EarDark'+s,new THREE.CylinderGeometry(.292,.292,.13,48),'ink');
 ear.rotation.z=Math.PI/2;ear.position.set(x,3.2,-.005);
 const ring=mesh('EarRing'+s,new THREE.CylinderGeometry(.235,.235,.095,48),'green');
 ring.rotation.z=Math.PI/2;ring.position.set(x+s*.075,3.2,-.005);
 const center=mesh('EarCentre'+s,new THREE.CylinderGeometry(.169,.169,.06,48),'shadow');
 center.rotation.z=Math.PI/2;center.position.set(x+s*.132,3.2,-.005);
}
helmetDome();visor();
pipe('HelmetCenterSeam',[[0,3.87,.635],[0,4.10,.63],[0,4.31,.38],[0,4.44,-.02]],.020,'orange');
for(const s of [-1,1]){
 pipe('HelmetRib'+s,[[s*.58,3.86,.52],[s*.53,4.12,.45],[s*.33,4.35,.21]],.013,'orange');
}
oval('HelmetLogoBorder',[0,4.055,.678],[.19,.203,.023],'white');
const leaf=oval('HelmetLogo',[0,4.073,.702],[.132,.157,.015],'shadow');leaf.rotation.z=-.46;
pipe('HelmetLogoVein',[[-.055,4.014,.724],[.006,4.07,.725],[.065,4.13,.725]],.011,'white');
oval('HelmetShine',[-.54,4.18,.41],[.125,.055,.017],'white');
// Chest gauge: correct outward orientation, coloured arc and overlaid leaf.
const gauge=mesh('ChestGaugeWhite',new THREE.CylinderGeometry(.255,.255,.04,64),'white');
gauge.rotation.x=Math.PI/2;gauge.position.set(0,2.075,.475);
const faceGauge=mesh('GaugeDark',new THREE.CylinderGeometry(.201,.201,.045,64),'shadow');
faceGauge.rotation.x=Math.PI/2;faceGauge.position.set(0,2.075,.501);
const inner=mesh('GaugeWhite',new THREE.CylinderGeometry(.159,.159,.045,64),'white');
inner.rotation.x=Math.PI/2;inner.position.set(0,2.075,.529);
['green','green','yellow','orange','red'].forEach((c,i)=>{
 let a=Math.PI-(i+.5)*Math.PI/5;
 oval('GaugeMark'+i,[.126*Math.cos(a),2.075+.126*Math.sin(a),.565],[.031,.030,.014],c);
});
pipe('GaugeNeedle',[[0,2.075,.576],[.12,2.145,.576]],.012,'shadow');
oval('GaugeLeaf',[.135,1.945,.562],[.118,.080,.023],'green');
// Editable bone-driven arms: tube mesh has actual bone indices and smooth elbow weights.
const arms=[];
function arm(side){
 const x=side*.78, shoulderY=2.29, radius=.245,rings=28,segments=20;
 const upper=new THREE.Bone();upper.name=side<0?'upperArm.L':'upperArm.R';upper.position.set(x,shoulderY,0);
 const fore=new THREE.Bone();fore.name=side<0?'forearm.L':'forearm.R';fore.position.set(side*.12,-.43,0);
 const hand=new THREE.Bone();hand.name=side<0?'hand.L':'hand.R';hand.position.set(side*.045,-.42,.06);
 upper.add(fore);fore.add(hand);toon.add(upper);
 const p=[],ind=[],ids=[],weights=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,y=shoulderY-t*.87;
  const rr=radius*(1-.13*t);
  for(let j=0;j<=segments;j++){
   const theta=j/segments*Math.PI*2;
   p.push(x+rr*Math.cos(theta)+side*.11*t,y,rr*.91*Math.sin(theta));
   const w=THREE.MathUtils.smoothstep(t,.37,.69);
   ids.push(0,1,0,0);weights.push(1-w,w,0,0);
   if(i<rings&&j<segments){
    const a=i*(segments+1)+j,b=a+segments+1;ind.push(a,b,a+1,b,b+1,a+1);
   }
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(ind);geo.computeVertexNormals();
 const skin=new THREE.SkinnedMesh(geo,mats.green);skin.name='ArmSkin'+(side<0?'L':'R');skin.frustumCulled=false;
 toon.add(skin);toon.updateMatrixWorld(true);skin.bind(new THREE.Skeleton([upper,fore,hand]));
 oval('ShoulderJoint'+side,[x,shoulderY,0],[.26,.26,.27],'shadow');
 superBody('Glove'+side,[0,-.065,.04],[.24,.235,.25],[.63,.63],'shadow',hand);
 arms.push({side,upper,fore,hand});
}
arm(-1);arm(1);
function setPose(pose){
 for(const {side,upper,fore,hand} of arms){
  upper.rotation.z=0;fore.rotation.z=0;hand.rotation.z=0;
  if(pose==='welcome'&&side===1){upper.rotation.z=1.0;fore.rotation.z=.65;hand.rotation.z=-.20;}
 }
 document.querySelectorAll('[data-pose]').forEach(x=>x.classList.toggle('active',x.dataset.pose===pose));
 status.textContent='曲面母版 Beta · '+(pose==='welcome'?'歡迎招手':'正式站姿')+' · 手臂蒙皮已啟用';
}
const faceGroup=new THREE.Group();toon.add(faceGroup);
function setExpression(kind){
 while(faceGroup.children.length){
  const o=faceGroup.children[0];faceGroup.remove(o);o.geometry?.dispose();
 }
 const eye=(side)=>{
  const x=side*.335;
  if(kind==='happy'){
   pipe('eyeArc'+side,[[x-.11,3.32,.645],[x,3.45,.647],[x+.11,3.32,.645]],.033,'led',faceGroup);
  }else{
   oval('eye'+side,[x,3.35,.646],[.103,.194,.018],'led',faceGroup);
  }
 };
 eye(-1);eye(1);
 if(kind==='happy')oval('happyMouth',[0,3.066,.651],[.145,.079,.016],'led',faceGroup);
 else if(kind==='alert')oval('alertMouth',[0,3.052,.654],[.050,.074,.015],'led',faceGroup);
 else pipe('smile',[[-.14,3.08,.655],[-.07,3.045,.666],[0,3.035,.669],[.07,3.045,.666],[.14,3.08,.655]],.022,'led',faceGroup);
}
setExpression('smile');setPose('formal');
document.querySelectorAll('[data-pose]').forEach(x=>x.addEventListener('click',()=>setPose(x.dataset.pose)));
document.querySelector('#expression').addEventListener('change',e=>setExpression(e.target.value));
const angles={front:[0,2.52,9],three:[5.4,3.15,7.3],side:[9,2.52,0],back:[0,2.52,-9]};
document.querySelector('#angle').addEventListener('change',e=>{camera.position.set(...angles[e.target.value]);orbit.update()});
function resize(){const b=area.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(area);resize();
function render(){requestAnimationFrame(render);orbit.update();renderer.render(scene,camera);}render();
document.querySelector('#download').addEventListener('click',async()=>{
 const n=Number(document.querySelector('#resolution').value),size=new THREE.Vector2();renderer.getSize(size);
 const ratio=renderer.getPixelRatio(),aspect=camera.aspect;
 try{
 renderer.setPixelRatio(1);renderer.setSize(n,n,false);camera.aspect=1;camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
 if(!blob)throw new Error('截圖失敗');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bio_Surface_Beta_transparent_'+n+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }catch(e){status.textContent='PNG 匯出失敗：'+e.message;}
 finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}
});
