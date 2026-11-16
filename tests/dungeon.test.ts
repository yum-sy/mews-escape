import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,DELTA,OPPOSITE,enemyLayout} from '../src/dungeon';
import {itemOffers} from '../src/rewards';
import {Run} from '../src/run';
import {MOVES,composeAttack} from '../src/moves';

test('1000 seeds produce connected, reciprocal nine-room layouts with reachable exits',()=>{
 for(let seed=0;seed<1000;seed++){
  const rooms=generateDungeon(seed);assert.equal(rooms.length,9);assert.equal(new Set(rooms.map(r=>`${r.x},${r.y}`)).size,9);
  assert.equal(rooms.filter(r=>r.kind==='combat').length,5);assert.equal(rooms.filter(r=>r.kind==='reward').length,2);
  const seen=new Set([0]),queue=[0];
  for(const id of queue)for(const [dir,target] of Object.entries(rooms[id].doors)){
   const d=dir as keyof typeof DELTA,r=rooms[target];assert.equal(r.doors[OPPOSITE[d]],id);assert.equal(r.x,rooms[id].x+DELTA[d][0]);assert.equal(r.y,rooms[id].y+DELTA[d][1]);
   if(!seen.has(target)){seen.add(target);queue.push(target)}
  }
  assert.equal(seen.size,9);assert.equal(rooms[0].kind,'start');assert.equal(enemyLayout(rooms[0]).length,0);assert.ok(seen.has(rooms.find(r=>r.kind==='boss')!.id));
 }
});
test('same seed reproduces rooms, enemies and reward options, other seeds vary',()=>{
 assert.deepEqual(generateDungeon(151),generateDungeon(151));assert.notDeepEqual(generateDungeon(151),generateDungeon(152));
 const room=generateDungeon(151).find(r=>r.kind==='combat')!;assert.deepEqual(enemyLayout(room),enemyLayout(room));assert.deepEqual(itemOffers(room.seed,[],6,'treasure'),itemOffers(room.seed,[],6,'treasure'));
});
test('combat locks travel; cleared rooms and claimed rewards persist on revisit',()=>{
 const run=new Run(151);run.current=run.rooms.find(r=>r.kind==='reward')!.id;run.room.cleared=false;
 const dir=Object.keys(run.room.doors)[0] as keyof typeof DELTA,id=run.current;
 assert.equal(run.travel(dir),false);run.clear();assert.ok(run.openReward());const reward=run.choices[0];assert.equal(run.choose(reward.id),true);assert.equal(run.choose(reward.id),false);assert.equal(run.choose('invalid'),false);
 assert.equal(run.travel(dir),true);run.clear();assert.equal(run.travel(OPPOSITE[dir]),true);assert.equal(run.current,id);assert.equal(run.rewardPending,false);assert.equal(enemyLayout(run.room).length,0);assert.deepEqual(run.moves,[reward.id]);
});
function clearFloor(run:Run){
 const visited=new Set<number>();
 const visit=()=>{const room=run.room;visited.add(room.id);if(room.kind==='combat')run.clear();if(run.rewardPending){if(!run.claimSupply()&&run.openReward()){const choice=run.choices[0];if(choice)assert.ok(run.choose(choice.id));else run.skipReward()}}for(const [d,id] of Object.entries(room.doors)){if(visited.has(id)||run.rooms[id].kind==='boss')continue;assert.ok(run.travel(d as keyof typeof DELTA));visit();assert.ok(run.travel(OPPOSITE[d as keyof typeof DELTA]))}};
 visit();assert.equal(visited.size,run.rooms.length-1);assert.equal(run.canExit,false);
 const target=run.rooms.find(r=>r.kind==='boss')!.id,queue:[number,(keyof typeof DELTA)[]][]=[[run.current,[]]],seen=new Set([run.current]);
 for(const [id,path] of queue){if(id===target){for(const d of path)assert.ok(run.travel(d));break}for(const [d,next] of Object.entries(run.rooms[id].doors))if(!seen.has(next)){seen.add(next);queue.push([next,[...path,d as keyof typeof DELTA]])}}
 assert.equal(run.room.kind,'boss');assert.equal(run.canExit,false);run.clear();assert.equal(run.canExit,true);
}
test('five escalating floors preserve builds and require the boss before ascent',()=>{
 const run=new Run(2718);let previous=0;
 for(let floor=6;floor>=2;floor--){assert.equal(run.floor,floor);assert.equal(run.ascend(),false);clearFloor(run);assert.ok(run.moves.length>=previous);previous=run.moves.length;if(floor>2){assert.equal(run.ascend(),true);assert.equal(run.current,0);assert.equal(run.canExit,false)}else{assert.equal(run.ascend(),true);assert.equal(run.floor,1);assert.equal(run.rooms.length,1);assert.equal(run.room.kind,'boss');assert.equal(run.canExit,false);assert.equal(run.ascend(),false);run.clear();assert.equal(run.ascend(),false)}}
 const fresh=new Run(2719);assert.deepEqual(fresh.moves,[]);assert.equal(fresh.floor,6);assert.equal(fresh.canExit,false);
});
test('independent modifiers compose and remain bounded under repeated upgrades',()=>{
 const a=composeAttack(['shadow','swift','tri','flame','ice','spark','split']);
 assert.equal(a.count,3);assert.equal(a.pierce,1);assert.ok(a.homing>0&&a.burn>0&&a.slow>0);assert.equal(a.chain,1);assert.equal(a.split,2);assert.ok(Math.abs(a.damage*3-(1+.28/(1+.28*.65))*.3575)<1e-10);
 const b=composeAttack(Array.from({length:100},()=>MOVES.map(m=>m.id)).flat());assert.equal(b.count,5);assert.equal(b.interval,.155);assert.equal(b.pierce,2);assert.equal(b.chain,2);assert.equal(b.split,2);assert.equal(b.slow,.45);assert.equal(b.size,11);
 const owned=MOVES.flatMap(m=>Array(m.max).fill(m.id));assert.deepEqual(itemOffers(12,owned,2,'treasure'),[]);
});
