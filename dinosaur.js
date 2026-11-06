import * as THREE from 'three';

let sharedGeometry, sharedBump, sharedFibers;
const colorTextures = new Map();
function plushTexture(color) {
  if (colorTextures.has(color)) return colorTextures.get(color);
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
  const c = canvas.getContext('2d');
  c.fillStyle = color; c.fillRect(0,0,1024,1024);
  let seed=817; const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  // Dense, short fibers, without the regular grid pattern of the initial prototype.
  for(let i=0;i<24000;i++) {
    const x=random()*1024,y=random()*1024;
    c.strokeStyle=i%2?'rgba(255,255,225,.19)':'rgba(38,72,45,.09)';
    c.lineWidth=1.1;c.beginPath();c.moveTo(x,y);c.lineTo(x+(random()-.5)*2,y+2+random()*5);c.stroke();
  }
  // The belly is painted into the continuous surface, not a protruding sphere.
  c.fillStyle='#f4e7c8';c.beginPath();c.moveTo(512,526);c.bezierCurveTo(615,516,626,654,602,730);c.bezierCurveTo(578,824,437,821,419,730);c.bezierCurveTo(395,646,413,531,512,526);c.fill();
  c.strokeStyle='#bbaa86';c.lineWidth=3.3;c.setLineDash([7,7]);c.beginPath();c.ellipse(512,662,91,130,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
  // Soft embroidered blush integrated into the face.
  for(const side of [-1,1]) {
    const x=512+side*80,y=407;
    const g=c.createRadialGradient(x,y,0,x,y,25);g.addColorStop(0,'rgba(225,139,137,.85)');g.addColorStop(1,'rgba(225,139,137,0)');
    c.fillStyle=g;c.fillRect(x-26,y-26,52,52);
    c.strokeStyle='#f0b8a8';c.lineWidth=1.2;
    for(let i=0;i<4;i++){c.beginPath();c.moveTo(x-9+i*5,y-5);c.lineTo(x-12+i*5,y+5);c.stroke();}
  }
  c.strokeStyle='#466657';c.lineWidth=1.2;c.setLineDash([4,7]);
  for(const x of [264,760]){c.beginPath();c.moveTo(x,90);c.bezierCurveTo(x-15,340,x+15,690,x,930);c.stroke();}
  c.setLineDash([]);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  colorTextures.set(color,texture);return texture;
}
function geometry() {
  if(sharedGeometry)return sharedGeometry;
  const g=new THREE.SphereGeometry(1,64,48),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){
    const u=uv.getX(i),theta=(1-uv.getY(i))*Math.PI,a=u*Math.PI*2;
    const pear=1-.12*Math.cos(theta),r=Math.sin(theta);
    p.setXYZ(i,-Math.sin(a)*r*.98*pear,1.17+Math.cos(theta)*1.01,-Math.cos(a)*r*.69*pear);
  }
  g.computeVertexNormals();sharedGeometry=g;return g;
}
function bumpTexture(){
  if(sharedBump)return sharedBump;
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  let seed=29;for(let i=0;i<16384;i++){seed=(seed*16807)%2147483647;const value=100+seed%55;x.fillStyle=`rgb(${value},${value},${value})`;x.fillRect(i%128,Math.floor(i/128),1,1);}
  sharedBump=new THREE.CanvasTexture(c);sharedBump.wrapS=sharedBump.wrapT=THREE.RepeatWrapping;sharedBump.repeat.set(9,9);return sharedBump;
}
export function createDinosaur({color='#8ebc94'}={}) {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const fabric=new THREE.MeshPhysicalMaterial({color:0xffffff,map:plushTexture(color),bumpMap:bumpTexture(),bumpScale:.026,roughness:.92,sheen:1,sheenColor:'#e4efcc',sheenRoughness:.8});
  const limbMaterial=new THREE.MeshPhysicalMaterial({color,bumpMap:bumpTexture(),bumpScale:.014,roughness:.94,sheen:.9,sheenColor:'#e0edc8'});
  const golden=new THREE.MeshPhysicalMaterial({color:'#e7c978',roughness:.94,bumpMap:bumpTexture(),bumpScale:.012,sheen:.7});
  const dark=new THREE.MeshPhysicalMaterial({color:'#283d32',roughness:.12,clearcoat:1,clearcoatRoughness:.12});
  function oval(parent,material,pos,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const torso=new THREE.Mesh(geometry(),fabric);torso.castShadow=true;torso.receiveShadow=true;body.add(torso);
  // Short pile follows the surface normal. One batched line draw adds a soft contour.
  if(!sharedFibers){
    const positions=[];let seed=371;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<4500;i++){
      const theta=Math.acos(2*rand()-1),a=rand()*Math.PI*2,r=Math.sin(theta),pear=1-.12*Math.cos(theta);
      const pos=new THREE.Vector3(-Math.sin(a)*r*.98*pear,1.17+Math.cos(theta)*1.01,-Math.cos(a)*r*.69*pear);
      const normal=new THREE.Vector3(pos.x/.9604,(pos.y-1.17)/1.0201,pos.z/.4761).normalize();
      const end=pos.clone().addScaledVector(normal,.006+rand()*.012);positions.push(...pos,...end);
    }
    sharedFibers=new THREE.BufferGeometry();sharedFibers.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  }
  const pile=new THREE.LineSegments(sharedFibers,new THREE.LineBasicMaterial({color,transparent:true,opacity:.28}));body.add(pile);
  // Features follow the surface curvature, eliminating floating eyes and cheeks.
  const faceZ=(x,y)=>{const t=Math.acos((y-1.17)/1.01),r=Math.sin(t),w=.98*(1-.12*Math.cos(t))*r;return .69*(1-.12*Math.cos(t))*r*Math.sqrt(Math.max(0,1-x*x/(w*w)));};
  const eyes=[];
  for(const side of [-1,1]) {
    const x=side*.30,y=1.60,z=faceZ(x,y);
    const eye=oval(body,dark,[x,y,z+.023],[.094,.118,.048]);eye.rotation.y=side*.3;eyes.push(eye);
    oval(eye,new THREE.MeshBasicMaterial({color:'#fff8e7'}),[-.26,.30,.84],[.23,.24,.15]);
  }
  const smilePoints=[[-.115,1.38],[-.065,1.335],[0,1.325],[.065,1.34],[.115,1.40]].map(([x,y])=>new THREE.Vector3(x,y,faceZ(x,y)+.012));
  const smile=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints),24,.012,6,false),new THREE.MeshStandardMaterial({color:'#425744',roughness:1}));body.add(smile);
  const arms=[],feet=[];
  for(const side of [-1,1]) {
    const pivot=new THREE.Group();pivot.position.set(side*.80,.94,.04);body.add(pivot);
    const arm=oval(pivot,limbMaterial,[side*.10,-.12,.04],[.21,.31,.23]);arm.rotation.z=side*.25;arms.push(pivot);
    const foot=new THREE.Group();foot.position.set(side*.43,.23,.13);root.add(foot);feet.push(foot);
    oval(foot,limbMaterial,[0,0,0],[.265,.25,.31]);
    oval(foot,new THREE.MeshStandardMaterial({color:'#b9c99c',roughness:1}),[0,-.13,.12],[.185,.06,.15]);
  }
  // A broad curved base sinks inside the rump; the tip curls gently upward.
  const tailVertices=[],tailUV=[],tailIndices=[];
  const tailRings=18,tailSides=20;
  for(let i=0;i<=tailRings;i++){
    const t=i/tailRings,r=.31*Math.pow(1-t,.75)+.008;
    const center=new THREE.Vector3(.14*t*t,.60-.10*t+.23*t*t,-.43-.83*t);
    for(let j=0;j<=tailSides;j++){
      const a=j/tailSides*Math.PI*2;
      tailVertices.push(center.x+Math.cos(a)*r,center.y+Math.sin(a)*r*.85,center.z);
      tailUV.push(j/tailSides,t);
      if(i<tailRings&&j<tailSides){const k=i*(tailSides+1)+j;tailIndices.push(k,k+tailSides+1,k+1,k+1,k+tailSides+1,k+tailSides+2);}
    }
  }
  const tipIndex=tailVertices.length/3;tailVertices.push(.14,.73,-1.26);tailUV.push(.5,1);
  for(let j=0;j<tailSides;j++){const k=tailRings*(tailSides+1)+j;tailIndices.push(k,tipIndex,k+1);}
  const tailGeometry=new THREE.BufferGeometry();tailGeometry.setAttribute('position',new THREE.Float32BufferAttribute(tailVertices,3));tailGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(tailUV,2));tailGeometry.setIndex(tailIndices);tailGeometry.computeVertexNormals();
  const tail=new THREE.Mesh(tailGeometry,limbMaterial);tail.castShadow=true;body.add(tail);
  // Soft stuffed scallops, with the broad base embedded in the spine.
  for(const [y,z,sx,sy,sz] of [[2.17,-.14,.115,.20,.19],[1.94,-.45,.12,.22,.20],[1.61,-.62,.12,.22,.22],[1.26,-.70,.11,.20,.21],[.94,-.77,.10,.16,.19]]){
    oval(body,golden,[0,y,z],[sx,sy,sz]);
  }
  root.userData.protectionOrigin=(target)=>{
    root.updateWorldMatrix(true,true);
    const right=arms[1].localToWorld(new THREE.Vector3(0,-.1,.1));
    return target.copy(right).add(new THREE.Vector3(0,0,.25).applyQuaternion(root.quaternion).multiplyScalar(root.scale.x));
  };
  root.userData.pose=({protect=0,land=0,wave=0,cheer=0}={})=>{
    arms.forEach((arm,i)=>{arm.position.x=(i?1:-1)*(.8-cheer*.12);arm.position.y=.94+protect*.38+cheer*.7;arm.rotation.x-=protect*.95+cheer*.2;arm.rotation.z=(i?1:-1)*(protect*1.25+wave*.3+cheer*2.3);if(i===1)arm.rotation.x-=wave*.65;});
    body.scale.y*=1-land*.14;body.scale.x*=1+land*.08;body.scale.z*=1+land*.08;
    body.rotation.y=protect*.18;body.rotation.z+=wave*.045;
  };
  root.userData.animate=(time,running,airborne)=>{
    const stride=running&&!airborne?Math.sin(time*12):0;
    const breath=Math.sin(time*2.1)*.012;
    body.position.y=running&&!airborne?Math.abs(stride)*.075:breath;
    body.scale.set(1-breath*.2,1+breath*.3,1-breath*.2);body.rotation.z=stride*.025;
    feet.forEach((f,i)=>{f.rotation.x=stride*(i?1:-1)*.48;f.position.y=.23+Math.max(0,stride*(i?1:-1))*.1;});
    arms.forEach((a,i)=>{a.rotation.x=airborne?-.8:stride*(i?1:-1)*.38;});
    const blinkPhase=(time+2)%5;const blink=blinkPhase>4.7?Math.sin((blinkPhase-4.7)/.3*Math.PI):0;eyes.forEach(e=>{e.scale.y=.118*(1-blink*.85);});
    tail.rotation.z=stride*.05;
  };
  return root;
}

