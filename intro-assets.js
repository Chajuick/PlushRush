import * as THREE from 'three';

const sphere = new THREE.SphereGeometry(1, 24, 18);
const woolGeometry = new THREE.SphereGeometry(1, 16, 12);
const cream = new THREE.MeshPhysicalMaterial({color:'#fff4d8', roughness:1, sheen:.8, sheenColor:'#ffedce'});
const warmWool = new THREE.MeshPhysicalMaterial({color:'#eee3c9', roughness:1, sheen:.8, sheenColor:'#fff4de'});
const charcoal = new THREE.MeshStandardMaterial({color:'#3c404c', roughness:.94});
const black = new THREE.MeshStandardMaterial({color:'#1c2230', roughness:.7});
const eyeWhite = new THREE.MeshStandardMaterial({color:'#fffaf0', roughness:.45});
function oval(parent, geometry, material, x,y,z, sx,sy,sz) {
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function curve(parent, points, radius, material) {
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,5,false),material);
  parent.add(mesh);return mesh;
}

/** A toy sheep faces +Z, feet rest at local y=0. Base bounds ~1.2×1.45×1.9. */
export function createSheep() {
  const root=new THREE.Group(), body=new THREE.Group();root.add(body);
  const legs=[];
  for(const side of [-1,1]) for(const z of [-.45,.42]) {
    const pivot=new THREE.Group();pivot.position.set(side*.29,.52,z);root.add(pivot);
    oval(pivot,sphere,charcoal,0,-.24,0,.09,.28,.10);
    oval(pivot,sphere,black,0,-.43,.035,.115,.08,.14);legs.push(pivot);
  }
  // An elongated center keeps the silhouette animal-like; overlapping wool lobes
  // follow that center instead of looking like a bunch of disconnected balls.
  oval(body,sphere,warmWool,0,.86,-.08,.50,.46,.72);
  for(let ring=0;ring<5;ring++) {
    const z=-.64+ring*.28;
    for(let j=0;j<7;j++) {
      const a=j/7*Math.PI*2+ring*.22;
      const size=.205+Math.sin(ring*4+j*2)*.018;
      oval(body,woolGeometry,(ring+j)%3?cream:warmWool,
        Math.cos(a)*.40,.88+Math.sin(a)*.33,z,size,size*.96,size*1.1);
    }
  }
  const neck=new THREE.Group();neck.position.set(0,1.01,.57);body.add(neck);
  oval(neck,sphere,charcoal,0,0,.14,.29,.36,.35);
  oval(neck,sphere,charcoal,0,-.15,.29,.245,.235,.23);
  for(const side of [-1,1]) {
    const ear=oval(neck,sphere,charcoal,side*.33,.11,.04,.18,.075,.11);ear.rotation.z=side*.35;
    oval(neck,sphere,eyeWhite,side*.14,.06,.43,.07,.083,.03);
    oval(neck,sphere,black,side*.14,.055,.455,.033,.048,.018);
    oval(neck,sphere,black,side*.075,-.16,.495,.022,.016,.01);
  }
  for(let j=0;j<5;j++) {
    const a=j/5*Math.PI*2;
    oval(neck,woolGeometry,cream,Math.cos(a)*.19,.32+Math.sin(a)*.045,Math.sin(a)*.12+.05,.16,.14,.16);
  }
  const tail=oval(body,woolGeometry,cream,0,.99,-.90,.16,.18,.19);tail.rotation.x=-.4;
  root.userData.animate=(time,speed=1)=>{
    const cycle=time*7*Math.max(.25,speed), hop=Math.max(0,Math.sin(cycle));
    body.position.y=hop*.10;body.rotation.x=Math.sin(cycle)*.025;
    legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(cycle+(i===0||i===3?0:Math.PI))*.40;});
    neck.rotation.z=Math.sin(time*1.8)*.04;
    tail.rotation.x=-.4+Math.sin(cycle)*.1;
  };
  return root;
}

/** Bed along local Z. Pillow/head at z=-2; blanket extends toward feet z=3.
 * Head faces +Y for the opening overhead camera. No skin-colored portrait. */
