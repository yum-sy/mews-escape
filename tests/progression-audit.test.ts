import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {DIRECTIONS,OPPOSITE,type Direction} from '../src/dungeon';
import {doorBlockReason,thresholdDirection} from '../src/progression';
import {obstacles,overlapsBlock,moveWithWalls} from '../src/lab';
import {sceneryBlocks,roomInteractions} from '../src/environment';
import {speciesSize} from '../src/scaling';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
import {MOVES} from '../src/moves';

const snapshot=(r:Run):Checkpoint=>({version:1,seed:r.seed,floor:r.floor,current:r.current,keys:r.keys,moves:[...r.moves],rooms:r.rooms.map(({visited,cleared,rewardTaken,environment,offer,opened})=>({visited,cleared,rewardTaken,environment,offer,opened})),hp:6,kills:0,elapsed:0,drain:0,entry:null,phase:1,ending:false,savedAt:1});

test('10,000 seeds × B6–B2: real travel traverses every non-boss room without keys, rewards or map reveal',()=>{
 for(let n=0;n<10000;n++){
  const seed=n<5000?n:Math.imul(n,0x9e3779b1)>>>0;
  const run=new Run(seed);
  for(let floor=6;floor>=2;floor--){
   const visited=new Set<number>();
   const visit=()=>{const id=run.current,room=run.room;visited.add(id);if(room.kind==='combat')run.clear();for(const dir of DIRECTIONS){const next=room.doors[dir];if(next===undefined||visited.has(next)||run.rooms[next].kind==='boss')continue;assert.equal(doorBlockReason(run.rooms,room,dir),null);assert.ok(run.travel(dir),`seed ${seed} B${floor} ${id} ${dir}`);visit();assert.ok(run.travel(OPPOSITE[dir]));assert.equal(run.current,id)}};
   run.keys=0;visit();assert.equal(visited.size,run.rooms.length-1);
   const boss=run.rooms.find(r=>r.kind==='boss')!;assert.equal(Object.keys(boss.doors).length,1);
   const queue:[number,Direction[]][]=[[run.current,[]]],seen=new Set([run.current]);let path:Direction[]|undefined;
   for(const [id,route] of queue){if(id===boss.id){path=route;break}for(const dir of DIRECTIONS){const next=run.rooms[id].doors[dir];if(next!==undefined&&!seen.has(next)){seen.add(next);queue.push([next,[...route,dir]])}}}
   assert.ok(path);for(const dir of path)assert.ok(run.travel(dir));assert.equal(run.current,boss.id);run.clear();
   // Even with all possible boss upgrades exhausted, skip still opens the lift.
   if(n===0)run.moves=MOVES.flatMap(m=>Array(m.max).fill(m.id));
   assert.ok(run.openReward());assert.ok(run.skipReward());assert.ok(roomInteractions(run.room,floor,run.canExit).some(i=>i.kind==='lift'));assert.ok(run.ascend());
  }
  assert.equal(run.floor,1);assert.equal(roomEnemies(run.room,1)[0].kind,'mewtwo');
 }
});

test('every obstacle template and all 16 prop destruction masks connect all door thresholds and interactions',()=>{
 const radius=speciesSize('mew').radius;
 const targets=[{x:560,y:160},{x:560,y:568},{x:100,y:364},{x:1024,y:364},{x:560,y:365},{x:230,y:200},{x:880,y:200}];
 for(const kind of ['start','combat','reward','boss'] as const)for(let seed=0;seed<3;seed++)for(let broken=0;broken<16;broken++){
  const room={...roomsForFloor(1,6)[0],kind,seed,environment:{broken,powerOff:false,recordRead:false}},blocks=[...obstacles(room),...sceneryBlocks(room)];
  const nodes:{x:number;y:number}[]=[],index=new Map<string,number>();
  for(let y=160;y<=568;y+=12)for(let x=100;x<=1024;x+=12)if(!blocks.some(b=>overlapsBlock({x,y},radius,b))){index.set(`${x},${y}`,nodes.length);nodes.push({x,y})}
  const nearest=(p:{x:number;y:number})=>nodes.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
  const start=nearest(targets[4]),queue=[start],seen=new Set([index.get(`${start.x},${start.y}`)!]);
  for(const p of queue)for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]){const id=index.get(`${p.x+dx},${p.y+dy}`);if(id===undefined||seen.has(id))continue;const q=moveWithWalls(p,{x:dx,y:dy},blocks,radius);if(q.x===p.x+dx&&q.y===p.y+dy){seen.add(id);queue.push(nodes[id])}}
  for(const p of targets){assert.ok(!blocks.some(b=>overlapsBlock(p,radius,b)));const q=nearest(p);assert.ok(seen.has(index.get(`${q.x},${q.y}`)!),`${kind}/${seed}/${broken}: ${JSON.stringify(p)}`)}
 }
});

test('all species spawn outside combined solid scenery on every floor',()=>{
 for(let seed=0;seed<1000;seed++)for(let floor=6;floor>=1;floor--)for(const room of roomsForFloor(seed,floor))for(const enemy of roomEnemies(room,floor)){
  const blocks=[...obstacles(room),...sceneryBlocks(room)];assert.ok(!blocks.some(b=>overlapsBlock(enemy,speciesSize(enemy.kind).radius,b)),`${seed} B${floor} room ${room.id} ${enemy.kind}`);
 }
});

test('four door triggers accept full and gentle touch movement at reachable player clamps',()=>{
 for(const [dir,p,v] of [['up',{x:560,y:158},{x:0,y:-1}],['down',{x:560,y:568},{x:0,y:1}],['left',{x:96,y:364},{x:-1,y:0}],['right',{x:1024,y:364},{x:1,y:0}]] as const){assert.equal(thresholdDirection(p,v),dir);assert.equal(thresholdDirection(p,{x:v.x*.01,y:v.y*.01}),dir);assert.equal(thresholdDirection(p,{x:-v.x,y:-v.y}),undefined)}
});

test('checkpoint restore retains every reciprocal door, pending reward and return route on B6–B2',()=>{
 for(let seed=0;seed<100;seed++)for(let floor=6;floor>=2;floor--){const r=new Run(seed);r.floor=floor;r.rooms=roomsForFloor(seed,floor);for(const room of r.rooms){r.current=room.id;room.visited=true;r.clear();if(r.rewardPending)r.openReward();const saved=decodeSave(JSON.stringify(snapshot(r)));assert.ok(saved);const restored=restoreRun(saved);assert.deepEqual(restored.room.doors,room.doors);assert.equal(restored.rewardPending,r.rewardPending);for(const dir of DIRECTIONS)assert.equal(doorBlockReason(restored.rooms,restored.room,dir),doorBlockReason(r.rooms,room,dir))}}
});
