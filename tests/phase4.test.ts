import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Run,roomsForFloor} from '../src/run';
import {decodeSave,restoreRun,readCheckpoint,writeCheckpoint,removeCheckpoint,SAVE_KEY,type Checkpoint,type StoragePort} from '../src/save';
import {stepMewtwo,nextFinalPhase,FINAL_HP,beamPhase,beamHits,type FinalPhase} from '../src/finale';
const snapshot=(run=new Run(151)):Checkpoint=>({version:1,keys:run.keys,seed:run.seed,floor:run.floor,current:run.current,moves:run.moves,rooms:run.rooms.map(({visited,cleared,rewardTaken,opened,offer})=>({visited,cleared,rewardTaken,opened,offer})),hp:4,kills:12,elapsed:71.3,drain:.4,entry:'down',phase:1,ending:false,savedAt:1});
const storage=()=>{const items=new Map<string,string>();return{getItem:(k:string)=>items.get(k)??null,setItem:(k:string,v:string)=>{items.set(k,v)},removeItem:(k:string)=>{items.delete(k)}}};
test('checkpoint restores deterministic map, build, health and reward without duplicate acquisition',()=>{
 const r=new Run(151);r.current=r.rooms.find(x=>x.kind==='reward')!.id;r.room.visited=true;r.clear();const before=decodeSave(JSON.stringify(snapshot(r)))!;assert.ok(restoreRun(before).rewardPending);
 assert.ok(r.openReward());assert.ok(r.choose(r.choices[0].id));const s=decodeSave(JSON.stringify(snapshot(r)))!;assert.ok(s);const restored=restoreRun(s);assert.deepEqual(restored,r);assert.equal(restored.rewardPending,false);assert.equal(restored.choose(restored.choices[0].id),false);assert.equal(s.hp,4);assert.equal(s.elapsed,71.3);
});
test('B1 phase checkpoints and pending ending survive reload but only phase three can finish',()=>{
 const r=new Run(42);r.floor=1;r.rooms=roomsForFloor(r.seed,1);
 for(const phase of [1,2,3] as const){const s={...snapshot(r),phase};assert.equal(decodeSave(JSON.stringify(s))?.phase,phase);assert.equal(restoreRun(s).floor,1)}
 assert.equal(nextFinalPhase(1),2);assert.equal(nextFinalPhase(2),3);assert.equal(nextFinalPhase(3),'ending');
 r.clear();assert.ok(decodeSave(JSON.stringify({...snapshot(r),phase:3,ending:true})));assert.equal(decodeSave(JSON.stringify({...snapshot(r),phase:2,ending:true})),null);
});
test('invalid versions, impossible health, missing rooms and unknown moves are rejected safely',()=>{
 const base=snapshot();for(const patch of [{version:9},{floor:7},{hp:0},{hp:7},{phase:4},{moves:['cheat']},{moves:Array(9).fill('psybeam')},{rooms:[]},{current:99},{elapsed:Infinity},{ending:true},{entry:'diagonal'}])assert.equal(decodeSave(JSON.stringify({...base,...patch})),null);
 for(const raw of [null,'{','null','[]','x'.repeat(30001)])assert.equal(decodeSave(raw),null);
 const extra=snapshot();Object.assign(extra.rooms[0],{id:999,doors:{left:999},kind:'combat'});assert.equal(restoreRun(extra).room.id,0);assert.equal(restoreRun(extra).room.kind,'start');
});
test('storage failures stay recoverable; ending/death deletion removes the continuation',()=>{
 const s=storage(),value=snapshot();assert.ok(writeCheckpoint(s,value));assert.deepEqual(readCheckpoint(s).save,JSON.parse(JSON.stringify(value)));assert.ok(removeCheckpoint(s));assert.equal(s.getItem(SAVE_KEY),null);
 s.setItem(SAVE_KEY,'broken');assert.ok(readCheckpoint(s).status);assert.equal(readCheckpoint(s).save,null);
 const blocked:StoragePort={getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}};assert.equal(writeCheckpoint(blocked,value),false);assert.equal(removeCheckpoint(blocked),false);assert.ok(readCheckpoint(blocked).status);
});
test('all floors reconstruct exactly from seed before checkpoint flags are applied',()=>{
 for(let floor=6;floor>=1;floor--){const r=new Run(2026);r.floor=floor;r.rooms=roomsForFloor(r.seed,floor);r.current=0;assert.deepEqual(restoreRun(snapshot(r)).rooms,r.rooms)}
});
test('three boss phases are distinct, telegraphs precede attacks and targeting leaves reaction time',()=>{
 for(const phase of [1,2,3] as FinalPhase[]){const e={x:560,y:250,hp:FINAL_HP[phase-1],cooldown:0,charge:0,dir:{x:0,y:0},phase,cycle:0};const first=stepMewtwo(e,{x:560,y:500},phase,.016);assert.equal(first.actions[0].type,'warn');assert.equal(first.actions.some(a=>a.type==='shot'),false);
 const actions=[...first.actions];for(let i=0;i<500;i++)actions.push(...stepMewtwo(e,{x:560,y:500},phase,.016).actions);
 assert.ok(actions.some(a=>a.type==='shot'));assert.equal(actions.some(a=>a.type==='blink'),phase>1);assert.equal(actions.some(a=>a.type==='shot'&&!!a.homing),phase===2);assert.equal(actions.some(a=>a.type==='beam'),phase===3);
 }
 assert.equal(beamPhase(.99),'warning');assert.equal(beamPhase(1),'active');assert.equal(beamPhase(1.5),'expired');assert.ok(beamHits('x',560,{x:570,y:200}));assert.ok(!beamHits('x',560,{x:600,y:200}));assert.ok(beamHits('y',300,{x:100,y:310}));
});
