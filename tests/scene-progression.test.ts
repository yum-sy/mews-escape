import {cageSegments,cageBlocks,breakCage,ambushProp} from '../src/exploration-events';
import {obstacles,overlapsBlock,segmentBlockEntry} from '../src/lab';
import {sceneryBlocks,pathHitsProp,breakProp} from '../src/environment';
import {ambushEnemies} from '../src/run';
import {stairLanding,onStairLanding} from '../src/stairs';
import {fusionRules,thermalBank} from '../src/fusion-rules';
import {gasShellClosed} from '../src/enemy-techniques';
import {composeAttack,CHAIN_DAMAGE} from '../src/moves';
import {actorMotion} from '../src/actor-motion';
import {grantUnlock} from '../src/progression-unlocks';
import {secretInteractions} from '../src/secret-route';
import {isLabBoss} from '../src/boss-roster';
import {warningPattern,PATTERN_HINTS,PatternHints} from '../src/pattern-hints';
import {trapHits,trapPush,trapDamage,TRAP_RECOVERY} from '../src/traps';
import {poolPhase,hazardPhase} from '../src/scaling';
import {intersects,normalize} from '../src/combat';
import {floorLoot,takeFloorLoot} from '../src/floor-map';
import {ENTRY_SECONDS,entryLayout} from '../src/encounter';
import {availablePropLoot,takePropLoot} from '../src/prop-loot';
import {damage} from '../src/combat';
import {knockbackPosition} from '../src/lab';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {Run,roomsForFloor,roomEnemies} from '../src/run';
import {ROOM,STATS,ENEMIES} from '../src/data';
import {speciesSize} from '../src/scaling';
import {OPPOSITE} from '../src/dungeon';
import {doorBlockReason,thresholdDirection} from '../src/progression';
import {breakableProps,roomEnvironment,roomInteractions,nearestInteraction,floorTheme} from '../src/environment';
import {moveWithWalls} from '../src/lab';
import {FINAL_HP,nextFinalPhase} from '../src/finale';

