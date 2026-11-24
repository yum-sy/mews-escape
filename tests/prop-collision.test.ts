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

import {MOVES} from '../src/moves';
import {weaponProfile} from '../src/weapons';
import {overlapsBlock} from '../src/lab';
test('every ordered two-move combination and stacked carrier breaks a prop before its solid collision stops the attack',()=>{
 const ids=MOVES.filter(m=>m.id!=='survey').map(m=>m.id);
 const builds=[[],...ids.map(id=>[id]),...ids.flatMap(a=>ids.map(b=>[a,b])),...ids.map(id=>['tri','swift','ricochet','shadow','flame','poison',id])];
 for(const build of builds)for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*3/4]){
  const a=composeAttack(build),o={x:prop.x-Math.cos(angle)*110,y:prop.y-Math.sin(angle)*110};
  if(weaponProfile(a).kind!=='projectile'){assert.ok(pathHitsProp(prop,traceWeapon(o,angle,a,[],[propBlock(prop)],bounds).points),build.join('+'));continue}
  let p=o,broken=false;
  for(let frame=0;frame<120;frame++){const q={x:p.x+Math.cos(angle)*a.speed/60,y:p.y+Math.sin(angle)*a.speed/60};broken=pathHitsProp(prop,[{...p,width:a.size},{...q,width:a.size}]);if(broken)break;if(overlapsBlock(q,a.size,propBlock(prop)))break;p=q}
  assert.ok(broken,build.join('+'));
 }
});
