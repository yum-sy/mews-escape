import {test} from 'node:test';import assert from 'node:assert/strict';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {floorTheme,breakableProps,roomEnvironment,breakProp,roomInteractions,nearestInteraction} from '../src/environment';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {readProfile,rememberRecord,finishProfile} from '../src/profile';
test('six floor themes differ and decorative props preserve door and center access',()=>{
 assert.equal(new Set([6,5,4,3,2,1].map(f=>floorTheme(f).feature)).size,6);
 for(let seed=0;seed<100;seed++)for(const r of roomsForFloor(seed,4))for(const p of breakableProps(r)){assert.ok(Math.hypot(p.x-560,p.y-365)>100);assert.ok(p.x>120&&p.x<1000&&p.y>175&&p.y<555)}
});
test('interactions require proximity, safe rewards and cleared boss gates; power can be switched during battle',()=>{
 const run=new Run(3),room=run.rooms.find(r=>r.kind==='combat')!;assert.deepEqual(roomInteractions(room,6,false).map(i=>i.kind),['power']);
 assert.equal(nearestInteraction({x:100,y:500},roomInteractions(room,6,false)),undefined);assert.equal(nearestInteraction({x:880,y:200},roomInteractions(room,6,false))?.kind,'power');
 roomEnvironment(room).powerOff=true;assert.deepEqual(roomInteractions(room,6,false),[]);room.cleared=true;assert.ok(roomInteractions(room,6,false).some(i=>i.kind==='reward'));room.rewardTaken=true;assert.ok(!roomInteractions(room,6,false).some(i=>i.kind==='reward'));
 const boss=run.rooms.find(r=>r.kind==='boss')!;boss.cleared=true;assert.ok(!roomInteractions(boss,6,false).some(i=>i.kind==='lift'));assert.ok(roomInteractions(boss,6,true).some(i=>i.kind==='lift'));assert.deepEqual(roomInteractions(boss,1,true),[]);
});
test('world changes survive checkpoints without duplicate destruction and older saves remain compatible',()=>{
 const run=new Run(3),state=roomEnvironment(run.room);assert.equal(breakProp(state,2),true);assert.equal(breakProp(state,2),false);state.powerOff=true;state.recordRead=true;
 const s:Checkpoint={version:1,seed:3,floor:6,current:0,moves:[],rooms:run.rooms.map(r=>({visited:r.visited,cleared:r.cleared,rewardTaken:r.rewardTaken,environment:r.environment})),hp:6,kills:0,elapsed:0,drain:0,entry:null,phase:1,ending:false,savedAt:1};
 const decoded=decodeSave(JSON.stringify(s))!;assert.ok(decoded);assert.deepEqual(roomEnvironment(restoreRun(decoded).room),state);delete s.rooms[0].environment;assert.ok(decodeSave(JSON.stringify(s)));s.rooms[0].environment={broken:16,powerOff:false,recordRead:false};assert.equal(decodeSave(JSON.stringify(s)),null);
});
test('cleared high-floor rooms never respawn reinforcements on revisit',()=>{for(let floor=6;floor>=1;floor--)for(const room of roomsForFloor(3,floor)){if(room.kind==='combat'){assert.ok(roomEnemies(room,floor).length>0)}room.cleared=true;assert.deepEqual(roomEnemies(room,floor),[])}});
test('archive persists discoveries once, tracks completed runs and safely handles blocked storage',()=>{
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)},removeItem:(k:string)=>{map.delete(k)}};
 rememberRecord(storage,2);rememberRecord(storage,2);finishProfile(storage,false,4,12,100);finishProfile(storage,true,1,100,720);finishProfile(storage,true,1,90,650);const p=readProfile(storage);assert.deepEqual(p.records,[2]);assert.equal(p.runs,3);assert.equal(p.wins,2);assert.equal(p.bestFloor,1);assert.equal(p.bestKills,100);assert.equal(p.bestTime,650);
 const denied={getItem:()=>{throw Error()},setItem:()=>{throw Error()},removeItem:()=>{throw Error()}};assert.equal(readProfile(denied).runs,0);assert.equal(rememberRecord(denied,0),false);assert.equal(finishProfile(denied,false,6,0,1),false);
});
