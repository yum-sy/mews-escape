import {onStairLanding} from './stairs';
import {bindTouchAction} from './touch-action';
import {actorMotion} from './actor-motion';
import {readUnlocks,grantUnlock,unlockSummary,ACTIVE_NAMES,type Unlock} from './progression-unlocks';
import {fusionRules,reflectionAttack,thermalBank,FUSION_HELP} from './fusion-rules';
import {EncounterFamiliarity} from './encounter-familiarity';
import {ResearchZones} from './research-zones';
import {enemyPose} from './enemy-pose';
import {NORMAL_VARIANTS} from './normal-patterns';
import {attachSecretRoute} from './save';
import {secretInteractions} from './secret-route';
import {enemyProjectile} from './enemy-effects';
import {ENEMY_TECHNIQUES,enemyWarning,gasShellClosed} from './enemy-techniques';
import {isLabBoss} from './boss-roster';
import {stepBoss} from './boss-ai';
import {trapHits,trapPush,trapDamage,TRAP_RECOVERY} from './traps';
import {poolPhase,POOL_WARNING,TRACKING_SECONDS} from './scaling';
import {Telegraphs,type Warning} from './telegraphs';
import {ENTRY_SECONDS,entryLayout} from './encounter';
import {floorLoot,takeFloorLoot} from './floor-map';
import type {PropLoot} from './prop-loot';
import {lightProp,PROP_SIZE} from './prop-lighting';
import {doorBlockReason,thresholdDirection,progressionReport} from './progression';
import ARTWORK from './artwork-frames.json';
import {techniqueIcon,techniqueBadge,moveHint,stableMarkup} from './technique-icons';
import {symbol,paintHealth} from './hud-symbols';
import {arenaView} from './viewport';
import {roomKnown,roomMapIcon,roomMapLabel} from './exploration';
import {objective,attackTraits,rewardComparison,formatDuration,attackLabel} from './player-ui';
import {readProfile,rememberRecord,finishProfile} from './profile';
import {LabPresentation} from './lab-presentation';
import {roomEnvironment,roomInteractions,nearestInteraction,breakableProps,breakProp,floorTheme,sceneryBlocks} from './environment';
import {weaponProfile,fusionLayers,tickAttack,traceWeapon,distanceToSegment,type WeaponPath} from './weapons';
import {roomReward,rewardTier} from './rewards';
import {FORMS,glyph} from './techniques';
import Phaser from 'phaser';
import {CombatEffects} from './effects';
import {ROOM as R,STATS,ENEMIES,type Kind} from './data';
import {damage,intersects,normalize,canSpawnProjectile,type Vec} from './combat';
import {Controls} from './input';
import {AudioFX} from './audio';
import {Run,roomEnemies} from './run';
import {FINAL_HP,stepMewtwo,nextFinalPhase,beamPhase,beamHits,type FinalPhase} from './finale';
import {browserStorage,readCheckpoint,writeCheckpoint,removeCheckpoint,restoreRun,type Checkpoint} from './save';
import {showStory} from './story-player';
import {OPPOSITE,type Direction} from './dungeon';
import {MOVES,composeAttack,splitAttack,CHAIN_DAMAGE,BLAST_DAMAGE,PIERCE_RETAIN,CRITICAL_MULTIPLIER,type Attack} from './moves';
import {setupShell} from './shell';
import {LAB_RECORDS,MEWTWO_SCRIPT,ENDING} from './story';
import {knockbackPosition,obstacles,debris,moveWithWalls,overlapsBlock,type Block} from './lab';
import {stepBrain} from './ai';
import {SPECIES,speciesSize,hazardPhase} from './scaling';

