import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gengarPattern,poolPhase,TRACKING_SECONDS} from '../src/scaling';
import {cueMetrics} from '../src/cue-layout';
import {arenaView} from '../src/viewport';
import {stepBrain,type Brain} from '../src/ai';
import {stepMewtwo} from '../src/finale';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {mapCache,floorLoot,takeFloorLoot} from '../src/floor-map';
import {roomEnvironment,breakableProps} from '../src/environment';
import {roomKnown,roomMapIcon} from '../src/exploration';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {PatternHints,HINT_KEY,warningPattern} from '../src/pattern-hints';
import {trapHits,trapPush,trapDamage} from '../src/traps';

test('B5–B2 patterns rise by one lane and 10 speed per floor with >=1 second warning',()=>{
 for(const phase of [1,2])for(let f=5;f>=2;f--){const a=gengarPattern(f+1,phase),b=gengarPattern(f,phase);assert.equal(b.count,a.count+1);assert.equal(b.speed,a.speed+10);assert.ok(b.warning>=1);assert.ok(a.interval-b.interval<.11);
 const e:Brain={x:560,y:290,hp:phase===1?220:60,phase,cooldown:0,charge:0,dir:{x:0,y:0}};const first=stepBrain('gengar',e,{x:560,y:500},.016,f),warn=first.actions.find(a=>a.type==='warn');assert.ok(warn?.type==='warn');let shots:unknown[]=[];for(let i=0;i<75;i++)shots.push(...stepBrain('gengar',e,{x:200,y:500},.016,f).actions.filter(a=>a.type==='shot').map(a=>a.dir));assert.deepEqual(shots,warn.directions)}
 for(let seed=0;seed<200;seed++)for(const room of roomsForFloor(seed,4))if(room.kind==='combat')assert.equal(roomEnemies(room,4).length,4);
});
test('phone previews retain 2.5 px lines and 13 px text at supported landscape sizes',()=>{
 for(const [w,h] of [[667,375],[844,390],[932,430],[1280,720]]){const z=arenaView(w,h).zoom,m=cueMetrics(z);assert.ok(m.line*z>=2.5-1e-9);assert.ok(m.fontScale*z*13>=13-1e-9);assert.ok(m.arrow*z>=5-1e-9)}
});
test('Mewtwo tracking is identified ahead of firing and hazard startup has escape time',()=>{
 const e={x:560,y:260,hp:520,phase:2,cycle:0,cooldown:0,charge:0,dir:{x:0,y:0}};const w=stepMewtwo(e,{x:560,y:500},2,.016).actions.find(a=>a.type==='warn');assert.ok(w?.type==='warn'&&w.tracking&&w.duration!>=1);assert.equal(warningPattern(w),'tracking');assert.ok(TRACKING_SECONDS<=1);assert.equal(poolPhase(.99),'warning');assert.equal(poolPhase(1),'active');assert.equal(poolPhase(4),'expired');
});
test('every exploration floor guarantees one destructible map, consumed once without a key',()=>{
 for(let seed=0;seed<500;seed++)for(let f=6;f>=2;f--){const r=new Run(seed);r.floor=f;r.rooms=roomsForFloor(seed,f);const cache=mapCache(r.rooms,f,seed);assert.ok(cache);assert.deepEqual(cache,mapCache(r.rooms,f,seed));r.current=cache.roomId;assert.ok(breakableProps(r.room).some(p=>p.id===cache.propId));assert.equal(floorLoot(r).filter(p=>p.kind==='map').length,0);roomEnvironment(r.room).broken|=1<<cache.propId;assert.equal(floorLoot(r).filter(p=>p.kind==='map').length,1);const keys=r.keys;assert.equal(takeFloorLoot(r,cache.propId,6,6),'map');assert.equal(r.mapFound,true);assert.equal(r.keys,keys);assert.equal(takeFloorLoot(r,cache.propId,6,6),null);assert.ok(r.rooms.every(room=>roomKnown(room,[],r.mapFound)));r.rooms.forEach(room=>room.cleared=true);assert.ok(r.ascend());assert.equal(r.mapFound,false);assert.ok(r.rooms.filter(room=>!room.visited).every(room=>!roomKnown(room,[],r.mapFound)))}
});
const save=(r:Run):Checkpoint=>({version:1,seed:r.seed,floor:r.floor,current:r.current,mapFound:r.mapFound,moves:r.moves,rooms:r.rooms.map(({visited,cleared,rewardTaken,environment})=>({visited,cleared,rewardTaken,environment})),hp:6,kills:0,elapsed:0,drain:0,entry:null,phase:1,ending:false,savedAt:1});
test('map save/reload retains only the current floor and migrates legacy permanent survey',()=>{
 const r=new Run(151);r.mapFound=true;const s=decodeSave(JSON.stringify(save(r)))!;assert.equal(restoreRun(s).mapFound,true);assert.equal(decodeSave(JSON.stringify({...s,mapFound:'yes'})),null);
 const old=save(new Run(151));delete old.mapFound;old.moves=['survey'];const migrated=restoreRun(decodeSave(JSON.stringify(old))!);assert.equal(migrated.mapFound,true);assert.ok(!migrated.moves.includes('survey'));migrated.rooms.forEach(room=>room.cleared=true);migrated.ascend();assert.equal(migrated.mapFound,false);
 const kinds=roomsForFloor(151,6);assert.equal(roomMapIcon(kinds.find(r=>r.kind==='combat')!),'combat');assert.equal(roomMapIcon(kinds.find(r=>r.kind==='reward')!),'reward');assert.equal(roomMapIcon(kinds[0]),'empty');
});
test('first-pattern hints persist once per mechanic, including failed storage fallback',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};const hints=new PatternHints(storage);assert.ok(hints.needs('burst'));hints.acknowledge('burst');assert.equal(new PatternHints(storage).needs('burst'),false);assert.ok(new PatternHints(storage).needs('beam'));storage.setItem(HINT_KEY,'broken');assert.ok(new PatternHints(storage).needs('burst'));
 const blocked=new PatternHints({getItem(){throw Error()},setItem(){throw Error()},removeItem(){}});assert.equal(blocked.acknowledge('pool'),false);assert.equal(blocked.needs('pool'),false);
});
test('all laboratory traps hit both actor sizes and knock away from the hazard',()=>{
 for(const kind of ['laser','gas','electric'] as const){const t={kind,x:560,y:350,r:50};assert.ok(trapHits(t,{x:560,y:350}));assert.ok(trapHits(t,{x:560,y:350},25));const d=trapPush(t,{x:560,y:350});assert.ok(Math.hypot(d.x,d.y)>.99);assert.ok(!trapHits(t,{x:100,y:550},25));assert.ok(trapDamage(50)<50)}
});