// Execute the actual scene methods with rendering/audio/DOM adapters replaced.
// This is a state-machine regression test, not a browser or normal-play simulation.
function harness(){
 const source=ts.createSourceFile('scene.ts',readFileSync(new URL('../src/scene.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
 const declaration=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='LabScene')!;
 const js=ts.transpileModule(declaration.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const elements=new Map<string,any>(),element=(id:string)=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',focus(){},classList:{remove(){},add(){}},offsetWidth:0});return elements.get(id)};
 const context={cageSegments,cageBlocks,breakCage,ambushProp,obstacles,overlapsBlock,segmentBlockEntry,sceneryBlocks,pathHitsProp,breakProp,ambushEnemies,onStairLanding,fusionRules,thermalBank,gasShellClosed,CHAIN_DAMAGE,actorMotion,grantUnlock,browserStorage:{getItem:()=>null,setItem(){},removeItem(){}},secretInteractions,isLabBoss,warningPattern,PATTERN_HINTS,trapHits,trapPush,trapDamage,TRAP_RECOVERY,poolPhase,hazardPhase,intersects,normalize,floorLoot,takeFloorLoot,ENTRY_SECONDS,entryLayout,availablePropLoot,takePropLoot,damage,knockbackPosition,matchMedia:()=>({matches:true}),exports:{} as any,Phaser:{Scene:class{},Math:{Distance:{Between:(x:number,y:number,a:number,b:number)=>Math.hypot(x-a,y-b)},Clamp:(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))}},R:ROOM,STATS,ENEMIES,Run,roomEnemies,speciesSize,OPPOSITE,doorBlockReason,thresholdDirection,breakableProps,roomEnvironment,roomInteractions,nearestInteraction,floorTheme,moveWithWalls,FINAL_HP,nextFinalPhase,document:{getElementById:element}};
 vm.runInNewContext(js.replaceAll('import.meta.env.DEV','false'),context);
 const entity=(x=0,y=0)=>{const o:any={x,y,alive:true,destroy(){this.alive=false}};for(const method of ['setStrokeStyle','setRotation','setOrigin','setDisplaySize','setDepth','setAlpha','setAngle','setFlipX','setTint','clearTint'])o[method]=()=>o;o.setPosition=(x:number,y:number)=>{o.x=x;o.y=y;return o};return o};
 const scene:any=Object.create(context.exports.LabScene.prototype),timers:(()=>void)[]=[],notes:string[]=[];
 Object.assign(scene,{run:new Run(151),player:entity(560,365),shadow:entity(),enemies:[],loot:[],shots:[],beams:[],pools:[],blocks:[],env:[],state:'playing',finalPhase:1,hp:6,kills:0,elapsed:0,fire:0,inv:0,startDelay:0,transitionDelay:0,roomClock:0,noteTime:0,hudTime:0,weaponTimers:new Map(),weaponBursts:new Map(),controls:{reset(){},movement:()=>({x:0,y:0}),attack:()=>({x:0,y:0})},audioFX:{setScene(){},environment(){},play(){}},effects:{clear(){},setChannels(){},render(){}},lab:{update(){},refreshProps(){}},tweens:{add(){}},cameras:{main:{fadeOut(){},fadeIn(){scene.fadedIn=true}}},time:{delayedCall:(_n:number,f:()=>void)=>timers.push(f)},add:{circle:entity,image:entity,ellipse:entity,rectangle:entity},note:(s:string)=>notes.push(s),checkpoint:()=>{scene.saved=true},refreshRoom(){},updateHud(){},decorateRoom(){},updateHazards(){},updateEnemies(){},updateShots(){},burst(){},finalDialogue(){scene.state='story'},playEnding(){scene.state='won'},showReward(){scene.state='reward'}});
 return {scene,timers,notes,element};
}

test('last enemy death clears the room on the next update and all existing return doors work',()=>{
 const {scene:s}=harness();s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.enterRoom();assert.ok(s.enemies.length);
 s.startDelay=0;for(const e of s.enemies)s.hitEnemy(e,e.hp);s.update(0,16);assert.equal(s.run.room.cleared,true);assert.equal(s.enemies.length,0);
 const dir=Object.keys(s.run.room.doors).find(d=>s.run.rooms[s.run.room.doors[d]].kind!=='boss')!;const before=s.run.current;
 const points:any={up:[560,158,0,-1],down:[560,568,0,1],left:[96,364,-1,0],right:[1024,364,1,0]};const [x,y,dx,dy]=points[dir];s.player.setPosition(x,y);s.transitionDelay=0;assert.ok(s.tryTravel({x:dx,y:dy}));assert.notEqual(s.run.current,before);assert.equal(s.entry,OPPOSITE[dir as keyof typeof OPPOSITE]);assert.equal(s.run.room.visited,true);
});
test('reaching the boss allows entry while off-route combat stays optional',()=>{
 const {scene:s,notes}=harness();const boss=s.run.rooms.find((r:any)=>r.kind==='boss');const [back,parent]=Object.entries(boss.doors)[0] as [keyof typeof OPPOSITE,number];s.run.current=parent;s.run.clear();const dir=OPPOSITE[back];const p:any={up:[560,158,0,-1],down:[560,568,0,1],left:[96,364,-1,0],right:[1024,364,1,0]};const [x,y,dx,dy]=p[dir];s.player.setPosition(x,y);assert.equal(s.tryTravel({x:dx,y:dy}),true);assert.equal(s.run.room.kind,'boss');assert.ok(s.run.rooms.some((r:any)=>r.kind==='combat'&&!r.cleared));assert.equal(notes.length,0);
});
test('boss reward skip, all five stairs and all three final phases preserve a playable state',()=>{
 const {scene:s,timers}=harness();
 for(let floor=6;floor>=2;floor--){s.run.floor=floor;s.run.rooms=roomsForFloor(151,floor);for(const r of s.run.rooms)r.cleared=true;s.run.current=s.run.rooms.find((r:any)=>r.kind==='boss').id;s.run.room.visited=true;s.enterRoom();s.resume();s.interact();assert.equal(s.state,'reward');assert.ok(s.run.skipReward());s.resume();const landing=stairLanding(s.run.room);s.player.setPosition(landing.x,landing.y+12);s.controls.movement=()=>({x:0,y:-1});s.startDelay=0;s.update(0,16);assert.equal(s.state,'transition');assert.equal(timers.length,1);timers.shift()!();assert.equal(s.run.floor,floor-1);assert.equal(s.state,floor===2?'story':'playing')}
 for(let phase=1;phase<=3;phase++){assert.equal(s.finalPhase,phase);s.resume();s.startDelay=0;for(const e of s.enemies)s.hitEnemy(e,e.hp);s.update(0,16);assert.equal(s.state,phase===3?'won':'story')}
});
test('refused ascent restores visible play instead of trapping the game in transition',()=>{
 const {scene:s,timers,notes}=harness();s.interaction=()=>({kind:'lift'});s.run.ascend=()=>false;s.interact();assert.equal(s.state,'transition');timers.shift()!();assert.equal(s.state,'playing');assert.equal(s.fadedIn,true);assert.match(notes[0],/계단/);
});

test('arrival blocks movement, weapons, hazards and contact together, then releases in under a second',()=>{
 const {scene:s}=harness();s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.enterRoom('left');s.controls.movement=()=>({x:1,y:0});s.controls.attack=()=>({x:0,y:1});const x=s.player.x,hp=s.hp;let fire=0,hazards=0,enemies=0;s.fireWeapon=()=>fire++;s.updateHazards=()=>hazards++;s.updateEnemies=()=>enemies++;
 for(let i=0;i<20;i++){s.hurt({x:0,y:0});s.update(0,32)}assert.equal(s.player.x,x);assert.equal(s.hp,hp);assert.equal(fire,0);assert.equal(hazards,0);assert.equal(enemies,0);
 s.update(0,32);s.update(0,32);assert.ok(s.player.x>x);assert.equal(fire,1);assert.equal(enemies,1);assert.equal(hazards,1);
});
test('firing cannot cancel arrival and repeated hits cannot consume multiple hearts during recovery',()=>{
 const {scene:s}=harness();s.startDelay=ENTRY_SECONDS;s.controls.attack=()=>({x:1,y:0});s.fireWeapon(.016);assert.equal(s.startDelay,ENTRY_SECONDS);assert.equal(s.shots.length,0);s.interaction=()=>{throw Error('interaction ran during arrival')};s.interact();
 s.startDelay=0;s.hurt({x:0,y:0});assert.equal(s.hp,5);for(let i=0;i<100;i++)s.hurt({x:0,y:0});assert.equal(s.hp,5);assert.equal(s.inv,STATS.invulnerability);s.inv=0;s.hurt({x:0,y:0});assert.equal(s.hp,4);
});

test('active traps hurt and recoil both sides once, then respect recovery and disabled power',()=>{
 const {scene:s}=harness();s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.roomClock=1.2;s.toxic=0;s.toxicTick=1;s.hazardSlow=0;s.player.setPosition(560,350);const shape:any={setAlpha(){return this},setStrokeStyle(){return this}};s.env=[{shape,kind:'electric',x:560,y:350,r:50,offset:0}];const sprite:any={x:565,y:350,setPosition(x:number,y:number){this.x=x;this.y=y}};const enemy={sprite,hp:50,maxHp:50,radius:20,trapInv:0};s.enemies=[enemy];s.hitEnemy=(e:any,n:number)=>e.hp-=n;const update=Object.getPrototypeOf(s).updateHazards.bind(s);
 update(.016);assert.equal(s.hp,5);assert.equal(enemy.hp,41);assert.notEqual(s.player.y,350);assert.ok(sprite.x>565);s.player.setPosition(560,350);sprite.setPosition(565,350);for(let i=0;i<30;i++)update(.016);assert.equal(s.hp,5);assert.equal(enemy.hp,41);roomEnvironment(s.run.room).powerOff=true;s.inv=0;enemy.trapInv=0;update(.016);assert.equal(s.hp,5);assert.equal(enemy.hp,41);
});

test('first attack warnings stay live, keep controls active and never create a confirmation dialog',()=>{
 const {scene:s,element}=harness();let shown=0,updates=0,resets=0;s.telegraphs={show(){shown++},update(){}};s.controls.reset=()=>resets++;s.updateEnemies=()=>updates++;s.startDelay=0;const hp=s.hp;s.warn(300,300,40,{cue:'aim',directions:[{x:1,y:0}]});s.update(0,16);s.hurt({x:1,y:0});assert.equal(s.state,'playing');assert.equal(shown,1);assert.ok(updates>0);assert.equal(resets,0);assert.equal(s.hp,hp-1);assert.equal(element('hint-confirm').onclick,undefined);
});

test('actual scene interaction enters cache and depth, then returns without advancing the main floor',()=>{
 const {scene:s}=harness();s.run.floor=4;s.run.rooms=roomsForFloor(s.run.seed,4);s.run.keys=3;for(const r of s.run.rooms.slice(0,2)){r.visited=true;r.cleared=true;r.environment={broken:0,powerOff:false,recordRead:true}}
 s.player.setPosition(230,200);s.interact();assert.equal(s.run.branch,'cache');assert.equal(s.state,'playing');assert.equal(s.enemies.length,0);s.run.openReward();s.run.choose(s.run.choices.find((m:any)=>m.id!=='survey').id);s.startDelay=0;s.player.setPosition(560,500);s.interact();assert.equal(s.run.branch,'depth');assert.equal(s.run.keys,2);assert.equal(s.state,'playing');s.startDelay=0;s.player.setPosition(230,200);s.interact();assert.equal(s.run.branch,null);assert.equal(s.run.floor,4);assert.equal(s.run.current,0);assert.equal(s.run.moves.length,1);assert.equal(s.run.secretAvailable,false);
});

test('both elite bosses must die before room clear and Mewtwo inherits alert HP',()=>{
 const {scene:s}=harness();s.run.floor=4;s.run.rooms=roomsForFloor(151,4);s.run.keys=4;for(const r of s.run.rooms.slice(0,2)){r.visited=true;r.cleared=true;r.environment={broken:0,recordRead:true,powerOff:false}}s.run.enterSecret();s.run.openReward();s.run.skipReward();s.run.enterDepth();s.run.current=2;s.run.room.visited=true;s.enterRoom('left');assert.equal(s.enemies.length,2);s.startDelay=0;s.hitEnemy(s.enemies[0],1e6);s.update(0,16);assert.equal(s.run.room.cleared,false);s.hitEnemy(s.enemies[0],1e6);s.update(0,16);assert.equal(s.run.room.cleared,true);
 s.run=new Run(151);s.run.threat=4;s.run.floor=1;s.run.rooms=roomsForFloor(151,1);s.finalPhase=1;s.enterRoom();assert.equal(s.enemies[0].maxHp,Math.round(FINAL_HP[0]*1.2));
});

test('research zones use normal hit recovery, slow web contact, and clear on room transitions',()=>{const {scene:s}=harness();s.toxic=0;s.toxicTick=1;s.hazardSlow=0;let cleared=false;const zones=[{style:'web',a:{x:540,y:350},b:{x:580,y:350}},{style:'gas',a:{x:540,y:350},b:{x:580,y:350}}];s.researchZones={update:()=>zones,clear(){cleared=true;zones.length=0}};const update=Object.getPrototypeOf(s).updateHazards.bind(s);update(.016);assert.equal(s.hp,5);assert.ok(s.hazardSlow>0);update(.016);assert.equal(s.hp,5);s.clearActors();assert.equal(cleared,true);assert.equal(zones.length,0)});

function fusionHarness(){const {scene:s}=harness();const make=(id:number,x:number)=>({id,kind:'gastly',sprite:{x,y:350},hp:100,maxHp:100,charge:0,cooldown:2,burn:0,poison:0,slow:0,radius:15});s.enemies=[make(0,400),make(1,450),make(2,600)];s.effects.impact=()=>{};s.effects.bolt=()=>{};s.effects.siphon=()=>{};s.audioFX.hit=()=>{};s.audioFX.proc=()=>{};s.drain=0;return s}
test('real fusion hit and release conserve thermal damage and cannot discharge twice',()=>{const s=fusionHarness();s.run.moves=['icebeam','flame'];const e=s.enemies[0],a=s.run.attack;s.applyWeaponHit(e,a,e.sprite,{x:1,y:0},false,false,false);assert.ok(e.thermal>0);s.releaseThermal();const total=s.enemies.reduce((n:number,q:any)=>n+100-q.hp,0);assert.ok(Math.abs(total-a.damage*4/3)<1e-10);s.releaseThermal();assert.ok(Math.abs(s.enemies.reduce((n:number,q:any)=>n+100-q.hp,0)-total)<1e-10)});
test('real conduction only reaches wet targets and toxic siphon rewards existing poison',()=>{const s=fusionHarness(),e=s.enemies[0],a=composeAttack(['water','spark']);s.enemies[1].wet=2;s.applyWeaponHit(e,a,e.sprite,{x:1,y:0},false,true,false);assert.ok(s.enemies[1].hp<100);assert.equal(s.enemies[2].hp,100);assert.ok(e.wet>0);const drain=composeAttack(['drain','poison']);e.poison=0;s.drain=0;s.applyWeaponHit(e,drain,e.sprite,{x:1,y:0},false,false,false);const first=s.drain;s.drain=0;s.applyWeaponHit(e,drain,e.sprite,{x:1,y:0},false,false,false);assert.ok(s.drain>first*4)});

test('real active skill obeys combat/charge/arrival gates and expires its visual',()=>{const {scene:s}=harness();s.run.activeCharge=3;s.activeLeft=0;s.useActive();assert.equal(s.run.activeCharge,3);s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.startDelay=1;s.useActive();assert.equal(s.run.activeCharge,3);s.startDelay=0;s.useActive();assert.equal(s.run.activeCharge,0);assert.equal(s.activeLeft,2);const art=s.activeRing;s.useActive();assert.equal(s.activeLeft,2);s.updateActive(2.1);assert.equal(s.activeLeft,0);assert.equal(art.alive,false);assert.equal(s.activeRing,undefined)});
test('real reflector removes nearby hostile projectiles without granting contact immunity',()=>{const {scene:s}=harness();s.activeLeft=2;s.run.activeSkill='reflector';const sprite=s.add.image(s.player.x+30,s.player.y),glow=s.add.image(0,0);s.shots=[{sprite,glow,v:{x:0,y:0},life:2,hostile:true,tracking:0,returning:false}];Object.getPrototypeOf(s).updateShots.call(s,.016);assert.equal(s.shots.length,0);assert.equal(s.hp,6);s.hurt({x:1,y:0});assert.equal(s.hp,5)});

test('decoy has distinct start/end feedback and clears its marker at expiry',()=>{const {scene:s}=harness();const events:string[]=[];s.effects.active=(kind:string,_p:any,left:number)=>events.push(`${kind}:${left}`);s.effects.activeBurst=(_p:any,kind:string,end:boolean)=>events.push(`${kind}:${end?'end':'start'}`);s.audioFX.active=(kind:string,event:string)=>events.push(`${kind}:${event}`);s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.run.activeSkill='decoy';s.run.unlocks=['decoy'];s.run.activeCharge=3;s.activeLeft=0;s.useActive();assert.equal(s.activeLeft,2.8);assert.equal(s.decoy.x,560);assert.equal(s.decoy.y,365);const art=s.activeArt;s.updateActive(3);assert.equal(art.alive,false);assert.equal(s.decoy,undefined);assert.ok(events.includes('decoy:start'));assert.ok(events.includes('decoy:0'));assert.ok(events.includes('decoy:end'))});

test('direct item buttons consume their own inventory and cannot switch an active effect',()=>{const {scene:s}=harness();s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.run.collectActive('reflector');s.run.collectActive('decoy');s.activeLeft=0;s.useActive('decoy');assert.equal(s.run.activeStock.decoy.count,1);assert.equal(s.activeLeft,0);s.run.unlocks=['decoy'];s.useActive('reflector');assert.equal(s.run.activeStock.reflector.count,0);assert.equal(s.run.activeStock.decoy.count,1);s.useActive('decoy');assert.equal(s.run.activeSkill,'reflector');assert.equal(s.run.activeStock.decoy.count,1);s.updateActive(2.1);s.useActive('decoy');assert.equal(s.run.activeStock.decoy.count,0);assert.equal(s.run.activeSkill,'decoy');assert.equal(s.activeLeft,2.8)});


test('real scenery interaction releases a warned crate creature once and persists its defeat',()=>{
 const {scene:s}=harness();let selected=false;
 for(let seed=0;seed<100&&!selected;seed++){const run=new Run(seed),room=run.rooms.find(r=>ambushProp(r)!==null);if(!room)continue;run.current=room.id;room.visited=true;room.cleared=true;s.run=run;selected=true}
 const id=ambushProp(s.run.room)!,prop=breakableProps(s.run.room).find(p=>p.id===id)!;s.enterRoom();s.blocks=[...obstacles(s.run.room),...sceneryBlocks(s.run.room)];s.hitScenery([{x:prop.x,y:prop.y,width:1}]);assert.equal(s.enemies.length,1);assert.equal(s.enemies[0].propId,id);assert.equal(s.enemies[0].recovery,1.2);s.hitScenery([{x:prop.x,y:prop.y,width:1}]);assert.equal(s.enemies.length,1);const enemy=s.enemies[0];assert.ok(!s.blocks.some((b:any)=>overlapsBlock(enemy.sprite,enemy.radius,b)));s.hitEnemy(enemy,1e5);assert.ok(roomEnvironment(s.run.room).ambushCleared!&(1<<id));assert.ok(s.loot.some((p:any)=>p.id===id&&p.kind==='reflector'));s.enterRoom();assert.equal(s.enemies.length,0);
});

test('reflector remains usable against a crate ambush in an already cleared room',()=>{const {scene:s}=harness();s.run.room.cleared=true;s.run.collectActive('reflector');s.enemies=[{hp:4}];s.startDelay=0;s.activeLeft=0;s.useActive();assert.equal(s.activeLeft,2);assert.equal(s.run.activeStock.reflector.count,0)});
