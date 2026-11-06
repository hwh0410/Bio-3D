import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const view=document.getElementById('master-view'),status=document.getElementById('master-status');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;view.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,1000);
scene.add(new THREE.HemisphereLight(0xffffff,0x93ac8c,2.0));
const key=new THREE.DirectionalLight(0xffffff,2.1);key.position.set(-4,8,8);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(4,4,-6);scene.add(fill);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.enablePan=false;
let object=null, center=new THREE.Vector3(),radius=2.4,angle='front',localURL=null;
function distanceForFit(){
 const fov=THREE.MathUtils.degToRad(camera.fov);
 const vertical=radius/Math.tan(fov/2);
 const horizontal=radius/(Math.tan(fov/2)*Math.max(camera.aspect,.15));
 return Math.max(vertical,horizontal)*1.35;
}
const directions={front:[0,.05,1],three:[.707,.12,.707],side:[1,.05,0],back:[0,.05,-1]};
function setView(next=angle){
 angle=next;const direction=new THREE.Vector3(...directions[angle]).normalize(),d=distanceForFit();
 orbit.target.copy(center);camera.position.copy(center).addScaledVector(direction,d);
 camera.near=Math.max(.001,d/1000);camera.far=Math.max(100,d*10);
 camera.updateProjectionMatrix();orbit.maxDistance=Math.max(20,d*4);orbit.update();
}
function cleanup(){
 if(!object)return;
 scene.remove(object);
 object.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});
 object=null;
}
const loader=new GLTFLoader();
function loadURL(url,source){
 status.textContent='載入 '+source+' 中…';
 loader.load(url,gltf=>{
  cleanup();object=gltf.scene;scene.add(object);
  object.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(object);
  if(bounds.isEmpty()){status.textContent='GLB 沒有可顯示的網格';return;}
  bounds.getCenter(center);
  radius=Math.max(bounds.getSize(new THREE.Vector3()).length()/2,.01);
  setView('front');
  status.textContent='已載入 '+source+' · '+gltf.scene.children.length+' 個頂層物件，拖曳即可旋轉';
 },undefined,e=>{status.textContent='尚未載入正式 GLB。請選擇上方本機檔案。';console.info('GLB not loaded',e);});
}
document.getElementById('master-file').addEventListener('change',event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(!file.name.toLowerCase().endsWith('.glb')){status.textContent='請選擇 .glb 模型檔';return;}
 if(localURL)URL.revokeObjectURL(localURL);
 localURL=URL.createObjectURL(file);loadURL(localURL,file.name);
});
document.querySelectorAll('[data-angle]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.angle)));
document.getElementById('master-reset').addEventListener('click',()=>setView(angle));
document.getElementById('master-bg').addEventListener('change',e=>{
 const el=document.getElementById('master-window');
 const v=e.target.value;el.style.background=v==='checker'?'':v==='white'?'#fff':'#deefdb';
});
function resize(){
 const r=view.getBoundingClientRect();if(!r.width||!r.height)return;
 renderer.setSize(r.width,r.height,false);
 const prevAspect=camera.aspect;camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
 if(object && Math.abs(prevAspect-camera.aspect)>.1)setView(angle);
}
new ResizeObserver(resize).observe(view);resize();
function tick(){requestAnimationFrame(tick);orbit.update();renderer.render(scene,camera);}tick();
document.getElementById('master-export').addEventListener('click',async()=>{
 if(!object){status.textContent='請先載入 GLB，才能截圖';return;}
 const n=Number(document.getElementById('master-resolution').value),size=new THREE.Vector2();renderer.getSize(size);
 const ratio=renderer.getPixelRatio(),aspect=camera.aspect;
 try{
  renderer.setPixelRatio(1);renderer.setSize(n,n,false);camera.aspect=1;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
  if(!blob)throw Error('PNG 匯出失敗');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bio_Master_transparent_'+n+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);
  status.textContent='透明 PNG 已產生';
 }catch(e){status.textContent=String(e);}
 finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}
});
loadURL('./models/Bio_Master.glb','Bio_Master.glb');
