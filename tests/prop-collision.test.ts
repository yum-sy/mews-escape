import test from 'node:test';
import assert from 'node:assert/strict';
import {pathHitsProp,propBlock} from '../src/environment';
import {traceWeapon} from '../src/weapons';
import {composeAttack} from '../src/moves';
const prop={x:400,y:350},bounds={left:0,right:1100,top:0,bottom:700};
test('all channel weapons break props at stopped contact, including corner grazes and point-blank starts',()=>{
 for(const move of ['icebeam','flamethrower','water','drain','psybeam','thunderbolt'])for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){
  const attack=composeAttack([move]);const origin={x:prop.x-Math.cos(angle)*140,y:prop.y-Math.sin(angle)*140};
  const path=traceWeapon(origin,angle,attack,[],[propBlock(prop)],bounds);
  assert.ok(pathHitsProp(prop,path.points),`${move} ${angle}`);
 }
 const a=composeAttack(['icebeam']);const p=traceWeapon({x:365,y:324},0,a,[],[propBlock(prop)],bounds);assert.ok(pathHitsProp(prop,p.points));
 assert.ok(pathHitsProp(prop,[{x:375,y:326,width:1}]));
});
test('projectile corner impacts break the same solid rectangle and genuine misses do not',()=>{
 assert.ok(pathHitsProp(prop,[{x:360,y:325,width:3},{x:378,y:325,width:3}]));
 assert.equal(pathHitsProp(prop,[{x:360,y:310,width:3},{x:440,y:310,width:3}]),false);
});
test('a permanent wall still occludes props behind it',()=>{
 const path=traceWeapon({x:100,y:350},0,composeAttack(['icebeam']),[],[{x:250,y:350,w:50,h:100},propBlock(prop)],bounds);
 assert.equal(pathHitsProp(prop,path.points),false);
});
