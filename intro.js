import * as THREE from 'three';
import {createDinosaur} from './dinosaur.js';
import {createSheep,createSleeper} from './intro-assets.js';
import {openingShot} from './camera-motion.js';
import {introState,INTRO_DURATION,ease} from './intro-timeline.js';

const overlay=document.querySelector('#opening'),canvas=document.querySelector('#opening-scene');
const title=document.querySelector('#opening-title'),caption=document.querySelector('#opening-caption');
const fade=document.querySelector('#opening-fade'),flash=document.querySelector('#lightning-flash');
const enter=document.querySelector('#enter-game'),main=document.querySelector('main');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let active=true,elapsed=0,previous,renderer,finalSize='';
function resetUI(){finalSize='';title.classList.remove('visible');enter.hidden=true;fade.style.opacity='1';caption.textContent='평온한 잠 속으로…';}
function finish(){
 active=false;overlay.hidden=true;document.body.classList.remove('watching-intro');main.inert=false;
 window.dispatchEvent(new Event('plush:intro-closed'));document.querySelector('#jump').focus();
}
document.querySelector('#skip-intro').addEventListener('click',finish);
enter.addEventListener('click',finish);
document.querySelector('#replay-intro').addEventListener('click',()=>{
 active=true;elapsed=0;previous=undefined;overlay.hidden=false;main.inert=true;
 document.body.classList.add('watching-intro');resetUI();document.querySelector('#skip-intro').focus();
 if(!renderer)fallback();
});
function fallback(){fade.style.opacity='0';title.classList.add('visible');enter.hidden=false;caption.textContent='작은 친구들과 꿈 너머로 달려요.';}
main.inert=true;resetUI();document.querySelector('#skip-intro').focus();
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}catch{fallback();}

// Audio is opt-in: browsers prohibit unsolicited autoplay audio.
let audio,enabled=false,lastAudioTime=-1;
const sound=document.querySelector('#intro-sound');
sound.addEventListener('click',async()=>{
 try{audio??=new AudioContext();await audio.resume();enabled=!enabled;sound.textContent=enabled?'소리 끄기':'소리 켜기';sound.setAttribute('aria-pressed',String(enabled));}catch{sound.textContent='소리 사용 불가';sound.disabled=true;}
});
function playEffect(kind){
 if(!enabled||!audio)return;
 const gain=audio.createGain();gain.connect(audio.destination);const now=audio.currentTime;
 if(kind==='thunder'){
  const length=audio.sampleRate*1.1,buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/length*4);
  const source=audio.createBufferSource();source.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=220;source.connect(filter);filter.connect(gain);gain.gain.setValueAtTime(.18,now);source.start();
 }else{
  const tone=audio.createOscillator();tone.type='sine';tone.frequency.setValueAtTime(kind==='pop'?550:420,now);tone.frequency.exponentialRampToValueAtTime(kind==='pop'?180:900,now+.16);gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);tone.connect(gain);tone.start();tone.stop(now+.23);
 }
}