export function createCharacterView(canvas, { preview = false } = {}) {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled = preview;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.setClearColor(0x000000,0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.5,2.5,2.9,-0.7,0.1,1000);
  camera.position.set(0,2.2,9); camera.lookAt(0,1.1,0);
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x779a86,1.5));
  const key = new THREE.DirectionalLight(0xfff2de,2.0); key.position.set(-3,6,5); key.castShadow=preview;
  key.shadow.mapSize.set(1024,1024); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8eaff,.9); fill.position.set(4,3,-4);scene.add(fill);
  const character = createDinosaur(); scene.add(character);
  if(preview) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0.12}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  }
  let angle = -0.72;
  if(preview) {
    let drag;
    canvas.addEventListener('pointerdown',e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(drag!==undefined){angle+=(e.clientX-drag)*0.012;drag=e.clientX;}});
    const release=()=>{drag=undefined;};
    canvas.addEventListener('pointerup',release); canvas.addEventListener('pointercancel',release);
  }
  return {
    draw(time, {running=false, jump=0}={}) {
      const width=canvas.clientWidth, height=canvas.clientHeight;
      if(!width || !height)return;
      if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
      if(preview) {
        const aspect=width/height;
        camera.left=-1.8*aspect;camera.right=1.8*aspect;camera.top=1.8;camera.bottom=-1.8;
        character.rotation.y=angle+Math.sin(time*0.4)*0.06;
      } else {
        camera.left=0;camera.right=960;camera.top=400;camera.bottom=0;
        camera.position.set(0,0,200);camera.lookAt(0,0,0);
        character.scale.setScalar(32); character.position.set(168,78+jump,0); character.rotation.y=0.4;
      }
      camera.updateProjectionMatrix();
      character.userData.animate(time,running,jump>0);
      renderer.render(scene,camera);
    }
  };
}
