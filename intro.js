import * as THREE from 'three';
import { createDinosaur } from '/dinosaur.js';
import { openingShot } from './camera-motion.js';
import { introState } from './intro-timeline.js';

const overlay=document.querySelector('#opening');
const canvas=document.querySelector('#opening-scene');
const caption=document.querySelector('#opening-caption');
const title=document.querySelector('#opening-title');
const enter=document.querySelector('#enter-game');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }
catch { caption.textContent='작은 인형들이 당신의 꿈을 지켜줄 거예요.';title.classList.add('visible');enter.hidden=false; }
let active=true,elapsed=0,previous;
function finish(){
  active=false;overlay.hidden=true;document.body.classList.remove('watching-intro');
  window.dispatchEvent(new Event('plush:intro-closed'));
  document.querySelector('main').inert=false;document.querySelector('#jump').focus();
}
document.querySelector('#skip-intro').addEventListener('click',finish);
enter.addEventListener('click',finish);
document.querySelector('#replay-intro').addEventListener('click',()=>{
  overlay.hidden=false;active=true;elapsed=0;previous=undefined;
  document.body.classList.add('watching-intro');document.querySelector('main').inert=true;
  title.classList.add('visible');enter.hidden=false;document.querySelector('#skip-intro').focus();
});
document.querySelector('main').inert=true;
title.classList.add('visible');enter.hidden=false;
document.querySelector('#enter-game').focus();

