import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Run,roomEnemies,roomsForFloor} from '../src/run';
import {ENTRY_DISTANCE,entryLayout} from '../src/encounter';
import {obstacles,overlapsBlock} from '../src/lab';
import {sceneryBlocks,roomEnvironment} from '../src/environment';
import {speciesSize,difficulty} from '../src/scaling';
import {propDrop,availablePropLoot,takePropLoot} from '../src/prop-loot';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {stepBrain,type Brain} from '../src/ai';
import {stepMewtwo,type FinalPhase} from '../src/finale';

test('early combat caps rise from 2–3 to 3–4 and first boss health is halved',()=>{
 for(let seed=0;seed<1000;seed++)for(const floor of [6,5])for(const room of roomsForFloor(seed,floor))if(room.kind==='combat'){const n=roomEnemies(room,floor).length;assert.ok(floor===6?n>=2&&n<=3:n>=3&&n<=4)}
 assert.equal(difficulty(6).bossHp,90);for(let f=6;f>2;f--)assert.ok(difficulty(f-1).bossHp>difficulty(f).bossHp);
});
test('all entry directions keep actors away from the player, real doorways and solids',()=>{
 const landings=[{x:560,y:184},{x:560,y:542},{x:126,y:364},{x:994,y:364},{x:560,y:365}];
 for(let seed=0;seed<100;seed++)for(let floor=6;floor>=1;floor--)for(const room of roomsForFloor(seed,floor))for(const player of landings){const blocks=[...obstacles(room),...sceneryBlocks(room)],actors=entryLayout(roomEnemies(room,floor),player,blocks,room.doors);assert.equal(actors.length,roomEnemies(room,floor).length);for(const e of actors){assert.ok(Math.hypot(e.x-player.x,e.y-player.y)>=ENTRY_DISTANCE+speciesSize(e.kind).radius);assert.ok(!blocks.some(b=>overlapsBlock(e,speciesSize(e.kind).radius,b)))}}
});
test('gengar warns the exact outgoing lanes; B6 has fewer, slower shots and no surprise pool',()=>{
 for(const phase of [1,2]){const e:Brain={x:560,y:290,hp:phase===1?220:60,phase,cooldown:0,charge:0,dir:{x:0,y:0}};const first=stepBrain('gengar',e,{x:560,y:500},.016,6),warning=first.actions.find(a=>a.type==='warn');assert.ok(warning?.type==='warn'&&warning.kind==='gengar');const actions=[];for(let i=0;i<70;i++)actions.push(...stepBrain('gengar',e,{x:200,y:300},.016,6).actions);const shots=actions.filter(a=>a.type==='shot');assert.equal(shots.length,phase===1?6:8);assert.deepEqual(shots.map(s=>s.dir),warning.directions);assert.ok(shots.every(s=>s.speed===175));assert.ok(!actions.some(a=>a.type==='pool'))}
});
test('crossing boss half health cancels charge and gives a full phase-change pause',()=>{
 const e:Brain={x:560,y:290,hp:100,phase:1,cooldown:.2,charge:.01,dir:{x:800,y:470}};
 assert.equal(stepBrain('gengar',e,{x:560,y:500},.016,6).actions[0].type,'phase');
 for(let i=0;i<70;i++){const result=stepBrain('gengar',e,{x:560,y:500},.016,6);assert.equal(result.actions.length,0);assert.deepEqual(result.v,{x:0,y:0})}
});
test('Mewtwo projectile directions stay locked to the shown preview while the player dodges',()=>{
 for(const phase of [1,2,3] as FinalPhase[]){const e={x:560,y:250,hp:500,phase,cycle:0,cooldown:0,charge:0,dir:{x:0,y:0}};const first=stepMewtwo(e,{x:560,y:500},phase,.016),warning=first.actions.find(a=>a.type==='warn');assert.ok(warning?.type==='warn');const actions=[];for(let i=0;i<70;i++)actions.push(...stepMewtwo(e,{x:200,y:500},phase,.016).actions);assert.deepEqual(actions.filter(a=>a.type==='shot').map(a=>a.dir),warning.directions)}
});
test('prop drops are rare and deterministic, and collected loot cannot be farmed by reloading',()=>{
 let hearts=0,keys=0;for(let seed=0;seed<10000;seed++)for(let id=0;id<4;id++){const drop=propDrop(seed,id);hearts+=Number(drop==='heart');keys+=Number(drop==='key');assert.equal(propDrop(seed,id),drop)}assert.ok(hearts/40000>.05&&hearts/40000<.07);assert.ok(keys/40000>.015&&keys/40000<.025);
 let seed=0,r=new Run(seed);while(!r.rooms.some(room=>room.kind==='combat'&&propDrop(room.seed,0)))r=new Run(++seed);r.current=r.rooms.findIndex(room=>room.kind==='combat'&&propDrop(room.seed,0));r.room.visited=true;
 roomEnvironment(r.room).broken=1;const item=availablePropLoot(r.room)[0];assert.ok(item);if(item.kind==='heart')assert.equal(takePropLoot(r.room,0,6,6),null);assert.equal(takePropLoot(r.room,0,4,6),item.kind);assert.equal(takePropLoot(r.room,0,4,6),null);
 const s:Checkpoint={version:1,keys:r.keys,seed:r.seed,floor:r.floor,current:r.current,moves:[],rooms:r.rooms.map(({visited,cleared,rewardTaken,environment})=>({visited,cleared,rewardTaken,environment})),hp:5,kills:0,elapsed:1,drain:0,entry:'down',phase:1,ending:false,savedAt:1};const decoded=decodeSave(JSON.stringify(s));assert.ok(decoded);assert.equal(roomEnvironment(restoreRun(decoded).room).lootTaken,1);assert.ok(!availablePropLoot(restoreRun(decoded).room).some(i=>i.id===0));
 s.rooms[r.current].environment!.lootTaken=2;assert.equal(decodeSave(JSON.stringify(s)),null);
});

test('Koffing remains still and fires along its eight preview arrows',()=>{
 const e:Brain={x:560,y:290,hp:30,phase:1,cooldown:0,charge:0,dir:{x:0,y:0}};const first=stepBrain('koffing',e,{x:560,y:500},.016),warning=first.actions.find(a=>a.type==='warn');assert.ok(warning?.type==='warn');assert.deepEqual(first.v,{x:0,y:0});const actions=[];for(let i=0;i<42;i++)actions.push(...stepBrain('koffing',e,{x:200,y:500},.016).actions);assert.deepEqual(actions.filter(a=>a.type==='shot').map(a=>a.dir),warning.directions);
});