if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(44,1,.1,150);
 const bedroom=new THREE.Color('#11192a'),day=new THREE.Color('#9fd7e9'),stormSky=new THREE.Color('#343e59');scene.background=day.clone();scene.fog=new THREE.Fog(day,35,100);
 const ambient=new THREE.HemisphereLight('#e7f5ff','#6d9362',1.8);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#fff1c4',2.8);sun.position.set(-9,15,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15});scene.add(sun);
 const nightLight=new THREE.DirectionalLight('#a8b9df',.8);nightLight.position.set(5,6,12);scene.add(nightLight);
 const heroLight=new THREE.PointLight('#ffe3a7',0,18);heroLight.position.set(0,2,1);scene.add(heroLight);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.96});
 const sphereGeometry=new THREE.SphereGeometry(1,24,16);
 function oval(parent,material,position,scale){const m=new THREE.Mesh(sphereGeometry,material);m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const grassMaterial=mat('#91bd76');grassMaterial.transparent=true;
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(110,140,1,1),grassMaterial);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.06,-30.5);floor.receiveShadow=true;scene.add(floor);
 const hills=[];
 for(const [x,y,z,sx,sy,sz,c] of [[-15,-1,-24,18,5,15,'#88b879'],[15,-1,-33,23,7,18,'#78aa7a'],[-24,-2,-49,23,8,20,'#77a28b']])hills.push(oval(scene,mat(c),[x,y,z],[sx,sy,sz]));
 const sleeper=createSleeper();sleeper.position.set(0,-4,10);scene.add(sleeper);
 const dreamSleeper=createSleeper();dreamSleeper.rotation.x=Math.PI/2;dreamSleeper.position.set(0,-4.1,-8);camera.add(dreamSleeper);scene.add(camera);
 let seed=133;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const clouds=[];
 const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=256;
 const cloudPaint=cloudCanvas.getContext('2d');
 for(const [x,y,r] of [[92,167,61],[168,127,85],[262,107,91],[347,145,75],[417,172,52]]){
  const g=cloudPaint.createRadialGradient(x,y,r*.55,x,y,r);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');cloudPaint.fillStyle=g;cloudPaint.fillRect(x-r,y-r,r*2,r*2);
 }
 const cloudMaterial=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cloudCanvas),color:'#fffdf2',transparent:true,depthWrite:false});
 for(let i=0;i<7;i++){
  const cloud=new THREE.Sprite(cloudMaterial);cloud.scale.set(11+i%3*2,5+i%2,1);cloud.position.set((i-3)*10,8+i%3*2,-27-i%4*7);scene.add(cloud);clouds.push(cloud);
 }
 const sunDisc=oval(scene,new THREE.MeshBasicMaterial({color:'#fff0b8'}),[-12,12,-42],[2,2,.5]);
 const blade=new THREE.PlaneGeometry(.09,.5,1,3),bp=blade.attributes.position;
 for(let i=0;i<bp.count;i++){const h=(bp.getY(i)+.25)/.5;bp.setXYZ(i,bp.getX(i)*(1-h*.9)+h*h*.12,h*.5,h*h*.09);}blade.computeVertexNormals();
 const grass=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({color:'#80ad68',roughness:1,side:THREE.DoubleSide}),850),matrix=new THREE.Object3D();
 for(let i=0;i<850;i++){
  const x=(random()-.5)*40,z=-1-random()*45;matrix.position.set(x,Math.abs(x)<2&&z>-8?-.6:0,z);matrix.rotation.y=random()*6;matrix.scale.setScalar(.5+random());matrix.updateMatrix();grass.setMatrixAt(i,matrix.matrix);
 }scene.add(grass);
 const sheep=[];
 for(let i=0;i<6;i++){const s=createSheep();s.scale.setScalar(.72+i%2*.12);scene.add(s);sheep.push(s);}
 const flowerMaterial=new THREE.MeshBasicMaterial({color:'#f3edcf'});
 const flowerPositions=[];for(let i=0;i<90;i++)flowerPositions.push((random()-.5)*35,.27,-2-random()*32);
 const flowers=new THREE.BufferGeometry();flowers.setAttribute('position',new THREE.Float32BufferAttribute(flowerPositions,3));scene.add(new THREE.Points(flowers,new THREE.PointsMaterial({color:flowerMaterial.color,size:.12,sizeAttenuation:true})));
 function portal(color){
  const g=new THREE.Group(),points=[];for(let i=0;i<=72;i++){const a=i/72*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*1.5,Math.sin(a)*1.5,Math.sin(a*4)*.04));}
  const ring=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),96,.07,8,true),new THREE.MeshBasicMaterial({color}));g.add(ring);
  const center=new THREE.Mesh(new THREE.CircleGeometry(1.46,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));g.add(center);scene.add(g);return g;
 }
 const nightmare=portal('#ba99ed');nightmare.position.set(3,2.5,-7);nightmare.scale.setScalar(.01);
 const dollPortal=portal('#ffe5ae');dollPortal.position.set(0,.03,-.5);dollPortal.rotation.x=-Math.PI/2;
 const dolls=[];for(let i=0;i<3;i++){const d=createDinosaur({color:['#94bf91','#b8a0c6','#c4b18c'][i]});d.scale.setScalar(i?1.1:1.45);scene.add(d);dolls.push(d);}
 function ghost(){
  const g=new THREE.Group(),bodyMat=mat('#c3b2df');
  const shape=new THREE.LatheGeometry([new THREE.Vector2(0,-.5),new THREE.Vector2(.36,-.35),new THREE.Vector2(.46,0),new THREE.Vector2(.38,.43),new THREE.Vector2(.18,.61),new THREE.Vector2(0,.64)],24);
  g.add(new THREE.Mesh(shape,bodyMat));
  for(const side of [-1,1]){oval(g,mat('#403956'),[side*.16,.2,.38],[.045,.07,.025]);oval(g,bodyMat,[side*.4,.05,0],[.18,.11,.15]);}
  oval(g,mat('#655573'),[0,-.03,.44],[.06,.08,.025]);scene.add(g);return g;
 }
 const ghosts=Array.from({length:3},ghost);
 const rainPositions=new Float32Array(380*6);
 const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
 const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#b9d1e5',transparent:true,opacity:0}));rain.frustumCulled=false;scene.add(rain);
 const rainSeeds=Array.from({length:380},()=>[random()*32-16,random()*15,random()*32-24]);
 const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.43:1;if(i)starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
 const starGeometry=new THREE.ShapeGeometry(starShape);
 function starBurst(count,color){const group=new THREE.Group();for(let i=0;i<count;i++){const m=new THREE.Mesh(starGeometry,new THREE.MeshBasicMaterial({color,transparent:true,side:THREE.DoubleSide,depthWrite:false}));group.add(m);}scene.add(group);return group;}
 const shockStars=starBurst(24,'#ffe6a2'),pops=Array.from({length:3},()=>starBurst(9,'#fff0b8'));
 const shockRing=new THREE.Mesh(new THREE.RingGeometry(.94,1,72),new THREE.MeshBasicMaterial({color:'#ffe9b1',side:THREE.DoubleSide,transparent:true,depthWrite:false}));shockRing.rotation.x=-Math.PI/2;shockRing.position.set(0,.1,1);scene.add(shockRing);
 let lastCaption='';
 const captions=['평온한 잠 속으로…','초원 위로, 포근한 꿈이 펼쳐져요.','그런데… 꿈에 먹구름이 몰려와요.','걱정 마! 우리가 왔어!','달려라! 인형친구들'];

 function draw(now){
  requestAnimationFrame(draw);if(!active||document.hidden){previous=undefined;return;}
  if(previous!==undefined)elapsed+=Math.min((now-previous)/1000,.25);previous=now;
  const s=introState(elapsed,reduced),t=s.time;
  const sizeKey=`${canvas.clientWidth}:${canvas.clientHeight}`;
  if(t===INTRO_DURATION&&finalSize===sizeKey)return;
  if(t<INTRO_DURATION)finalSize='';
  const phase=t<2?0:t<3.7?1:t<5.2?2:t<7.8?3:4;
  if(lastCaption!==captions[phase]){caption.textContent=captions[phase];lastCaption=captions[phase];}
  overlay.dataset.beat=['bed','meadow','storm','rescue','logo'][phase];
  fade.style.opacity=String(s.fade);flash.style.opacity=String(reduced?0:s.thunder);
  title.classList.toggle('visible',s.logo>0);title.style.setProperty('--logo-reveal',String(s.logo));enter.hidden=s.logo<.7;
  sleeper.userData.setDistress(s.distress);sleeper.userData.animate(t);sleeper.visible=s.rise<.75;
  dreamSleeper.visible=s.rise>.7&&t<8.35;const bedExit=ease(t,7.4,8.3);dreamSleeper.position.y=-4.1-bedExit*2.8;dreamSleeper.scale.setScalar(1-bedExit*.15);dreamSleeper.userData.setDistress(s.distress);dreamSleeper.userData.animate(t);
  scene.background.copy(bedroom).lerp(day,s.rise).lerp(stormSky,s.storm);scene.fog.color.copy(scene.background);
  sun.intensity=.3+s.rise*2.5-s.storm*2.45+(reduced?0:s.thunder*5);ambient.intensity=.8+s.rise-s.storm*.9;
  cloudMaterial.color.set('#f6f7ed').lerp(new THREE.Color('#4c566f'),s.storm);grassMaterial.color.set('#91bd76').lerp(new THREE.Color('#607d78'),s.storm);
  sunDisc.visible=s.rise>.7&&s.storm<.5;floor.visible=s.rise>.05;grassMaterial.opacity=s.rise;
  clouds.forEach((c,i)=>{c.visible=s.rise>.05;c.position.x=(i-3.5)*8+Math.sin(t*.12+i)*.4;});
  sheep.forEach((sheep,i)=>{
   const runTime=reduced?2.8:t;sheep.position.set(((runTime*(i%2?1.0:-.85)+i*3.4+30)%18)-9,.15+Math.max(0,Math.sin(runTime*5+i))* .45,-8-i%3*3.5);
   sheep.rotation.y=i%2?Math.PI/2:-Math.PI/2;sheep.userData.animate(runTime+i,s.storm>.5?0:1);sheep.visible=t>1.65;
  });
  rain.visible=s.storm>.01;rain.material.opacity=s.storm*.5;
  if(rain.visible){for(let i=0;i<rainSeeds.length;i++){const [x,y,z]=rainSeeds[i],height=((y-t*13)%15+15)%15;rainPositions.set([x,height,z,x-.18,height-.65,z],i*6);}rainGeometry.attributes.position.needsUpdate=true;}
  nightmare.visible=s.nightmare>.01;nightmare.scale.setScalar(Math.max(.001,s.nightmare));nightmare.rotation.z=Math.sin(t*2)*.07;
  dollPortal.scale.setScalar(Math.max(.001,s.portal*1.5));dollPortal.visible=s.portal>.01;
  heroLight.intensity=s.portal*12;
  dolls.forEach((d,i)=>{
    const a=ease(t,5.05+i*.12,5.8+i*.12);d.visible=a>0;
    d.position.set(i===0?0:i===1?-1.9:1.9,-2.6*(1-a)+Math.sin(a*Math.PI)*1.3,-.5+a*(i?1.3:2));
    d.rotation.y=-.3+(1-a)*.4;d.userData.animate(reduced?1:t,false,false);d.userData.pose({cheer:s.cheer*(1-ease(t,7.6,8.2)),land:s.landing,wave:0});
  });
  const shockActive=t>=6.05&&t<6.8;
  shockRing.visible=shockActive;shockRing.scale.setScalar(.2+s.shock*8);shockRing.material.opacity=1-s.shock;
  shockStars.visible=shockActive;shockStars.position.set(0,1.7,1);
  shockStars.children.forEach((star,i)=>{const a=i/24*Math.PI*2,r=s.shock*6;star.position.set(Math.cos(a)*r,Math.sin(a)*r*.6,Math.sin(a*3)*s.shock);star.scale.setScalar(.08+(1-s.shock)*.18);star.rotation.z=a+s.shock*2;star.material.opacity=1-s.shock;});
  ghosts.forEach((g,i)=>{
   const beat=s.ghosts[i],x=[-2.6,.4,3][i],y=[2.1,2.8,2.2][i];
   g.visible=beat.visible;g.position.set(3+(x-3)*beat.spawn+[-.9,0,.75][i]*beat.flight,y+beat.flight*4,-7+beat.spawn*3-beat.flight*3);g.rotation.z=(i-1)*beat.flight*4;g.scale.setScalar(.9*(1-beat.flight*.25));
   const pop=pops[i];pop.visible=beat.burstVisible;pop.position.set(x+[-.9,0,.75][i],y+4,-7);
   pop.children.forEach((star,j)=>{const a=j/9*Math.PI*2;star.position.set(Math.cos(a)*beat.burst*1.2,Math.sin(a)*beat.burst*1.2,0);star.scale.setScalar(.28*(1-beat.burst)+.02);star.rotation.z=a+beat.burst*3;star.material.opacity=1-beat.burst;});
  });
  if(!reduced){for(const [at,kind] of [[4.05,'thunder'],[4.42,'thunder'],[6.08,'cheer'],[7,'pop'],[7.25,'pop'],[7.5,'pop']])if(lastAudioTime<at&&t>=at)playEffect(kind);}lastAudioTime=t;
  if(t===0)lastAudioTime=-1;
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
  const shot=openingShot(t,{mobile:width/height<.7,reduced});camera.aspect=width/height;camera.position.set(...shot.position);camera.lookAt(...shot.target);camera.fov=shot.fov;camera.updateProjectionMatrix();
  renderer.render(scene,camera);if(t===INTRO_DURATION)finalSize=sizeKey;
 }
 requestAnimationFrame(draw);
}
