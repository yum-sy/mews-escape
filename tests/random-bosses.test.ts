import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BOSS_ROSTER,bossForFloor} from '../src/boss-roster';
import {stepBoss,type BossBrain} from '../src/boss-ai';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {entryLayout} from '../src/encounter';
import {obstacles} from '../src/lab';
import {sceneryBlocks} from '../src/environment';
import FRAMES from '../src/artwork-frames.json';
import SPECIES from '../src/species.json';
import SOURCES from '../public/assets/artwork-sources.json';

test('each run shuffles five distinct laboratory bosses while Mewtwo remains at B1',()=>{
 const permutations=new Set<string>();for(let seed=0;seed<1000;seed++){const roster=[6,5,4,3,2].map(f=>bossForFloor(seed,f));assert.equal(new Set(roster).size,5);assert.ok(roster.every(k=>(BOSS_ROSTER as readonly string[]).includes(k)));assert.equal(bossForFloor(seed,1),'mewtwo');permutations.add(roster.join(','));for(let f=6;f>=2;f--){const room=roomsForFloor(seed,f).find(r=>r.kind==='boss')!;assert.equal(roomEnemies(room,f)[0].kind,roster[6-f]);for(const player of [{x:560,y:184},{x:560,y:542},{x:126,y:364},{x:994,y:364}])assert.equal(entryLayout(roomEnemies(room,f),player,[...obstacles(room),...sceneryBlocks(room)],room.doors).length,1)}}assert.ok(permutations.size>100);
});
test('save/reload and ascent retain the seeded roster; old saves do not need a stored boss field',()=>{
 const r=new Run(151);r.floor=4;r.rooms=roomsForFloor(r.seed,4);r.current=r.rooms.find(r=>r.kind==='boss')!.id;r.room.visited=true;
 const s:Checkpoint={version:1,seed:r.seed,floor:r.floor,current:r.current,moves:[],rooms:r.rooms.map(({visited,cleared,rewardTaken})=>({visited,cleared,rewardTaken})),hp:6,kills:0,elapsed:0,drain:0,entry:'down',phase:1,ending:false,savedAt:1};const restored=restoreRun(decodeSave(JSON.stringify(s))!);assert.equal(restored.room.boss,r.room.boss);restored.rooms.forEach(r=>r.cleared=true);assert.ok(restored.ascend());assert.equal(restored.rooms.find(r=>r.kind==='boss')!.boss,bossForFloor(151,3));
});
test('every boss previews its shots, preserves locked directions and cancels attacks at phase change',()=>{
 for(const kind of BOSS_ROSTER)for(const floor of [6,4,2])for(const phase of [1,2]){
  const e:BossBrain={x:560,y:290,hp:phase===1?220:90,cooldown:0,charge:0,dir:{x:0,y:0},phase,cycle:0,recovery:0,dash:0};const actions=stepBoss(kind,e,{x:560,y:480},.016,floor).actions;assert.ok(!actions.some(a=>a.type==='shot'));const warning=actions.find(a=>a.type==='warn');assert.ok(warning?.type==='warn'&&warning.duration!>=1);
  const emitted=[];for(let i=0;i<70;i++)emitted.push(...stepBoss(kind,e,{x:150,y:200},.016,floor).actions);assert.deepEqual(emitted.filter(a=>a.type==='shot').map(a=>a.dir),warning.directions);
  e.hp=80;e.phase=1;e.charge=.01;e.dash=.1;assert.equal(stepBoss(kind,e,{x:560,y:480},.016,floor).actions[0].type,'phase');for(let i=0;i<60;i++){const intent=stepBoss(kind,e,{x:560,y:480},.016,floor);assert.equal(intent.actions.length,0);assert.deepEqual(intent.v,{x:0,y:0})}
 }
});
test('boss identities have different mechanics, including a warned Houndoom dash',()=>{
 const observed=new Map<string,Set<string>>();for(const kind of BOSS_ROSTER){const e:BossBrain={x:560,y:290,hp:90,cooldown:0,charge:0,dir:{x:0,y:0},phase:2,cycle:0};const features=new Set<string>();for(let i=0;i<700;i++){const r=stepBoss(kind,e,{x:560,y:480},.016,3);for(const a of r.actions){features.add(a.type);if(a.type==='warn')features.add(a.cue!);if(a.type==='shot'&&a.homing)features.add('tracking')}if(Math.hypot(r.v.x,r.v.y)>200)features.add('dash');e.x+=r.v.x*.016;e.y+=r.v.y*.016}observed.set(kind,features)}
 assert.ok(observed.get('gengar')!.has('blink'));assert.ok(!observed.get('weezing')!.has('blink'));assert.ok(observed.get('muk')!.has('pool'));assert.ok(observed.get('houndoom')!.has('rush')&&observed.get('houndoom')!.has('dash'));assert.ok(observed.get('banette')!.has('tracking'));
});
test('new boss artwork exists, matches recorded sources and retains species dimensions',()=>{
 for(const name of ['weezing','muk','houndoom','banette'] as const){const frame=FRAMES[name],raw=readFileSync(new URL('../public/assets/'+frame.file,import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),SOURCES.find(s=>s.name===name)!.sha256);assert.ok(SPECIES[name].heightDm>0);assert.ok(frame.bounds[2]>frame.bounds[0]&&frame.bounds[3]>frame.bounds[1])}
});
