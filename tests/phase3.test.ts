import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ENEMIES,NORMAL_KINDS} from '../src/data';
import {SPECIES,speciesSize,difficulty,hazardPhase} from '../src/scaling';
import {stepBrain,bossPhase,type Brain} from '../src/ai';
import {knockbackPosition,obstacles,overlapsBlock,moveWithWalls} from '../src/lab';
import {generateDungeon,enemyLayout} from '../src/dungeon';
import {Run} from '../src/run';
import {MOVES,composeAttack} from '../src/moves';

test('real species heights control visible sizes and padded PNG bounds',()=>{
 assert.equal(SPECIES.mew.heightDm,4);assert.equal(SPECIES.gengar.heightDm,15);
 for(const [name,data] of Object.entries(SPECIES)){const size=speciesSize(name as keyof typeof SPECIES);assert.ok(size.radius>0&&size.radius<size.height/2);assert.ok(data.bounds[2]>data.bounds[0]&&data.bounds[3]>data.bounds[1]);}
 assert.ok(speciesSize('gengar').height>speciesSize('gastly').height);assert.ok(speciesSize('gastly').height>speciesSize('zubat').height);assert.ok(speciesSize('zubat').height>speciesSize('mew').height);
});
test('every upward floor increases health, speed, bullets, room count and hazard frequency',()=>{
 for(let f=6;f>2;f--){const a=difficulty(f),b=difficulty(f-1);for(const k of ['hp','speed','shotSpeed','combatCount'] as const)assert.ok(b[k]>a[k]);assert.ok(b.hazardPeriod<a.hazardPeriod)}
});
test('boss gate is a leaf and never blocks required combat rooms across 1000 seeds',()=>{
 for(let seed=0;seed<1000;seed++)for(const count of [5,9]){const rooms=generateDungeon(seed,count),boss=rooms.find(r=>r.kind==='boss')!;assert.equal(Object.keys(boss.doors).length,1);assert.equal(rooms.filter(r=>r.kind==='combat').length,count);const seen=new Set([0]),q=[0];for(const id of q)for(const target of Object.values(rooms[id].doors))if(target!==boss.id&&!seen.has(target)){seen.add(target);q.push(target)}assert.equal(seen.size,rooms.length-1)}
});
test('boss cannot be entered early and cannot be bypassed for ascent',()=>{
 const r=new Run(151),boss=r.rooms.find(x=>x.kind==='boss')!;const [dir,parent]=Object.entries(boss.doors)[0];r.current=parent;r.room.cleared=true;const toBoss=({up:'down',down:'up',left:'right',right:'left'} as const)[dir as 'up'];assert.equal(r.travel(toBoss),false);for(const room of r.rooms)if(room.kind==='combat')room.cleared=true;assert.equal(r.travel(toBoss),true);assert.equal(r.canExit,false);assert.equal(r.ascend(),false);
});
test('all normal species have executable attacks across different roles; boss intensifies below half HP',()=>{
 const brain=():Brain=>({x:400,y:300,hp:100,cooldown:0,charge:0,dir:{x:0,y:0},phase:1}),p={x:560,y:450};
 const shotCounts:number[]=[];
 for(const kind of NORMAL_KINDS){const b=brain(),target=['zubat','sandshrew','sandslash','murkrow'].includes(kind)?{x:400,y:450}:p,first=stepBrain(kind,b,target,.016);assert.ok(Number.isFinite(first.v.x));let actions=[...first.actions];for(let i=0;i<60;i++)actions.push(...stepBrain(kind,b,target,.016).actions);assert.ok(actions.length>0,kind);shotCounts.push(actions.filter(a=>a.type==='shot').length)}
 assert.ok(new Set(shotCounts).size>2);
 assert.equal(bossPhase(180),1);assert.equal(bossPhase(49),2);
 const b=brain();b.hp=40;let actions=stepBrain('gengar',b,p,.016).actions;assert.equal(actions[0].type,'phase');for(let i=0;i<160;i++)actions.push(...stepBrain('gengar',b,p,.016).actions);assert.equal(actions.filter(a=>a.type==='shot').length,12);assert.ok(actions.some(a=>a.type==='pool'));assert.ok(actions.findIndex(a=>a.type==='warn')<actions.findIndex(a=>a.type==='blink'));
});
test('obstacles preserve entry corridors, center and spawn positions for all templates',()=>{
 for(let seed=0;seed<50;seed++)for(const room of generateDungeon(seed)){const blocks=obstacles(room);for(const p of [...enemyLayout(room),{x:560,y:184},{x:560,y:542},{x:126,y:364},{x:994,y:364},{x:560,y:365}])assert.ok(!blocks.some(b=>overlapsBlock(p,28,b)));}
 const b={x:100,y:100,w:40,h:40};assert.deepEqual(moveWithWalls({x:60,y:100},{x:20,y:5},[b],10),{x:60,y:105});
});
test('hazards warn before damage and have an idle window',()=>{assert.equal(hazardPhase(.5,5),'warning');assert.equal(hazardPhase(1.2,5),'active');assert.equal(hazardPhase(2.1,5),'idle');assert.equal(hazardPhase(5.2,5),'warning')});
test('content includes 10+ named moves and 15+ independently used modifier channels',()=>{
 assert.ok(MOVES.filter(m=>m.type!=='강화').length>=10);assert.ok(new Set(MOVES.flatMap(m=>Object.keys(m.modifier))).size>=15);
 const a=composeAttack(['poison','dragon','drain','focus','ricochet','sludge','water']);assert.ok(a.poison>0&&a.knockback>0&&a.lifesteal>0&&a.crit>0&&a.bounce>0&&a.blast>0&&a.speed>600&&a.range>720);
});

test('high-output player builds cannot consume the enemy bullet reserve',async()=>{
 const {canSpawnProjectile}=await import('../src/combat');const player=Array.from({length:80},()=>({hostile:false}));assert.equal(canSpawnProjectile(player,false),false);assert.equal(canSpawnProjectile(player,true),true);const full=[...player,...Array.from({length:40},()=>({hostile:true}))];assert.equal(canSpawnProjectile(full,true),false);
});

test('damage recoil cannot embed Mew inside a crate and movement away remains possible',()=>{
 const crate={x:950,y:480,w:50,h:48},p={x:906,y:480};
 const pushed=knockbackPosition(p,{x:1,y:0},[crate],18);
 assert.ok(!overlapsBlock(pushed,18,crate));assert.equal(pushed.x,p.x);
 assert.ok(moveWithWalls(pushed,{x:-4,y:0},[crate],18).x<pushed.x);
 const corner=knockbackPosition({x:910,y:442},{x:.707,y:.707},[crate],18);assert.ok(!overlapsBlock(corner,18,crate));
 assert.deepEqual(knockbackPosition({x:98,y:160},{x:-1,y:-1},[],18),{x:96,y:158});
});
