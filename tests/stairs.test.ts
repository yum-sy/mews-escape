import test from 'node:test';
import assert from 'node:assert/strict';
import {Run} from '../src/run';
import {stairLanding,onStairLanding} from '../src/stairs';
import {roomInteractions} from '../src/environment';
test('stair landings vary by seed, survive serialization and avoid center and doorway lanes',()=>{
 const positions=new Set<string>();for(let seed=1;seed<=100;seed++){
 const run=new Run(seed),room=run.rooms.find(r=>r.kind==='boss')!,p=stairLanding(room);positions.add(JSON.stringify(p));
 assert.deepEqual(stairLanding(JSON.parse(JSON.stringify(room))),p);
 assert.ok(p.x-62>80&&p.x+62<1040&&p.y-106>140&&p.y+20<590);
 assert.ok(Math.abs(p.x-560)>150);assert.ok(Math.abs(p.y-364)>40);
 assert.equal(onStairLanding(room,p),true);assert.equal(onStairLanding(room,{x:p.x+60,y:p.y}),false);
 room.cleared=true;assert.equal(roomInteractions(room,6,true).some(i=>i.kind==='lift'),false);
 room.rewardTaken=true;assert.deepEqual(roomInteractions(room,6,true).find(i=>i.kind==='lift'),{kind:'lift',...p,label:'B5로 올라가는 계단'});
 assert.equal(roomInteractions(room,1,true).some(i=>i.kind==='lift'),false);
 }assert.equal(positions.size,4);
});
