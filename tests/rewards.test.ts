import {test} from 'node:test';import assert from 'node:assert/strict';
import {roomReward,itemOffers,rewardTier} from '../src/rewards';
import {Run,roomsForFloor} from '../src/run';
import {MOVES,composeAttack,CRITICAL_MULTIPLIER} from '../src/moves';
import {fusionLook,presentation} from '../src/techniques';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
test('ordinary clears occasionally offer techniques, and rare items retain lower weights',()=>{
 const counts={none:0,key:0,heart:0,treasure:0};let earlyRare=0,lateRare=0;
 for(let seed=0;seed<10000;seed++){const room={...roomsForFloor(seed,6).find(r=>r.kind==='combat')!,seed};counts[roomReward(room,6) as keyof typeof counts]++;
  for(const [floor,add] of [[6,()=>earlyRare++],[2,()=>lateRare++]] as const){const choices=itemOffers(seed,[],floor,'treasure');assert.ok(choices.length===2&&choices[0].id!==choices[1].id);if(rewardTier(choices[0].id)==='희귀 변형')add()}
  assert.ok(itemOffers(seed,[],6,'boss').every(m=>['agility','focus','dragon','ricochet','ice','shadow','psybeam','spark','poison','flame','water'].includes(m.id)));
 }
 assert.ok(Math.abs(counts.none/10000-.47)<.02);assert.ok(Math.abs(counts.key/10000-.25)<.02);assert.ok(Math.abs(counts.heart/10000-.2)<.02);assert.ok(Math.abs(counts.treasure/10000-.08)<.015);assert.ok(earlyRare<1800&&earlyRare>1000);assert.ok(lateRare>earlyRare*1.4);
});
test('one key opens a frozen offer exactly once and it survives save, leave and reload',()=>{
 const run=new Run(3);run.current=run.rooms.find(r=>r.kind==='reward')!.id;run.room.visited=true;
 run.keys=0;assert.equal(run.openReward(),false);assert.equal(run.choose(run.choices[0].id),false);
 run.keys=1;assert.equal(run.openReward(),true);assert.equal(run.keys,0);const offer=run.choices.map(m=>m.id);assert.ok(run.openReward());assert.equal(run.keys,0);
 const snap:Checkpoint={version:1,keys:run.keys,seed:3,floor:6,current:run.current,moves:[],rooms:run.rooms.map(r=>({visited:r.visited,cleared:r.cleared,rewardTaken:r.rewardTaken,offer:r.offer,opened:r.opened})),hp:4,kills:0,elapsed:0,drain:0,entry:null,phase:1,ending:false,savedAt:1};
 const decoded=decodeSave(JSON.stringify(snap));assert.ok(decoded);const restored=restoreRun(decoded);assert.deepEqual(restored.choices.map(m=>m.id),offer);assert.equal(restored.keys,0);assert.ok(restored.choose(offer[0]));assert.equal(restored.choose(offer[0]),false);
 delete snap.keys;assert.equal(restoreRun(decodeSave(JSON.stringify(snap))!).keys,1);
});
test('boss reward grants a key once even when skipped; supplies do not grow the build',()=>{
 const run=new Run(3);run.current=run.rooms.find(r=>r.kind==='boss')!.id;run.clear();const before=run.keys;assert.ok(run.openReward());assert.ok(run.skipReward());assert.equal(run.keys,before+1);assert.equal(run.skipReward(),false);assert.deepEqual(run.moves,[]);
 for(let seed=0;seed<100;seed++){const r=new Run(seed);r.current=r.rooms.find(x=>x.kind==='combat')!.id;r.clear();const k=r.keys,result=r.claimSupply();if(result==='key')assert.equal(r.keys,k+1);assert.equal(r.claimSupply(),null);assert.deepEqual(r.moves,[])}
});
test('no first pickup boosts expected direct DPS by more than 30%; old full builds remain bounded',()=>{
 const dps=(ids:string[])=>{const a=composeAttack(ids);return a.damage*a.count/a.interval*(1+a.crit*(CRITICAL_MULTIPLIER-1))};
 for(const m of MOVES)assert.ok(dps([m.id])<=dps([])*1.3,m.id);
 const full=MOVES.flatMap(m=>Array(m.max).fill(m.id)),a=composeAttack(full.filter(id=>!['swift','tri'].includes(id)));
 assert.ok(a.damage*a.count/a.interval*(1+a.crit*.6)<14);assert.ok(a.burn+a.poison<=.900001);assert.ok(a.lifesteal<=1/220);
});
test('fusion recipes are acquisition-order independent and retain thermal identity',()=>{
 for(const ids of [['flamethrower','icebeam'],['water','spark'],['poison','flame']]){assert.deepEqual(fusionLook(presentation(ids)),fusionLook(presentation([...ids].reverse())))}
 assert.equal(fusionLook(presentation(['flamethrower','icebeam'])).recipe,'thermal');
});

test('frozen offers never exceed rank limits when a different room supplies the same item',()=>{const run=new Run(3);run.current=run.rooms.find(r=>r.kind==='reward')!.id;run.openReward();const id=run.choices[0].id;run.moves=Array(MOVES.find(m=>m.id===id)!.max).fill(id);assert.equal(run.choose(id),false);assert.ok(!run.choices.some(m=>m.id===id));assert.ok(run.skipReward())});

test('an exhausted treasure pool does not consume a key',()=>{const run=new Run(3);run.current=run.rooms.find(r=>r.kind==='reward')!.id;run.moves=MOVES.flatMap(m=>Array(m.max).fill(m.id));assert.equal(run.openReward(),false);assert.equal(run.keys,1);assert.equal(run.room.opened,undefined)});
