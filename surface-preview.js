import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const area=document.querySelector('#surface-view'),status=document.querySelector('#surface-status');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
area.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,60);
camera.position.set(0,2.25,11);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,2.23,0);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=4;orbit.maxDistance=32;orbit.update();
scene.add(new THREE.HemisphereLight(0xffffff,0xbfcfbb,2.05));
// Fill the unlit underside and back: transparent PNG should not make green plastic appear black.
scene.add(new THREE.AmbientLight(0xffffff,.72));
const sun=new THREE.DirectionalLight(0xffffff,1.35);sun.position.set(-3,7,7);scene.add(sun);
const rim=new THREE.DirectionalLight(0xf0ffe8,1.12);rim.position.set(4,4,-6);scene.add(rim);
const colors={green:'#7BC043',light:'#B8FF66',shadow:'#2E6B3F',dark:'#2E6B3F',ink:'#12291E',screen:'#394A41',yellow:'#FFD42A',yellowlight:'#FFE27A',orange:'#FF9A3C',white:'#FCFFF6',led:'#B8FF66',red:'#E53935'};
const mats={};for(const [key,color] of Object.entries(colors)){
 mats[key]=new THREE.MeshStandardMaterial({color,roughness:key==='screen'?.63:.80,metalness:0,side:THREE.DoubleSide,emissive:key==='led'?color:0,emissiveIntensity:key==='led'?.10:0});
}
const toon=new THREE.Group();scene.add(toon);
const BIO_BUILD='v0.10.0 · armor-refine';
const COLOR_TEST_NAMES=/^(HeadOuter|HeadShell|BodyBase|BodyShell|ChestPlate|BackArmorPanel|BellyHighlight|ShoulderArmor|UpperArmArmor|ForearmArmor|ShinArmor|BootBorder|Boot|BootToe|Thigh|ArmSkin)/;
const originalMaterials=new Map();
let flatColorMode=false;
const flatGreen=new THREE.MeshBasicMaterial({color:'#7BC043',side:THREE.DoubleSide});
const flatLight=new THREE.MeshBasicMaterial({color:'#B8FF66',side:THREE.DoubleSide});
function setFlatColorMode(enabled){
 flatColorMode=enabled;
 toon.traverse(o=>{
  if(!o.isMesh||!COLOR_TEST_NAMES.test(o.name))return;
  if(!originalMaterials.has(o.uuid))originalMaterials.set(o.uuid,o.material);
  if(enabled)o.material=o.name.startsWith('BootToe')?flatLight:flatGreen;
  else o.material=originalMaterials.get(o.uuid);
 });
 document.querySelector('#diagnostic').textContent=enabled?'關閉無光照色票檢查':'啟用無光照色票檢查';
 status.textContent=BIO_BUILD+' · '+(enabled?'色票檢查：主體表面不受燈光影響':'一般材質顯示');
}
document.querySelector('#diagnostic').addEventListener('click',()=>setFlatColorMode(!flatColorMode));

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
 // Rounded safety helmet: smoother crown with subtle front fullness.
 const levels=32,around=96,verts=[],indices=[];
 for(let j=0;j<=levels;j++){
  const t=j/levels,v=t*Math.PI/2,ring=Math.cos(v),rise=Math.sin(v);
  for(let i=0;i<=around;i++){
   const a=i/around*Math.PI*2;
   const frontBias=1+.075*Math.max(0,Math.sin(a));
   const sideSoft=1-.045*Math.pow(Math.cos(a),2);
   const x=1.01*ring*Math.cos(a)*sideSoft;
   const z=-.02+.68*ring*Math.sin(a)*frontBias;
   verts.push(x,3.86+.60*rise,z);
  }
 }
 for(let j=0;j<levels;j++)for(let i=0;i<around;i++){
  const a=j*(around+1)+i,b=a+around+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(indices);g.computeVertexNormals();
 return mesh('HelmetShell',g,'yellow');
}

