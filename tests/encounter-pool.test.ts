import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encounterWeights,encounterKind,UNLOCK_TIER} from '../src/encounter-pool';
import {roomsForFloor,roomEnemies} from '../src/run';
import {BOSS_ROSTER} from '../src/boss-roster';
test('each floor unlocks a wider declared species pool while original species lose relative weight',()=>{
 const expected=[7,15,23,29,32];let oldShare=1;
 for(let floor=6;floor>=2;floor--){const p=encounterWeights(floor);assert.equal(p.length,expected[6-floor]);const total=p.reduce((n,e)=>n+e.weight,0),first=p.filter(e=>UNLOCK_TIER[e.kind]===0).reduce((n,e)=>n+e.weight,0)/total;assert.ok(first<=oldShare);oldShare=first;assert.ok(p.every(e=>!BOSS_ROSTER.includes(e.kind as any)));const elite=encounterWeights(floor,true);if(floor<6){const youngest=p.filter(e=>UNLOCK_TIER[e.kind]===6-floor).reduce((n,e)=>n+e.weight,0)/total,eliteYoung=elite.filter(e=>UNLOCK_TIER[e.kind]===6-floor).reduce((n,e)=>n+e.weight,0)/elite.reduce((n,e)=>n+e.weight,0);assert.ok(eliteYoung>youngest)}}
});
test('seeded draws match weights, never select locked species, and keep early enemy counts bounded',()=>{
 for(let floor=6;floor>=2;floor--){const p=encounterWeights(floor),counts=new Map<string,number>(),n=20000;for(let seed=0;seed<n;seed++){const k=encounterKind(seed,2,floor);assert.ok(UNLOCK_TIER[k]!<=6-floor);assert.equal(k,encounterKind(seed,2,floor));counts.set(k,(counts.get(k)??0)+1)}const total=p.reduce((n,e)=>n+e.weight,0);for(const e of p)assert.ok(Math.abs((counts.get(e.kind)??0)/n-e.weight/total)<.012,e.kind)}
 for(let seed=0;seed<100;seed++)for(const floor of [6,5])for(const room of roomsForFloor(seed,floor).filter(r=>r.kind==='combat')){const n=roomEnemies(room,floor).length;assert.ok(n>0&&n<=(floor===6?3:4))}
});
