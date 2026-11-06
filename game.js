import * as THREE from 'three';
import { createDinosaur, createCharacterView } from '/dinosaur.js';

// All dimensions, speed and collision values below are prototype tuning values.
const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const button = document.querySelector('#jump');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
let renderer, preview;
function showUnavailable(message) {
  status.textContent=message;
  document.querySelector('#run-panel').hidden=false;
  document.querySelector('#run-panel-title').textContent='3D 화면을 표시할 수 없어요';
  document.querySelector('#run-panel-copy').textContent=message;
  document.querySelector('#resume-game').hidden=true;
  document.querySelector('#pause-game').disabled=true;
  button.disabled=true;
}
function prepareGame(){
  try { preview = createCharacterView(document.querySelector('#portrait'), {preview:true}); }
  catch { document.querySelector('#model-status').textContent='이 브라우저에서는 3D 인형을 표시할 수 없어요.'; }
  try { renderer = new THREE.WebGLRenderer({canvas,antialias:true}); }
  catch { showUnavailable('WebGL을 지원하는 최신 브라우저에서 열어 주세요.'); }
  if(renderer)initialize();
}
if(document.body.classList.contains('watching-intro'))window.addEventListener('plush:intro-closed',prepareGame,{once:true});
else prepareGame();

function initialize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background=new THREE.Color('#e8f1e7');
  scene.fog=new THREE.Fog('#e8f1e7',35,105);
  const camera = new THREE.PerspectiveCamera(51,1,0.1,140);
  camera.position.set(0,5.3,10);
  const cameraTarget=new THREE.Vector3(0,1.1,-12);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x779b80,2.7));
  const sun = new THREE.DirectionalLight(0xfff2da,3);sun.position.set(-10,20,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;
  sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;scene.add(sun);
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:0.95});
  const roadCanvas=document.createElement('canvas');roadCanvas.width=roadCanvas.height=512;const paint=roadCanvas.getContext('2d');
  paint.fillStyle='#d8cbb0';paint.fillRect(0,0,512,512);let seed=97;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<6000;i++){paint.fillStyle=i%2?'#e0d3ba':'#ccbea2';paint.fillRect(random()*512,random()*512,1+random()*2,1+random()*2);}
  for(let i=0;i<25;i++){paint.fillStyle='#c4b69a';paint.beginPath();paint.ellipse(random()*512,random()*512,2+random()*3,1+random(),random()*3,0,Math.PI*2);paint.fill();}
  const roadTexture=new THREE.CanvasTexture(roadCanvas);roadTexture.colorSpace=THREE.SRGBColorSpace;roadTexture.wrapS=roadTexture.wrapT=THREE.RepeatWrapping;roadTexture.repeat.set(2,28);roadTexture.anisotropy=4;
  const roadMaterial=new THREE.MeshStandardMaterial({map:roadTexture,roughness:1}), grass=material('#b1c59a'), border=material('#d6d5ba');
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
    for(const [x,y,z,size] of [[0,2.8,0,1.05],[-.65,2.3,.15,.78],[.65,2.4,.1,.83],[.15,2.2,-.55,.85]]){
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(size,2),treeMaterial);crown.scale.set(1,1.12,.94);crown.position.set(x,y,z);crown.castShadow=true;tree.add(crown);
    }
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.075,.12,.9,6),trunkMaterial);branch.position.set(.27,1.6,0);branch.rotation.z=-.65;tree.add(branch);
    tree.position.set((i%2?1:-1)*(6.5+(i%4)*0.7),0,-i*4);scene.add(tree);scenery.push(tree);
  }
  const markers=[];
  for(let i=0;i<35;i++) for(const side of [-1,1]) markers.push(box(0.05,0.015,1.2,border,side*1.5,0.005,-i*4));
  const obstacleMaterial=material('#c89879');
  const obstacleGeometry=new THREE.CapsuleGeometry(.5,.45,5,12);
  obstacleGeometry.rotateZ(Math.PI/2);
  const bushMaterial=material('#85ad8b');
  for(let i=0;i<40;i++){
    const bush=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),bushMaterial);
    bush.scale.set(.6+(i%3)*.15,.35,.6);bush.position.set((i%2?1:-1)*(5.3+(i%3)),.25,-i*3.4);scene.add(bush);scenery.push(bush);
  }
  let obstacles=[],mode='ready',distance=0,x=0,targetX=0,y=0,velocity=0,spawn=0.8,previous,best=0;
  try{best=Number(localStorage.getItem('plushrush-3d-best'))||0;}catch{}
  bestLabel.textContent=best;
  // Read-only state lets browser QA verify movement, rather than merely send keys.
  Object.defineProperty(canvas,'gameState',{get:()=>Object.freeze({mode,x,targetX,y,distance,velocity})});
  function focusPlayfield(){
    canvas.focus({preventScroll:true});
    const bounds=document.querySelector('.game').getBoundingClientRect();
    if(bounds.top<0||bounds.bottom>innerHeight)document.querySelector('.game').scrollIntoView({block:'start',behavior:'instant'});
  }

  const keys=new Set();
  const pauseButton=document.querySelector('#pause-game');
  const panel=document.querySelector('#run-panel');
  const panelTitle=document.querySelector('#run-panel-title');
  function showPanel(title,copy){panelTitle.textContent=title;document.querySelector('#run-panel-copy').textContent=copy;panel.hidden=false;}
  function pause(){
    if(mode==='running'){mode='paused';keys.clear();showPanel('잠깐 쉬어가요','준비되면 이어 달릴 수 있어요.');pauseButton.textContent='계속하기';}
    else if(mode==='paused'){mode='running';panel.hidden=true;previous=undefined;pauseButton.textContent='일시 정지';focusPlayfield();}
  }
  pauseButton.addEventListener('click',pause);
  document.querySelector('#resume-game').addEventListener('click',()=>{if(mode==='paused')pause();else jump();});
  showPanel('작은 발걸음, 큰 모험','좌우로 움직이고 점프하며 길을 달려보세요.');

  function jump() {
    if(mode==='paused'){pause();return;}
    if(mode!=='running') {
      for(const obstacle of obstacles)scene.remove(obstacle);
      obstacles=[];mode='running';distance=0;x=targetX=0;y=velocity=0;spawn=0.8;
      panel.hidden=true;pauseButton.disabled=false;pauseButton.textContent='일시 정지';document.querySelector('#resume-game').textContent='이어서 달리기';
      status.textContent='좌우로 피하고, 위로 점프해요!';button.textContent='점프 ↗';
    }
    if(y===0)velocity=8;
    focusPlayfield();
  }
  button.addEventListener('click',jump);
  document.addEventListener('keydown',event=>{
    if(document.body.classList.contains('watching-intro')||document.hidden)return;
    if(event.code==='Escape'){event.preventDefault();pause();return;}
    if(event.target instanceof HTMLElement && (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.target.isContentEditable))return;
    if(event.target instanceof HTMLButtonElement&&['Space','Enter'].includes(event.code))return;
    if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','ArrowUp'].includes(event.code)){
      if(mode!=='running'&&!['Space','ArrowUp'].includes(event.code))return;
      event.preventDefault();keys.add(event.code);
      if(['Space','ArrowUp'].includes(event.code)&&!event.repeat)jump();
    }
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>{keys.clear();if(mode==='running')pause();});
  let touch;
  canvas.addEventListener('pointerdown',event=>{if(mode!=='running'||!event.isPrimary)return;focusPlayfield();touch={id:event.pointerId,x:event.clientX,y:event.clientY,target:targetX,jumped:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(!touch||event.pointerId!==touch.id)return;
    const dx=event.clientX-touch.x,dy=event.clientY-touch.y;
    if(!touch.jumped&&dy < -35&&Math.abs(dy)>Math.abs(dx)){jump();touch.jumped=true;}
    if(!touch.jumped)targetX=THREE.MathUtils.clamp(touch.target+dx/canvas.clientWidth*10,-3.6,3.6);
  });
  const release=event=>{if(touch&&event.pointerId===touch.id)touch=undefined;};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  document.addEventListener('visibilitychange',()=>{previous=undefined;keys.clear();if(document.hidden&&mode==='running')pause();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();mode='unavailable';keys.clear();touch=undefined;showUnavailable('화면 연결이 끊겼어요. 페이지를 새로고침해 주세요.');});
  function render(time){
    if(mode==='unavailable'||document.hidden||document.body.classList.contains('watching-intro')){previous=undefined;keys.clear();requestAnimationFrame(render);return;}
    const dt=previous===undefined?0:Math.min((time-previous)/1000,0.04);previous=time;
    if(mode==='running'){
      const speed=13;distance+=speed*dt;roadTexture.offset.y=-distance/5;
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
          showPanel('괜찮아요, 한 번 더!',`${Math.floor(distance)}m를 달렸어요. 최고 기록 ${best}m`);document.querySelector('#resume-game').textContent='다시 달리기';pauseButton.disabled=true;
          status.textContent=`${Math.floor(distance)}m 달렸어요! 다시 도전해 볼까요?`;button.textContent='다시 시작 ↗';break;
        }
      }
      obstacles=obstacles.filter(obstacle=>{if(obstacle.position.z>12){scene.remove(obstacle);return false;}return true;});
      for(const item of [...scenery,...markers]){item.position.z+=speed*dt;if(item.position.z>12)item.position.z-=140;}
      scoreLabel.textContent=Math.floor(distance);
    }
    character.position.set(x,y,0);character.rotation.z=(x-targetX)*0.08;
    character.userData.animate(time/1000,mode==='running',y>0);
    // Follow inertia and slight jump lift; avoid camera shake and excessive roll.
    const desiredX=x*.35+(targetX-x)*.08;
    camera.position.x=THREE.MathUtils.damp(camera.position.x,desiredX,5,dt);
    camera.position.y=THREE.MathUtils.damp(camera.position.y,5.3+(reducedMotion?0:y*.18),4,dt);
    camera.position.z=THREE.MathUtils.damp(camera.position.z,mode==='running'&&!reducedMotion?9.4:10,3,dt);
    cameraTarget.x=THREE.MathUtils.damp(cameraTarget.x,x*.5,6,dt);
    cameraTarget.y=THREE.MathUtils.damp(cameraTarget.y,1.1+(reducedMotion?0:y*.1),4,dt);
    camera.fov=THREE.MathUtils.damp(camera.fov,mode==='running'&&!reducedMotion?53:51,3,dt);
    camera.lookAt(cameraTarget);
    const width=canvas.clientWidth,height=canvas.clientHeight;
    if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);
    if(document.querySelector('.character-card').getBoundingClientRect().bottom>0)preview?.draw(time/1000);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
