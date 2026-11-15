import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOVES,composeAttack,splitAttack,CRITICAL_MULTIPLIER,PIERCE_RETAIN} from '../src/moves';
import {ENEMIES} from '../src/data';
import {stepBrain,type Brain} from '../src/ai';
const directDps=(ids:string[])=>{const a=composeAttack(ids);return a.damage*a.count/a.interval*(1+a.crit*(CRITICAL_MULTIPLIER-1))};
test('multishot and homing sacrifice total direct damage even when every projectile converges',()=>{
 const base=directDps([]);for(const [ids,ratio] of [[['tri'],.65],[['tri','tri'],.5],[['swift'],.55],[['swift','swift'],.4],[['tri','swift'],.3575],[['tri','tri','swift','swift'],.2]] as [string[],number][]){assert.ok(Math.abs(directDps(ids)/base-ratio)<1e-10)}
});
test('coverage penalties survive later weapon changes, normalize continuous ticks and reduce child/proc base damage',()=>{
 for(const form of ['flamethrower','icebeam','water','psybeam','thunderbolt','shadow']){
  const base=composeAttack(['flame','poison','split','spark',form]),covered=composeAttack(['tri','swift','flame','poison','split','spark',form]);
  assert.ok(Math.abs(covered.damage*covered.count/base.damage-.3575)<1e-10);assert.ok(covered.damage<base.damage);
  assert.equal(covered.burn,base.burn);assert.equal(covered.poison,base.poison);assert.equal(covered.chain,base.chain);
  assert.ok(Math.abs(splitAttack(covered).damage*covered.count/splitAttack(base).damage-.3575)<1e-10);
 }
});
test('seven early upgrades and a complete legal build stay within direct DPS budgets',()=>{
 const ids=['tri','psybeam','shadow','agility','flamethrower','thunderbolt','focus'];let max=0;
 const visit=(i:number,owned:string[])=>{if(i===ids.length){max=Math.max(max,directDps(owned));return}const move=MOVES.find(m=>m.id===ids[i])!;for(let n=0;n<=move.max&&owned.length+n<=7;n++)visit(i+1,[...owned,...Array(n).fill(move.id)])};visit(0,[]);
 assert.ok(max>directDps([])*1.5,'focused growth must remain meaningful');assert.ok(max<12,`early DPS ${max}`);
 const full=MOVES.flatMap(m=>Array(m.max).fill(m.id));assert.ok(directDps(full)<directDps([])*2.6);
});
test('split children preserve identity but cannot multiply secondary hits or healing',()=>{
 const a=composeAttack(['shadow','swift','split','spark','sludge','flame','poison','drain','ricochet']);const b=splitAttack(a);
 assert.equal(b.damage,a.damage*.2);assert.equal(b.burn,a.burn*.5);assert.equal(b.poison,a.poison*.5);assert.equal(b.homing,a.homing);
 for(const key of ['chain','blast','pierce','split','bounce','lifesteal'] as const)assert.equal(b[key],0);
 assert.ok(1+PIERCE_RETAIN+PIERCE_RETAIN**2<2.5,'piercing does not repeat full damage');
});
test('unupgraded early enemies survive the entry grace and ranged enemies apply pressure',()=>{
 const base=composeAttack([]);const availableHits=Math.ceil(1.2/base.interval);assert.ok(ENEMIES.gastly.hp>availableHits*base.damage);assert.ok(ENEMIES.koffing.hp>availableHits*base.damage);
 const e:Brain={x:300,y:300,hp:ENEMIES.gastly.hp,cooldown:0,charge:0,dir:{x:0,y:0},phase:1};let shots=0;for(let i=0;i<300;i++)shots+=stepBrain('gastly',e,{x:560,y:360},1/60).actions.filter(a=>a.type==='shot').length;assert.equal(shots,3);
});
