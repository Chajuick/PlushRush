import * as THREE from 'three';
import { createDinosaur } from '/dinosaur.js';

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
for(let i=0;i<100;i++){
 const grass=new THREE.Mesh(new THREE.ConeGeometry(0.10,0.65+random()*0.6,3),material(i%3?'#3d5960':'#647475'));
 grass.position.set((random()-.5)*34,0,-random()*32);grass.rotation.z=(random()-.5)*.35;scene.add(grass);
}
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
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,0.17,16,96),new THREE.MeshStandardMaterial({color,roughness:.85,emissive:color,emissiveIntensity:.65}));group.add(ring);
 for(let i=0;i<64;i++){
  const a=i/64*Math.PI*2;
  const stitch=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.065,3,5),new THREE.MeshBasicMaterial({color:'#fff0c2'}));
  stitch.position.set(Math.cos(a)*1.55,Math.sin(a)*1.55,.17);stitch.rotation.z=a+.6;group.add(stitch);
 }
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;
 const context=haloCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);
 gradient.addColorStop(0,'rgba(255,223,160,.32)');gradient.addColorStop(.5,'rgba(255,210,140,.15)');gradient.addColorStop(1,'rgba(255,210,140,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(6,6,1);group.add(halo);
 const haze=new THREE.Mesh(new THREE.CircleGeometry(1.5,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));group.add(haze);
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
const ghosts=Array.from({length:6},makeGhost);
const dolls=[];
for(let i=0;i<1;i++){const doll=createDinosaur({color:['#9dce9a','#d5afbf','#c7b9e6'][i]});doll.scale.setScalar(i===0?1.3:.85);scene.add(doll);dolls.push(doll);}
// Vector foreground keeps the cropped sleeping face legible on small screens.
const face=document.querySelector('#sleeping-face');
let lastCaption='';
const captions=['','잠 못 드는 밤, 작은 걱정들이 피어나요.','꿈의 틈으로 악몽들이 찾아왔어요.','그때, 따뜻한 빛 하나가 열리고…','작은 친구들이 당신의 꿈을 지켜요.','이제 안심하고 꿈꿔도 괜찮아.'];
function draw(time){
 requestAnimationFrame(draw);
 if(!active||document.hidden){previous=undefined;return;}
 const dt=previous===undefined?0:Math.min((time-previous)/1000,.05);previous=time;
 if(!document.hidden)elapsed+=dt;
 const t=reduceMotion?18:Math.min(18,elapsed*4.5);
 const phase=t<9?1:5;
 if(lastCaption!==captions[phase]){caption.textContent=captions[phase];lastCaption=captions[phase];}
 const reveal=THREE.MathUtils.smoothstep(t,6,9);
 const relief=THREE.MathUtils.smoothstep(t,10,15);
 nightmare.visible=relief<.9;
 nightmare.scale.setScalar((1-relief*.85)*(1+Math.sin(t*2)*.025));
 nightmare.rotation.z=Math.sin(t*.7)*.05;
 plushPortal.scale.setScalar(Math.max(.001,reveal*1.4));plushPortal.rotation.z=Math.sin(t*.3)*.035;
 glow.intensity=reveal*10;
 for(let i=0;i<darkClouds.length;i++){
  const p=darkClouds[i],f=(t*.16+i/12)%1;
  p.position.set(Math.sin(i*2+f*4)*(f*2+.2),.1+f*5,6-f*10);
  p.scale.setScalar((.25+f*.6)*(1-relief));p.visible=relief<.99;
 }
 ghosts.forEach((g,i)=>{
  const emerge=THREE.MathUtils.clamp((t-2-i*.4)/3,0,1);
  g.visible=t>2+i*.4&&relief<.99;
  g.position.set(3.9-emerge*(2+i*.7)+relief*(i%2?5:-5),2.5+Math.sin(t*2+i)*.3+relief*3,-7+emerge*(3+i*.7));
  g.rotation.z=Math.sin(t*2+i)*.12;g.scale.setScalar((1-relief)*(.7+i*.04));
 });
 dolls.forEach((d,i)=>{
  const f=THREE.MathUtils.smoothstep(t,7+i*.45,10+i*.45);
  d.visible=f>0;d.position.set([0,-2.2,2.2][i]*f,.15+Math.sin(f*Math.PI)*1.2,-1.8+f*[4.4,3.2,3.2][i]);
  d.rotation.y=-.18;d.userData.animate(reduceMotion?0:Math.min(elapsed,4),false,false);
 });
 face.classList.toggle('peaceful',relief>.6);
 stars.material.opacity=.7+Math.sin(t*.5)*.12;
 if(t>=14){title.classList.add('visible');enter.hidden=false;}
 const width=canvas.clientWidth,height=canvas.clientHeight;
 if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);camera.aspect=width/height;
 camera.position.z=width/height<.7?25:16;camera.lookAt(0,2.8,-2);camera.updateProjectionMatrix();renderer.render(scene,camera);
}
requestAnimationFrame(draw);
}
