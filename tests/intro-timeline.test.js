import test from 'node:test';
import assert from 'node:assert/strict';
import {introState,INTRO_DURATION} from '../intro-timeline.js';
test('black fades to peaceful sleep, then a sunny sheep meadow before the storm',()=>{
 assert.equal(introState(0).fade,1);assert.equal(introState(1).fade,0);
 assert.equal(introState(1.5).distress,0);assert.equal(introState(3.2).rise,1);assert.equal(introState(3.2).storm,0);
 assert.ok(introState(4.3).storm>.9);assert.ok(introState(4.3).distress>0);assert.ok(introState(4.05).thunder>0);
});
test('ghosts arrive before dolls; shock sends ghosts flying and each pops after flight',()=>{
 const haunted=introState(4.9);assert.ok(haunted.ghosts.some(g=>g.spawn>0));assert.equal(haunted.arrival,0);
 assert.ok(introState(5.8).arrival>.99);assert.equal(introState(5.8).ghosts[0].flight,0);
 const first=introState(6.4);assert.ok(first.shock>0);assert.ok(first.ghosts[0].flight>0);assert.equal(first.ghosts[1].flight,0);
 const pop=introState(7.05);assert.ok(pop.ghosts[0].burstVisible);assert.equal(pop.ghosts[0].visible,false);
});
test('logo follows all impacts; final/reduced state is peaceful and stable',()=>{
 assert.equal(introState(7.6).logo,0);const final=introState(INTRO_DURATION);
 assert.equal(final.logo,1);assert.equal(final.distress,0);assert.equal(final.storm,0);assert.equal(final.fade,0);
 assert.ok(final.ghosts.every(g=>!g.visible&&!g.burstVisible));assert.deepEqual(introState(0,true),final);
});
