import {isLabBoss} from '../src/boss-roster';
import {warningPattern,PATTERN_HINTS,PatternHints} from '../src/pattern-hints';
import {trapHits,trapPush,trapDamage,TRAP_RECOVERY} from '../src/traps';
import {poolPhase,hazardPhase} from '../src/scaling';
import {intersects} from '../src/combat';
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
import {roomEnvironment,roomInteractions,nearestInteraction,floorTheme} from '../src/environment';
import {moveWithWalls} from '../src/lab';
import {FINAL_HP,nextFinalPhase} from '../src/finale';

// Execute the actual scene methods with rendering/audio/DOM adapters replaced.
// This is a state-machine regression test, not a browser or normal-play simulation.
function harness(){
 const source=ts.createSourceFile('scene.ts',readFileSync(new URL('../src/scene.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
 const declaration=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='LabScene')!;
 const js=ts.transpileModule(declaration.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const elements=new Map<string,any>(),element=(id:string)=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',focus(){},classList:{remove(){},add(){}},offsetWidth:0});return elements.get(id)};
 const context={isLabBoss,warningPattern,PATTERN_HINTS,trapHits,trapPush,trapDamage,TRAP_RECOVERY,poolPhase,hazardPhase,intersects,floorLoot,takeFloorLoot,ENTRY_SECONDS,entryLayout,availablePropLoot,takePropLoot,damage,knockbackPosition,matchMedia:()=>({matches:true}),exports:{} as any,Phaser:{Scene:class{},Math:{Clamp:(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))}},R:ROOM,STATS,ENEMIES,Run,roomEnemies,speciesSize,OPPOSITE,doorBlockReason,thresholdDirection,roomEnvironment,roomInteractions,nearestInteraction,floorTheme,moveWithWalls,FINAL_HP,nextFinalPhase,document:{getElementById:element}};
 vm.runInNewContext(js.replaceAll('import.meta.env.DEV','false'),context);
 const entity=(x=0,y=0)=>{const o:any={x,y,alive:true,destroy(){this.alive=false}};for(const method of ['setDisplaySize','setDepth','setAlpha','setAngle','setFlipX','setTint','clearTint'])o[method]=()=>o;o.setPosition=(x:number,y:number)=>{o.x=x;o.y=y;return o};return o};
 const scene:any=Object.create(context.exports.LabScene.prototype),timers:(()=>void)[]=[],notes:string[]=[];
 Object.assign(scene,{run:new Run(151),player:entity(560,365),shadow:entity(),enemies:[],loot:[],shots:[],beams:[],pools:[],blocks:[],env:[],state:'playing',finalPhase:1,hp:6,kills:0,elapsed:0,fire:0,inv:0,startDelay:0,transitionDelay:0,roomClock:0,noteTime:0,hudTime:0,weaponTimers:new Map(),weaponBursts:new Map(),controls:{reset(){},movement:()=>({x:0,y:0}),attack:()=>({x:0,y:0})},audioFX:{setScene(){},environment(){},play(){}},effects:{clear(){},setChannels(){},render(){}},lab:{update(){}},cameras:{main:{fadeOut(){},fadeIn(){scene.fadedIn=true}}},time:{delayedCall:(_n:number,f:()=>void)=>timers.push(f)},add:{image:entity,ellipse:entity,rectangle:entity},note:(s:string)=>notes.push(s),checkpoint:()=>{scene.saved=true},refreshRoom(){},updateHud(){},decorateRoom(){},updateHazards(){},updateEnemies(){},updateShots(){},burst(){},finalDialogue(){scene.state='story'},playEnding(){scene.state='won'},showReward(){scene.state='reward'}});
 return {scene,timers,notes,element};
}

test('last enemy death clears the room on the next update and all existing return doors work',()=>{
 const {scene:s}=harness();s.run.current=s.run.rooms.find((r:any)=>r.kind==='combat').id;s.enterRoom();assert.ok(s.enemies.length);
 s.startDelay=0;for(const e of s.enemies)s.hitEnemy(e,e.hp);s.update(0,16);assert.equal(s.run.room.cleared,true);assert.equal(s.enemies.length,0);
 const dir=Object.keys(s.run.room.doors).find(d=>s.run.rooms[s.run.room.doors[d]].kind!=='boss')!;const before=s.run.current;
 const points:any={up:[560,158,0,-1],down:[560,568,0,1],left:[96,364,-1,0],right:[1024,364,1,0]};const [x,y,dx,dy]=points[dir];s.player.setPosition(x,y);s.transitionDelay=0;assert.ok(s.tryTravel({x:dx,y:dy}));assert.notEqual(s.run.current,before);assert.equal(s.entry,OPPOSITE[dir as keyof typeof OPPOSITE]);assert.equal(s.run.room.visited,true);
});
test('locked boss threshold explains the existing rule without revealing future room types',()=>{
 const {scene:s,notes}=harness();const boss=s.run.rooms.find((r:any)=>r.kind==='boss');const [back,parent]=Object.entries(boss.doors)[0] as [keyof typeof OPPOSITE,number];s.run.current=parent;s.run.clear();const dir=OPPOSITE[back];const p:any={up:[560,158,0,-1],down:[560,568,0,1],left:[96,364,-1,0],right:[1024,364,1,0]};const [x,y,dx,dy]=p[dir];s.player.setPosition(x,y);assert.equal(s.tryTravel({x:dx,y:dy}),false);assert.match(notes[0],/남은 전투방/);s.tryTravel({x:dx,y:dy});assert.equal(notes.length,1);
});
test('boss reward skip, all five lifts and all three final phases preserve a playable state',()=>{
 const {scene:s,timers}=harness();
 for(let floor=6;floor>=2;floor--){s.run.floor=floor;s.run.rooms=roomsForFloor(151,floor);for(const r of s.run.rooms)r.cleared=true;s.run.current=s.run.rooms.find((r:any)=>r.kind==='boss').id;s.run.room.visited=true;s.enterRoom();s.resume();s.interact();assert.equal(s.state,'reward');assert.ok(s.run.skipReward());s.resume();s.interact();assert.equal(s.state,'transition');assert.equal(timers.length,1);timers.shift()!();assert.equal(s.run.floor,floor-1);assert.equal(s.state,floor===2?'story':'playing')}
 for(let phase=1;phase<=3;phase++){assert.equal(s.finalPhase,phase);s.resume();s.startDelay=0;for(const e of s.enemies)s.hitEnemy(e,e.hp);s.update(0,16);assert.equal(s.state,phase===3?'won':'story')}
});
test('refused ascent restores visible play instead of trapping the game in transition',()=>{
 const {scene:s,timers,notes}=harness();s.interaction=()=>({kind:'lift'});s.run.ascend=()=>false;s.interact();assert.equal(s.state,'transition');timers.shift()!();assert.equal(s.state,'playing');assert.equal(s.fadedIn,true);assert.match(notes[0],/승강기/);
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

test('first-pattern help freezes play until confirmation and is not repeated in a new session',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};const {scene:s,element}=harness();s.hints=new PatternHints(storage);let updates=0;s.updateEnemies=()=>updates++;s.offerHint('beam');assert.equal(s.state,'hint');s.update(0,32);s.hurt({x:1,y:0});assert.equal(updates,0);assert.equal(s.hp,6);element('hint-confirm').onclick();assert.equal(s.state,'playing');assert.equal(element('pattern-hint').hidden,true);s.hints=new PatternHints(storage);s.offerHint('beam');assert.equal(s.state,'playing');
});
