import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {attachSecretRoute,decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {secretInteractions} from '../src/secret-route';
import {NORMAL_KINDS} from '../src/data';
import {BOSS_ROSTER} from '../src/boss-roster';
import {stepBrain,type Brain} from '../src/ai';
const ready=(floor=4)=>{const r=new Run(71);r.floor=floor;r.rooms=roomsForFloor(r.seed,floor);for(const room of r.rooms.slice(0,2)){room.visited=true;room.cleared=true;room.environment={broken:0,powerOff:false,recordRead:true}}return r};
const save=(r:Run)=>attachSecretRoute({version:1,seed:r.seed,floor:r.floor,current:r.current,mapFound:r.mapFound,keys:r.keys,moves:r.moves,rooms:r.rooms.map(({visited,cleared,rewardTaken,environment,offer,opened})=>({visited,cleared,rewardTaken,environment,offer,opened})),hp:6,kills:0,elapsed:1,drain:0,entry:null,phase:1,ending:false,savedAt:1} satisfies Checkpoint,r);
test('two distinct records unlock one free cache per floor, not repeating one terminal',()=>{
 const r=new Run(71);assert.equal(r.enterSecret(),false);r.room.environment={broken:0,powerOff:false,recordRead:true};assert.equal(r.secretAvailable,false);const unlocked=ready();assert.equal(unlocked.secretAvailable,true);const rooms=unlocked.rooms;assert.ok(unlocked.enterSecret());assert.equal(unlocked.ascend(),false);assert.equal(unlocked.choices.length,3);const keys=unlocked.keys;assert.ok(unlocked.openReward());assert.equal(unlocked.keys,keys);assert.ok(unlocked.choose(unlocked.choices[0].id));assert.ok(unlocked.leaveSecret());assert.equal(unlocked.rooms,rooms);assert.equal(unlocked.enterSecret(),false);
});
test('optional depth costs two keys, scales enemies, allows retreat, and never advances main floor',()=>{
 const r=ready();r.keys=3;const mainMap=r.mapFound=true;assert.ok(r.enterSecret());assert.equal(r.enterDepth(),false);r.openReward();r.skipReward();const keys=r.keys;assert.ok(r.enterDepth());assert.equal(r.keys,keys-2);assert.ok(r.tuning.hp>ready().tuning.hp);assert.equal(r.floor,4);assert.equal(r.mapFound,false);assert.equal(r.rooms.length,3);assert.ok(secretInteractions(r).some(i=>i.kind==='return'));r.travel('right');assert.equal(r.leaveSecret(),false);assert.equal(r.travel('right'),false);assert.ok(roomEnemies(r.room,r.floor).length>0);r.clear();r.travel('right');assert.ok(BOSS_ROSTER.includes(roomEnemies(r.room,r.floor)[0].kind as any));r.clear();assert.equal(r.choices.length,3);r.openReward();r.choose(r.choices[0].id);assert.ok(r.leaveSecret());assert.equal(r.floor,4);assert.equal(r.mapFound,mainMap);assert.equal(r.secretAvailable,false);
 const early=ready(6);early.enterSecret();early.openReward();early.skipReward();early.keys=20;assert.equal(early.enterDepth(),false);
});
test('save/reload preserves both maps, offers, consumed entrance, and return path; rejects forged nesting',()=>{
 for(const mode of ['cache','depth']){const r=ready();r.keys=4;r.enterSecret();r.openReward();if(mode==='depth'){r.choose(r.choices[0].id);r.enterDepth();r.travel('right')}
 const raw=save(r),decoded=decodeSave(JSON.stringify(raw));assert.ok(decoded);const restored=restoreRun(decoded);assert.equal(restored.branch,mode);assert.equal(restored.keys,r.keys);assert.deepEqual(restored.room,r.room);assert.ok(restored.origin);restored.room.cleared=true;assert.ok(restored.leaveSecret());assert.equal(restored.secretAvailable,false);assert.equal(restored.current,0);
 raw.route!.origin.route=raw.route;assert.throws(()=>JSON.stringify(raw));}
 const original=save(ready());assert.ok(decodeSave(JSON.stringify(original)));const forged=save(ready());forged.secretUsed=true;forged.route={mode:'depth',origin:{...original,floor:3}};assert.equal(decodeSave(JSON.stringify(forged)),null);
});
test('thirty-two ordinary species and nine lab bosses are separate; new enemies warn before attacking',()=>{
 assert.equal(NORMAL_KINDS.length,32);assert.equal(BOSS_ROSTER.length,9);for(const b of BOSS_ROSTER)assert.ok(!NORMAL_KINDS.includes(b));for(const kind of ['drowzee','magnemite','cubone','misdreavus'] as const){const e:Brain={x:400,y:300,hp:10,cooldown:0,charge:0,dir:{x:0,y:0},phase:1};const first=stepBrain(kind,e,{x:500,y:500},.016);assert.ok(first.actions.some(a=>a.type==='warn'));assert.ok(!first.actions.some(a=>a.type==='shot'));const out=[];for(let i=0;i<55;i++)out.push(...stepBrain(kind,e,{x:600,y:200},.016).actions);const shots=out.filter(a=>a.type==='shot');assert.ok(shots.length);if(kind==='cubone')assert.ok(shots.every(a=>a.returning));}
});

test('bonus bosses use the remaining roster and are distinct from all main-floor bosses',()=>{
 for(let seed=0;seed<200;seed++){const main=[6,5,4,3,2].map(f=>roomsForFloor(seed,f).find(r=>r.kind==='boss')!.boss);const bonus=[];for(const floor of [4,3,2]){const r=new Run(seed);r.floor=floor;r.rooms=roomsForFloor(seed,floor);r.keys=10;for(const room of r.rooms.slice(0,2)){room.cleared=true;room.visited=true;room.environment={broken:0,powerOff:false,recordRead:true}}r.enterSecret();r.openReward();r.skipReward();r.enterDepth();bonus.push(r.rooms[2].boss)}assert.equal(new Set([...main,...bonus]).size,8)}
});