if(renderer){
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#151b36',0.012);
const camera=new THREE.PerspectiveCamera(43,1,0.1,90);
camera.position.set(0,7.6,18);camera.lookAt(0,2,-2);
scene.add(new THREE.HemisphereLight('#d9dbff','#485744',1.0));
const moonlight=new THREE.DirectionalLight('#bacaff',1.1);moonlight.position.set(-7,12,4);scene.add(moonlight);
const key=new THREE.DirectionalLight('#ffe3b0',1.5);key.position.set(-3,7,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;scene.add(key);
const faceLight=new THREE.DirectionalLight('#fff3dc',.9);faceLight.position.set(1,4,12);scene.add(faceLight);
const rimLight=new THREE.DirectionalLight('#c9a8ff',1.2);rimLight.position.set(4,5,-5);scene.add(rimLight);
const glow=new THREE.PointLight('#ffe6af',0,22);glow.position.set(0,3,2);scene.add(glow);
const material=color=>new THREE.MeshStandardMaterial({color,roughness:0.95});
function sphere(parent,position,scale,mat){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const ground=material('#283a49');
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,90),ground);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.05,-15);floor.receiveShadow=true;scene.add(floor);
sphere(scene,[-15,-1,-18],[13,3.6,14],material('#253348'));
sphere(scene,[17,-1,-22],[17,4,15],material('#303a51'));
const moon=sphere(scene,[-8,10,-21],[1.4,1.4,0.4],new THREE.MeshBasicMaterial({color:'#fff3cf'}));
sphere(scene,[-7.35,10.4,-20.5],[1.2,1.2,0.45],new THREE.MeshBasicMaterial({color:'#151b36'}));
// A seeded arrangement keeps the composition stable across replays.
let seed=19;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const starPositions=[];
for(let i=0;i<120;i++)starPositions.push((random()-.5)*46,3+random()*15,-12-random()*23);
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#ffe8bd',size:.055,sizeAttenuation:true,transparent:true,opacity:.8}));scene.add(stars);
// Curved tapered grass ribbons are instanced instead of scattered cones.
const bladeGeometry=new THREE.PlaneGeometry(.10,.7,1,5);
const bp=bladeGeometry.attributes.position;
for(let i=0;i<bp.count;i++){
 const h=(bp.getY(i)+.35)/.7;
 bp.setXYZ(i,bp.getX(i)*(1-h*.95)+h*h*.17,h*.7,h*h*.12);
}
bladeGeometry.computeVertexNormals();
const bladeMaterial=new THREE.MeshStandardMaterial({color:'#668479',roughness:1,side:THREE.DoubleSide});
const blades=new THREE.InstancedMesh(bladeGeometry,bladeMaterial,900),transform=new THREE.Object3D();
for(let i=0;i<900;i++){
 const x=(random()-.5)*30,z=5-random()*35;
 transform.position.set(x,Math.abs(x)<2.5?-.8:0,z);transform.rotation.set(0,random()*Math.PI*2,(random()-.5)*.2);transform.scale.setScalar(.4+random()*.9);transform.updateMatrix();blades.setMatrixAt(i,transform.matrix);
 blades.setColorAt(i,new THREE.Color().setHSL(.38+random()*.07,.16,.20+random()*.14));
}
scene.add(blades);
const petalMaterial=material('#e9dfeb'),flowerCenter=material('#efd399'),stemMaterial=material('#54756c');
const petalGeometry=new THREE.SphereGeometry(1,8,6);
for(let i=0;i<100;i++){
 const x=(random()-.5)*24,z=2-random()*22;
 if(Math.abs(x)<2.6)continue;
 const flower=new THREE.Group();flower.position.set(x,.1,z);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.6,4),stemMaterial);stem.position.y=.25;flower.add(stem);
 const center=new THREE.Mesh(petalGeometry,flowerCenter);center.position.y=.6;center.scale.set(.08,.06,.08);flower.add(center);
 for(let j=0;j<5;j++){
  const a=j*Math.PI*2/5,p=new THREE.Mesh(petalGeometry,petalMaterial);
  p.position.set(Math.cos(a)*.12,.59,Math.sin(a)*.12);p.scale.set(.12,.045,.075);p.rotation.y=-a;flower.add(p);
 }
 flower.rotation.y=random()*6;flower.scale.setScalar(.6+random()*.8);scene.add(flower);
}
for(let i=0;i<9;i++)sphere(scene,[Math.sin(i)*.55,-.02,4-i*.8],[1,.07,.5],material('#62746c'));
function portal(x,y,z,color){
 const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);
 const rim=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,r=1.55+Math.sin(a*5)*.045+Math.cos(a*3)*.035;rim.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*4)*.045));}
 const ring=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim,true),128,.105,12,true),new THREE.MeshStandardMaterial({color,roughness:.85,emissive:color,emissiveIntensity:.65}));group.add(ring);
 for(let i=0;i<64;i++){
  const a=i/64*Math.PI*2;
  const stitch=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.065,3,5),new THREE.MeshBasicMaterial({color:'#fff0c2'}));
  stitch.position.set(Math.cos(a)*1.55,Math.sin(a)*1.55,.17);stitch.rotation.z=a+.6;group.add(stitch);
 }
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;
 const context=haloCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);
 gradient.addColorStop(0,'rgba(255,223,160,.32)');gradient.addColorStop(.5,'rgba(255,210,140,.15)');gradient.addColorStop(1,'rgba(255,210,140,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(6,6,1);group.add(halo);
 const haze=new THREE.Mesh(new THREE.CircleGeometry(1.5,64),new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{tint:{value:new THREE.Color(color)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 tint;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float mist=sin(vUv.y*18.+sin(vUv.x*12.)*2.)*.5+.5;float alpha=(.12+mist*.08)*(1.-smoothstep(.75,1.,r));gl_FragColor=vec4(tint,alpha);}'
 }));group.add(haze);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(1.35,.025,6,64),new THREE.MeshBasicMaterial({color:'#fff2d4'}));inner.position.z=.03;group.add(inner);
 return group;
}
const nightmare=portal(3.9,2.7,-7,'#a77ce3');nightmare.scale.set(1.15,1.35,1);
const plushPortal=portal(0,2.3,-1.8,'#f2d18f');
plushPortal.scale.setScalar(1.4);
const darkClouds=[];
for(let i=0;i<12;i++){
 const c=document.createElement('canvas');c.width=c.height=64;const b=c.getContext('2d');const g=b.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(151,115,194,.5)');g.addColorStop(1,'rgba(91,65,137,0)');b.fillStyle=g;b.fillRect(0,0,64,64);
 const cloud=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false,transparent:true}));scene.add(cloud);darkClouds.push(cloud);
}
function makeGhost(){
 const g=new THREE.Group();const lavender=material('#b8a7d3');
 sphere(g,[0,.1,0],[.47,.58,.36],lavender);
 for(let i=0;i<3;i++)sphere(g,[(i-1)*.27,-.31,0],[.20,.23,.31],lavender);
 for(const side of [-1,1]){sphere(g,[side*.17,.2,.33],[.05,.07,.025],material('#39314f'));sphere(g,[side*.47,0,0],[.19,.11,.15],lavender);}
 sphere(g,[0,-.02,.35],[.065,.07,.025],material('#65517e'));scene.add(g);return g;
}
const ghosts=Array.from({length:2},makeGhost);
const dolls=[];
for(let i=0;i<1;i++){const doll=createDinosaur({color:['#9dce9a','#d5afbf','#c7b9e6'][i]});doll.scale.setScalar(1.6);scene.add(doll);dolls.push(doll);}
// Visible cause/effect: protection pulses travel from the doll to each ghost.
const pulses=[],bursts=[];
const pulseMaterial=new THREE.MeshBasicMaterial({color:'#ffe2a0'});
const pulseCanvas=document.createElement('canvas');pulseCanvas.width=pulseCanvas.height=64;const pc=pulseCanvas.getContext('2d'),pg=pc.createRadialGradient(32,32,0,32,32,32);pg.addColorStop(0,'rgba(255,224,161,.7)');pg.addColorStop(1,'rgba(255,224,161,0)');pc.fillStyle=pg;pc.fillRect(0,0,64,64);const pulseMap=new THREE.CanvasTexture(pulseCanvas);
const starShape=new THREE.Shape();
for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?.42:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)starShape.moveTo(x,y);else starShape.lineTo(x,y);}starShape.closePath();
const starMeshGeometry=new THREE.ShapeGeometry(starShape);
const charge=new THREE.Group();charge.add(new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),pulseMaterial));
const chargeAura=new THREE.Sprite(new THREE.SpriteMaterial({map:pulseMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));chargeAura.scale.set(1.7,1.7,1);charge.add(chargeAura);scene.add(charge);
const protectionOrigin=new THREE.Vector3();
for(let i=0;i<2;i++){
 const pulse=new THREE.Group();pulse.add(new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),pulseMaterial));const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:pulseMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));aura.scale.set(1.2,1.2,1);pulse.add(aura);scene.add(pulse);pulses.push(pulse);
 const group=new THREE.Group();
 for(let j=0;j<5;j++){const star=new THREE.Mesh(starMeshGeometry,new THREE.MeshBasicMaterial({color:j%2?'#ffe5ac':'#cde9c8',side:THREE.DoubleSide,transparent:true}));star.scale.setScalar(.25);group.add(star);}
 scene.add(group);bursts.push(group);
}
// Vector foreground keeps the cropped sleeping face legible on small screens.
const face=document.querySelector('#sleeping-face');
let lastCaption='';
const captions=['','잠 못 드는 밤, 작은 걱정들이 피어나요.','꿈의 틈으로 악몽들이 찾아왔어요.','그때, 따뜻한 빛 하나가 열리고…','작은 친구들이 당신의 꿈을 지켜요.','이제 안심하고 꿈꿔도 괜찮아.'];
function draw(time){
 requestAnimationFrame(draw);
 if(!active||document.hidden){previous=undefined;return;}
 const dt=previous===undefined?0:Math.min((time-previous)/1000,.1);previous=time;
 if(!document.hidden)elapsed+=dt;
 const state=introState(elapsed,reduceMotion),t=state.time;
 const relief=state.relief,reveal=state.portal;
 const phase=t<1.45?1:t<3.1?4:5;
 if(lastCaption!==captions[phase]){caption.textContent=captions[phase];lastCaption=captions[phase];}
 nightmare.visible=relief<.9;nightmare.scale.setScalar(1-relief*.85);
 plushPortal.scale.setScalar(Math.max(.001,reveal*1.4));
 glow.intensity=reveal*(10+state.protect*10);
 for(let i=0;i<darkClouds.length;i++){
   const p=darkClouds[i],f=(t*.3+i/12)%1;
   p.position.set(Math.sin(i*2+f*4)*(f*1.4+.1),.1+f*5,6-f*10);
   p.scale.setScalar((.3+f*.6)*(1-relief));p.visible=relief<.99;
 }
 dolls.forEach(d=>{
   const f=state.arrival;
   d.visible=f>0;d.position.set(0,.15+Math.sin(f*Math.PI)*.8,-1.8+f*4.4);
   d.rotation.y=-.65+state.protect*1.1;
   d.userData.animate(reduceMotion?1:elapsed,false,false);
   d.userData.pose({protect:state.protect,land:state.landing,wave:state.wave*(.6+Math.sin(t*12)*.4)});
 });
 dolls[0].userData.protectionOrigin(protectionOrigin);
 charge.visible=state.protect>.05&&t<2.65;charge.position.copy(protectionOrigin);charge.scale.setScalar(.5+state.protect*.5);
 ghosts.forEach((g,i)=>{
   const beat=state.ghosts[i];
   g.visible=t>.1+i*.12&&beat.dissolve<1;
   g.position.set(3.9-beat.approach*(1.8-i*.65)+beat.recoil*.6,2.7+i*.65+Math.sin(t*4+i)*.10+beat.recoil*.3,-7+beat.approach*6.5);
   g.rotation.z=beat.recoil*(i?-.7:.7);g.scale.setScalar((1-beat.dissolve)*1.0);
   const destination=new THREE.Vector3(2.1+i*.65,2.7+i*.65,-.5);
   const source=protectionOrigin;
   pulses[i].visible=beat.pulseVisible;
   pulses[i].position.copy(source).lerp(destination,beat.pulse);
   pulses[i].scale.setScalar(1+Math.sin(beat.pulse*Math.PI)*.3);
   bursts[i].visible=beat.burstVisible;bursts[i].position.copy(destination);
   bursts[i].children.forEach((star,j)=>{
     const a=j/5*Math.PI*2;star.position.set(Math.cos(a)*beat.burst*.85,Math.sin(a)*beat.burst*.7,0);
     star.rotation.z=beat.burst*(j%2?2:-2);star.material.opacity=1-beat.burst;
   });
 });
 overlay.dataset.beat=t<1.45?'arrival':t<2.05?'protect':t<2.8?'impact':t<3.35?'relief':'settled';
 face.classList.toggle('peaceful',relief>.6);
 stars.material.opacity=.7+Math.sin(t*.5)*.12;
 if(t>=4){title.classList.add('visible');enter.hidden=false;}
 const width=canvas.clientWidth,height=canvas.clientHeight;
 if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);camera.aspect=width/height;
 const shot=openingShot(elapsed,{mobile:width/height<.7,reduced:reduceMotion});
 camera.position.set(...shot.position);camera.lookAt(...shot.target);camera.fov=shot.fov;
 face.style.setProperty('--sleep-parallax',`${(1-shot.progress)*28}px`);
 face.style.setProperty('--sleep-scale',String(1.04-shot.progress*.04));
 overlay.dataset.shot=shot.progress>=1?'settled':'moving';
 camera.updateProjectionMatrix();renderer.render(scene,camera);
}
requestAnimationFrame(draw);
}
