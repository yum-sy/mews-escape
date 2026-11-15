import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeAttack,splitAttack,MOVES} from '../src/moves';
import {traceWeapon,weaponProfile,tickAttack} from '../src/weapons';
const bounds={left:0,right:1000,top:0,bottom:700},origin={x:100,y:350};
const target=(id:number,x:number,y=350)=>({id,x,y,radius:12});
test('flame, beam, water, tether, pulse and electricity use different attack mechanics',()=>{
 assert.equal(weaponProfile(composeAttack(['flamethrower'])).kind,'flame');assert.equal(weaponProfile(composeAttack(['icebeam'])).kind,'beam');
 assert.equal(weaponProfile(composeAttack(['water'])).kind,'water');assert.equal(weaponProfile(composeAttack(['drain'])).kind,'tether');
 assert.equal(weaponProfile(composeAttack(['psybeam'])).held,false);assert.equal(weaponProfile(composeAttack(['thunderbolt'])).kind,'arc');
 assert.equal(weaponProfile(composeAttack(['ice'])).pellets,3);assert.equal(weaponProfile(composeAttack(['flame'])).pellets,2);
 assert.ok(weaponProfile(composeAttack(['sludge'])).speed<1);assert.ok(weaponProfile(composeAttack(['poison'])).speed>1);
});
test('continuous attacks and pulse volleys preserve direct DPS, support modifiers and split limits',()=>{
 for(const move of MOVES){const a=composeAttack(['tri','agility','flame','poison','spark','drain','split',move.id]),p=weaponProfile(a),tick=tickAttack(a);
  assert.ok(Math.abs(tick.damage/p.interval-a.damage/a.interval)<1e-10);
  for(const key of ['burn','slow','poison','chain','lifesteal','pierce','split','bounce'] as const)assert.equal(tick[key],a[key]);
  const child=splitAttack(tick);assert.equal(child.chain,0);assert.equal(child.lifesteal,0);assert.equal(child.blast,0);
 }
});
test('flame has a growing short cone; ice beam is narrow and long',()=>{
 const flame=composeAttack(['flamethrower']),beam=composeAttack(['icebeam']);
 const f=traceWeapon(origin,0,flame,[target(1,280,380),target(2,600)],[],bounds),b=traceWeapon(origin,0,beam,[target(1,280,380),target(2,600)],[],bounds);
 assert.deepEqual(f.hits,[1]);assert.deepEqual(b.hits,[2]);assert.ok(f.points.at(-1)!.x<400);assert.ok(b.points.at(-1)!.x>800);assert.ok(f.points.at(-1)!.width>beam.size*3);
});
test('beam collision stops at furniture and at its penetration budget, independent of enemy array order',()=>{
 const a=composeAttack(['icebeam']),enemies=[target(3,800),target(2,600),target(1,300)];
 assert.deepEqual(traceWeapon(origin,0,a,enemies,[],bounds).hits,[1,2]);
 const blocked=traceWeapon(origin,0,a,enemies,[{x:200,y:350,w:30,h:100}],bounds);assert.deepEqual(blocked.hits,[]);assert.ok(blocked.points.at(-1)!.x<185);
 const boosted=composeAttack(['shadow','icebeam']);assert.deepEqual(traceWeapon(origin,0,boosted,enemies,[],bounds).hits,[1,2,3]);
});
test('homing bends the real hit path; reflection stays inside room and never hits a target twice per tick',()=>{
 const enemies=[target(1,400,420)],straight=traceWeapon(origin,0,composeAttack(['icebeam']),enemies,[],bounds),guided=traceWeapon(origin,0,composeAttack(['swift','icebeam']),enemies,[],bounds);
 assert.deepEqual(straight.hits,[]);assert.deepEqual(guided.hits,[1]);assert.ok(guided.points.some(p=>p.y>380));
 const a=composeAttack(['ricochet','icebeam']),small={left:0,right:400,top:0,bottom:700},reflected=traceWeapon({x:300,y:350},0,a,[target(1,180)],[],small);
 assert.equal(reflected.reflections,1);assert.deepEqual(reflected.hits,[1]);assert.ok(reflected.points.every(p=>p.x>=0&&p.x<=400));
});
test('all legal stacked channel builds have finite bounded paths and limited contacts',()=>{
 const all=MOVES.flatMap(m=>Array(m.max).fill(m.id));for(const id of ['flamethrower','icebeam','water','drain','psybeam','thunderbolt']){
  const a=composeAttack([...all,id]),path=traceWeapon(origin,.3,a,Array.from({length:20},(_,i)=>target(i,150+i*35,350+Math.sin(i)*50)),[],bounds);
  assert.ok(path.points.length<=151);assert.equal(new Set(path.hits).size,path.hits.length);assert.ok(path.hits.length<=1+a.pierce+(id==='flamethrower'?1:0));assert.ok(path.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});
