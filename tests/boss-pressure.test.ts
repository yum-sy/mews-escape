import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_ROSTER} from '../src/boss-roster';
import {stepBoss,type BossBrain} from '../src/boss-ai';
import {stepMewtwo} from '../src/finale';
import {speciesSize,SPECIES,gengarPattern,difficulty} from '../src/scaling';
const brain=():BossBrain=>({x:560,y:290,hp:220,phase:1,cycle:0,cooldown:2,charge:0,dir:{x:0,y:0},recovery:0,dash:0});
test('bosses no longer idle at medium range and pressure increases beyond B6',()=>{
 for(const kind of BOSS_ROSTER){const a=stepBoss(kind,brain(),{x:560,y:480},.016,6),b=stepBoss(kind,brain(),{x:560,y:480},.016,2);assert.ok(Math.hypot(a.v.x,a.v.y)>=40,kind);assert.ok(Math.hypot(b.v.x,b.v.y)>Math.hypot(a.v.x,a.v.y),kind)}
 for(let floor=6;floor>=2;floor--)for(const phase of [1,2]){const p=gengarPattern(floor,phase);assert.ok(p.warning>=1);assert.ok(p.interval>=1.9&&p.interval<=2.7)}
 assert.equal(difficulty(6).bossHp,90);
});
test('boss art is larger but leaves reasonable contact and arena margins',()=>{
 for(const kind of [...BOSS_ROSTER,'mewtwo'] as const){const s=speciesSize(kind),old=32*Math.sqrt(SPECIES[kind].heightDm/4);assert.ok(s.height>old*1.25,kind);assert.ok(s.radius<=45);assert.ok(s.width<=160&&s.height<=140)}
});
test('Mewtwo flanks nearby, locks its destination and moves faster between casts',()=>{
 const e={...brain(),cycle:0,cooldown:0},target={x:700,y:410};const first=stepMewtwo(e,target,2,.016),w=first.actions.find(a=>a.type==='warn');assert.ok(w?.type==='warn');const distance=Math.hypot(w.x-target.x,w.y-target.y);assert.ok(distance>=149&&distance<=191);const destination={x:w.x,y:w.y};const actions=[];for(let i=0;i<70;i++)actions.push(...stepMewtwo(e,{x:150,y:200},2,.016).actions);const blink=actions.find(a=>a.type==='blink');assert.deepEqual(blink,{type:'blink',...destination});const motion=stepMewtwo({...brain(),cycle:0},target,3,.016);assert.ok(Math.hypot(motion.v.x,motion.v.y)>100);
});
test('health transitions introduce distinct, telegraphed mechanics rather than only speed',()=>{
 const start=(kind:typeof BOSS_ROSTER[number],phase:number,cycle=1)=>stepBoss(kind,{...brain(),hp:phase===1?220:90,phase,cycle,cooldown:0},{x:560,y:480},.016,6).actions;
 for(const kind of ['weezing','houndoom','banette'] as const){assert.ok(!start(kind,1).some(a=>a.type==='pool'||a.type==='zone'));assert.ok(start(kind,2).some(a=>a.type==='pool'||a.type==='zone'),kind)}
 const dirs=(kind:typeof BOSS_ROSTER[number],phase:number)=>start(kind,phase).find(a=>a.type==='warn');
 for(const kind of ['magneton','hypno','marowak'] as const){const a=dirs(kind,1),b=dirs(kind,2);assert.ok(a?.type==='warn'&&b?.type==='warn');assert.notDeepEqual(a.directions,b.directions,kind);assert.ok(b.duration!>=1)}
 for(const kind of BOSS_ROSTER)for(const phase of [1,2]){for(const action of start(kind,phase))if(action.type==='zone'){assert.ok(action.warning>=1);assert.ok(action.r<=32);assert.ok(action.life<=1.5)}}
});