test('Gengar flanks moving players from varied locations without changing a committed destination',async()=>{
 const {gengarDestination}=await import('../src/boss-position');
 for(let x=96;x<=1024;x+=58)for(let y=158;y<=568;y+=41)for(let cycle=1;cycle<=24;cycle++){const p={x,y},d=gengarDestination({x:560,y:290},p,cycle);assert.ok(d&&d.x>=130&&d.x<=990&&d.y>=190&&d.y<=530);assert.ok(Math.hypot(d.x-x,d.y-y)>=149.99)}
 const positions=Array.from({length:12},(_,i)=>gengarDestination({x:560,y:290},{x:560,y:420},i+1));assert.ok(new Set(positions.map(p=>`${Math.round(p.x)},${Math.round(p.y)}`)).size>=8);
 const e:Brain={x:560,y:290,hp:220,phase:1,cooldown:0,charge:0,dir:{x:0,y:0}};const a=stepBrain('gengar',e,{x:560,y:450},.016,3),warning=a.actions.find(a=>a.type==='warn')!;assert.equal(warning.type,'warn');const target={...e.dir};for(let i=0;i<50;i++)stepBrain('gengar',e,{x:1000,y:500},.016,3);assert.deepEqual(e.dir,target);
});

test('ranged enemies lock and show their firing lanes before shots, including after teleport',()=>{
 for(const kind of ['gastly','houndour','shuppet'] as const){const e:Brain={x:400,y:280,hp:20,phase:1,cooldown:0,charge:0,dir:{x:0,y:0}};const first=stepBrain(kind,e,{x:560,y:450},.016,4),w=first.actions.find(a=>a.type==='warn');assert.ok(w?.type==='warn'&&w.duration!>=.6);assert.ok(!first.actions.some(a=>a.type==='shot'));const shots=[];for(let i=0;i<55;i++)shots.push(...stepBrain(kind,e,{x:100,y:200},.016,4).actions.filter(a=>a.type==='shot').map(a=>a.dir));assert.deepEqual(shots,w.directions)}
});
