import test from 'node:test';
import assert from 'node:assert/strict';
import {introState} from '../intro-timeline.js';
test('doll lands and prepares before protection reaches either ghost',()=>{
  const ready=introState(2.04);assert.equal(ready.arrival,1);assert.equal(ready.protect,1);assert.ok(ready.ghosts.every(g=>!g.hit));
  assert.ok(introState(1.5).landing>0);
  const first=introState(2.4);assert.ok(first.ghosts[0].hit);assert.equal(first.ghosts[1].hit,false);
  assert.ok(introState(2.7).ghosts.every(g=>g.hit));
});
test('relief follows impacts and reduced motion has no ghosts or traveling pulses',()=>{
  assert.equal(introState(2.7).relief,0);const final=introState(4);assert.equal(final.relief,1);assert.equal(final.wave,1);
  assert.ok(final.ghosts.every(g=>g.dissolve===1&&!g.pulseVisible&&!g.burstVisible));
  assert.deepEqual(introState(0,true),final);
});