type Enemy={motionSpeed?:number;wet?:number;thermal?:number;id:number;sprite:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;bar:Phaser.GameObjects.Rectangle;kind:Kind;hp:number;cooldown:number;charge:number;dir:Vec;flash:number;burn:number;slow:number;statusTime:number;poison:number;phase:number;maxHp:number;radius:number;cycle:number;recovery:number;dash:number;trapInv:number;aim?:Vec;lastPlayer?:Vec};
type Shot={sprite:Phaser.GameObjects.Arc;glow:Phaser.GameObjects.Arc|Phaser.GameObjects.Image;v:Vec;life:number;hostile:boolean;attack:Attack;hit:Set<number>;remaining:number;child:boolean;bounces:number;trail:Vec[];critical:boolean;procAvailable:boolean;tracking:number;trackingLeft:number;speed:number;returning?:boolean};
type State='ready'|'playing'|'paused'|'reward'|'record'|'won'|'lost'|'story'|'transition';
function nextSeed(){const raw=new URLSearchParams(location.search).get('seed');const value=Number(raw);return raw!==null&&/^\d+$/.test(raw)&&Number.isSafeInteger(value)&&value>=0&&value<=0xffffffff?value:crypto.getRandomValues(new Uint32Array(1))[0]}
const ROOM_NAME={start:'격리실',combat:'실험실',reward:'기술 보관실',boss:'비상 계단실'};
export class LabScene extends Phaser.Scene{
 telegraphs!:Telegraphs;loot:{id:number;kind:PropLoot|'map';sprite:Phaser.GameObjects.Image}[]=[];
 terminal!:Phaser.GameObjects.Text;lab!:LabPresentation;effects!:CombatEffects;controls=new Controls(()=>this.state==='playing');audioFX=new AudioFX();player!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;
 enemies:Enemy[]=[];shots:Shot[]=[];hp=STATS.hp;inv=0;fire=0;elapsed=0;state:State='ready';kills=0;startDelay=1.2;hudTime=0;transitionDelay=0;blockedDoor='';
 weaponTimers=new Map<string,number>();weaponBursts=new Map<string,{paths:WeaponPath[];life:number}>();
 run=new Run(nextSeed());finalPhase:FinalPhase=1;entry:Direction|null=null;stopStory=()=>{};saveStatus='';
 beams:{shape:Phaser.GameObjects.Rectangle;axis:'x'|'y';position:number;age:number;hintAlpha?:number}[]=[];
 pendingUnlock='';
 activeLeft=0;activeArt?:Phaser.GameObjects.Image;activeRing?:Phaser.GameObjects.Arc;decoy?:Vec;
 familiarity?:EncounterFamiliarity;
 researchZones?:ResearchZones;
 menu=()=>{};roomDecor!:Phaser.GameObjects.Container;blocks:Block[]=[];roomClock=0;drain=0;noteTime=0;toxic=0;toxicTick=0;hazardSlow=0;
 pools:{shape:Phaser.GameObjects.Arc;x:number;y:number;r:number;age:number;color?:number;hintAlpha?:number}[]=[];
 env:{shape:Phaser.GameObjects.Rectangle|Phaser.GameObjects.Arc;kind:'laser'|'gas'|'electric';x:number;y:number;r:number;offset:number;art?:Phaser.GameObjects.Image[];effect?:Phaser.GameObjects.Graphics}[]=[];
 preload(){this.load.svg('reflector-item','./assets/reflector-outline.svg',{width:48,height:48});this.load.svg('decoy-item','./assets/decoy-outline.svg',{width:48,height:48});Object.entries(ARTWORK).forEach(([key,art])=>this.load.image(key,`./assets/${art.file}`));this.load.image('lab-props','./assets/lab-props-v3.webp');this.load.image('tiles','./assets/lab-tiles.png');this.load.on('loaderror',()=>{document.getElementById('modal-copy')!.textContent='리소스를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'})}
 create(){
  const fit=()=>{const v=arenaView(this.scale.width,this.scale.height);this.cameras.main.setZoom(v.zoom).centerOn(v.x,v.y);this.lab?.resizeText();this.terminal?.setFontSize(Math.ceil(14/v.zoom));document.documentElement.style.setProperty('--arena-inset',`${v.left}px`)};fit();this.scale.on('resize',fit);this.events.once('shutdown',()=>this.scale.off('resize',fit));
  for(const [key,data] of Object.entries(ARTWORK)){const [x,y,right,bottom]=data.bounds;this.textures.get(key).add('body',0,x,y,right-x,bottom-y)}
  const props=this.textures.get('lab-props');for(let i=0;i<9;i++)props.add(String(i),0,i%3*418,Math.floor(i/3)*418,418,418);
  const mapArt=this.add.graphics();mapArt.fillStyle(0xc9d6c6,1);mapArt.fillPoints([{x:5,y:12},{x:23,y:5},{x:42,y:12},{x:59,y:5},{x:59,y:52},{x:42,y:59},{x:23,y:52},{x:5,y:59}],true);mapArt.lineStyle(2,0x6b8e88,1);mapArt.lineBetween(23,5,23,52);mapArt.lineBetween(42,12,42,59);mapArt.lineStyle(3,0x3d6266,1);mapArt.strokeRect(13,22,9,9);mapArt.strokeRect(39,35,9,9);mapArt.lineBetween(22,26,34,26);mapArt.lineBetween(34,26,34,39);mapArt.lineBetween(34,39,39,39);mapArt.generateTexture('floor-map',64,64);mapArt.destroy();
  const damageOverlay=document.createElement('div');damageOverlay.id='damage-flash';damageOverlay.setAttribute('aria-hidden','true');document.getElementById('app')!.append(damageOverlay);
  this.buildRoom();this.lab=new LabPresentation(this);this.effects=new CombatEffects(this);this.telegraphs=new Telegraphs(this);this.researchZones=new ResearchZones(this);this.familiarity=new EncounterFamiliarity(browserStorage);this.roomDecor=this.add.container(0,0).setDepth(3);

  this.terminal=this.add.text(560,410,'',{fontFamily:'sans-serif',fontSize:`${Math.ceil(14/this.cameras.main.zoom)}px`,color:'#d7eee8',stroke:'#10202b',strokeThickness:3,align:'center'}).setOrigin(.5).setDepth(6);
  this.shadow=this.add.ellipse(560,385,40,14,0x000000,.4).setDepth(8);this.player=this.add.image(560,360,'mew','body').setDisplaySize(speciesSize('mew').width,speciesSize('mew').height).setDepth(17);
  this.decorateRoom();this.refreshRoom();this.updateHud();
  document.getElementById('primary')!.onclick=()=>{if(this.state==='paused'||this.state==='record')this.resume();else this.restart()};
  document.getElementById('secondary')!.onclick=()=>{const button=document.getElementById('secondary')!;button.textContent='현재 진행을 지우고 시작';button.onclick=()=>this.restart()};
  document.getElementById('back-menu')!.onclick=()=>{this.stopStory();this.state='ready';this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='silent';this.menu()};
  document.getElementById('build-toggle')!.onclick=()=>this.showBuild();
  bindTouchAction(document.getElementById('active-skill') as HTMLButtonElement,()=>this.useActive('reflector'));bindTouchAction(document.getElementById('active-decoy') as HTMLButtonElement,()=>this.useActive('decoy'));this.controls.onActive=()=>this.useActive();
  document.getElementById('interact')!.onclick=()=>this.interact();this.controls.onInteract=()=>this.interact();
  this.menu=setupShell(restore=>restore?this.continueRun():this.restart());
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('campaign'))void import('../tests/campaign-fixture').then(m=>m.installCampaign(this));
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('review'))void import('../tests/review-fixture').then(m=>m.installReview(this));
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa'))void import('../tests/browser-fixture').then(m=>m.installFixture(this));
  document.getElementById('pause')!.onclick=()=>this.togglePause();this.controls.onPause=()=>this.togglePause();
  document.getElementById('sound')!.onclick=async()=>{const button=document.getElementById('sound') as HTMLButtonElement;button.disabled=true;const on=await this.audioFX.toggle();button.disabled=false;button.innerHTML=symbol(on?'sound':'mute');button.setAttribute('aria-label',on?'소리 끄기':'소리 켜기')};
  this.events.once('shutdown',()=>this.audioFX.dispose());
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='playing')this.togglePause()});window.addEventListener('blur',()=>{if(this.state==='playing')this.togglePause()});
 }
 buildRoom(){
 this.cameras.main.setBackgroundColor('#080e18');
 const tex=this.textures.get('tiles');tex.setFilter(Phaser.Textures.FilterMode.NEAREST);tex.add('floor',0,64,896,64,64);tex.add('wall',0,128,640,64,64);tex.add('desk',0,1280,1024,192,64);tex.add('cabinet',0,1536,960,192,64);tex.add('paper',0,1600,576,64,64);tex.add('glass',0,1280,576,64,64);tex.add('crate',0,1280,256,64,64);
 this.add.rectangle(560,355,1050,538,0x172331).setStrokeStyle(2,0x314757);
 for(let x=80;x<1040;x+=48)for(let y=138;y<590;y+=48)this.add.image(x+24,y+24,'tiles','floor').setDisplaySize(48,48).setTint((x+y)%96===26?0x344658:0x3b5060);
 this.add.rectangle(560,364,962,454,0x080e20,.35);
 for(let x=56;x<1064;x+=48){this.add.image(x+24,112,'tiles','wall').setDisplaySize(48,48).setTint(0x526a7a);this.add.image(x+24,614,'tiles','wall').setDisplaySize(48,48).setTint(0x2b3e52)}
 this.add.rectangle(65,362,24,454,0x263b4a).setStrokeStyle(2,0x405663);this.add.rectangle(1055,362,24,454,0x263b4a).setStrokeStyle(2,0x405663);
 this.add.rectangle(560,138,960,3,0x83e6d7,.35);this.add.rectangle(560,589,960,3,0x83e6d7,.18);
 for(const x of [160,340,780,960]){this.add.image(x,110,'tiles','desk').setDisplaySize(108,36).setTint(0x54747e);this.add.rectangle(x,107,48,5,0x83dece,.7);this.add.ellipse(x,141,120,60,0x6be4d0,.035)}

 const g=this.add.graphics();g.lineStyle(1,0x95b4cd,.08);g.strokeCircle(560,364,115);g.strokeCircle(560,364,122);g.lineBetween(410,364,710,364);g.lineBetween(560,214,560,514);
 this.add.text(560,355,'151',{fontFamily:'monospace',fontSize:'64px',color:'#647488'}).setAlpha(.11).setOrigin(.5);
 this.add.text(99,158,'BIO-CONTAINMENT  /  B01',{fontFamily:'monospace',fontSize:'9px',color:'#6e8b9b'}).setAlpha(.65).setName('room-label');
 for(let y=0;y<700;y+=4)this.add.rectangle(560,y,1120,1,0x000000,.04).setDepth(4);
 }
 decorateRoom(){
  this.lab.build(this.run.room,this.run.floor);this.roomDecor.removeAll(true);this.blocks=this.run.floor===1?[]:[...obstacles(this.run.room),...sceneryBlocks(this.run.room)];this.env=[];
  for(const d of debris(this.run.room)){let item:Phaser.GameObjects.GameObject;
   if(d.kind===0){const stain=this.add.ellipse(d.x,d.y,25,9,0x642f40,.45).setAngle(d.angle);item=stain}
   else if(d.kind===1)item=this.add.image(d.x,d.y,'tiles','paper').setDisplaySize(30,26).setTint(0xa6a5b0).setAngle(d.angle).setAlpha(.65);
   else if(d.kind===2)item=this.add.image(d.x,d.y,'tiles','glass').setDisplaySize(32,25).setTint(0x96b2bc).setAngle(d.angle).setAlpha(.6);
   else item=this.add.rectangle(d.x,d.y,19,7,0xa8a6b2,.45).setAngle(d.angle);
   this.roomDecor.add(item);
  }
  for(const b of obstacles(this.run.room)){this.roomDecor.add(this.add.rectangle(b.x+4,b.y+7,b.w+7,b.h+8,0x000000,.4));this.roomDecor.add(this.add.image(b.x,b.y,'tiles',this.run.room.seed%2?'desk':'cabinet').setDisplaySize(b.w,b.h).setTint(0x526675));this.roomDecor.add(this.add.rectangle(b.x,b.y-5,b.w*.5,4,0x43575e))}
  this.roomDecor.add(this.add.image(230,200,'tiles','paper').setDisplaySize(50,44).setTint(0x9bdbd0));this.roomDecor.add(this.add.text(230,238,'▤',{fontFamily:'sans-serif',fontSize:'14px',color:'#7daca8'}).setOrigin(.5));
  if(this.run.floor===1){this.roomDecor.add(this.add.rectangle(560,116,180,40,0xcce9d0,.45));this.roomDecor.add(this.add.text(560,115,'SURFACE / 地上',{fontFamily:'monospace',fontSize:'12px',color:'#f0fff1'}).setOrigin(.5));this.roomDecor.add(this.add.circle(560,350,135,0xa380db,.045).setStrokeStyle(2,0xa48ac6,.35));this.roomDecor.add(this.add.text(560,165,'PROJECT 150 / 最後の扉',{fontFamily:'monospace',fontSize:'10px',color:'#baa8d3'}).setOrigin(.5))}
  if(this.run.room.kind==='combat'){
   const kinds=['laser','gas','electric'] as const;const count=this.run.tuning.level>=3?2:1;
   for(let i=0;i<count;i++){const kind=kinds[(this.run.room.seed+i)%3],x=i?780:340,y=kind==='laser'?350:445,r=50;const shape=kind==='laser'?this.add.rectangle(560,y,830,12,0xf59b77,.1):this.add.circle(x,y,r,kind==='gas'?0x99c279:0x8fcbe6,.1);this.roomDecor.add(shape);this.env.push({shape,kind,x:kind==='laser'?560:x,y,r,offset:i*2});const art=kind==='laser'?[this.add.image(165,y,'lab-props','1').setDisplaySize(PROP_SIZE.emitter,PROP_SIZE.emitter),this.add.image(955,y,'lab-props','1').setDisplaySize(PROP_SIZE.emitter,PROP_SIZE.emitter).setFlipX(true)]:[this.add.image(x,y,'lab-props',kind==='gas'?'2':'3').setDisplaySize(PROP_SIZE.vent,PROP_SIZE.vent)];art.forEach(a=>lightProp(a));const effect=this.add.graphics();this.roomDecor.add(kind==='laser'?[effect,...art]:[...art,effect]);Object.assign(this.env[this.env.length-1],{art,effect})}
  }
 }
 interaction(){const extra=secretInteractions(this.run);if(this.run.room.kind==='start'&&this.run.unlocks.includes('sanctuary')&&!roomEnvironment(this.run.room).stabilized)extra.push({kind:'sanctuary',x:740,y:365,label:'안정화 장치 · 열쇠 2 · 체력 2 회복 · 현재 사용형 +1'});return nearestInteraction(this.player,[...roomInteractions(this.run.room,this.run.floor,this.run.canExit).filter(i=>!(i.kind==='record'&&extra.length)&&!(i.kind==='lift'&&this.run.branch)),...extra])}
 interact(){if(this.state!=='playing'||this.startDelay>0)return;const target=this.interaction();if(!target)return;
  if(target.kind==='sanctuary'){if(this.run.keys<2){this.note('열쇠 2개가 필요합니다.');return}if(this.hp>=STATS.hp&&this.run.activeItem.count===this.run.activeItem.capacity){this.note('체력과 사용형 기술이 이미 가득 찼습니다.');return}const healed=this.run.stabilize(this.hp,STATS.hp);if(healed===null)return;this.hp=healed;this.checkpoint();this.refreshRoom();this.updateHud();this.audioFX.proc('heal');return}
  if(['secret','depth','return'].includes(target.kind)){const changed=target.kind==='secret'?this.run.enterSecret():target.kind==='depth'?this.run.enterDepth():this.run.leaveSecret();if(!changed){this.note('열쇠 2개가 필요합니다. 본층 복귀는 무료입니다.');return}this.clearShots();this.controls.reset();this.enterRoom();this.resume();this.note(this.run.branch==='depth'?'폐쇄 실험층 · 경계 +2 · 이후 층에도 유지':this.run.branch==='cache'?'숨겨진 보관실 · 무료 기술':'본층으로 복귀했습니다.');return}
  if(target.kind==='record'){this.readRecord();return}
  if(target.kind==='reward'){if(this.run.rewardKind==='heart'&&this.hp>=STATS.hp){this.note('체력이 가득 찼습니다. 회복제는 이 방에 남겨둡니다.');return}const supply=this.run.claimSupply();if(supply){if(supply==='heart')this.hp=Math.min(STATS.hp,this.hp+1);this.checkpoint();this.refreshRoom();this.updateHud();this.audioFX.environment('reward');this.note(supply==='heart'?'체력 1 회복':'열쇠 +1');return}if(!this.run.openReward()){this.note(this.run.keys<1?'열쇠 1개가 필요합니다.':'더 익힐 기술이 없습니다. 열쇠는 사용하지 않습니다.');return}this.checkpoint();this.audioFX.environment('reward');this.showReward();return}
  if(target.kind==='power'){roomEnvironment(this.run.room).powerOff=true;this.audioFX.environment('switch');this.note('시설 전원을 차단했습니다. 이 방의 레이저·가스·전기 장치가 정지합니다.');if(this.run.room.cleared)this.checkpoint();this.updateHud();return}
  this.state='transition';document.getElementById('interact')!.hidden=true;this.controls.reset();this.clearShots();this.audioFX.mode='silent';this.audioFX.environment('lift');this.cameras.main.fadeOut(320,5,10,18);this.time.delayedCall(350,()=>{if(this.state!=='transition')return;if(this.run.ascend()){this.enterRoom();if(this.state==='transition')this.resume();this.cameras.main.fadeIn(450,5,10,18);this.note(`B${this.run.floor} · ${floorTheme(this.run.floor).name}`)}else{this.resume();this.cameras.main.fadeIn(250,5,10,18);this.updateHud();this.note('계단 조건을 다시 확인해 주세요.')}});
 }
 hitScenery(points:{x:number;y:number;width:number}[]){const state=roomEnvironment(this.run.room);for(const prop of breakableProps(this.run.room)){if(state.broken&(1<<prop.id))continue;if(points.some((p,i)=>i>0&&distanceToSegment(prop,points[i-1],p)<=prop.radius+p.width)&&breakProp(state,prop.id)){this.blocks=[...obstacles(this.run.room),...sceneryBlocks(this.run.room)];this.lab.refreshProps();this.burst(prop.x,prop.y,prop.kind==='crate'?0x9faeaf:0xa2ddd1,8);this.audioFX.environment(prop.kind==='crate'?'crate':'glass');this.syncLoot(prop.id);this.checkpoint()}}}
 note(text:string){document.getElementById('room-note')!.textContent=text;this.noteTime=Math.min(7,Math.max(4,2+text.length*.075))}
 readRecord(){if(this.state!=='playing'||!this.run.room.cleared||!intersects(this.player,{x:230,y:200},80))return;roomEnvironment(this.run.room).recordRead=true;this.refreshRoom();this.checkpoint();this.state='record';this.controls.reset();this.effects.setChannels([]);this.audioFX.mode='silent';this.audioFX.play('read');const recordIndex=(this.run.current+this.run.tuning.level)%LAB_RECORDS.length,record=LAB_RECORDS[recordIndex];if(!rememberRecord(browserStorage,recordIndex))this.note('기록 보관함 저장에 실패했습니다.');if(readProfile(browserStorage).records.length>=3)this.unlock('sanctuary');this.showModal(record.title,record.text+(this.run.secretAvailable?'\n두 기록의 암호가 일치했다. 이 단말에서 숨겨진 보관실로 이동할 수 있다.':!this.run.secretUsed&&!this.run.branch?'\n다른 방의 연구 기록에 남은 암호 조각이 있을지도 모른다.':''),'기록 닫기')}
 syncLoot(popId?:number){for(const item of this.loot)item.sprite.destroy();this.loot=floorLoot(this.run).map(item=>{const sprite=this.add.image(item.x,item.y,item.kind==='map'?'floor-map':item.kind==='reflector'?'reflector-item':item.kind==='decoy'?'decoy-item':'lab-props',item.kind==='map'||item.kind==='reflector'||item.kind==='decoy'?undefined:item.kind==='heart'?'5':'6').setDisplaySize(36,36).setDepth(10).setTint(item.kind==='decoy'?0xb8a9f1:item.kind==='reflector'?0xd4edff:0xc0d7cd);if(item.id===popId)this.tweens.add({targets:sprite,y:item.y-18,duration:180,yoyo:true,ease:'Sine.easeOut'});return{id:item.id,kind:item.kind,sprite}})}
 collectLoot(){for(const item of this.loot){if(Math.hypot(this.player.x-item.sprite.x,this.player.y-item.sprite.y)>30)continue;const kind=takeFloorLoot(this.run,item.id,this.hp,STATS.hp);if(!kind)continue;if(kind==='heart')this.hp=Math.min(STATS.hp,this.hp+1);else if(kind==='key')this.run.keys++;else if(kind==='reflector'||kind==='decoy')this.note(`${ACTIVE_NAMES[kind]} +1 · ${this.run.activeStock[kind].count}/${this.run.activeStock[kind].capacity}개`);else this.note(`B${this.run.floor} 지도 확보 · 방 종류와 통로 공개`);this.audioFX.environment('reward');this.checkpoint();this.updateHud();this.syncLoot();break}}
 warn(x:number,y:number,r:number,options:Partial<Warning>={}){this.telegraphs?.show({type:'warn',x,y,r,...options})}
 phaseShift(e:Enemy){this.researchZones?.clear();for(const other of this.enemies)if(other!==e&&isLabBoss(other.kind)){other.charge=0;other.dash=0;other.recovery=1.2;other.cooldown=1.35}this.telegraphs?.clear();this.shots=this.shots.filter(s=>{if(s.hostile){s.sprite.destroy();s.glow.destroy();return false}return true});this.pools.forEach(p=>p.shape.destroy());this.pools=[];this.toxic=0;this.warn(e.sprite.x,e.sprite.y,e.radius+12,{cue:'phase',duration:1.2});this.burst(e.sprite.x,e.sprite.y,ENEMY_TECHNIQUES[e.kind].color,12);this.audioFX.play('alarm')}

 addPool(x:number,y:number,r:number,source:Kind='grimer'){const guidance=this.familiarity?.guidance(source),hintAlpha=guidance==='subtle'?.28:guidance==='soft'?.65:1;if(this.pools.length>=12)return;const shape=this.add.circle(x,y,r,0x95bd64,.06).setStrokeStyle(3,0xe6c57e,.9).setDepth(4);this.warn(x,y,r,{cue:'pool',duration:POOL_WARNING,guidance:this.familiarity?.guidance(source),label:enemyWarning(source,'pool')});this.pools.push({shape,x,y,r,age:0,color:ENEMY_TECHNIQUES[source].color,hintAlpha})}
 addBeam(axis:'x'|'y',position:number,source:Kind='mewtwo'){const guidance=this.familiarity?.guidance(source),hintAlpha=guidance==='subtle'?.28:guidance==='soft'?.65:1;if(this.beams.length>=4)return;const shape=this.add.rectangle(axis==='x'?position:560,axis==='y'?position:363,axis==='x'?26:964,axis==='y'?26:454,0xffcd9b,.1).setStrokeStyle(2,0xffc696,.9).setDepth(7);this.beams.push({shape,axis,position,age:0,hintAlpha});this.warn(axis==='x'?position:560,axis==='y'?position:363,20,{cue:'aim',guidance,label:'빔 예고',duration:1,directions:axis==='x'?[{x:0,y:1},{x:0,y:-1}]:[{x:1,y:0},{x:-1,y:0}]})}
 updateHazards(dt:number){
  for(const e of this.enemies)e.trapInv=Math.max(0,(e.trapInv??0)-dt);
  for(const b of this.beams){b.age+=dt;const phase=beamPhase(b.age);b.shape.setFillStyle(phase==='active'?0xffe4fd:0xffb579,phase==='active'?.9:.12*(b.hintAlpha??1)).setStrokeStyle(phase==='warning'?2:0,0xffbd86,.85*(b.hintAlpha??1));if(phase==='active'&&this.startDelay<=0&&beamHits(b.axis,b.position,this.player))this.hurt({x:0,y:0});if(this.state!=='playing')return}
  this.beams=this.beams.filter(b=>{if(beamPhase(b.age)==='expired'){b.shape.destroy();return false}return true});
  this.hazardSlow=Math.max(0,this.hazardSlow-dt);this.toxic=Math.max(0,this.toxic-dt);this.toxicTick-=dt;if(this.toxic>0&&this.toxicTick<=0){this.toxicTick=1.3;this.hurt({x:0,y:0});if(this.state!=='playing')return}
  for(const zone of this.researchZones?.update(dt,this.player)??[]){if(zone.style==='web')this.hazardSlow=Math.max(this.hazardSlow,.18);this.hurt(normalize(this.player.x-(zone.a.x+zone.b.x)/2,this.player.y-(zone.a.y+zone.b.y)/2));if(this.state!=='playing')return}
  for(const p of this.pools){p.age+=dt;p.shape.setFillStyle(p.color??0x95bd64,poolPhase(p.age)==='warning'?.08*(p.hintAlpha??1):.45).setStrokeStyle(3,poolPhase(p.age)==='warning'?0xe6c57e:(p.color??0xc5ed7d),poolPhase(p.age)==='warning'?.9*(p.hintAlpha??1):.9);if(poolPhase(p.age)==='active'&&intersects(this.player,p,p.r)){if(this.toxic<=0)this.toxicTick=.65;this.toxic=2}if(this.state!=='playing')return}
  this.pools=this.pools.filter(p=>{if(poolPhase(p.age)==='expired'){p.shape.destroy();return false}return true});
  for(const hazard of this.env){const phase=this.run.room.cleared||roomEnvironment(this.run.room).powerOff?'idle':hazardPhase(this.roomClock+hazard.offset,this.run.tuning.hazardPeriod);hazard.shape.setAlpha(phase==='active'?.32:phase==='warning'?.12:0);hazard.art?.forEach(a=>lightProp(a,this.run.room.cleared||roomEnvironment(this.run.room).powerOff));const g=hazard.effect;g?.clear();if(g&&phase!=='idle'){const active=phase==='active',pulse=.5+Math.sin(this.roomClock*14)*.25;g.lineStyle(active?3:2,active?0xffb769:0xffdc83,active?.9:pulse);if(hazard.kind==='laser'){g.strokeRect(145,hazard.y-13,830,26);if(active){g.lineStyle(4,0xff5555,.9);g.lineBetween(145,hazard.y,975,hazard.y);g.lineStyle(1,0xfff2c7,1);g.lineBetween(145,hazard.y,975,hazard.y)}}else{g.strokeCircle(hazard.x,hazard.y,hazard.r);if(active&&hazard.kind==='electric')for(let i=0;i<4;i++){const a=this.roomClock*4+i*Math.PI/2;g.lineStyle(2,0xffee9b,.9);g.strokePoints([{x:hazard.x,y:hazard.y},{x:hazard.x+Math.cos(a)*24,y:hazard.y+Math.sin(a)*18},{x:hazard.x+Math.cos(a+.3)*46,y:hazard.y+Math.sin(a+.3)*46}],false)}if(active&&hazard.kind==='gas')for(let i=0;i<7;i++){const a=i*2.4+this.roomClock*.7;g.fillStyle(0xb1a4d4,.24);g.fillCircle(hazard.x+Math.cos(a)*28,hazard.y+Math.sin(a)*24,15+Math.sin(i+this.roomClock*2)*4)}}}
   hazard.shape.setStrokeStyle(phase==='warning'?2:0,0xffcf9d,.8);
   if(phase==='active'&&this.startDelay<=0){
    if(trapHits(hazard,this.player)){if(hazard.kind==='electric'&&this.inv<=0)this.hazardSlow=.35;this.hurt(trapPush(hazard,this.player))}if(this.state!=='playing')return;
    for(const e of this.enemies)if(e.hp>0&&e.trapInv<=0&&trapHits(hazard,e.sprite,e.radius*.5)){e.trapInv=TRAP_RECOVERY;const pushed=knockbackPosition(e.sprite,trapPush(hazard,e.sprite),this.blocks,e.radius);e.sprite.setPosition(pushed.x,pushed.y);this.hitEnemy(e,trapDamage(e.maxHp));}
   }
  }
 }
 clearActors(){
  this.effects?.active?.('reflector',this.player,0);this.activeLeft=0;this.decoy=undefined;this.activeArt?.destroy();this.activeArt=undefined;this.activeRing?.destroy();this.activeRing=undefined;this.telegraphs?.clear();this.loot?.forEach(l=>l.sprite.destroy());this.loot=[];
  this.effects?.clear();this.beams.forEach(b=>b.shape.destroy());this.beams=[];
  this.enemies.forEach(e=>{e.sprite.destroy();e.shadow.destroy();e.bar.destroy()});this.enemies=[];
  this.clearShots();this.pools.forEach(p=>p.shape.destroy());this.pools=[];
 }
 clearShots(){this.researchZones?.clear();this.weaponTimers.clear();this.weaponBursts.clear();this.effects?.setChannels([]);this.shots.forEach(s=>{s.sprite.destroy();s.glow.destroy()});this.shots=[]}
 enterRoom(from?:Direction,preserveInput=false){
  this.entry=from??null;this.blockedDoor='';
  this.clearActors();if(!preserveInput)this.controls.reset();this.inv=0;this.fire=0;this.startDelay=this.run.room.cleared?0:ENTRY_SECONDS;this.transitionDelay=.65;
  const spawn:Record<Direction,Vec>={up:{x:560,y:R.top+48},down:{x:560,y:R.bottom-48},left:{x:R.left+48,y:364},right:{x:R.right-48,y:364}};
  const pos=from?spawn[from]:{x:560,y:365};this.player.setPosition(pos.x,pos.y).setAlpha(1);this.shadow.setPosition(pos.x,pos.y+25);
  this.roomClock=0;this.toxic=0;this.toxicTick=0;this.hazardSlow=0;this.decorateRoom();
  const layout=entryLayout(roomEnemies(this.run.room,this.run.floor),this.player,this.blocks,this.run.room.doors);
  this.familiarity?.enter(`${this.run.seed}:${this.run.floor}:${this.run.branch??'main'}:${this.run.current}`,layout.map(s=>s.kind));
  layout.forEach((spawn,i)=>{const size=speciesSize(spawn.kind),maxHp=spawn.kind==='mewtwo'?Math.round(FINAL_HP[this.finalPhase-1]*this.run.alert.boss):isLabBoss(spawn.kind)?this.run.tuning.bossHp:ENEMIES[spawn.kind].hp*this.run.tuning.hp;
   this.enemies.push({id:i,kind:spawn.kind,hp:maxHp,maxHp,radius:size.radius,sprite:this.add.image(spawn.x,spawn.y,spawn.kind,'body').setDisplaySize(size.width,size.height).setDepth(spawn.kind==='mewtwo'?16:9),shadow:this.add.ellipse(spawn.x,spawn.y+size.height*.4,size.width*.6,12,0x000000,.3).setDepth(8),bar:this.add.rectangle(spawn.x,spawn.y-size.height*.6,30,3,0xca8eb3).setDepth(12),cooldown:.5+i*(this.run.room.bosses?1.1:.15),charge:0,dir:{x:0,y:0},flash:0,burn:0,slow:0,statusTime:0,poison:0,phase:spawn.kind==='mewtwo'?this.finalPhase:1,cycle:0,recovery:0,dash:0,trapInv:0});
  });
  for(const e of this.enemies){e.sprite.setFlipX(this.player.x>e.sprite.x);this.warn(e.sprite.x,e.sprite.y-speciesSize(e.kind).height*.7,0,{cue:'notice',duration:ENTRY_SECONDS})}this.syncLoot();
  this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';

  this.refreshRoom();this.updateHud();this.checkpoint();if(this.run.floor===1){if(this.run.room.cleared)this.playEnding();else this.finalDialogue();return}if(this.run.rewardPending)this.note('중앙 보상에 다가가 E 또는 상호작용 버튼으로 확인하세요.');
 }
 secretGate?:Phaser.GameObjects.Container;
 refreshRoom(){
  this.secretGate?.destroy(true);this.secretGate=this.add.container(0,0).setDepth(10);if(this.run.room.kind==='start'&&this.run.unlocks.includes('sanctuary')){const used=roomEnvironment(this.run.room).stabilized;this.secretGate.add([this.add.ellipse(744,390,65,16,0x000000,.25),lightProp(this.add.image(740,365,'lab-props','0').setDisplaySize(70,70),!!used),this.add.text(740,413,used?'✓':'＋ · 🔑2',{fontSize:`${Math.ceil(14/this.cameras.main.zoom)}px`,color:'#d7eee8',stroke:'#10202b',strokeThickness:3}).setOrigin(.5)])}for(const item of secretInteractions(this.run)){const color=item.kind==='depth'?0xc99bdc:0x9cd6cb;this.secretGate.add([this.add.ellipse(item.x+3,item.y+12,76,24,0x000000,.4),this.add.rectangle(item.x,item.y,64,38,0x344b56).setStrokeStyle(2,color),this.add.rectangle(item.x,item.y-5,40,14,color,.35),this.add.text(item.x,item.y+29,item.kind==='return'?'↩ 본층':item.kind==='depth'?'↓ 폐쇄층 · 🔑2':'◇ 숨겨진 보관실',{fontSize:`${Math.ceil(14/this.cameras.main.zoom)}px`,color:'#d5eee8',backgroundColor:'#14242b'}).setOrigin(.5)]);}

  this.lab.setDoors(this.run.rooms,this.run.moves);(this.children.getByName('room-label') as Phaser.GameObjects.Text).setText(`B${this.run.floor} / ${String(this.run.current+1).padStart(2,'0')}`);
  this.terminal.setText(this.run.floor===1?'':this.run.room.kind==='boss'?(this.run.room.cleared?'':`격리 실패 / ${(this.run.room.bosses??[this.run.room.boss??'gengar']).map(k=>ENEMIES[k].name).join(' + ')}`):this.run.room.kind==='start'?'깨진 격리 장치. 위층에서 소리가 들린다.':'');

 }
 restart(){
  this.stopStory();this.finalPhase=1;this.clearActors();this.run=new Run(nextSeed());this.run.unlocks=readUnlocks(browserStorage);this.hp=STATS.hp;this.drain=0;this.inv=0;this.fire=0;this.kills=0;this.elapsed=0;
  this.player.clearTint().setAlpha(1);this.resume();this.enterRoom();
 }
 resume(){if(this.pendingUnlock){this.note(this.pendingUnlock);this.pendingUnlock=''}this.controls.reset();this.state='playing';document.getElementById('modal')!.hidden=true;this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';document.getElementById('pause')!.textContent='Ⅱ'}
 togglePause(){if(this.state==='playing'){this.state='paused';this.effects.setChannels([]);this.audioFX.mode='silent';this.controls.reset();this.showModal('잠시 숨 고르기',this.saveStatus||'체크포인트 저장됨 · 전투 중 종료하면 마지막 방 진입 또는 보스 단계 시작부터 이어집니다.','탈출 계속하기',true);this.showRunSummary();document.getElementById('pause')!.textContent='▶'}else if(this.state==='paused')this.resume()}
 showModal(title:string,copy:string,button:string,secondary=false){
  for(const id of ['active-skill','active-decoy']){const active=document.getElementById(id);if(active)active.hidden=true;}
  document.getElementById('interact')!.hidden=true;document.querySelector('.panel footer')!.textContent=`B${this.run.floor} · ${floorTheme(this.run.floor).name} · 지상을 향해`;document.getElementById('modal')!.hidden=false;document.querySelector('.panel')!.classList.remove('reward-panel','reward-single','build-panel');document.getElementById('modal-title')!.textContent=title;document.getElementById('modal-copy')!.textContent=copy;document.getElementById('primary')!.hidden=false;document.getElementById('primary')!.textContent=button;document.getElementById('secondary')!.hidden=!secondary;document.getElementById('secondary')!.textContent='새로운 탈출 시작';document.getElementById('secondary')!.onclick=()=>{const b=document.getElementById('secondary')!;b.textContent='현재 진행을 지우고 시작';b.onclick=()=>this.restart()};document.getElementById('instructions')!.style.display='none';document.getElementById('rewards')!.replaceChildren();document.getElementById('run-summary')!.replaceChildren();document.getElementById('primary')!.focus({preventScroll:true});document.querySelector('.panel')!.scrollTop=0;document.getElementById('modal')!.scrollTop=0;
 }
 showBuild(){
  if(this.state!=='playing')return;this.state='paused';this.controls.reset();this.effects.setChannels([]);this.effects.aim?.(this.player,{x:0,y:0});this.audioFX.mode='silent';
  this.showModal('현재 기술 조합','확인하는 동안 전투가 멈춥니다.','닫고 계속하기');document.querySelector('.panel')!.classList.add('build-panel');const host=document.getElementById('run-summary')!,a=this.run.attack;
  const summary=document.createElement('p');summary.textContent=attackLabel(a)+' · '+attackTraits(a).join(' · ');host.append(summary);
  const ids=[...new Set(this.run.moves)];if(!ids.length){const text=document.createElement('p');text.textContent='염동력 · 조준한 방향으로 발사합니다. 보상으로 기술 효과를 추가할 수 있습니다.';host.append(text)}
  for(const id of ids){const move=MOVES.find(m=>m.id===id)!;const row=document.createElement('article');row.className='build-row';const icon=document.createElement('div');icon.innerHTML=techniqueIcon(id);const text=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p');title.textContent=`${move.name} · ${this.run.moves.filter(m=>m===id).length}단계${id===a.visual.form?' · 주 기술':''}`;description.textContent=move.description;text.append(title,description);row.append(icon,text);host.append(row)}
  const rules=fusionRules(a),combos=[rules.thermal?'냉기 + 불꽃: 공격을 놓으면 축적한 열충격 방출':'',rules.conductive?'물 + 전기: 젖은 적 사이로 전도':'',rules.toxicDrain?'독 + 흡수: 이미 중독된 적에서 흡수 강화':'',rules.bankShot?'섀도볼 + 반사: 벽에 튕긴 뒤 위력·관통 증가':''].filter(Boolean);for(const combo of combos){const p=document.createElement('p');p.className='build-combo';p.textContent=combo;host.append(p)}
 }
 showRunSummary(){
  const host=document.getElementById('run-summary')!,a=this.run.attack;
  const title=document.createElement('h2');title.textContent=attackLabel(a);host.append(title);
  for(const text of [objective(this.run),`체력 ${this.hp}/6 · 열쇠 ${this.run.keys} · 경계 ${this.run.threat} · ${formatDuration(this.elapsed)}`,attackTraits(a).join(' · ')]){const line=document.createElement('p');line.textContent=text;host.append(line)}
  const fusion=document.createElement('details');fusion.className='quality-details';const fs=document.createElement('summary');fs.textContent='기술 조합 작동 방식';const fp=document.createElement('p');fp.textContent=FUSION_HELP;fusion.append(fs,fp);host.append(fusion);const picker=document.createElement('div');picker.className='active-picker';for(const skill of ['reflector','decoy'] as const){if(skill==='decoy'&&!this.run.unlocks.includes('decoy'))continue;const b=document.createElement('button');b.textContent=(this.run.activeSkill===skill?'✓ ':'')+ACTIVE_NAMES[skill]+` ${this.run.activeStock[skill].count}/${this.run.activeStock[skill].capacity}개`;b.disabled=!this.run.room.cleared;b.onclick=()=>{this.run.activeSkill=skill;this.checkpoint();host.replaceChildren();this.showRunSummary()};picker.append(b)}host.append(picker);const goals=document.createElement('details');goals.className='quality-details';const gs=document.createElement('summary');gs.textContent='다음 탈출의 목표';const gp=document.createElement('p');gp.className='unlock-list';gp.textContent=unlockSummary(browserStorage);goals.append(gs,gp);host.append(goals);
  const list=document.createElement('div');list.className='inventory';
  for(const id of new Set(this.run.moves)){const move=MOVES.find(m=>m.id===id)!;const item=document.createElement('span');item.textContent=`${move.name} ×${this.run.moves.filter(m=>m===id).length}`;item.title=move.description;list.append(item)}
  if(!this.run.moves.length)list.textContent='아직 익힌 기술이 없습니다. 염동력으로 길을 여세요.';
  if(new Set(this.run.moves).size>6){const details=document.createElement('details');details.className='inventory-details';const summary=document.createElement('summary');summary.textContent=`습득 기술 ${new Set(this.run.moves).size}종 · 목록 보기`;details.append(summary,list);host.append(details)}else host.append(list);const hint=document.createElement('small');hint.textContent='WASD 이동 · 방향키 공격 · Space 사용형 · E 상호작용 / 터치: 왼쪽 이동 · 오른쪽 조준';host.append(hint);const diagnostic=document.createElement('details');diagnostic.className='progress-diagnostic';const label=document.createElement('summary');label.textContent='문제 확인용 진행 정보';const report=document.createElement('pre');report.textContent=progressionReport(this.run,this.state,this.player,this.enemies);diagnostic.append(label,report);host.append(diagnostic);
 }
 showReward(){
  this.state='reward';this.updateHud();this.controls.reset();this.clearShots();this.showModal(this.run.room.service==='medical'?'의무실 · 회복 또는 기술':this.run.room.elite?'희귀 기술 보상 · 경계 +1':this.run.room.secret?'숨겨진 기술':this.run.rewardKind==='boss'?'보스 보상':'봉인된 기술',this.run.room.service==='medical'?'열쇠 1개로 개방했습니다. 체력 2 회복과 기술 중 하나를 선택하세요.':this.run.room.elite?'희귀 기술 습득 시 경계 +1 · 이후 층의 난이도도 상승합니다.':this.run.rewardKind==='boss'?'강화 하나를 선택하거나 포기하세요. 열쇠 1개를 받습니다.':'하나를 습득하거나 포기하세요. 기술 습득으로 체력은 회복되지 않습니다.','');document.getElementById('primary')!.hidden=true;document.querySelector('.panel')!.classList.add('reward-panel');
  const container=document.getElementById('rewards')!;container.style.gridTemplateColumns=`repeat(${Math.max(1,this.run.choices.length)},minmax(0,1fr))`;document.querySelector('.panel')!.classList.toggle('reward-single',this.run.choices.length<=1);if(!this.run.choices.length)document.getElementById('modal-copy')!.textContent='제시된 기술은 이미 충분히 익혔습니다. 보상을 정리하고 진행하세요.';
  for(const move of this.run.choices){const button=document.createElement('button');button.className='reward-card';button.dataset.hint=moveHint(move.id);button.style.setProperty('--technique-color','#'+move.color.toString(16));const comparison=rewardComparison(this.run.moves,move.id);button.innerHTML=`<small>${rewardTier(move.id)} · ${move.type} / ${move.form}</small><strong>${move.name} <small>${move.id==='survey'?'현재 층':comparison.rank+'단계'}</small></strong><span class="reward-form">${techniqueIcon(move.id)}</span><span class="reward-delta ${comparison.delta<0?'tradeoff':''}">${comparison.caption}</span>`;button.onclick=()=>{if(this.state!=='reward'||!this.run.choose(move.id))return;this.checkpoint();this.resume();this.audioFX.reward(move.id,this.run.attack);this.effects.upgrade(this.player.x,this.player.y,this.run.attack,move.id);this.note(move.id==='survey'?`B${this.run.floor} 지도 확보 · 방 종류와 통로 공개`:`${move.name} · ${this.run.moves.filter(id=>id===move.id).length}단계 · ${move.form}`);this.refreshRoom();this.updateHud()};const option=document.createElement('div');option.className='reward-option';const detail=document.createElement('details');detail.innerHTML=`<summary>효과 보기</summary><p>${move.description}</p><p>${move.synergy}</p><small>직접 화력: 전 갈래 적중 기준, 지속·연쇄 피해 제외</small>`;option.append(button,detail);container.append(option)}
  if(this.run.room.service==='medical'){const heal=document.createElement('button');heal.className='medical-choice';heal.textContent=this.hp>=STATS.hp?'체력 가득 참':'회복제 선택 · 체력 +2 · 기술 포기';heal.disabled=this.hp>=STATS.hp;heal.onclick=()=>{if(this.state!=='reward')return;const healed=this.run.claimRecovery(this.hp,STATS.hp);if(healed===null)return;this.hp=healed;this.checkpoint();this.resume();this.audioFX.proc('heal');this.refreshRoom();this.updateHud()};container.append(heal)}
  const skip=document.createElement('button');skip.className='reward-skip';skip.textContent=this.run.room.elite&&this.run.choices.length===0?'희귀 기술 습득 완료 · 열쇠 3개 받기':this.run.rewardKind==='boss'?'강화 포기 · 열쇠만 받기':'현재 조합 유지 · 습득 포기 (열쇠 반환 없음)';skip.onclick=()=>{if(this.state!=='reward'||!this.run.skipReward())return;this.checkpoint();this.resume();this.refreshRoom();this.updateHud();this.note('기술을 추가하지 않고 현재 조합을 유지합니다.')};container.append(skip);(container.querySelector('button') as HTMLButtonElement|null)?.focus({preventScroll:true});document.querySelector('.panel')!.scrollTop=0;
 }
 tryTravel(move:Vec){
  if(this.transitionDelay>0)return false;
  const dir=thresholdDirection(this.player,move);if(!dir)return false;
  const reason=doorBlockReason(this.run.rooms,this.run.room,dir);
  if(reason){const stamp=`${dir}:${reason}`;if(reason!=='missing'&&this.blockedDoor!==stamp){this.blockedDoor=stamp;this.note(reason==='combat'?'방 안의 적을 모두 제압하면 문이 열립니다.':`남은 전투방 ${this.run.rooms.filter(r=>r.kind==='combat'&&!r.cleared).length}개를 정리하면 봉인이 풀립니다.`)}return false}
  if(this.run.travel(dir)){this.enterRoom(OPPOSITE[dir],true);return true}return false;
 }
 update(_time:number,delta:number){
  if(this.state!=='playing')return;
  const dt=Math.min(delta/1000,.033);this.telegraphs?.update(dt);if(this.startDelay>0){this.startDelay=Math.max(0,this.startDelay-dt);this.player.setAlpha(1);for(const e of this.enemies)e.sprite.setAngle(Math.sin((ENTRY_SECONDS-this.startDelay)/ENTRY_SECONDS*Math.PI)*-6);this.updateHud();return}this.collectLoot();this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.fire-=dt;this.startDelay-=dt;this.transitionDelay-=dt;this.roomClock+=dt;this.noteTime-=dt;if(this.noteTime<=0)document.getElementById('room-note')!.textContent='';
  const move=this.controls.movement(),position=moveWithWalls(this.player,{x:move.x*STATS.speed*dt*(this.hazardSlow>0?.6:1),y:move.y*STATS.speed*dt*(this.hazardSlow>0?.6:1)},this.blocks,speciesSize('mew').radius);this.player.x=Phaser.Math.Clamp(position.x,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(position.y,R.top+22,R.bottom-22);if(move.x)this.player.setFlipX(move.x>0);
  this.player.setAlpha(this.inv>0?.75+Math.sin(this.elapsed*14)*.25:1);const motion=actorMotion(this.elapsed,Math.hypot(move.x,move.y)*STATS.speed,true);this.player.setAngle(move.x*5+motion.tilt);this.player.setOrigin(.5,.5+motion.lift/speciesSize('mew').height);this.shadow.setPosition(this.player.x,this.player.y+25).setAlpha(motion.shadowAlpha).setDisplaySize(40*motion.shadowScale,14*motion.shadowScale);this.updateActive(dt);
  if(this.tryTravel(move))return;
  if(!this.run.branch&&this.run.floor>1&&this.run.room.kind==='boss'&&this.run.room.cleared&&this.run.room.rewardTaken&&this.run.canExit&&onStairLanding(this.run.room,this.player)&&(move.x!==0||move.y!==0)){this.interact();if(this.state!=='playing')return;}
  if(this.run.rewardPending&&['heart','key'].includes(this.run.rewardKind)&&Math.hypot(this.player.x-560,this.player.y-365)<28&&(this.run.rewardKind!=='heart'||this.hp<STATS.hp))this.interact();

  this.updateHazards(dt);if(this.state!=='playing')return;
  this.fireWeapon(dt);
  this.updateEnemies(dt);if(this.state!=='playing')return;
  this.updateShots(dt);if(this.state!=='playing')return;
  this.effects.render(dt,this.shots,this.enemies);this.lab.update(dt,this.interaction(),this.run.rewardPending,this.run.room.cleared,!this.run.branch);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  if((this.run.room.kind==='combat'||this.run.room.kind==='boss')&&!this.run.room.cleared&&this.enemies.length===0){if(this.run.floor===1){const next=nextFinalPhase(this.finalPhase);if(next==='ending'){this.run.clear();this.checkpoint();this.playEnding()}else{this.finalPhase=next;this.enterRoom('down')}return}this.run.clear();if(this.run.room.kind==='boss'){this.unlock('decoy');if(this.run.room.elite)this.unlock('resonance')}this.checkpoint();this.clearShots();this.pools.forEach(p=>p.shape.destroy());this.pools=[];this.audioFX.play('clear');this.audioFX.mode='ambient';this.refreshRoom();this.updateHud();this.audioFX.environment('door');if(this.run.room.kind==='combat')this.note(this.run.rewardPending?'문 개방 · 보상 획득 가능':'적 제압 · 문 개방');else this.note('보스 제압 · 보상을 확인한 뒤 계단으로 이동');if(this.pendingUnlock){this.note(this.pendingUnlock);this.pendingUnlock=''}return}
  this.hudTime-=dt;if(this.hudTime<=0){this.updateHud();this.hudTime=.15}
 }
 updateEnemies(dt:number){
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   if(e.statusTime>0){e.statusTime-=dt;if(e.burn+e.poison>0)this.hitEnemy(e,(e.burn+e.poison)*dt);if(e.hp<=0)continue}else{e.burn=0;e.slow=0;e.poison=0}
   e.wet=Math.max(0,(e.wet??0)-dt);e.flash-=dt;
   if(this.startDelay<=0){const brain={x:e.sprite.x,y:e.sprite.y,hp:e.hp/e.maxHp*ENEMIES[e.kind].hp,cooldown:e.cooldown,charge:e.charge,dir:e.dir,phase:e.phase,cycle:e.cycle,recovery:e.recovery,dash:e.dash,aim:e.aim,lastPlayer:e.lastPlayer};const target=this.activeLeft>0&&this.decoy?this.decoy:this.player;const intent=e.kind==='mewtwo'?stepMewtwo(brain,target,this.finalPhase,dt):isLabBoss(e.kind)?stepBoss(e.kind,brain,target,dt,this.run.floor):stepBrain(e.kind,brain,target,dt,this.run.floor);e.cycle=brain.cycle;e.cooldown=brain.cooldown;e.charge=brain.charge;e.dir=brain.dir;e.phase=brain.phase;e.recovery=brain.recovery??0;e.aim=brain.aim;e.lastPlayer=brain.lastPlayer;e.dash=brain.dash??0;
    const v={x:intent.v.x*(1-e.slow*((e.kind==='mewtwo'||isLabBoss(e.kind))?.35:1))*dt*(e.kind==='mewtwo'?this.run.alert.speed:this.run.tuning.speed),y:intent.v.y*(1-e.slow*((e.kind==='mewtwo'||isLabBoss(e.kind))?.35:1))*dt*(e.kind==='mewtwo'?this.run.alert.speed:this.run.tuning.speed)};const p=ENEMIES[e.kind].flying?{x:e.sprite.x+v.x,y:e.sprite.y+v.y}:moveWithWalls(e.sprite,v,this.blocks,e.radius);
    e.motionSpeed=Math.hypot(p.x-e.sprite.x,p.y-e.sprite.y)/Math.max(dt,.001);
    if(((e.kind==='zubat'||NORMAL_VARIANTS[e.kind]?.family==='zubat')&&Math.hypot(intent.v.x,intent.v.y)>200||e.kind==='houndoom'&&e.dash>0)&&Math.floor(this.elapsed*12)!==Math.floor((this.elapsed-dt)*12)){const trail=this.add.ellipse(e.sprite.x,e.sprite.y,26,9,ENEMY_TECHNIQUES[e.kind].color,.55).setRotation(Math.atan2(intent.v.y,intent.v.x)).setDepth(8);this.tweens.add({targets:trail,alpha:0,scaleX:.3,duration:180,onComplete:()=>trail.destroy()})}e.sprite.setPosition(Phaser.Math.Clamp(p.x,R.left+e.radius,R.right-e.radius),Phaser.Math.Clamp(p.y,R.top+e.radius,R.bottom-e.radius));
    for(const action of intent.actions){if(action.type==='zone'){this.researchZones?.add({...action,guidance:this.familiarity?.guidance(e.kind)});this.audioFX.enemy(e.kind)}else if(action.type==='shot')this.shoot(e.sprite.x,e.sprite.y,action.dir,true,undefined,false,undefined,action.homing??0,action.speed,e.kind,action.returning);else if(action.type==='beam')this.addBeam(action.axis,action.position,e.kind);else if(action.type==='pool')this.addPool(action.x,action.y,action.r,e.kind);else if(action.type==='blink'){this.burst(e.sprite.x,e.sprite.y,ENEMY_TECHNIQUES[e.kind].color,8);e.sprite.setPosition(action.x,action.y);this.burst(action.x,action.y,ENEMY_TECHNIQUES[e.kind].color,8)}else if(action.type==='phase')this.phaseShift(e);else {this.warn(action.x,action.y,action.r,{...action,guidance:this.familiarity?.guidance(e.kind),label:action.cue==='notice'?undefined:enemyWarning(e.kind,action.cue,action.tracking)});if(action.cue!=='notice')this.audioFX.enemy(e.kind)}}
   }
   const body=speciesSize(e.kind),pose=enemyPose(e.kind,e.charge,e.recovery,this.elapsed+e.id);const motion=actorMotion(this.elapsed+e.id,e.charge>0?0:(e.motionSpeed??0),ENEMIES[e.kind].flying,e.flash>0);e.sprite.setOrigin(.5,.5+motion.lift/body.height);e.shadow.setAlpha(motion.shadowAlpha).setDisplaySize(body.width*.6*motion.shadowScale,12*motion.shadowScale);e.sprite.setDisplaySize(body.width*pose.x*motion.scaleX,body.height*pose.y*motion.scaleY).setFlipX(this.player.x>e.sprite.x).setAngle((pose.tilt+motion.tilt)*(this.player.x>e.sprite.x?1:-1));e.sprite.setTint(e.flash>0?0xffffff:gasShellClosed(e)?0x91ad88:e.charge>.48?ENEMY_TECHNIQUES[e.kind].color:e.slow>0?0x91e6fa:e.poison>0?0xbb8fe8:e.burn>0?0xffaf71:0xffffff);e.sprite.setAlpha(e.flash>0?.65:1);e.shadow.setPosition(e.sprite.x,e.sprite.y+speciesSize(e.kind).height*.4);e.bar.setPosition(e.sprite.x,e.sprite.y-speciesSize(e.kind).height*.6).setDisplaySize(30*e.hp/e.maxHp,3);
   if(this.startDelay<=0&&intersects(this.player,e.sprite,e.radius+speciesSize('mew').radius-4))this.hurt(normalize(this.player.x-e.sprite.x,this.player.y-e.sprite.y));if(this.state!=='playing')return;
  }
 }
 updateShots(dt:number){
  // Snapshot keeps child projectiles from being simulated recursively in their birth frame.
  for(const s of [...this.shots]){
   if(s.life<=0)continue;
   if(s.hostile&&s.tracking>0&&s.trackingLeft>0){s.trackingLeft=Math.max(0,s.trackingLeft-dt);if(s.trackingLeft===0)s.glow.setAlpha(.8);const aim=this.activeLeft>0&&this.decoy?this.decoy:this.player,desired=normalize(aim.x-s.sprite.x,aim.y-s.sprite.y),mix=Math.min(1,s.tracking*dt),v=normalize(s.v.x/s.speed*(1-mix)+desired.x*mix,s.v.y/s.speed*(1-mix)+desired.y*mix);s.v={x:v.x*s.speed,y:v.y*s.speed}}
   if(!s.hostile&&s.attack.homing>0){const target=this.enemies.filter(e=>e.hp>0&&!s.hit.has(e.id)).sort((a,b)=>Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,b.sprite.x,b.sprite.y))[0];if(target){const desired=normalize(target.sprite.x-s.sprite.x,target.sprite.y-s.sprite.y),mix=Math.min(1,s.attack.homing*dt),v=normalize(s.v.x/s.attack.speed*(1-mix)+desired.x*mix,s.v.y/s.attack.speed*(1-mix)+desired.y*mix);s.v={x:v.x*s.attack.speed,y:v.y*s.attack.speed}}}
   if(s.returning&&s.life<4.2){s.returning=false;s.v.x*=-1;s.v.y*=-1} s.life-=dt;s.sprite.x+=s.v.x*dt;s.sprite.y+=s.v.y*dt;s.glow.setPosition(s.sprite.x,s.sprite.y);if(s.hostile)s.glow.setRotation(s.returning?this.elapsed*14:Math.atan2(s.v.y,s.v.x));if(!s.hostile)this.hitScenery([{x:s.sprite.x-s.v.x*dt,y:s.sprite.y-s.v.y*dt,width:s.attack.size},{x:s.sprite.x,y:s.sprite.y,width:s.attack.size}]);if(s.sprite.x<R.left||s.sprite.x>R.right||s.sprite.y<R.top||s.sprite.y>R.bottom){if(!s.hostile&&s.bounces>0){s.bounces--;if(s.bounces===s.attack.bounce-1){s.attack=reflectionAttack(s.attack);s.remaining=Math.min(s.remaining+1,s.attack.pierce)}this.audioFX.proc('bounce');this.effects.impact(s.sprite.x,s.sprite.y,s.attack);if(s.sprite.x<R.left||s.sprite.x>R.right)s.v.x*=-1;if(s.sprite.y<R.top||s.sprite.y>R.bottom)s.v.y*=-1;s.sprite.setPosition(Phaser.Math.Clamp(s.sprite.x,R.left,R.right),Phaser.Math.Clamp(s.sprite.y,R.top,R.bottom))}else s.life=0}if(this.blocks.some(b=>overlapsBlock(s.sprite,s.hostile?7:s.attack.size,b)))s.life=0;if(s.life<=0)continue;
   if(s.hostile){if(this.activeLeft>0&&this.run.activeSkill==='reflector'&&intersects(s.sprite,this.player,58)){s.life=0;this.burst(s.sprite.x,s.sprite.y,0xa8d8ff,3);this.audioFX.active?.('reflector','block');continue}if(this.activeLeft>0&&this.decoy&&intersects(s.sprite,this.decoy,24)){s.life=0;this.burst(s.sprite.x,s.sprite.y,0xb9f4d6,3);this.audioFX.active?.('decoy','block');continue}if(intersects(s.sprite,this.player,20)){s.life=0;this.hurt(normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y));if(this.state!=='playing')return}}
   else for(const e of this.enemies){
    if(e.hp<=0||s.hit.has(e.id)||!intersects(s.sprite,e.sprite,e.radius+s.attack.size))continue;
    s.hit.add(e.id);this.applyWeaponHit(e,s.attack,s.sprite,s.v,s.critical,s.procAvailable,!s.child);s.child=true;
    s.procAvailable=false;if(s.remaining--<=0){s.life=0;break}s.attack={...s.attack,damage:s.attack.damage*PIERCE_RETAIN};
   }
  }
  this.shots=this.shots.filter(s=>{if(s.life<=0){s.sprite.destroy();s.glow.destroy();return false}return true});
 }
 applyWeaponHit(e:Enemy,attack:Attack,origin:Vec,dir:Vec,critical:boolean,proc:boolean,split:boolean){
    const rules=fusionRules(attack),alreadyPoisoned=e.poison>0,point={x:e.sprite.x,y:e.sprite.y};if(attack.visual.levels.water)e.wet=2.2;e.burn=Math.max(e.burn,attack.burn);e.slow=Math.max(e.slow,attack.slow);e.poison=Math.max(e.poison,attack.poison);e.statusTime=2;
    const appliedDamage=attack.damage*(gasShellClosed(e)?.65:1),dealt=Math.min(e.hp,appliedDamage);if(attack.lifesteal)this.effects.siphon(point,this.player);e.thermal=thermalBank(attack,dealt,e.thermal??0);this.drain+=dealt*attack.lifesteal*(rules.toxicDrain?(alreadyPoisoned?1.6:.35):1);if(this.drain>=1){const heal=Math.floor(this.drain);this.hp=Math.min(STATS.hp,this.hp+heal);this.drain-=heal;this.audioFX.proc('heal')}
    this.effects.impact(point.x,point.y,attack,critical);this.hitEnemy(e,appliedDamage);
    if(e.hp>0&&attack.knockback&&!(e.charge>0)){const v=normalize(dir.x,dir.y),power=attack.knockback*(isLabBoss(e.kind)||e.kind==='mewtwo'?.25:1),p=moveWithWalls(e.sprite,{x:v.x*power,y:v.y*power},ENEMIES[e.kind].flying?[]:this.blocks,e.radius);e.sprite.setPosition(Phaser.Math.Clamp(p.x,R.left+e.radius,R.right-e.radius),Phaser.Math.Clamp(p.y,R.top+e.radius,R.bottom-e.radius))}
    if(proc&&attack.blast){this.burst(point.x,point.y,0xb991cf,10);const ring=this.add.circle(point.x,point.y,attack.blast,0xb991cf,.06).setStrokeStyle(2,0xb991cf,.45);this.tweens.add({targets:ring,alpha:0,duration:220,onComplete:()=>ring.destroy()});for(const other of this.enemies)if(other.id!==e.id&&other.hp>0&&intersects(point,other.sprite,attack.blast))this.hitEnemy(other,attack.damage*BLAST_DAMAGE)}this.audioFX.hit(attack);
    const chained=this.enemies.filter(other=>other.hp>0&&other.id!==e.id&&intersects(point,other.sprite,rules.conductive?245:175)&&(!rules.conductive||(other.wet??0)>0)).sort((a,b)=>Phaser.Math.Distance.Between(point.x,point.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(point.x,point.y,b.sprite.x,b.sprite.y)).slice(0,proc?(rules.conductive?Math.min(3,attack.chain+1):attack.chain):0);
    if(chained.length)this.audioFX.proc('chain');for(const other of chained){this.effects.bolt(point,other.sprite);this.hitEnemy(other,attack.damage*CHAIN_DAMAGE*(rules.conductive?Math.min(2,attack.chain)/chained.length:1))}
    if(split&&attack.split){this.audioFX.proc('split');const angle=Math.atan2(dir.y,dir.x);for(const offset of [-.7,.7]){const dir={x:Math.cos(angle+offset),y:Math.sin(angle+offset)};this.shoot(origin.x,origin.y,dir,false,splitAttack(attack),true,e.id)}}

 }
 releaseThermal(){for(const e of this.enemies){const bank=e.thermal??0;e.thermal=0;if(e.hp<=0||bank<=.01)continue;const nearby=this.enemies.filter(o=>o!==e&&o.hp>0&&intersects(e.sprite,o.sprite,110)).slice(0,2);this.effects.impact(e.sprite.x,e.sprite.y,this.run.attack,true);this.hitEnemy(e,bank*(nearby.length?.7:1));for(const other of nearby){this.effects.bolt(e.sprite,other.sprite);this.hitEnemy(other,bank*.3/nearby.length)}}}
 fireWeapon(dt:number){
  const aim=this.controls.attack();this.effects.aim?.(this.player,aim);if(!aim.x&&!aim.y){this.releaseThermal();this.weaponBursts.clear();this.effects.setChannels([]);for(const [key,value] of this.weaponTimers)this.weaponTimers.set(key,Math.max(0,value-dt));return}
  if(this.startDelay>0)return;
  const layers=fusionLayers(this.run.attack),angle=Math.atan2(aim.y,aim.x),paths:WeaponPath[]=[];
  const targets=this.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,x:e.sprite.x,y:e.sprite.y,radius:e.radius}));
  for(const [layerIndex,attack] of layers.entries()){
   const key=attack.visual.form,profile=weaponProfile(attack),left=(this.weaponTimers.get(key)??0)-dt,due=left<=0;this.weaponTimers.set(key,due?Math.max(left,-dt)+profile.interval:left);
   const offset=layerIndex===0?0:(layerIndex%2?1:-1)*(.045+Math.floor(layerIndex/2)*.025);
   if(profile.kind==='projectile'){
    if(!due)continue;
    for(let i=0;i<attack.count;i++)for(let j=0;j<profile.pellets;j++){
     const theta=angle+offset+(i-(attack.count-1)/2)*.15+(j-(profile.pellets-1)/2)*(attack.visual.form==='ice'?.24:.12),dir={x:Math.cos(theta),y:Math.sin(theta)};
     const shot={...attack,damage:attack.damage/profile.pellets,speed:attack.speed*profile.speed,size:attack.size*(attack.visual.form==='dragon'?2:attack.visual.form==='sludge'?1.5:1),visual:{...attack.visual,variant:i+j}};
     this.shoot(this.player.x+dir.x*22,this.player.y+dir.y*22,dir,false,shot);
    }
   }else{
    const current:WeaponPath[]=[];
    if(profile.held||due)for(let i=0;i<attack.count;i++){
     const theta=angle+offset+(i-(attack.count-1)/2)*.15,dir={x:Math.cos(theta),y:Math.sin(theta)},origin={x:this.player.x+dir.x*22,y:this.player.y+dir.y*22};
     const path=traceWeapon(origin,theta,attack,targets,this.blocks,R);current.push(path);
     if(due){this.hitScenery(path.points);const critical=Math.random()<attack.crit;let hitAttack=tickAttack(attack);if(critical)hitAttack={...hitAttack,damage:hitAttack.damage*CRITICAL_MULTIPLIER};
      for(let n=0;n<path.hits.length;n++){const e=this.enemies.find(e=>e.id===path.hits[n]);if(e&&e.hp>0)this.applyWeaponHit(e,path.reflectedHits?.includes(e.id)?reflectionAttack(hitAttack):hitAttack,e.sprite,dir,critical,n===0,n===0);hitAttack={...hitAttack,damage:hitAttack.damage*PIERCE_RETAIN}}
      if(path.reflections)this.audioFX.proc('bounce');
     }
    }
    if(profile.held)paths.push(...current);else if(due)this.weaponBursts.set(key,{paths:current,life:.12});
   }
   if(due&&layerIndex===0)this.audioFX.shoot(attack);
  }
  for(const [key,burst] of this.weaponBursts){burst.life-=dt;if(burst.life<=0)this.weaponBursts.delete(key);else paths.push(...burst.paths.map(p=>({...p,opacity:burst.life/.12})))}
  this.effects.setChannels(paths);
 }

 shoot(x:number,y:number,dir:Vec,hostile:boolean,attack=this.run.attack,child=false,ignore?:number,tracking=0,shotSpeed?:number,source:Kind='mewtwo',returning=false){
  if(!canSpawnProjectile(this.shots,hostile))return;
  const critical=!hostile&&!child&&Math.random()<attack.crit;
  if(critical)attack={...attack,damage:attack.damage*CRITICAL_MULTIPLIER,size:Math.min(13,attack.size+1)};
  const color=hostile?(tracking>0?0xe8a1ef:0xff9c64):attack.color,r=hostile?7:attack.size,speed=hostile?(shotSpeed===undefined?220*this.run.tuning.shotSpeed:shotSpeed*this.run.alert.shot):attack.speed;
  this.shots.push({sprite:this.add.circle(x,y,r,color).setStrokeStyle(2,hostile?0xffe0b6:0xffeaff).setDepth(hostile?20:13).setVisible(false),glow:hostile?enemyProjectile(this,source,x,y).setRotation(Math.atan2(dir.y,dir.x)):this.add.circle(x,y,r*2.5,color,.09).setDepth(12).setVisible(false),v:{x:dir.x*speed,y:dir.y*speed},life:hostile?5:attack.range/speed,hostile,attack,hit:new Set(ignore===undefined?[]:[ignore]),remaining:attack.pierce,child,bounces:attack.bounce,trail:[],critical,procAvailable:!child,tracking,trackingLeft:tracking>0?TRACKING_SECONDS:0,speed,returning});
 }
 hitEnemy(e:Enemy,amount:number){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);e.flash=.1;if(e.hp===0){if(e.kind!=='mewtwo'||this.finalPhase===3)this.kills++;this.burst(e.sprite.x,e.sprite.y,0xc29fed,10);e.sprite.destroy();e.bar.destroy();e.shadow.destroy()}}
 hurt(dir:Vec){if(this.startDelay>0||this.state!=='playing')return;const result=damage(this.hp,this.inv);if(!result.hit)return;this.hp=result.hp;this.inv=result.invulnerable;const pushed=knockbackPosition(this.player,dir,this.blocks,speciesSize('mew').radius);this.player.setPosition(pushed.x,pushed.y);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.cameras.main.shake(150,.005);const flash=document.getElementById('damage-flash');if(flash){flash.classList.remove('hit');void flash.offsetWidth;flash.classList.add('hit')}this.audioFX.play('hurt');this.burst(this.player.x,this.player.y,0xf9a1b7,8);this.updateHud();if(this.hp<=0)this.finish(false)}
 burst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,3,3,color).setDepth(15),angle=Math.random()*Math.PI*2;this.tweens.add({targets:p,x:x+Math.cos(angle)*35,y:y+Math.sin(angle)*35,alpha:0,duration:280,onComplete:()=>p.destroy()})}}
 checkpoint(){
  const save:Checkpoint={version:1,secretUsed:this.run.secretUsed,keys:this.run.keys,mapFound:this.run.mapFound,seed:this.run.seed,floor:this.run.floor,current:this.run.current,moves:[...this.run.moves],rooms:this.run.rooms.map(({visited,cleared,rewardTaken,environment,offer,opened})=>({visited,cleared,rewardTaken,offer,opened,environment:environment?{...environment}:undefined})),hp:this.hp,kills:this.kills,elapsed:this.elapsed,drain:this.drain,entry:this.entry,phase:this.finalPhase,ending:this.run.floor===1&&this.run.room.cleared,savedAt:Date.now()};
  attachSecretRoute(save,this.run);
  this.saveStatus=writeCheckpoint(browserStorage,save)?'':'자동 저장 실패 · 브라우저 저장 공간/권한을 확인해 주세요.';if(this.saveStatus)this.note(this.saveStatus);
 }
 continueRun(){const result=readCheckpoint(browserStorage);if(!result.save){this.restart();this.note(result.status||'저장이 없어 새 게임을 시작합니다.');return}const s=result.save;this.run=restoreRun(s);this.run.unlocks=[...new Set([...this.run.unlocks,...readUnlocks(browserStorage)])];this.hp=s.hp;this.kills=s.kills;this.elapsed=s.elapsed;this.drain=s.drain;this.finalPhase=s.phase;this.resume();this.enterRoom(s.entry??undefined);if(this.run.floor!==1)this.note('체크포인트에서 이어합니다.');}
 finalDialogue(){
  this.state='story';document.getElementById('active-skill')!.hidden=true;document.getElementById('active-decoy')!.hidden=true;this.controls.reset();this.audioFX.mode='silent';this.clearShots();const script=MEWTWO_SCRIPT[this.finalPhase-1];
  const shots=this.finalPhase===1?[{id:'reunion',tag:'B1 · 지상 출입 구역',title:'문 앞에서 기다리던 존재',text:'문틈으로 햇빛이 비쳤다. 뮤는 반가운 듯 고개를 들고 그쪽으로 날아갔다. 문 앞의 뮤츠가 천천히 손을 펼쳤다. 출구가, 다시 어두워졌다.'}]:[];
  shots.push({id:this.finalPhase===1?'awakening':this.finalPhase===2?'jealousy':'abandonment',tag:`MEWTWO / ${this.finalPhase}단계 · ${script.emotion}`,title:script.emotion,text:script.line+'<br><small>'+script.direction+'</small>'});
  this.stopStory=showStory(shots,()=>{this.resume();this.inv=0;this.startDelay=ENTRY_SECONDS;this.audioFX.play('alarm')});
 }
 playEnding(){this.audioFX.setScene(6,1);this.state='story';document.getElementById('active-skill')!.hidden=true;document.getElementById('active-decoy')!.hidden=true;this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='ambient';this.stopStory=showStory(ENDING,()=>this.finish(true),'탈출 기록 보기');}
 finish(won:boolean){if(this.state==='won'||this.state==='lost')return;const archived=finishProfile(browserStorage,won,this.run.floor,this.kills,this.elapsed);if(!archived)this.note('탈출 통계 저장에 실패했습니다.');this.audioFX.setScene(6,1);this.state=won?'won':'lost';this.audioFX.mode='ambient';this.controls.reset();this.clearShots();const removed=removeCheckpoint(browserStorage);if(won)this.audioFX.play('win');const learned=this.run.moves.length;this.updateHud();this.showModal(won?'탈출 성공 · 새로운 아침':'아직, 하늘에 닿지 못했다',`B${this.run.floor} · ${this.kills}마리 제압 · 기술 ${learned}회 습득 · ${formatDuration(this.elapsed)}. ${won?'뮤는 빛 앞에서 기다렸다. 이번 탈출은 여기서 끝났지만, 두 포켓몬의 이야기는 이제 시작이다.':'이번 판은 끝났습니다. 새로운 탈출을 시작할 수 있습니다.'}${removed?'':' 저장소에 접근할 수 없어 이전 기록을 지우지 못했습니다.'}`,'다시 탈출하기');}
 unlock(id:Unlock){if(!this.run.unlocks.includes(id))this.run.unlocks.push(id);if(grantUnlock(browserStorage,id))this.pendingUnlock=(id==='decoy'?'대타출동 해금 · 정리한 방의 일시정지에서 선택':id==='resonance'?'공명 연구 해금 · 보스 보상 후보 확장':'안정화실 해금 · 다음 층 격리실의 장치 이용 가능');this.checkpoint()}
 useActive(kind=this.run.activeSkill){if(this.state!=='playing'||this.startDelay>0||this.run.room.cleared||this.activeLeft>0||kind==='decoy'&&!this.run.unlocks.includes('decoy')||this.run.activeStock[kind].count===0)return;this.run.activeSkill=kind;if(!this.run.useActive())return;this.activeLeft=this.run.activeSkill==='reflector'?2:2.8;if(this.run.activeSkill==='decoy'){this.decoy={x:this.player.x,y:this.player.y};this.activeArt=this.add.image(this.player.x,this.player.y,'ditto','body').setDisplaySize(48,42).setTint(0xb1dece).setDepth(17)}else this.activeRing=this.add.circle(this.player.x,this.player.y,58,0x83c7ee,.025).setStrokeStyle(1,0xb7e7ff,.25).setDepth(18);this.effects.activeBurst?.(this.player,this.run.activeSkill);this.effects.active?.(this.run.activeSkill,this.decoy??this.player,this.activeLeft);this.audioFX.active?.(this.run.activeSkill,'start');this.updateHud()}
 updateActive(dt:number){if(this.activeLeft<=0)return;this.activeLeft=Math.max(0,this.activeLeft-dt);this.activeRing?.setPosition(this.player.x,this.player.y).setAlpha(Math.min(1,this.activeLeft*3));this.activeArt?.setAlpha(Math.min(.95,this.activeLeft*3));this.effects.active?.(this.run.activeSkill,this.decoy??this.player,this.activeLeft);if(this.activeLeft===0){this.effects.activeBurst?.(this.decoy??this.player,this.run.activeSkill,true);this.audioFX.active?.(this.run.activeSkill,'end');this.activeRing?.destroy();this.activeRing=undefined;this.activeArt?.destroy();this.activeArt=undefined;this.decoy=undefined}}
 updateHud(){
  for(const skill of ['reflector','decoy'] as const){const activeButton=document.getElementById(skill==='reflector'?'active-skill':'active-decoy') as HTMLButtonElement|null;if(!activeButton)continue;const stock=this.run.activeStock[skill],locked=skill==='decoy'&&!this.run.unlocks.includes('decoy');activeButton.hidden=this.state!=='playing';activeButton.disabled=locked||this.startDelay>0||stock.count===0||this.run.room.cleared||this.activeLeft>0;activeButton.innerHTML=symbol(skill==='reflector'?'shield':'decoy')+`<small>${locked?'잠김':stock.count+'/'+stock.capacity}</small>`;activeButton.setAttribute('aria-label',`${ACTIVE_NAMES[skill]} · ${locked?'첫 보스 제압 후 해금':stock.count+'/'+stock.capacity+'개'} · 기물 파괴 보상으로 획득`);activeButton.dataset.hint=locked?'첫 연구소 보스 제압 시 대타출동 해금':skill==='reflector'?'2초간 적 탄환 차단 · 접촉·장판에는 무효':'2.8초간 적의 조준을 유인하는 대타 생성';}


  paintHealth(document.getElementById('hearts')!,this.hp,STATS.hp);
  const cleared=this.run.rooms.filter(r=>r.kind==='combat'&&r.cleared).length;
  document.getElementById('counter')!.textContent=`B${this.run.floor} · ${this.run.floor===1?'뮤츠 '+this.finalPhase+'/3단계':'전투방 '+cleared+'/'+this.run.tuning.combatCount} · ${this.kills} 처치 · ${Math.floor(this.elapsed)}s`;
  const supplies=document.getElementById('supplies')!;supplies.innerHTML=symbol('key')+`<b>${this.run.keys}</b>${this.run.threat?` <span aria-label="연구소 경계 ${this.run.threat}">⚠${this.run.threat}</span>`:''}`;supplies.setAttribute('aria-label',`열쇠 ${this.run.keys}`);supplies.dataset.hint='열쇠 · 기술 캡슐 해제 1개'+(this.run.threat?` / 경계 ${this.run.threat}: 적 체력 +${this.run.threat*6}%, 보스 +${this.run.threat*5}% · 이후 층 유지`:'');

  const status=document.getElementById('status')!;status.innerHTML=this.toxic>0?'☣':this.hazardSlow>0?'ϟ':'';status.setAttribute('aria-label',this.toxic>0?'중독':this.hazardSlow>0?'이동 둔화':'이상 상태 없음');
  document.getElementById('seed')!.textContent=`SEED ${this.run.seed.toString(16).toUpperCase()}`;
  const bosses=this.enemies.filter(e=>(isLabBoss(e.kind)||e.kind==='mewtwo')&&e.hp>0),boss=bosses[0];document.getElementById('boss-hud')!.hidden=!boss;if(boss){document.getElementById('boss-name')!.textContent=boss.kind==='mewtwo'?`뮤츠 ${'●'.repeat(this.finalPhase)}${'○'.repeat(3-this.finalPhase)}`:bosses.map(e=>ENEMIES[e.kind].name).join(' + ');document.getElementById('boss-fill')!.style.width=`${bosses.reduce((n,e)=>n+e.hp,0)/(this.run.room.bosses?this.run.tuning.bossHp*this.run.room.bosses.length:boss.maxHp)*100}%`}
  document.querySelector('.map>span')!.innerHTML=`B${this.run.floor}${this.run.branch==='depth'?'−X':this.run.branch==='cache'?'◇':''}${this.run.mapFound?symbol('map'):''}`;
  const target=this.interaction(),button=document.getElementById('interact')!;button.hidden=!target||target.kind==='lift'||this.state!=='playing'||this.startDelay>0;if(target){button.innerHTML=symbol(({record:'read',reward:'reward',power:'power',lift:'up',secret:'reward',depth:'down',return:'up',sanctuary:'shield'} as Record<string,string>)[target.kind]??'up')+`<span>${({record:'조사',reward:this.run.rewardKind==='heart'?'회복':this.run.rewardKind==='key'?'줍기':'보상',power:'전원 차단',lift:'위층으로',secret:'보관실',depth:'폐쇄층',return:'본층 복귀',sanctuary:'안정화'} as Record<string,string>)[target.kind]}</span>`+(document.body.classList.contains('touch-ui')||matchMedia('(pointer:coarse)').matches?'':'<kbd>E</kbd>');button.title=target.label;button.dataset.hint=target.label;button.setAttribute('aria-label',target.label)};
  const attack=this.run.attack,form=FORMS[attack.visual.form],name=MOVES.find(m=>m.id===attack.visual.form)?.name??'염동력';document.getElementById('build-info')!.replaceChildren();const icon=document.querySelector('.move-icon') as HTMLElement;stableMarkup(icon,techniqueIcon(attack.visual.form)+`<span class="main-tech-label"><span class="move-name">${name}</span><span class="build-action">조합 보기 ›</span></span>`);icon.removeAttribute('data-hint');icon.setAttribute('aria-label',`${name} · 현재 기술 조합 보기`);icon.style.color='#'+form.color.toString(16);document.getElementById('sound')!.title=this.audioFX.snapshot.title;
  const counts=new Map<string,number>();for(const id of this.run.moves)counts.set(id,(counts.get(id)??0)+1);
  document.getElementById('build-list')!.textContent=counts.size?[...counts].map(([id,n])=>`${MOVES.find(m=>m.id===id)!.name}${n>1?' ×'+n:''}`).join(' · '):'염동력 · 기술을 모아 효과를 조합하세요';
  const map=document.getElementById('minimap')!;map.dataset.hint='교차한 검: 미클리어 전투 · 선물: 남은 보상 · 빈 칸: 빈 방 · 해골: 보스 · 화살표: 위층 계단';map.setAttribute('tabindex','0');const rooms=this.run.rooms,minX=Math.min(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y));
  map.style.width=`${(Math.max(...rooms.map(r=>r.x))-minX)*32+22}px`;map.style.height=`${(Math.max(...rooms.map(r=>r.y))-minY)*32+22}px`;map.replaceChildren();for(const room of rooms){const known=roomKnown(room,this.run.moves,this.run.mapFound);if(!known)continue;const cell=document.createElement('span');cell.className='map-cell'+(room.id===this.run.current?' current':'')+(room.visited&&room.cleared?' cleared':'');cell.style.left=`${(room.x-minX)*32}px`;cell.style.top=`${(room.y-minY)*32}px`;const mapIcon=roomMapIcon(room);cell.innerHTML=mapIcon==='empty'?'':symbol(mapIcon);cell.title=roomMapLabel(room);cell.setAttribute('aria-label',cell.title);cell.dataset.kind=room.kind;if(room.visited||this.run.mapFound||this.run.moves.includes('survey')){const names={up:'위',right:'오른쪽',down:'아래',left:'왼쪽'};const directions=Object.keys(room.doors) as Direction[];for(const dir of directions){const marker=document.createElement('i');marker.className=`map-door ${dir}`;marker.setAttribute('aria-hidden','true');cell.append(marker)}cell.setAttribute('aria-label',`${roomMapLabel(room)} · 통로 ${directions.map(d=>names[d]).join(', ')||'없음'}`)}map.append(cell)}
 }
}
