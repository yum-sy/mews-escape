import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,DELTA,OPPOSITE,enemyLayout} from '../src/dungeon';
import {Run} from '../src/run';
import {MOVES,composeAttack,rewardOptions} from '../src/moves';

test('1000 seeds produce connected, reciprocal nine-room layouts with reachable exits',()=>{
 for(let seed=0;seed<1000;seed++){
  const rooms=generateDungeon(seed);assert.equal(rooms.length,9);assert.equal(new Set(rooms.map(r=>`${r.x},${r.y}`)).size,9);
  assert.equal(rooms.filter(r=>r.kind==='combat').length,5);assert.equal(rooms.filter(r=>r.kind==='reward').length,2);
  const seen=new Set([0]),queue=[0];
  for(const id of queue)for(const [dir,target] of Object.entries(rooms[id].doors)){
   const d=dir as keyof typeof DELTA,r=rooms[target];assert.equal(r.doors[OPPOSITE[d]],id);assert.equal(r.x,rooms[id].x+DELTA[d][0]);assert.equal(r.y,rooms[id].y+DELTA[d][1]);
   if(!seen.has(target)){seen.add(target);queue.push(target)}
  }
  assert.equal(seen.size,9);assert.equal(rooms[0].kind,'start');assert.equal(enemyLayout(rooms[0]).length,0);assert.ok(seen.has(rooms.find(r=>r.kind==='exit')!.id));
 }
});
test('same seed reproduces rooms, enemies and reward options, other seeds vary',()=>{
 assert.deepEqual(generateDungeon(151),generateDungeon(151));assert.notDeepEqual(generateDungeon(151),generateDungeon(152));
 const room=generateDungeon(151).find(r=>r.kind==='combat')!;assert.deepEqual(enemyLayout(room),enemyLayout(room));assert.deepEqual(rewardOptions(room.seed,[]),rewardOptions(room.seed,[]));
});
test('combat locks travel; cleared rooms and claimed rewards persist on revisit',()=>{
 const run=new Run(151);run.current=run.rooms.find(r=>r.kind==='combat')!.id;
 const dir=Object.keys(run.room.doors)[0] as keyof typeof DELTA,id=run.current;
 assert.equal(run.travel(dir),false);run.clear();const reward=run.choices[0];assert.equal(run.choose(reward.id),true);assert.equal(run.choose(reward.id),false);assert.equal(run.choose('invalid'),false);
 assert.equal(run.travel(dir),true);assert.equal(run.travel(OPPOSITE[dir]),true);assert.equal(run.current,id);assert.equal(run.rewardPending,false);assert.equal(enemyLayout(run.room).length,0);assert.deepEqual(run.moves,[reward.id]);
});
test('full seeded run can claim rewards, revisit rooms and unlock exit without duplicates',()=>{
 const run=new Run(2718);assert.equal(run.canExit,false);
 const visit=()=>{const room=run.room;if(room.kind==='combat')run.clear();if(run.rewardPending)assert.ok(run.choose(run.choices[0].id));for(const [d,id] of Object.entries(room.doors)){if(run.rooms[id].visited)continue;assert.ok(run.travel(d as keyof typeof DELTA));visit();assert.ok(run.travel(OPPOSITE[d as keyof typeof DELTA]))}};
 visit();assert.equal(run.canExit,true);assert.equal(run.moves.length,7);assert.equal(run.rooms.filter(r=>r.visited).length,9);
 const fresh=new Run(2719);assert.deepEqual(fresh.moves,[]);assert.equal(fresh.canExit,false);assert.equal(fresh.rooms.filter(r=>r.visited).length,1);
});
test('independent modifiers compose and remain bounded under repeated upgrades',()=>{
 const a=composeAttack(['shadow','swift','tri','flame','ice','spark','split']);
 assert.equal(a.count,3);assert.equal(a.pierce,2);assert.ok(a.homing>0&&a.burn>0&&a.slow>0);assert.equal(a.chain,1);assert.equal(a.split,2);assert.equal(a.damage,1.35);
 const b=composeAttack(Array.from({length:100},()=>MOVES.map(m=>m.id)).flat());assert.equal(b.count,5);assert.equal(b.interval,.09);assert.equal(b.pierce,6);assert.equal(b.chain,3);assert.equal(b.split,2);assert.equal(b.slow,.65);assert.equal(b.size,11);
 const owned=MOVES.flatMap(m=>Array(m.max).fill(m.id));assert.equal(rewardOptions(12,owned).length,0);
});
