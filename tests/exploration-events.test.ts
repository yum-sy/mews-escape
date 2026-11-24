import test from 'node:test';
import assert from 'node:assert/strict';
import {Run,roomsForFloor,roomEnemies,ambushEnemies} from '../src/run';
import {cageSegments,breakCage,cageBlocks,perimeterWalls,ambushProp,pendingAmbush,annexSpecimen} from '../src/exploration-events';
import {roomEnvironment,breakProp,breakableProps,sceneryBlocks} from '../src/environment';
import {obstacles,overlapsBlock} from '../src/lab';
import {speciesSize} from '../src/scaling';
import {availablePropLoot,takePropLoot} from '../src/prop-loot';
import {attachSecretRoute,decodeSave,restoreRun,type Checkpoint} from '../src/save';
const save=(r:Run)=>attachSecretRoute({version:1,seed:r.seed,floor:r.floor,current:r.current,mapFound:r.mapFound,keys:r.keys,moves:r.moves,rooms:r.rooms.map(({visited,cleared,rewardTaken,environment,offer,opened})=>({visited,cleared,rewardTaken,environment,offer,opened})),hp:6,kills:0,elapsed:1,drain:0,entry:null,phase:1,ending:false,savedAt:1} satisfies Checkpoint,r);
test('seeded cages are destructible from either side and every broken segment makes a Mew-sized passage',()=>{
 let found=0;for(let seed=0;seed<200;seed++)for(const room of roomsForFloor(seed,5)){const segments=cageSegments(room);if(!segments.length)continue;found++;const s=roomEnvironment(room);for(const gate of segments){s.gatesBroken=0;assert.equal(breakCage(room,gate.id),true);assert.equal(breakCage(room,gate.id),false);assert.equal(cageBlocks(room).length,5);assert.ok(!cageBlocks(room).some(b=>overlapsBlock(gate,speciesSize('mew').radius,b)))}s.gatesBroken=63;assert.equal(cageBlocks(room).length,0)}assert.ok(found>30);
});
test('wall cutouts leave terminals, door landings and props outside permanent walls',()=>{
 for(let seed=0;seed<200;seed++)for(const r of roomsForFloor(seed,4)){for(const p of [{x:230,y:200},{x:880,y:200},{x:560,y:184},{x:560,y:542},{x:126,y:364},{x:994,y:364},...breakableProps(r)])assert.ok(!perimeterWalls(r).some(b=>overlapsBlock(p,18,b)),`${seed}:${r.id}`)}
});
test('crate creatures persist until defeated and grant their supply only once',()=>{
 let found=false;for(let seed=0;seed<50&&!found;seed++){const run=new Run(seed),r=run.rooms.find(r=>ambushProp(r)!==null);if(!r)continue;found=true;run.current=r.id;r.visited=true;r.cleared=true;const id=ambushProp(r)!,s=roomEnvironment(r);assert.equal(pendingAmbush(r),null);breakProp(s,id);assert.equal(ambushEnemies(r,6).length,1);assert.equal(roomEnemies(r,6)[0].propId,id);assert.ok(!availablePropLoot(r).some(p=>p.id===id));const restored=restoreRun(decodeSave(JSON.stringify(save(run)))!);assert.equal(pendingAmbush(restored.room),id);s.ambushCleared=1<<id;assert.equal(roomEnemies(r,6).length,0);assert.equal(takePropLoot(r,id,6,6),'reflector');assert.equal(takePropLoot(r,id,6,6),null)}assert.ok(found);
});
test('power-and-crate investigation opens an optional annex with a return path, guarded rare reward and persistent alert',()=>{
 const run=new Run(151);run.current=run.rooms.find(r=>r.kind==='combat')!.id;run.room.visited=true;run.clear();const s=roomEnvironment(run.room);s.powerOff=true;s.broken=15;const id=ambushProp(run.room);if(id!==null)s.ambushCleared=1<<id;assert.ok(run.annexAvailable);assert.ok(run.enterSecret('annex'));assert.equal(run.threat,1);assert.equal(run.rooms.length,3);assert.ok(run.travel('right'));assert.ok(roomEnemies(run.room,6).some(e=>e.kind===annexSpecimen(6,run.room.seed)));assert.equal(run.leaveSecret(),false);run.clear();assert.ok(run.travel('right'));assert.equal(run.choices.length,3);assert.ok(run.room.elite);run.openReward();run.choose(run.choices[0].id);assert.equal(run.threat,2);const restored=restoreRun(decodeSave(JSON.stringify(save(run)))!);assert.equal(restored.branch,'annex');assert.ok(restored.leaveSecret());assert.equal(restored.floor,6);assert.equal(restored.secretUsed,true);assert.equal(restored.threat,2);
});
test('after cutting the middle cage segment all actual exits remain reachable through the combined room geometry',()=>{
 const radius=speciesSize('mew').radius;let checked=0;
 for(let seed=0;seed<80;seed++)for(const room of roomsForFloor(seed,4)){const gates=cageSegments(room);if(!gates.length)continue;checked++;const state=roomEnvironment(room);state.gatesBroken=1<<2;const blocks=[...obstacles(room),...sceneryBlocks(room)];
 const points=new Map<string,{x:number;y:number}>();for(let y=160;y<=568;y+=12)for(let x=100;x<=1024;x+=12)if(!blocks.some(b=>overlapsBlock({x,y},radius,b)))points.set(`${x},${y}`,{x,y});
 const nearest=(x:number,y:number)=>[...points.values()].reduce((a,b)=>Math.hypot(a.x-x,a.y-y)<Math.hypot(b.x-x,b.y-y)?a:b);const first=nearest(560,365),queue=[first],seen=new Set([`${first.x},${first.y}`]);for(const p of queue)for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]){const key=`${p.x+dx},${p.y+dy}`,q=points.get(key);if(q&&!seen.has(key)){seen.add(key);queue.push(q)}}
 for(const [x,y] of [[560,160],[560,568],[100,364],[1024,364],[230,200],[880,200]]){const p=nearest(x,y);assert.ok(seen.has(`${p.x},${p.y}`),`${seed}:${room.id} to ${x},${y}`)}
 }assert.ok(checked>20);
});

test('pre-event saves do not resurrect a previously broken crate or mint its new guaranteed reward',()=>{
 const run=new Run(1);const room=run.rooms.find(r=>ambushProp(r)!==null)!;assert.ok(room);run.current=room.id;room.visited=true;room.cleared=true;const id=ambushProp(room)!;room.environment={broken:1<<id,powerOff:false,recordRead:false};const restored=restoreRun(decodeSave(JSON.stringify(save(run)))!);assert.equal(pendingAmbush(restored.room),null);assert.ok(!availablePropLoot(restored.room).some(p=>p.id===id));
});
