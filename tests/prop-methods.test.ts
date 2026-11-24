import test from 'node:test';
import assert from 'node:assert/strict';
import {propDrop,PROP_CHANCE,availablePropLoot,takePropLoot} from '../src/prop-loot';
import {Run} from '../src/run';
import {roomEnvironment} from '../src/environment';
import {decodeSave,restoreRun,type Checkpoint} from '../src/save';
test('crate opening and canister destruction have distinct deterministic reward odds',()=>{
 for(const kind of ['crate','canister'] as const)for(const method of ['open','break'] as const){let count=0;for(let seed=0;seed<10000;seed++)if(propDrop(seed,0,method,kind))count++;assert.ok(Math.abs(count/10000-PROP_CHANCE[kind][method])<.02,`${kind}/${method}: ${count}`)}
 for(let seed=0;seed<1000;seed++){if(propDrop(seed,0,'break','crate'))assert.ok(propDrop(seed,0,'open','crate'));if(propDrop(seed,0,'open','canister'))assert.ok(propDrop(seed,0,'break','canister'))}
});
test('opened method survives reload and collecting or revisiting never rerolls the same prop',()=>{
 const run=new Run(151),state=roomEnvironment(run.room);state.broken=15;state.openedProps=5;state.rewardRules=15;
 const checkpoint=():Checkpoint=>({version:1,seed:run.seed,floor:6,current:0,moves:[],rooms:run.rooms.map(({visited,cleared,rewardTaken,environment})=>({visited,cleared,rewardTaken,environment})),hp:6,kills:0,elapsed:0,drain:0,entry:null,phase:1,ending:false,savedAt:1});
 const restored=restoreRun(decodeSave(JSON.stringify(checkpoint()))!);assert.deepEqual(availablePropLoot(restored.room),availablePropLoot(run.room));assert.equal(restored.room.environment!.openedProps,5);
 for(const p of availablePropLoot(run.room)){assert.ok(takePropLoot(run.room,p.id,1,6));assert.equal(takePropLoot(run.room,p.id,1,6),null)}
 const again=restoreRun(decodeSave(JSON.stringify(checkpoint()))!);assert.deepEqual(availablePropLoot(again.room),[]);
 state.openedProps=16;assert.equal(decodeSave(JSON.stringify(checkpoint())),null);
});
