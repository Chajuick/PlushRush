import test from 'node:test';
import assert from 'node:assert/strict';
import {openingShot} from '../camera-motion.js';
import {INTRO_DURATION} from '../intro-timeline.js';
test('camera tracks from blanket to pillow before rising into the dream',()=>{
 const foot=openingShot(.15),head=openingShot(1.65),dream=openingShot(3);
 assert.ok(head.position[2]<foot.position[2]);assert.ok(head.target[2]<foot.target[2]);
 assert.ok(dream.position[1]>head.position[1]+4);assert.ok(dream.target[1]>head.target[1]);
});
test('camera transitions are continuous with finite coordinates and a stable final shot',()=>{
 for(const time of [1.65,2.75,4.75,7.7]){
  const a=openingShot(time-.001),b=openingShot(time+.001);
  assert.ok(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.05);
 }
 for(let t=0;t<=INTRO_DURATION;t+=.05)for(const value of [...openingShot(t).position,...openingShot(t).target])assert.ok(Number.isFinite(value));
 assert.deepEqual(openingShot(100),openingShot(INTRO_DURATION));
});
test('mobile framing and reduced motion keep final dream readable',()=>{
 assert.ok(openingShot(3,{mobile:true}).position[2]>openingShot(3).position[2]);
 assert.deepEqual(openingShot(0,{reduced:true}),openingShot(INTRO_DURATION,{reduced:true}));
});