function visor(){
 // Thin curved brim with a smooth front sweep and green-black edge.
 const N=96,verts=[],ind=[];
 for(let layer=0;layer<2;layer++)for(let j=0;j<=1;j++)for(let i=0;i<=N;i++){
  const a=i/N*Math.PI*2,outer=j===1;
  const rx=outer?1.22:.98,rz=outer?.77:.56;
  const x=rx*Math.cos(a);
  const z=.18+.08*Math.max(0,Math.sin(a))+rz*Math.sin(a);
  const y=3.84+.02*Math.cos(a)+(layer?-.05:.01);
  verts.push(x,y,z);
 }
 const stride=N+1;
 for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++){
  const a=layer*2*stride+i,b=a+stride;
  ind.push(a,b,a+1,b,b+1,a+1);
 }
 for(let j=0;j<2;j++)for(let i=0;i<N;i++){
  const a=j*stride+i,b=2*stride+j*stride+i;
  ind.push(a,a+1,b,b,a+1,b+1);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(ind);g.computeVertexNormals();
 mesh('HelmetBrim',g,'yellow');
 pipe('HelmetBrimOuterTrim',Array.from({length:97},(_,i)=>{
  const a=i/96*Math.PI*2;
  return [1.22*Math.cos(a),3.85+.02*Math.cos(a),.18+.08*Math.max(0,Math.sin(a))+.77*Math.sin(a)];
 }),.018,'ink');
}

