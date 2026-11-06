import test from 'node:test';
import assert from 'node:assert/strict';
import { openingShot } from '../camera-motion.js';
test('opening camera rises, pushes in, arcs, and settles without replaying',()=>{
  const start=openingShot(0), push=openingShot(1.25), arc=openingShot(2.7), end=openingShot(4);
  assert.ok(push.position[1]>start.position[1]);
  assert.ok(arc.position[2]<start.position[2]);
  assert.ok(start.position[0]<0&&arc.position[0]>0);
  assert.deepEqual(openingShot(400),end);
  assert.equal(end.progress,1);
});
test('shot boundaries are continuous and all sampled values finite',()=>{
  for(const time of [1.25,2.7,4]){
    const before=openingShot(time-.001),after=openingShot(time+.001);
    assert.ok(Math.hypot(...before.position.map((v,i)=>v-after.position[i]))<.01);
  }
  for(let t=0;t<=4;t+=.01)for(const value of [...openingShot(t).position,...openingShot(t).target])assert.ok(Number.isFinite(value));
});
test('mobile retains the shot but increases framing distance; reduced motion is stationary',()=>{
  assert.ok(openingShot(2,{mobile:true}).position[2]>openingShot(2).position[2]);
  assert.deepEqual(openingShot(0,{reduced:true}),openingShot(4,{reduced:true}));
});

test('opening camera eases to rest instead of snapping to a stop',()=>{
  const end=openingShot(4),near=openingShot(3.999);
  assert.ok(Math.hypot(...end.position.map((v,i)=>v-near.position[i]))<.00001);
});
