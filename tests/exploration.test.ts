import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon} from '../src/dungeon';
import {roomKnown,roomLabel,mapSymbol} from '../src/exploration';
import {composeAttack} from '../src/moves';
import {itemOffers,itemWeight} from '../src/rewards';
import {Run} from '../src/run';
test('unvisited room types stay hidden until the current floor map is acquired',()=>{
 for(const r of generateDungeon(3)){r.visited=false;assert.equal(roomKnown(r,[]),false);assert.equal(roomLabel(r,[]),'미탐험');assert.equal(mapSymbol(r,[]),'?');assert.ok(roomKnown(r,[],true));assert.notEqual(roomLabel(r,[],true),'미탐험');r.visited=true;assert.ok(roomKnown(r,[]))}
});
test('survey spends a treasure opportunity without changing combat stats or carrier',()=>{
 const a=composeAttack(['icebeam','poison']),b=composeAttack(['icebeam','poison','survey']);
 for(const key of Object.keys(a))if(key!=='visual')assert.deepEqual(a[key as keyof typeof a],b[key as keyof typeof b]);assert.equal(a.visual.form,b.visual.form);
 assert.ok(itemWeight('survey',6)<itemWeight('focus',6));
 let offered=false;for(let seed=0;seed<500;seed++){offered ||= itemOffers(seed,[],6,'treasure').some(m=>m.id==='survey');assert.ok(!itemOffers(seed,['survey'],6,'treasure').some(m=>m.id==='survey'));assert.ok(!itemOffers(seed,[],6,'boss').some(m=>m.id==='survey'))}assert.ok(offered);
 const run=new Run(3);run.moves=['survey'];assert.ok(run.moves.includes('survey'));
});