// Primary body must be visible on ALL views. An opaque larger dark shell
// previously occluded the green body almost completely.
superBody('BodyBase',[0,1.95,-.005],[.80,.66,.49],[.58,.70],'green');
superBody('BodyShell',[0,1.99,.055],[.73,.58,.44],[.67,.82],'green');
// A small lower connector creates a dark mechanical seam without covering the suit.
superBody('LowerTorso',[0,1.47,.03],[.56,.18,.36],[.84,.78],'shadow');
// A slim curved highlight, not an oversized dark panel over the green body.
// Chest cuirass floats shallowly above the bodysuit, without hiding the bright green shell.
// A fitted, shallow breastplate with no swollen pillow-like protrusion.
superBody('ChestPlate',[0,2.045,.445],[.548,.402,.037],[.63,.72],'green');
// Subtle segmented perimeter, inset into the cuirass rather than protruding.
pipe('ChestPlateEdge',[[ -.43,2.26,.466],[-.48,2.03,.471],[-.39,1.79,.473],[0,1.70,.477],[.39,1.79,.473],[.48,2.03,.471],[.43,2.26,.466]],.010,'shadow');
// Back access plate helps the shell read as wearable armor from rear views.
// Rear service hatch is almost flush and has a thin border, not a large bulge.
superBody('BackArmorPanel',[0,2.05,-.483],[.355,.245,.019],[.72,.73],'green');
superBody('BackArmorSeam',[0,2.05,-.505],[.305,.204,.010],[.78,.75],'shadow');
superBody('ChestEdge',[0,1.65,.425],[.43,.041,.037],[.76,.76],'shadow');
oval('Neck',[0,2.63,-.01],[.26,.14,.26],'shadow');
for(const s of [-1,1]){
 const x=s*.44;
 // A recessed dark hip connector belongs BELOW the green leg armor.
 oval('HipSocket'+s,[x,1.405,-.025],[.275,.14,.27],'shadow');
 superBody('Thigh'+s,[x,1.00,0],[.27,.43,.29],[.79,.73],'green');
 // Slim greave follows the leg, preserving a small dark ankle recess.
 superBody('ShinArmor'+s,[x,1.028,.253],[.222,.293,.037],[.72,.77],'green');
 pipe('ShinPlateRim'+s,[[x-.19,1.19,.265],[x-.19,.94,.273],[x-.14,.78,.272],[x+.14,.78,.272],[x+.19,.94,.273],[x+.19,1.19,.265]],.010,'shadow');
 oval('Knee'+s,[x,.83,.20],[.19,.09,.07],'shadow');
 oval('Ankle'+s,[x,.50,.04],[.22,.11,.22],'shadow');
 // Green boots with a subtle dark sole instead of fully black footwear.
 superBody('BootSole'+s,[x,.15,.23],[.38,.09,.47],[.64,.57],'shadow');
 // Dark boot entry is inset; a green cuff wraps over its edge.
 superBody('BootCuffDark'+s,[x,.513,.05],[.225,.076,.240],[.77,.76],'shadow');
 superBody('BootCuff'+s,[x,.473,.10],[.302,.089,.289],[.68,.73],'green');
 superBody('BootBorder'+s,[x,.295,.24],[.39,.22,.47],[.63,.58],'green');
 superBody('Boot'+s,[x,.325,.27],[.35,.21,.43],[.64,.60],'green');
 superBody('BootToe'+s,[x,.34,.56],[.27,.10,.13],[.62,.72],'light');
}
// Head and screen are one smooth silhouette with a recessed front-panel accent.
// Keep the actual head casing green at the front, sides AND back.
// The original ink-coloured outer superellipsoid swallowed the inner green shell.
superBody('HeadOuter',[0,3.20,-.02],[1.05,.76,.53],[.44,.52],'green');
superBody('HeadShell',[0,3.24,.03],[1.01,.72,.51],[.52,.58],'green');
superBody('ScreenRim',[0,3.245,.515],[.95,.515,.070],[.60,.56],'ink');
superBody('FacePanel',[0,3.26,.592],[.87,.455,.048],[.60,.57],'screen');
for(const s of [-1,1]){
 const x=s*1.045;
 const ear=mesh('EarDark'+s,new THREE.CylinderGeometry(.285,.285,.12,48),'shadow');
 ear.rotation.z=Math.PI/2;ear.position.set(x,3.2,-.005);
 const ring=mesh('EarRing'+s,new THREE.CylinderGeometry(.225,.225,.09,48),'green');
 ring.rotation.z=Math.PI/2;ring.position.set(x+s*.075,3.2,-.005);
 const center=mesh('EarCentre'+s,new THREE.CylinderGeometry(.160,.160,.055,48),'shadow');
 center.rotation.z=Math.PI/2;center.position.set(x+s*.132,3.2,-.005);
}
helmetDome();visor();
pipe('HelmetCenterSeam',[[0,3.88,.63],[0,4.11,.61],[0,4.31,.36],[0,4.43,-.01]],.018,'orange');
for(const s of [-1,1]){
 pipe('HelmetRib'+s,[[s*.55,3.88,.49],[s*.49,4.11,.42],[s*.31,4.33,.18]],.011,'orange');
}
oval('HelmetLogoBorder',[0,4.06,.665],[.18,.19,.022],'white');
const leaf=oval('HelmetLogo',[0,4.075,.688],[.115,.145,.014],'shadow');leaf.rotation.z=-.48;
pipe('HelmetLogoVein',[[-.05,4.02,.706],[.003,4.074,.708],[.058,4.125,.709]],.009,'white');
oval('HelmetShine',[-.48,4.17,.39],[.11,.045,.015],'white');
// Chest gauge: correct outward orientation, coloured arc and overlaid leaf.
const gauge=mesh('ChestGaugeWhite',new THREE.CylinderGeometry(.255,.255,.04,64),'white');
gauge.rotation.x=Math.PI/2;gauge.position.set(0,2.075,.588);
const faceGauge=mesh('GaugeDark',new THREE.CylinderGeometry(.201,.201,.045,64),'shadow');
faceGauge.rotation.x=Math.PI/2;faceGauge.position.set(0,2.075,.615);
const inner=mesh('GaugeWhite',new THREE.CylinderGeometry(.159,.159,.045,64),'white');
inner.rotation.x=Math.PI/2;inner.position.set(0,2.075,.643);
['green','green','yellow','orange','red'].forEach((c,i)=>{
 let a=Math.PI-(i+.5)*Math.PI/5;
 oval('GaugeMark'+i,[.126*Math.cos(a),2.075+.126*Math.sin(a),.679],[.031,.030,.014],c);
});
pipe('GaugeNeedle',[[0,2.075,.690],[.12,2.145,.690]],.012,'shadow');
oval('GaugeLeaf',[.135,1.945,.676],[.118,.080,.023],'green');
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
 // Armor follows bone rotations; skinned sleeve beneath still bends at the elbow.
 oval('ShoulderSocket'+side,[0,-.014,0],[.223,.225,.228],'shadow',upper);
 // Smaller cap follows the upper-arm bone, hiding the joint from above.
 superBody('ShoulderArmor'+side,[side*.033,.027,.045],[.259,.185,.258],[.62,.69],'green',upper);
 // Small lower lip creates a wearable seam between cap and sleeve.
 superBody('UpperArmArmor'+side,[side*.023,-.192,.043],[.211,.213,.214],[.67,.76],'green',upper);
 superBody('UpperArmCuff'+side,[side*.025,-.357,.045],[.218,.050,.218],[.72,.79],'shadow',upper);
 // Elbow joint remains smaller and recessed between overlapping plates.
 superBody('ElbowJoint'+side,[0,-.006,0],[.162,.089,.160],[.78,.76],'shadow',fore);
 superBody('ForearmArmor'+side,[side*.008,-.185,.048],[.214,.209,.218],[.65,.77],'green',fore);
 // Slim dark trim is partly covered by the glove rim.
 superBody('WristCuff'+side,[0,.046,.034],[.197,.061,.198],[.72,.77],'shadow',hand);
 superBody('Glove'+side,[0,-.076,.060],[.213,.190,.211],[.64,.65],'shadow',hand);
 superBody('GlovePalm'+side,[0,-.073,.247],[.156,.125,.029],[.78,.80],'shadow',hand);
 // Three shallow knuckle lobes make it read as a padded glove, not a cube.
 for(let i=-1;i<=1;i++){
  oval('GloveFinger'+side+'_'+i,[i*.117,-.186,.216],[.065,.070,.059],'shadow',hand);
 }
 oval('GloveThumb'+side,[side*-.182,-.061,.139],[.075,.104,.085],'shadow',hand);
 arms.push({side,upper,fore,hand});
}
arm(-1);arm(1);
function setPose(pose){
 for(const {side,upper,fore,hand} of arms){
  upper.rotation.z=0;fore.rotation.z=0;hand.rotation.z=0;
  if(pose==='welcome'&&side===1){upper.rotation.z=1.0;fore.rotation.z=.65;hand.rotation.z=-.20;}
 }
 document.querySelectorAll('[data-pose]').forEach(x=>x.classList.toggle('active',x.dataset.pose===pose));
 status.textContent=BIO_BUILD+' · '+(pose==='welcome'?'歡迎招手':'正式站姿')+' · 手臂蒙皮已啟用';
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
   oval('eye'+side,[x,3.36,.646],[.095,.190,.017],'led',faceGroup);
  }
 };
 eye(-1);eye(1);
 if(kind==='happy')oval('happyMouth',[0,3.066,.651],[.145,.079,.016],'led',faceGroup);
 else if(kind==='alert')oval('alertMouth',[0,3.052,.654],[.050,.074,.015],'led',faceGroup);
 else pipe('smile',[[-.13,3.08,.655],[-.06,3.05,.666],[0,3.04,.669],[.06,3.05,.666],[.13,3.08,.655]],.019,'led',faceGroup);
}
setExpression('smile');setPose('formal');
// Expose diagnostic information for a clear cached-script versus geometry distinction.
const diagnostics={
 version:BIO_BUILD,
 headShell:toon.getObjectByName('HeadOuter')?.material?.color?.getHexString(),
 bodyShell:toon.getObjectByName('BodyBase')?.material?.color?.getHexString(),
 skeletonBones:arms.reduce((n,a)=>n+3,0),
 mode:'surface-preview'
};
console.info('Bio model diagnostics',diagnostics);

