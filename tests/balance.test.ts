import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOVES,composeAttack,splitAttack,CRITICAL_MULTIPLIER,PIERCE_RETAIN} from '../src/moves';
import {ENEMIES} from '../src/data';
import {stepBrain,type Brain} from '../src/ai';
const directDps=(ids:string[])=>{const a=composeAttack(ids);return a.damage*a.count/a.interval*(1+a.crit*(CRITICAL_MULTIPLIER-1))};
test('multishot improves coverage without multiplying direct damage three or five times',()=>{
 const base=directDps([]);assert.ok(Math.abs(directDps(['tri'])/base-1.5)<1e-10);assert.ok(Math.abs(directDps(['tri','tri'])/base-5/3)<1e-10);
 assert.ok(directDps(['tri','psybeam'])>directDps(['tri']));
});
test('seven early upgrades and a complete legal build stay within direct DPS budgets',()=>{
 const ids=['tri','psybeam','shadow','agility','flamethrower','thunderbolt','focus'];let max=0;
 const visit=(i:number,owned:string[])=>{if(i===ids.length){max=Math.max(max,directDps(owned));return}const move=MOVES.find(m=>m.id===ids[i])!;for(let n=0;n<=move.max&&owned.length+n<=7;n++)visit(i+1,[...owned,...Array(n).fill(move.id)])};visit(0,[]);
 assert.ok(max>directDps([])*3,'growth must still feel meaningful');assert.ok(max<24,`early DPS ${max}`);
 const full=MOVES.flatMap(m=>Array(m.max).fill(m.id));assert.ok(directDps(full)<directDps([])*8);
});
test('split children preserve identity but cannot multiply secondary hits or healing',()=>{
 const a=composeAttack(['shadow','swift','split','spark','sludge','flame','poison','drain','ricochet']);const b=splitAttack(a);
 assert.equal(b.damage,a.damage*.35);assert.equal(b.burn,a.burn*.5);assert.equal(b.poison,a.poison*.5);assert.equal(b.homing,a.homing);
 for(const key of ['chain','blast','pierce','split','bounce','lifesteal'] as const)assert.equal(b[key],0);
 assert.ok(1+PIERCE_RETAIN+PIERCE_RETAIN**2<2.5,'piercing does not repeat full damage');
});
test('unupgraded early enemies survive the entry grace and ranged enemies apply pressure',()=>{
 const base=composeAttack([]);const availableHits=Math.ceil(1.2/base.interval);assert.ok(ENEMIES.gastly.hp>availableHits*base.damage);assert.ok(ENEMIES.koffing.hp>availableHits*base.damage);
 const e:Brain={x:300,y:300,hp:ENEMIES.gastly.hp,cooldown:0,charge:0,dir:{x:0,y:0},phase:1};let shots=0;for(let i=0;i<300;i++)shots+=stepBrain('gastly',e,{x:560,y:360},1/60).actions.filter(a=>a.type==='shot').length;assert.equal(shots,3);
});
