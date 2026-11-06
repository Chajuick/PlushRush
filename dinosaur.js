import * as THREE from 'three';

// Handmade plush model: +Z is the face, all proportions are local to the toy.
export function createDinosaur({ color = '#9dce9a' } = {}) {
  const root = new THREE.Group();
  const fabricCanvas = document.createElement('canvas');
  fabricCanvas.width = fabricCanvas.height = 128;
  const brush = fabricCanvas.getContext('2d');
  brush.fillStyle = '#b7b7b7'; brush.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 4) for (let x = 0; x < 128; x += 4) {
    brush.fillStyle = (x + y) % 8 ? '#a6a6a6' : '#cccccc';
    brush.fillRect(x, y, 1, 3);
  }
  const weave = new THREE.CanvasTexture(fabricCanvas);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(4, 4);
  const fabric = color => new THREE.MeshPhysicalMaterial({ color, roughness: 0.93, bumpMap: weave, bumpScale: 0.025, sheen: 0.8, sheenColor: '#fff6dc', sheenRoughness: 0.9 });
  const green = fabric(color), cream = fabric('#fff0ce'), pink = fabric('#efa9a4'), sage = fabric('#6da583');
  const dark = new THREE.MeshStandardMaterial({color:'#293d38', roughness:0.38});
  const white = new THREE.MeshBasicMaterial({color:'#fffdf4'});
  function oval(parent, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), material);
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  const body = new THREE.Group(); root.add(body);
  oval(body, green, [0, 1.18, 0], [0.87, 1.04, 0.67]);
  oval(body, cream, [0, 0.82, 0.55], [0.54, 0.48, 0.18]);
  for (const side of [-1, 1]) {
    oval(body, dark, [side * 0.29, 1.72, 0.534], [0.10, 0.12, 0.057]);
    oval(body, white, [side * 0.29 - 0.018, 1.751, 0.576], [0.025, 0.029, 0.014]);
    oval(body, pink, [side * 0.43, 1.47, 0.575], [0.115, 0.055, 0.018]);
  }
  const smile = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.09,1.40,0.651),new THREE.Vector3(0,1.36,0.667),new THREE.Vector3(0.09,1.40,0.651)]);
  body.add(new THREE.Mesh(new THREE.TubeGeometry(smile,16,0.012,6,false),dark));
  const arms = [], feet = [];
  for (const side of [-1,1]) {
    const arm = oval(body, green, [side * 0.79, 1.02, 0.13], [0.21, 0.36, 0.24]);
    arm.rotation.z = side * 0.42; arms.push(arm);
    feet.push(oval(root, green, [side * 0.43,0.24,0.12],[0.31,0.24,0.43]));
    oval(feet.at(-1), cream, [0,-0.05,0.83], [0.67,0.52,0.19]);
  }
  const tail = oval(body, green, [0,0.67,-0.72],[0.35,0.29,0.65]); tail.rotation.x = -0.3;
  for (const [y,z,size] of [[2.20,-0.08,0.22],[1.97,-0.49,0.23],[1.59,-0.63,0.23],[1.17,-0.68,0.21],[0.79,-0.99,0.17]]) {
    const spike = new THREE.Mesh(new THREE.SphereGeometry(size,16,12),cream);
    spike.position.set(0,y,z); spike.rotation.x = -0.65; spike.rotation.y = Math.PI/2;
    spike.scale.set(.7,1.25,1); spike.castShadow = true; body.add(spike);
  }
  // Discrete stitches trace the side seams instead of drawing a hard outline.
  for (const side of [-1,1]) for(let i=0;i<14;i++) {
    const angle = -1.0 + i*0.14;
    const stitch = oval(body, sage,[side*0.85*Math.cos(angle),1.18+0.98*Math.sin(angle),0.14],[0.025,0.012,0.014]);
    stitch.rotation.z = side*angle;
  }
  // Short raised stitches follow the cream belly patch, like a sewn applique.
  for (let i=0;i<30;i++) {
    const a=i/30*Math.PI*2;
    const stitch=oval(body,cream,[Math.cos(a)*.49,.82+Math.sin(a)*.435,.66],[.026,.010,.013]);
    stitch.rotation.z=a+Math.PI/2;
  }
  root.userData.animate = (time, running, airborne) => {
    const stride = running && !airborne ? Math.sin(time*13) : 0;
    body.position.y = running && !airborne ? Math.abs(stride)*0.07 : Math.sin(time*2.3)*0.025;
    body.rotation.z = stride*0.035;
    feet.forEach((foot,i)=>{foot.rotation.x=stride*(i?1:-1)*0.45;});
    arms.forEach((arm,i)=>{arm.rotation.x=airborne?-0.7:stride*(i?1:-1)*0.35;});
  };
  return root;
}

export function createCharacterView(canvas, { preview = false } = {}) {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled = preview;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000,0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.5,2.5,2.9,-0.7,0.1,1000);
  camera.position.set(0,2.5,9); camera.lookAt(0,1.1,0);
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x779a86,2.5));
  const key = new THREE.DirectionalLight(0xfff2de,3.2); key.position.set(-3,6,5); key.castShadow=preview;
  key.shadow.mapSize.set(1024,1024); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8eaff,1.2); fill.position.set(4,3,-4);scene.add(fill);
  const character = createDinosaur(); scene.add(character);
  if(preview) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0.12}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  }
  let angle = -0.33;
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
