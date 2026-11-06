import * as THREE from 'three';
import { createDinosaur, createCharacterView } from '/dinosaur.js';

// All dimensions, speed and collision values below are prototype tuning values.
const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const button = document.querySelector('#jump');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
let renderer, preview;
try {
  preview = createCharacterView(document.querySelector('#portrait'), {preview:true});
  renderer = new THREE.WebGLRenderer({canvas,antialias:true});
} catch {
  status.textContent = '3D 게임에는 WebGL을 지원하는 브라우저가 필요해요.';
  button.disabled = true;
}
if (renderer) initialize();

function initialize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background=new THREE.Color('#e8f1e7');
  scene.fog=new THREE.Fog('#e8f1e7',35,105);
  const camera = new THREE.PerspectiveCamera(51,1,0.1,140);
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x779b80,2.7));
  const sun = new THREE.DirectionalLight(0xfff2da,3);sun.position.set(-10,20,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;
  sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;scene.add(sun);
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:0.95});
  const roadMaterial=material('#eadfc6'), grass=material('#bcd4aa'), border=material('#f8f1dd');
  function box(w,h,d,mat,x,y,z) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  box(180,0.2,180,grass,0,-0.22,-50);
  box(9,0.12,145,roadMaterial,0,-0.08,-55);
  for(const side of [-1,1]) box(0.18,0.18,145,border,side*4.6,0,-55);
  const character=createDinosaur();character.rotation.y=Math.PI;character.scale.setScalar(0.85);scene.add(character);
  const scenery=[];
  const treeMaterial=material('#a5c894'), trunkMaterial=material('#b68e6c');
  for(let i=0;i<32;i++) {
    const tree=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.23,1.5,8),trunkMaterial);trunk.position.y=0.75;tree.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),treeMaterial);crown.scale.set(1.1,1.6,1.1);crown.position.y=2.5;crown.castShadow=true;tree.add(crown);
    tree.position.set((i%2?1:-1)*(6.5+(i%4)*0.7),0,-i*4);scene.add(tree);scenery.push(tree);
  }
  const markers=[];
  for(let i=0;i<35;i++) for(const side of [-1,1]) markers.push(box(0.05,0.015,1.2,border,side*1.5,0.005,-i*4));
  const obstacleMaterial=material('#c89879');
  const obstacleGeometry=new THREE.BoxGeometry(1.45,1.05,1.1);
  let obstacles=[],mode='ready',distance=0,x=0,targetX=0,y=0,velocity=0,spawn=0.8,previous,best=0;
  try{best=Number(localStorage.getItem('plushrush-3d-best'))||0;}catch{}
  bestLabel.textContent=best;
  const keys=new Set();
  function jump() {
    if(mode!=='running') {
      for(const obstacle of obstacles)scene.remove(obstacle);
      obstacles=[];mode='running';distance=0;x=targetX=0;y=velocity=0;spawn=0.8;
      status.textContent='좌우로 피하고, 위로 점프해요!';button.textContent='점프 ↗';
    }
    if(y===0)velocity=8;
  }
  button.addEventListener('click',jump);
  document.addEventListener('keydown',event=>{
    if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','ArrowUp'].includes(event.code)){
      if(event.target===button && event.code==='Space')return;
      event.preventDefault();keys.add(event.code);
      if(['Space','ArrowUp'].includes(event.code)&&!event.repeat)jump();
    }
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>keys.clear());
  let touch;
  canvas.addEventListener('pointerdown',event=>{touch={x:event.clientX,y:event.clientY,target:targetX,jumped:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(!touch)return;
    const dx=event.clientX-touch.x,dy=event.clientY-touch.y;
    if(!touch.jumped&&dy < -35&&Math.abs(dy)>Math.abs(dx)){jump();touch.jumped=true;}
    if(!touch.jumped)targetX=THREE.MathUtils.clamp(touch.target+dx/canvas.clientWidth*10,-3.6,3.6);
  });
  const release=()=>{touch=undefined;};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  document.addEventListener('visibilitychange',()=>{previous=undefined;keys.clear();});
  function render(time){
    if(document.body.classList.contains('watching-intro')){previous=undefined;keys.clear();requestAnimationFrame(render);return;}
    const dt=previous===undefined?0:Math.min((time-previous)/1000,0.04);previous=time;
    if(mode==='running'){
      const speed=13;distance+=speed*dt;
      if(keys.has('ArrowLeft')||keys.has('KeyA'))targetX-=7*dt;
      if(keys.has('ArrowRight')||keys.has('KeyD'))targetX+=7*dt;
      targetX=THREE.MathUtils.clamp(targetX,-3.6,3.6);
      x=THREE.MathUtils.damp(x,targetX,16,dt);
      y=Math.max(0,y+velocity*dt);velocity-=21*dt;if(y===0)velocity=0;
      spawn-=dt;
      if(spawn<=0){
        const obstacle=new THREE.Mesh(obstacleGeometry,obstacleMaterial);
        obstacle.position.set((Math.floor(Math.random()*3)-1)*2.7,0.525,-70);obstacle.castShadow=true;scene.add(obstacle);obstacles.push(obstacle);spawn=1.35+Math.random()*0.5;
      }
      for(const obstacle of obstacles){
        obstacle.position.z+=speed*dt;
        if(Math.abs(obstacle.position.z)<0.9&&Math.abs(obstacle.position.x-x)<1.17&&y<0.93){
          mode='over';best=Math.max(best,Math.floor(distance));bestLabel.textContent=best;
          try{localStorage.setItem('plushrush-3d-best',String(best));}catch{}
          status.textContent=`${Math.floor(distance)}m 달렸어요! 다시 도전해 볼까요?`;button.textContent='다시 시작 ↗';break;
        }
      }
      obstacles=obstacles.filter(obstacle=>{if(obstacle.position.z>12){scene.remove(obstacle);return false;}return true;});
      for(const item of [...scenery,...markers]){item.position.z+=speed*dt;if(item.position.z>12)item.position.z-=140;}
      scoreLabel.textContent=Math.floor(distance);
    }
    character.position.set(x,y,0);character.rotation.z=(x-targetX)*0.08;
    character.userData.animate(time/1000,mode==='running',y>0);
    camera.position.set(x*0.25,5.3,10);camera.lookAt(x*0.35,1.1,-12);
    const width=canvas.clientWidth,height=canvas.clientHeight;
    if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);
    preview?.draw(time/1000);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