export function createSleeper() {
  const root=new THREE.Group();
  const mattressMaterial=new THREE.MeshStandardMaterial({color:'#a7a9bb',roughness:1});
  const pillowMaterial=new THREE.MeshPhysicalMaterial({color:'#c3c7d5',roughness:1,sheen:.5,sheenColor:'#d8dded'});
  const blanketMaterial=new THREE.MeshPhysicalMaterial({color:'#303f68',roughness:1,sheen:.7,sheenColor:'#7683a2',side:THREE.DoubleSide});
  const edgeMaterial=new THREE.MeshStandardMaterial({color:'#526488',roughness:1});
  const silhouetteMaterial=new THREE.MeshStandardMaterial({color:'#202532',roughness:1});
  const faceMaterial=new THREE.MeshBasicMaterial({color:'#a6aabd',transparent:true,opacity:.80});
  // Squared cushion forms with smoothly rounded corners (superellipse sphere).
  function cushion(material,x,y,z,sx,sy,sz) {
    const g=new THREE.SphereGeometry(1,32,24),p=g.attributes.position;
    for(let i=0;i<p.count;i++) {
      const a=p.getX(i),b=p.getY(i),c=p.getZ(i);
      p.setXYZ(i,Math.sign(a)*Math.pow(Math.abs(a),.44),b,Math.sign(c)*Math.pow(Math.abs(c),.44));
    }
    g.computeVertexNormals();return oval(root,g,material,x,y,z,sx,sy,sz);
  }
  cushion(mattressMaterial,0,-.20,.25,1.55,.27,3.55);
  cushion(pillowMaterial,0,.20,-2.02,1.12,.20,.83);
  const head=oval(root,sphere,silhouetteMaterial,0,.65,-2.03,.48,.24,.57);
  // A dark hair cap and visible side ears complete a silhouette, not a portrait.
  oval(root,sphere,silhouetteMaterial,0,.68,-2.24,.49,.235,.42);
  for(const side of [-1,1])oval(root,sphere,silhouetteMaterial,side*.46,.63,-2.02,.08,.10,.12);
  oval(root,sphere,silhouetteMaterial,0,.41,-1.41,.20,.13,.25);
  const breathing=new THREE.Group();root.add(breathing);
  const g=new THREE.PlaneGeometry(2.70,4.35,28,40),p=g.attributes.position;
  // Authored broad body mound and flowing folds rather than a box over the bed.
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getY(i)+.92;
    const middle=Math.max(0,1-Math.pow(x/1.36,2));
    const torso=.30*Math.exp(-Math.pow((z+.15)/1.5,2))*middle;
    const feet=.18*Math.exp(-Math.pow((z-2.55)/.6,2))*middle;
    const fold=Math.sin(x*7+z*.8)*.035*middle + Math.sin(z*5+x*1.3)*.02;
    p.setXYZ(i,x,.38+torso+feet+fold,z);
  }
  g.computeVertexNormals();const blanket=new THREE.Mesh(g,blanketMaterial);blanket.castShadow=true;blanket.receiveShadow=true;breathing.add(blanket);
  // Folded top cuff makes the division between shoulders and blanket readable.
  const cuffPoints=[];
  for(let i=0;i<=20;i++) {
    const x=-1.34+i/20*2.68,mid=Math.max(0,1-x*x/(1.36*1.36));
    cuffPoints.push([x,.43+.20*mid+Math.sin(x*7)*.015,-1.20]);
  }
  curve(breathing,cuffPoints,.045,edgeMaterial);
  for(const side of [-1,1]) {
    const points=[];
    for(let i=0;i<=20;i++)points.push([side*1.33,.39+Math.sin(i*.7)*.008,-1.20+i/20*4.3]);
    curve(breathing,points,.016,edgeMaterial);
  }
  const eyes=[],brows=[];
  function faceY(x,z){return .65+.24*Math.sqrt(Math.max(0,1-x*x/(.48*.48)-(z+2.03)*(z+2.03)/(.57*.57)))+.009;}
  for(const side of [-1,1]) {
    const cx=side*.19,ez=-1.97;
    const eyePoints=[];
    for(let i=0;i<5;i++) {
      const x=cx-.075+i*.0375,z=ez+.024*Math.sin(i/4*Math.PI);
      eyePoints.push([x,faceY(x,z),z]);
    }
    const eye=curve(root,eyePoints,.008,faceMaterial);eyes.push(eye);
    const browPoints=[];
    for(let i=0;i<5;i++) {
      const x=cx-.08+i*.04,z=-2.115-.016*Math.sin(i/4*Math.PI);
      browPoints.push([x,faceY(x,z)+.002,z]);
    }
    const brow=curve(root,browPoints,.009,faceMaterial);brows.push({mesh:brow,side,cx});
  }
  const mouthPoints=[];
  for(let i=0;i<5;i++){const x=-.055+i*.0275,z=-1.75+.015*Math.sin(i/4*Math.PI);mouthPoints.push([x,faceY(x,z),z]);}
  const mouth=curve(root,mouthPoints,.006,faceMaterial);
  let distress=0,lastExpression=-1;
  root.userData.setDistress=(strength)=>{
    distress=THREE.MathUtils.clamp(strength,0,1);
    if(Math.abs(distress-lastExpression)<.025)return;
    lastExpression=distress;
    // Rebuild only on changed expression; the curve remains fitted to the head.
    for(const {mesh,side,cx} of brows) {
      const points=[];
      for(let i=0;i<5;i++) {
        const x=cx-.08+i*.04;
        const z=-2.115-.016*Math.sin(i/4*Math.PI)-side*(x-cx)*distress*.7;
        points.push([x,faceY(x,z)+.006,z]);
      }
      mesh.geometry.dispose();mesh.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,.009,5,false);
    }
    const mouthPoints=[];
    for(let i=0;i<5;i++){
      const x=-.055+i*.0275,z=-1.75+(.015-.032*distress)*Math.sin(i/4*Math.PI);
      mouthPoints.push(new THREE.Vector3(x,faceY(x,z),z));
    }
    mouth.geometry.dispose();mouth.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints),16,.006,5,false);
    mouth.scale.x=1+distress*.25;
    head.rotation.z=distress*.025;
  };
  root.userData.animate=(time)=>{
    breathing.scale.y=1+Math.sin(time*(distress>.5?3.8:1.7))*(distress>.5?.025:.012);
  };
  root.userData.headPosition=new THREE.Vector3(0,.9,-2.03);
  root.userData.blanketPosition=new THREE.Vector3(0,.7,1.5);
  root.userData.bounds={width:3.1,length:7.1,height:1};
  return root;
}