document.querySelectorAll('[data-pose]').forEach(x=>x.addEventListener('click',()=>setPose(x.dataset.pose)));
document.querySelector('#expression').addEventListener('change',e=>setExpression(e.target.value));
// Responsive perspective fitting. Keeps the complete character visible in narrow mobile canvases.
const modelBounds={width:2.7,height:4.52,centerY:2.23};
let currentAngle='front';
let layoutAspect=0;
const viewDirections={
 front:[0,0,1],
 three:[Math.sin(Math.PI/4),.095,Math.cos(Math.PI/4)],
 side:[1,0,0],
 back:[0,0,-1]
};
function fitDistance(){
 const vertical=Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov)/2));
 const horizontal=Math.atan(Math.tan(vertical)*Math.max(.1,camera.aspect));
 const verticalFit=(modelBounds.height/2)/Math.tan(vertical);
 const horizontalFit=(modelBounds.width/2)/Math.tan(horizontal);
 return Math.max(verticalFit,horizontalFit)*1.22;
}
function applyViewPreset(name=currentAngle){
 currentAngle=name in viewDirections?name:'front';
 const direction=new THREE.Vector3(...viewDirections[currentAngle]).normalize();
 const distance=fitDistance();
 orbit.target.set(0,modelBounds.centerY,0);
 camera.position.copy(orbit.target).addScaledVector(direction,distance);
 camera.near=.1;camera.far=200;camera.updateProjectionMatrix();
 orbit.maxDistance=Math.max(32,distance*2.5);
 orbit.update();
}
document.querySelector('#angle').addEventListener('change',e=>applyViewPreset(e.target.value));
document.querySelector('#background-choice').addEventListener('change',e=>{document.querySelector('.surface-preview').className='surface-preview bg-'+e.target.value;});
document.querySelector('#recenter').addEventListener('click',()=>applyViewPreset(currentAngle));
function resize(){
 const b=area.getBoundingClientRect();
 if(!b.width||!b.height)return;
 renderer.setSize(b.width,b.height,false);
 const aspect=b.width/b.height;
 camera.aspect=aspect;camera.updateProjectionMatrix();
 // Don't erase user-controlled rotations when the mobile browser toolbar changes height.
 if(!layoutAspect||Math.abs(aspect-layoutAspect)>.12){
   layoutAspect=aspect;
   applyViewPreset(currentAngle);
 }
}
new ResizeObserver(resize).observe(area);
resize();
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
