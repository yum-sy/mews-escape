import {arenaView} from './viewport';
import {roomKnown,mapSymbol} from './exploration';
import {objective,attackTraits,rewardComparison,formatDuration,attackLabel} from './player-ui';
import {rememberRecord,finishProfile} from './profile';
import {LabPresentation} from './lab-presentation';
import {roomEnvironment,roomInteractions,nearestInteraction,breakableProps,breakProp,floorTheme,sceneryBlocks} from './environment';
import {weaponProfile,fusionLayers,tickAttack,traceWeapon,distanceToSegment,type WeaponPath} from './weapons';
import {roomReward,rewardTier} from './rewards';
import {FORMS,glyph} from './techniques';
import {techniquePreview} from './technique-preview';
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

type Enemy={id:number;sprite:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;bar:Phaser.GameObjects.Rectangle;kind:Kind;hp:number;cooldown:number;charge:number;dir:Vec;flash:number;burn:number;slow:number;statusTime:number;poison:number;phase:number;maxHp:number;radius:number;cycle:number};
type Shot={sprite:Phaser.GameObjects.Arc;glow:Phaser.GameObjects.Arc;v:Vec;life:number;hostile:boolean;attack:Attack;hit:Set<number>;remaining:number;child:boolean;bounces:number;trail:Vec[];critical:boolean;procAvailable:boolean;tracking:number;speed:number};
type State='ready'|'playing'|'paused'|'reward'|'record'|'won'|'lost'|'story'|'transition';
function nextSeed(){const raw=new URLSearchParams(location.search).get('seed');const value=Number(raw);return raw!==null&&/^\d+$/.test(raw)&&Number.isSafeInteger(value)&&value>=0&&value<=0xffffffff?value:crypto.getRandomValues(new Uint32Array(1))[0]}
const ROOM_NAME={start:'격리실',combat:'실험실',reward:'기술 보관실',boss:'승강기 제어실'};
export class LabScene extends Phaser.Scene{
 terminal!:Phaser.GameObjects.Text;lab!:LabPresentation;effects!:CombatEffects;controls=new Controls(()=>this.state==='playing');audioFX=new AudioFX();player!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;
 enemies:Enemy[]=[];shots:Shot[]=[];hp=STATS.hp;inv=0;fire=0;elapsed=0;state:State='ready';kills=0;startDelay=1.2;hudTime=0;transitionDelay=0;
 weaponTimers=new Map<string,number>();weaponBursts=new Map<string,{paths:WeaponPath[];life:number}>();
 run=new Run(nextSeed());finalPhase:FinalPhase=1;entry:Direction|null=null;stopStory=()=>{};saveStatus='';
 beams:{shape:Phaser.GameObjects.Rectangle;axis:'x'|'y';position:number;age:number}[]=[];
 menu=()=>{};roomDecor!:Phaser.GameObjects.Container;blocks:Block[]=[];roomClock=0;drain=0;noteTime=0;toxic=0;toxicTick=0;hazardSlow=0;
 pools:{shape:Phaser.GameObjects.Arc;x:number;y:number;r:number;age:number}[]=[];
 env:{shape:Phaser.GameObjects.Rectangle|Phaser.GameObjects.Arc;kind:'laser'|'gas'|'electric';x:number;y:number;r:number;offset:number}[]=[];
 preload(){Object.keys(SPECIES).forEach(key=>this.load.image(key,`./assets/${key}.png`));this.load.image('tiles','./assets/lab-tiles.png');this.load.on('loaderror',()=>{document.getElementById('modal-copy')!.textContent='리소스를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'})}
 create(){
  const fit=()=>{const v=arenaView(this.scale.width,this.scale.height);this.cameras.main.setZoom(v.zoom).centerOn(v.x,v.y);document.documentElement.style.setProperty('--arena-inset',`${v.left}px`)};fit();this.scale.on('resize',fit);this.events.once('shutdown',()=>this.scale.off('resize',fit));
  for(const [key,data] of Object.entries(SPECIES)){const [x,y,right,bottom]=data.bounds;this.textures.get(key).add('body',0,x,y,right-x,bottom-y)}
  this.buildRoom();this.lab=new LabPresentation(this);this.effects=new CombatEffects(this);this.roomDecor=this.add.container(0,0).setDepth(3);

  this.terminal=this.add.text(560,410,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#a6dfd5',align:'center'}).setOrigin(.5).setDepth(6);
  this.shadow=this.add.ellipse(560,385,40,14,0x000000,.4).setDepth(8);this.player=this.add.image(560,360,'mew','body').setDisplaySize(speciesSize('mew').width,speciesSize('mew').height).setDepth(17);
  this.decorateRoom();this.refreshRoom();this.updateHud();
  document.getElementById('primary')!.onclick=()=>{if(this.state==='paused'||this.state==='record')this.resume();else this.restart()};
  document.getElementById('secondary')!.onclick=()=>{const button=document.getElementById('secondary')!;button.textContent='현재 진행을 지우고 시작';button.onclick=()=>this.restart()};
  document.getElementById('back-menu')!.onclick=()=>{this.stopStory();this.state='ready';this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='silent';this.menu()};
  document.getElementById('interact')!.onclick=()=>this.interact();this.controls.onInteract=()=>this.interact();
  this.menu=setupShell(restore=>restore?this.continueRun():this.restart());
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('campaign'))void import('../tests/campaign-fixture').then(m=>m.installCampaign(this));
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa'))void import('../tests/browser-fixture').then(m=>m.installFixture(this));
  document.getElementById('pause')!.onclick=()=>this.togglePause();this.controls.onPause=()=>this.togglePause();
  document.getElementById('sound')!.onclick=async()=>{const button=document.getElementById('sound') as HTMLButtonElement;button.disabled=true;const on=await this.audioFX.toggle();button.disabled=false;button.textContent=on?'소리 ON':'소리 OFF';button.setAttribute('aria-label',on?'소리 끄기':'소리 켜기')};
  this.events.once('shutdown',()=>this.audioFX.dispose());
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='playing')this.togglePause()});window.addEventListener('blur',()=>{if(this.state==='playing')this.togglePause()});
 }
 buildRoom(){
 this.cameras.main.setBackgroundColor('#080e18');
 const tex=this.textures.get('tiles');tex.add('floor',0,64,896,64,64);tex.add('wall',0,128,640,64,64);tex.add('desk',0,1280,1024,192,64);tex.add('cabinet',0,1536,960,192,64);tex.add('paper',0,1600,576,64,64);tex.add('glass',0,1280,576,64,64);tex.add('crate',0,1280,256,64,64);
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
 for(let y=0;y<700;y+=4)this.add.rectangle(560,y,1120,1,0x000000,.04).setDepth(30);
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
  this.roomDecor.add(this.add.image(230,200,'tiles','paper').setDisplaySize(50,44).setTint(0x9bdbd0));this.roomDecor.add(this.add.text(230,238,'연구 기록',{fontFamily:'sans-serif',fontSize:'14px',color:'#7daca8'}).setOrigin(.5));
  if(this.run.floor===1){this.roomDecor.add(this.add.rectangle(560,116,180,40,0xcce9d0,.45));this.roomDecor.add(this.add.text(560,115,'SURFACE / 地上',{fontFamily:'monospace',fontSize:'12px',color:'#f0fff1'}).setOrigin(.5));this.roomDecor.add(this.add.circle(560,350,135,0xa380db,.045).setStrokeStyle(2,0xa48ac6,.35));this.roomDecor.add(this.add.text(560,165,'PROJECT 150 / 最後の扉',{fontFamily:'monospace',fontSize:'10px',color:'#baa8d3'}).setOrigin(.5))}
  if(this.run.room.kind==='combat'){
   const kinds=['laser','gas','electric'] as const;const count=this.run.tuning.level>=2?2:1;
   for(let i=0;i<count;i++){const kind=kinds[(this.run.room.seed+i)%3],x=i?780:340,y=kind==='laser'?350:445,r=50;const shape=kind==='laser'?this.add.rectangle(560,y,830,12,0xf59b77,.1):this.add.circle(x,y,r,kind==='gas'?0x99c279:0x8fcbe6,.1);this.roomDecor.add(shape);this.env.push({shape,kind,x:kind==='laser'?560:x,y,r,offset:i*2});this.roomDecor.add(this.add.text(kind==='laser'?175:x,y-(kind==='laser'?20:r+14),{laser:'LASER / 예고 후 작동',gas:'독가스 / 중독 잔류',electric:'전기 / 피해·이동 둔화'}[kind],{fontFamily:'sans-serif',fontSize:'8px',color:'#9aa8b7'}).setOrigin(.5))}
  }
 }
 interaction(){return nearestInteraction(this.player,roomInteractions(this.run.room,this.run.floor,this.run.canExit))}
 interact(){if(this.state!=='playing')return;const target=this.interaction();if(!target)return;
  if(target.kind==='record'){this.readRecord();return}
  if(target.kind==='reward'){if(this.run.rewardKind==='heart'&&this.hp>=STATS.hp){this.note('체력이 가득 찼습니다. 회복제는 이 방에 남겨둡니다.');return}const supply=this.run.claimSupply();if(supply){if(supply==='heart')this.hp=Math.min(STATS.hp,this.hp+1);this.checkpoint();this.refreshRoom();this.updateHud();this.audioFX.environment('reward');this.note(supply==='heart'?'체력 1 회복':'열쇠 +1');return}if(!this.run.openReward()){this.note(this.run.keys<1?'열쇠 1개가 필요합니다.':'더 익힐 기술이 없습니다. 열쇠는 사용하지 않습니다.');return}this.checkpoint();this.audioFX.environment('reward');this.showReward();return}
  if(target.kind==='power'){roomEnvironment(this.run.room).powerOff=true;this.audioFX.environment('switch');this.note('시설 전원을 차단했습니다. 이 방의 레이저·가스·전기 장치가 정지합니다.');if(this.run.room.cleared)this.checkpoint();this.updateHud();return}
  this.state='transition';document.getElementById('interact')!.hidden=true;this.controls.reset();this.clearShots();this.audioFX.mode='silent';this.audioFX.environment('lift');this.cameras.main.fadeOut(320,5,10,18);this.time.delayedCall(350,()=>{if(this.state!=='transition')return;if(this.run.ascend()){this.enterRoom();if(this.state==='transition')this.resume();this.cameras.main.fadeIn(450,5,10,18);this.note(`B${this.run.floor} · ${floorTheme(this.run.floor).name}`)}});
 }
 hitScenery(points:{x:number;y:number;width:number}[]){const state=roomEnvironment(this.run.room);for(const prop of breakableProps(this.run.room)){if(state.broken&(1<<prop.id))continue;if(points.some((p,i)=>i>0&&distanceToSegment(prop,points[i-1],p)<=prop.radius+p.width)&&breakProp(state,prop.id)){this.blocks=[...obstacles(this.run.room),...sceneryBlocks(this.run.room)];this.lab.refreshProps();this.burst(prop.x,prop.y,prop.kind==='crate'?0x9faeaf:0xa2ddd1,8);this.audioFX.environment(prop.kind==='crate'?'crate':'glass');if(this.run.room.cleared)this.checkpoint()}}}
 note(text:string){document.getElementById('room-note')!.textContent=text;this.noteTime=4}
 readRecord(){if(this.state!=='playing'||!this.run.room.cleared||!intersects(this.player,{x:230,y:200},80))return;roomEnvironment(this.run.room).recordRead=true;this.checkpoint();this.state='record';this.controls.reset();this.effects.setChannels([]);this.audioFX.mode='silent';this.audioFX.play('read');const recordIndex=(this.run.current+this.run.tuning.level)%LAB_RECORDS.length,record=LAB_RECORDS[recordIndex];if(!rememberRecord(browserStorage,recordIndex))this.note('기록 보관함 저장에 실패했습니다.');this.showModal(record.title,record.text,'기록 닫기')}
 warn(x:number,y:number,r:number){const ring=this.add.circle(x,y,r,0xe4ad7d,.04).setStrokeStyle(2,0xffc294,.65).setDepth(4);this.tweens.add({targets:ring,alpha:.1,duration:650,onComplete:()=>ring.destroy()})}
 addPool(x:number,y:number,r:number){if(this.pools.length>=12)return;const shape=this.add.circle(x,y,r,0x95bd64,.06).setStrokeStyle(1,0xc5d389,.5).setDepth(4);this.pools.push({shape,x,y,r,age:0})}
 addBeam(axis:'x'|'y',position:number){if(this.beams.length>=4)return;const shape=this.add.rectangle(axis==='x'?position:560,axis==='y'?position:363,axis==='x'?26:964,axis==='y'?26:454,0xffcd9b,.1).setStrokeStyle(2,0xffc696,.9).setDepth(7);this.beams.push({shape,axis,position,age:0})}
 updateHazards(dt:number){
  for(const b of this.beams){b.age+=dt;const phase=beamPhase(b.age);b.shape.setFillStyle(phase==='active'?0xffe4fd:0xffb579,phase==='active'?.9:.12).setStrokeStyle(phase==='warning'?2:0,0xffbd86,.85);if(phase==='active'&&this.startDelay<=0&&beamHits(b.axis,b.position,this.player))this.hurt({x:0,y:0});if(this.state!=='playing')return}
  this.beams=this.beams.filter(b=>{if(beamPhase(b.age)==='expired'){b.shape.destroy();return false}return true});
  this.hazardSlow=Math.max(0,this.hazardSlow-dt);this.toxic=Math.max(0,this.toxic-dt);this.toxicTick-=dt;if(this.toxic>0&&this.toxicTick<=0){this.toxicTick=1.3;this.hurt({x:0,y:0});if(this.state!=='playing')return}
  for(const p of this.pools){p.age+=dt;p.shape.setAlpha(p.age<.8?.2:.6);if(p.age>=.8&&p.age<3.8&&intersects(this.player,p,p.r)){if(this.toxic<=0)this.toxicTick=.65;this.toxic=2}if(this.state!=='playing')return}
  this.pools=this.pools.filter(p=>{if(p.age>=3.8){p.shape.destroy();return false}return true});
  for(const hazard of this.env){const phase=this.run.room.cleared||roomEnvironment(this.run.room).powerOff?'idle':hazardPhase(this.roomClock+hazard.offset,this.run.tuning.hazardPeriod);hazard.shape.setAlpha(phase==='active'?.65:phase==='warning'?.25:.035);
   hazard.shape.setStrokeStyle(phase==='warning'?2:0,0xffcf9d,.8);
   const hit=hazard.kind==='laser'?Math.abs(this.player.y-hazard.y)<13&&Math.abs(this.player.x-560)<415:intersects(this.player,hazard,hazard.r);
   if(phase==='active'&&this.startDelay<=0&&hit){if(hazard.kind==='gas'){if(this.toxic<=0)this.toxicTick=.65;this.toxic=2}else{if(hazard.kind==='electric')this.hazardSlow=.6;this.hurt({x:0,y:this.player.y>hazard.y?1:-1})}}if(this.state!=='playing')return;
  }
 }
 clearActors(){
  this.effects?.clear();this.beams.forEach(b=>b.shape.destroy());this.beams=[];
  this.enemies.forEach(e=>{e.sprite.destroy();e.shadow.destroy();e.bar.destroy()});this.enemies=[];
  this.clearShots();this.pools.forEach(p=>p.shape.destroy());this.pools=[];
 }
 clearShots(){this.weaponTimers.clear();this.weaponBursts.clear();this.effects?.setChannels([]);this.shots.forEach(s=>{s.sprite.destroy();s.glow.destroy()});this.shots=[]}
 enterRoom(from?:Direction,preserveInput=false){
  this.entry=from??null;
  this.clearActors();if(!preserveInput)this.controls.reset();this.inv=1.2;this.fire=0;this.startDelay=1.2;this.transitionDelay=.65;
  const spawn:Record<Direction,Vec>={up:{x:560,y:R.top+48},down:{x:560,y:R.bottom-48},left:{x:R.left+48,y:364},right:{x:R.right-48,y:364}};
  const pos=from?spawn[from]:{x:560,y:365};this.player.setPosition(pos.x,pos.y).setAlpha(1);this.shadow.setPosition(pos.x,pos.y+25);
  this.roomClock=0;this.toxic=0;this.toxicTick=0;this.hazardSlow=0;this.decorateRoom();
  const layout=roomEnemies(this.run.room,this.run.floor);
  layout.forEach((spawn,i)=>{const size=speciesSize(spawn.kind),maxHp=spawn.kind==='mewtwo'?FINAL_HP[this.finalPhase-1]:spawn.kind==='gengar'?this.run.tuning.bossHp:ENEMIES[spawn.kind].hp*this.run.tuning.hp;
   this.enemies.push({id:i,kind:spawn.kind,hp:maxHp,maxHp,radius:size.radius,sprite:this.add.image(spawn.x,spawn.y,spawn.kind,'body').setDisplaySize(size.width,size.height).setDepth(spawn.kind==='mewtwo'?16:9),shadow:this.add.ellipse(spawn.x,spawn.y+size.height*.4,size.width*.6,12,0x000000,.3).setDepth(8),bar:this.add.rectangle(spawn.x,spawn.y-size.height*.6,30,3,0xca8eb3).setDepth(12),cooldown:.5+i*.15,charge:0,dir:{x:0,y:0},flash:0,burn:0,slow:0,statusTime:0,poison:0,phase:spawn.kind==='mewtwo'?this.finalPhase:1,cycle:0});
  });
  this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';

  this.refreshRoom();this.updateHud();this.checkpoint();if(this.run.floor===1){if(this.run.room.cleared)this.playEnding();else this.finalDialogue();return}if(this.run.rewardPending)this.note('중앙 보상에 다가가 E 또는 상호작용 버튼으로 확인하세요.');
 }
 refreshRoom(){
  this.lab.setDoors(this.run.rooms,this.run.moves);(this.children.getByName('room-label') as Phaser.GameObjects.Text).setText(`B${this.run.floor} / ${String(this.run.current+1).padStart(2,'0')}`);
  this.terminal.setText(this.run.floor===1?'':this.run.room.kind==='boss'?(this.run.room.cleared?'':'격리 실패 / 팬텀'):this.run.room.kind==='start'?'깨진 격리 장치. 위층에서 소리가 들린다.':'');

 }
 restart(){
  this.stopStory();this.finalPhase=1;this.clearActors();this.run=new Run(nextSeed());this.hp=STATS.hp;this.drain=0;this.inv=0;this.fire=0;this.kills=0;this.elapsed=0;
  this.player.clearTint().setAlpha(1);this.resume();this.enterRoom();
 }
 resume(){this.controls.reset();this.state='playing';document.getElementById('modal')!.hidden=true;this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';document.getElementById('pause')!.textContent='Ⅱ'}
 togglePause(){if(this.state==='playing'){this.state='paused';this.effects.setChannels([]);this.audioFX.mode='silent';this.controls.reset();this.showModal('잠시 숨 고르기',this.saveStatus||'체크포인트 저장됨 · 전투 중 종료하면 마지막 방 진입 또는 보스 단계 시작부터 이어집니다.','탈출 계속하기',true);this.showRunSummary();document.getElementById('pause')!.textContent='▶'}else if(this.state==='paused')this.resume()}
 showModal(title:string,copy:string,button:string,secondary=false){
  document.getElementById('interact')!.hidden=true;document.querySelector('.panel footer')!.textContent=`B${this.run.floor} · ${floorTheme(this.run.floor).name} · 지상을 향해`;document.getElementById('modal')!.hidden=false;document.querySelector('.panel')!.classList.remove('reward-panel','reward-single');document.getElementById('modal-title')!.textContent=title;document.getElementById('modal-copy')!.textContent=copy;document.getElementById('primary')!.hidden=false;document.getElementById('primary')!.textContent=button;document.getElementById('secondary')!.hidden=!secondary;document.getElementById('secondary')!.textContent='새로운 탈출 시작';document.getElementById('secondary')!.onclick=()=>{const b=document.getElementById('secondary')!;b.textContent='현재 진행을 지우고 시작';b.onclick=()=>this.restart()};document.getElementById('instructions')!.style.display='none';document.getElementById('rewards')!.replaceChildren();document.getElementById('run-summary')!.replaceChildren();document.getElementById('primary')!.focus();
 }
 showRunSummary(){
  const host=document.getElementById('run-summary')!,a=this.run.attack;
  const title=document.createElement('h2');title.textContent=attackLabel(a);host.append(title);
  for(const text of [objective(this.run),`체력 ${this.hp}/6 · 열쇠 ${this.run.keys} · ${formatDuration(this.elapsed)}`,attackTraits(a).join(' · ')]){const line=document.createElement('p');line.textContent=text;host.append(line)}
  const list=document.createElement('div');list.className='inventory';
  for(const id of new Set(this.run.moves)){const move=MOVES.find(m=>m.id===id)!;const item=document.createElement('span');item.textContent=`${move.name} ×${this.run.moves.filter(m=>m===id).length}`;item.title=move.description;list.append(item)}
  if(!this.run.moves.length)list.textContent='아직 익힌 기술이 없습니다. 염동력으로 길을 여세요.';
  if(new Set(this.run.moves).size>6){const details=document.createElement('details');details.className='inventory-details';const summary=document.createElement('summary');summary.textContent=`습득 기술 ${new Set(this.run.moves).size}종 · 목록 보기`;details.append(summary,list);host.append(details)}else host.append(list);const hint=document.createElement('small');hint.textContent='WASD 이동 · 방향키 공격 · E 상호작용 / 터치: 왼쪽 이동 · 오른쪽 조준';host.append(hint);
 }
 showReward(){
  this.state='reward';this.updateHud();this.controls.reset();this.clearShots();this.showModal(this.run.rewardKind==='boss'?'보스 보상':'봉인된 기술',this.run.rewardKind==='boss'?'강화 하나를 선택하거나 포기하세요. 열쇠 1개를 받습니다.':'하나를 습득하거나 포기하세요. 기술 습득으로 체력은 회복되지 않습니다.','');document.getElementById('primary')!.hidden=true;document.querySelector('.panel')!.classList.add('reward-panel');
  const container=document.getElementById('rewards')!;container.style.gridTemplateColumns=`repeat(${Math.max(1,this.run.choices.length)},minmax(0,1fr))`;document.querySelector('.panel')!.classList.toggle('reward-single',this.run.choices.length<=1);if(!this.run.choices.length)document.getElementById('modal-copy')!.textContent='제시된 기술은 이미 충분히 익혔습니다. 보상을 정리하고 진행하세요.';
  for(const move of this.run.choices){const button=document.createElement('button');button.className='reward-card';button.style.setProperty('--technique-color','#'+move.color.toString(16));const preview=composeAttack([...this.run.moves,move.id]),comparison=rewardComparison(this.run.moves,move.id);button.innerHTML=`<small>${rewardTier(move.id)} · ${move.type} / ${move.form}</small><strong>${move.name} <small>${comparison.rank}단계</small></strong><span>${move.description}</span><em>${move.synergy}</em><span class="reward-form">습득 후 · ${comparison.name}<br>주 기술: ${comparison.carrier}</span><span class="reward-delta ${comparison.delta<0?'tradeoff':''}">${comparison.caption}</span><small class="damage-caption">전 갈래 적중 기준 · 지속/연쇄 피해 제외</small>`;button.prepend(techniquePreview(preview.visual));button.onclick=()=>{if(this.state!=='reward'||!this.run.choose(move.id))return;this.checkpoint();this.resume();this.audioFX.reward(move.id,this.run.attack);this.effects.upgrade(this.player.x,this.player.y,this.run.attack,move.id);this.note(`${move.name} · ${this.run.moves.filter(id=>id===move.id).length}단계`);this.refreshRoom();this.updateHud()};container.append(button)}
  const skip=document.createElement('button');skip.className='reward-skip';skip.textContent=this.run.rewardKind==='boss'?'강화 포기 · 열쇠만 받기':'현재 조합 유지 · 습득 포기 (열쇠 반환 없음)';skip.onclick=()=>{if(this.state!=='reward'||!this.run.skipReward())return;this.checkpoint();this.resume();this.refreshRoom();this.updateHud();this.note('기술을 추가하지 않고 현재 조합을 유지합니다.')};container.append(skip);(container.querySelector('button') as HTMLButtonElement|null)?.focus();
 }
 tryTravel(move:Vec){
  if(!this.run.room.cleared||this.transitionDelay>0)return false;
  const p=this.player;let dir:Direction|undefined;
  if(Math.abs(p.x-560)<48){if(p.y<=R.top+26&&move.y<0)dir='up';if(p.y>=R.bottom-26&&move.y>0)dir='down'}
  if(Math.abs(p.y-364)<48){if(p.x<=R.left+22&&move.x<0)dir='left';if(p.x>=R.right-22&&move.x>0)dir='right'}
  if(dir&&this.run.travel(dir)){this.enterRoom(OPPOSITE[dir],true);return true}return false;
 }
 update(_time:number,delta:number){
  if(this.state!=='playing')return;
  const dt=Math.min(delta/1000,.033);this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.fire-=dt;this.startDelay-=dt;this.transitionDelay-=dt;this.roomClock+=dt;this.noteTime-=dt;if(this.noteTime<=0)document.getElementById('room-note')!.textContent='';
  const move=this.controls.movement(),position=moveWithWalls(this.player,{x:move.x*STATS.speed*dt*(this.hazardSlow>0?.6:1),y:move.y*STATS.speed*dt*(this.hazardSlow>0?.6:1)},this.blocks,speciesSize('mew').radius);this.player.x=Phaser.Math.Clamp(position.x,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(position.y,R.top+22,R.bottom-22);if(move.x)this.player.setFlipX(move.x>0);
  this.player.setAlpha(this.inv>0?(Math.floor(this.inv*16)%2?.4:1):1);this.player.setAngle(move.x*5);this.shadow.setPosition(this.player.x,this.player.y+25);
  if(this.tryTravel(move))return;
  if(this.run.rewardPending&&['heart','key'].includes(this.run.rewardKind)&&Math.hypot(this.player.x-560,this.player.y-365)<28&&(this.run.rewardKind!=='heart'||this.hp<STATS.hp))this.interact();

  this.updateHazards(dt);if(this.state!=='playing')return;
  this.fireWeapon(dt);
  this.updateEnemies(dt);if(this.state!=='playing')return;
  this.updateShots(dt);if(this.state!=='playing')return;
  this.effects.render(dt,this.shots,this.enemies);this.lab.update(dt,this.interaction(),this.run.rewardPending,this.run.room.cleared);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  if((this.run.room.kind==='combat'||this.run.room.kind==='boss')&&!this.run.room.cleared&&this.enemies.length===0){if(this.run.floor===1){const next=nextFinalPhase(this.finalPhase);if(next==='ending'){this.run.clear();this.checkpoint();this.playEnding()}else{this.finalPhase=next;this.enterRoom('down')}return}this.run.clear();this.checkpoint();this.clearShots();this.pools.forEach(p=>p.shape.destroy());this.pools=[];this.audioFX.play('clear');this.audioFX.mode='ambient';this.refreshRoom();this.updateHud();this.audioFX.environment('door');if(this.run.room.kind==='combat')this.note(this.run.rewardPending?'문이 열렸습니다. 중앙에 보급품이 남아 있습니다.':'문이 열렸습니다. 이 방에는 보급품이 없습니다.');else this.note('팬텀이 물러났다. 중앙 보상을 확인하면 승강기를 이용할 수 있습니다.');return}
  this.hudTime-=dt;if(this.hudTime<=0){this.updateHud();this.hudTime=.15}
 }
 updateEnemies(dt:number){
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   if(e.statusTime>0){e.statusTime-=dt;if(e.burn+e.poison>0)this.hitEnemy(e,(e.burn+e.poison)*dt);if(e.hp<=0)continue}else{e.burn=0;e.slow=0;e.poison=0}
   e.flash-=dt;
   if(this.startDelay<=0){const brain={x:e.sprite.x,y:e.sprite.y,hp:e.hp/e.maxHp*ENEMIES[e.kind].hp,cooldown:e.cooldown,charge:e.charge,dir:e.dir,phase:e.phase,cycle:e.cycle};const intent=e.kind==='mewtwo'?stepMewtwo(brain,this.player,this.finalPhase,dt):stepBrain(e.kind,brain,this.player,dt);e.cycle=brain.cycle;e.cooldown=brain.cooldown;e.charge=brain.charge;e.dir=brain.dir;e.phase=brain.phase;
    const v={x:intent.v.x*(1-e.slow*(e.kind==='mewtwo'?.35:1))*dt*(e.kind==='mewtwo'?1:this.run.tuning.speed),y:intent.v.y*(1-e.slow*(e.kind==='mewtwo'?.35:1))*dt*(e.kind==='mewtwo'?1:this.run.tuning.speed)};const p=ENEMIES[e.kind].flying?{x:e.sprite.x+v.x,y:e.sprite.y+v.y}:moveWithWalls(e.sprite,v,this.blocks,e.radius);
    e.sprite.setPosition(Phaser.Math.Clamp(p.x,R.left+e.radius,R.right-e.radius),Phaser.Math.Clamp(p.y,R.top+e.radius,R.bottom-e.radius));
    for(const action of intent.actions){if(action.type==='shot')this.shoot(e.sprite.x,e.sprite.y,action.dir,true,undefined,false,undefined,action.homing??0,action.speed);else if(action.type==='beam')this.addBeam(action.axis,action.position);else if(action.type==='pool')this.addPool(action.x,action.y,action.r);else if(action.type==='blink'){this.burst(e.sprite.x,e.sprite.y,0xac8be8,8);e.sprite.setPosition(action.x,action.y);this.burst(action.x,action.y,0xac8be8,8)}else this.warn(action.x,action.y,action.r)}
   }
   e.sprite.setFlipX(this.player.x>e.sprite.x).setAngle(Math.sin(this.elapsed*7+e.id)*4);e.sprite.setTint(e.flash>0?0xffffff:e.charge>.48?0xff8b92:e.slow>0?0x91e6fa:e.poison>0?0xbb8fe8:e.burn>0?0xffaf71:0xffffff);e.sprite.setAlpha(e.flash>0?.65:1);e.shadow.setPosition(e.sprite.x,e.sprite.y+speciesSize(e.kind).height*.4);e.bar.setPosition(e.sprite.x,e.sprite.y-speciesSize(e.kind).height*.6).setDisplaySize(30*e.hp/e.maxHp,3);
   if(this.startDelay<=0&&intersects(this.player,e.sprite,e.radius+speciesSize('mew').radius-4))this.hurt(normalize(this.player.x-e.sprite.x,this.player.y-e.sprite.y));if(this.state!=='playing')return;
  }
 }
 updateShots(dt:number){
  // Snapshot keeps child projectiles from being simulated recursively in their birth frame.
  for(const s of [...this.shots]){
   if(s.life<=0)continue;
   if(s.hostile&&s.tracking>0){const desired=normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y),mix=Math.min(1,s.tracking*dt),v=normalize(s.v.x/s.speed*(1-mix)+desired.x*mix,s.v.y/s.speed*(1-mix)+desired.y*mix);s.v={x:v.x*s.speed,y:v.y*s.speed}}
   if(!s.hostile&&s.attack.homing>0){const target=this.enemies.filter(e=>e.hp>0&&!s.hit.has(e.id)).sort((a,b)=>Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,b.sprite.x,b.sprite.y))[0];if(target){const desired=normalize(target.sprite.x-s.sprite.x,target.sprite.y-s.sprite.y),mix=Math.min(1,s.attack.homing*dt),v=normalize(s.v.x/s.attack.speed*(1-mix)+desired.x*mix,s.v.y/s.attack.speed*(1-mix)+desired.y*mix);s.v={x:v.x*s.attack.speed,y:v.y*s.attack.speed}}}
   s.life-=dt;s.sprite.x+=s.v.x*dt;s.sprite.y+=s.v.y*dt;s.glow.setPosition(s.sprite.x,s.sprite.y);if(!s.hostile)this.hitScenery([{x:s.sprite.x-s.v.x*dt,y:s.sprite.y-s.v.y*dt,width:s.attack.size},{x:s.sprite.x,y:s.sprite.y,width:s.attack.size}]);if(s.sprite.x<R.left||s.sprite.x>R.right||s.sprite.y<R.top||s.sprite.y>R.bottom){if(!s.hostile&&s.bounces>0){s.bounces--;this.audioFX.proc('bounce');this.effects.impact(s.sprite.x,s.sprite.y,s.attack);if(s.sprite.x<R.left||s.sprite.x>R.right)s.v.x*=-1;if(s.sprite.y<R.top||s.sprite.y>R.bottom)s.v.y*=-1;s.sprite.setPosition(Phaser.Math.Clamp(s.sprite.x,R.left,R.right),Phaser.Math.Clamp(s.sprite.y,R.top,R.bottom))}else s.life=0}if(this.blocks.some(b=>overlapsBlock(s.sprite,s.hostile?7:s.attack.size,b)))s.life=0;if(s.life<=0)continue;
   if(s.hostile){if(intersects(s.sprite,this.player,20)){s.life=0;this.hurt(normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y));if(this.state!=='playing')return}}
   else for(const e of this.enemies){
    if(e.hp<=0||s.hit.has(e.id)||!intersects(s.sprite,e.sprite,e.radius+s.attack.size))continue;
    s.hit.add(e.id);this.applyWeaponHit(e,s.attack,s.sprite,s.v,s.critical,s.procAvailable,!s.child);s.child=true;
    s.procAvailable=false;if(s.remaining--<=0){s.life=0;break}s.attack={...s.attack,damage:s.attack.damage*PIERCE_RETAIN};
   }
  }
  this.shots=this.shots.filter(s=>{if(s.life<=0){s.sprite.destroy();s.glow.destroy();return false}return true});
 }
 applyWeaponHit(e:Enemy,attack:Attack,origin:Vec,dir:Vec,critical:boolean,proc:boolean,split:boolean){
    const point={x:e.sprite.x,y:e.sprite.y};e.burn=Math.max(e.burn,attack.burn);e.slow=Math.max(e.slow,attack.slow);e.poison=Math.max(e.poison,attack.poison);e.statusTime=2;
    const dealt=Math.min(e.hp,attack.damage);if(attack.lifesteal)this.effects.siphon(point,this.player);this.drain+=dealt*attack.lifesteal;if(this.drain>=1){const heal=Math.floor(this.drain);this.hp=Math.min(STATS.hp,this.hp+heal);this.drain-=heal;this.audioFX.proc('heal')}
    this.effects.impact(point.x,point.y,attack,critical);this.hitEnemy(e,attack.damage);
    if(e.hp>0&&attack.knockback){const v=normalize(dir.x,dir.y),power=attack.knockback*(e.kind==='gengar'||e.kind==='mewtwo'?.25:1),p=moveWithWalls(e.sprite,{x:v.x*power,y:v.y*power},ENEMIES[e.kind].flying?[]:this.blocks,e.radius);e.sprite.setPosition(Phaser.Math.Clamp(p.x,R.left+e.radius,R.right-e.radius),Phaser.Math.Clamp(p.y,R.top+e.radius,R.bottom-e.radius))}
    if(proc&&attack.blast){this.burst(point.x,point.y,0xb991cf,10);const ring=this.add.circle(point.x,point.y,attack.blast,0xb991cf,.06).setStrokeStyle(2,0xb991cf,.45);this.tweens.add({targets:ring,alpha:0,duration:220,onComplete:()=>ring.destroy()});for(const other of this.enemies)if(other.id!==e.id&&other.hp>0&&intersects(point,other.sprite,attack.blast))this.hitEnemy(other,attack.damage*BLAST_DAMAGE)}this.audioFX.hit(attack);
    const chained=this.enemies.filter(other=>other.hp>0&&other.id!==e.id&&intersects(point,other.sprite,175)).sort((a,b)=>Phaser.Math.Distance.Between(point.x,point.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(point.x,point.y,b.sprite.x,b.sprite.y)).slice(0,proc?attack.chain:0);
    if(chained.length)this.audioFX.proc('chain');for(const other of chained){this.effects.bolt(point,other.sprite);this.hitEnemy(other,attack.damage*CHAIN_DAMAGE)}
    if(split&&attack.split){this.audioFX.proc('split');const angle=Math.atan2(dir.y,dir.x);for(const offset of [-.7,.7]){const dir={x:Math.cos(angle+offset),y:Math.sin(angle+offset)};this.shoot(origin.x,origin.y,dir,false,splitAttack(attack),true,e.id)}}

 }
 fireWeapon(dt:number){
  const aim=this.controls.attack();if(!aim.x&&!aim.y){this.weaponBursts.clear();this.effects.setChannels([]);for(const [key,value] of this.weaponTimers)this.weaponTimers.set(key,Math.max(0,value-dt));return}
  if(this.startDelay>0){this.startDelay=0;this.inv=0}
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
      for(let n=0;n<path.hits.length;n++){const e=this.enemies.find(e=>e.id===path.hits[n]);if(e&&e.hp>0)this.applyWeaponHit(e,hitAttack,e.sprite,dir,critical,n===0,n===0);hitAttack={...hitAttack,damage:hitAttack.damage*PIERCE_RETAIN}}
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

 shoot(x:number,y:number,dir:Vec,hostile:boolean,attack=this.run.attack,child=false,ignore?:number,tracking=0,shotSpeed?:number){
  if(!canSpawnProjectile(this.shots,hostile))return;
  const critical=!hostile&&!child&&Math.random()<attack.crit;
  if(critical)attack={...attack,damage:attack.damage*CRITICAL_MULTIPLIER,size:Math.min(13,attack.size+1)};
  const color=hostile?0xff9c64:attack.color,r=hostile?7:attack.size,speed=hostile?(shotSpeed??220*this.run.tuning.shotSpeed):attack.speed;
  this.shots.push({sprite:this.add.circle(x,y,r,color).setStrokeStyle(2,hostile?0xffe0b6:0xffeaff).setDepth(hostile?20:13).setVisible(hostile),glow:this.add.circle(x,y,r*2.5,color,.09).setDepth(hostile?19:12).setVisible(hostile),v:{x:dir.x*speed,y:dir.y*speed},life:hostile?5:attack.range/speed,hostile,attack,hit:new Set(ignore===undefined?[]:[ignore]),remaining:attack.pierce,child,bounces:attack.bounce,trail:[],critical,procAvailable:!child,tracking,speed});
 }
 hitEnemy(e:Enemy,amount:number){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);e.flash=.1;if(e.hp===0){if(e.kind!=='mewtwo'||this.finalPhase===3)this.kills++;this.burst(e.sprite.x,e.sprite.y,0xc29fed,10);e.sprite.destroy();e.bar.destroy();e.shadow.destroy()}}
 hurt(dir:Vec){const result=damage(this.hp,this.inv);if(!result.hit)return;this.hp=result.hp;this.inv=result.invulnerable;const pushed=knockbackPosition(this.player,dir,this.blocks,speciesSize('mew').radius);this.player.setPosition(pushed.x,pushed.y);this.cameras.main.shake(100,.004);this.audioFX.play('hurt');this.burst(this.player.x,this.player.y,0xf9a1b7,8);this.updateHud();if(this.hp<=0)this.finish(false)}
 burst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,3,3,color).setDepth(15),angle=Math.random()*Math.PI*2;this.tweens.add({targets:p,x:x+Math.cos(angle)*35,y:y+Math.sin(angle)*35,alpha:0,duration:280,onComplete:()=>p.destroy()})}}
 checkpoint(){
  const save:Checkpoint={version:1,keys:this.run.keys,seed:this.run.seed,floor:this.run.floor,current:this.run.current,moves:[...this.run.moves],rooms:this.run.rooms.map(({visited,cleared,rewardTaken,environment,offer,opened})=>({visited,cleared,rewardTaken,offer,opened,environment:environment?{...environment}:undefined})),hp:this.hp,kills:this.kills,elapsed:this.elapsed,drain:this.drain,entry:this.entry,phase:this.finalPhase,ending:this.run.floor===1&&this.run.room.cleared,savedAt:Date.now()};
  this.saveStatus=writeCheckpoint(browserStorage,save)?'':'자동 저장 실패 · 브라우저 저장 공간/권한을 확인해 주세요.';if(this.saveStatus)this.note(this.saveStatus);
 }
 continueRun(){const result=readCheckpoint(browserStorage);if(!result.save){this.restart();this.note(result.status||'저장이 없어 새 게임을 시작합니다.');return}const s=result.save;this.run=restoreRun(s);this.hp=s.hp;this.kills=s.kills;this.elapsed=s.elapsed;this.drain=s.drain;this.finalPhase=s.phase;this.resume();this.enterRoom(s.entry??undefined);if(this.run.floor!==1)this.note('체크포인트에서 이어합니다.');}
 finalDialogue(){
  this.state='story';this.controls.reset();this.audioFX.mode='silent';this.clearShots();const script=MEWTWO_SCRIPT[this.finalPhase-1];
  const shots=this.finalPhase===1?[{id:'reunion',tag:'B1 · 지상 출입 구역',title:'문 앞에서 기다리던 존재',text:'문틈으로 햇빛이 비쳤다. 뮤는 반가운 듯 고개를 들고 그쪽으로 날아갔다. 문 앞의 뮤츠가 천천히 손을 펼쳤다. 출구가, 다시 어두워졌다.'}]:[];
  shots.push({id:this.finalPhase===1?'awakening':this.finalPhase===2?'jealousy':'abandonment',tag:`MEWTWO / ${this.finalPhase}단계 · ${script.emotion}`,title:script.emotion,text:script.line+'<br><small>'+script.direction+'</small>'});
  this.stopStory=showStory(shots,()=>{this.resume();this.inv=1.2;this.startDelay=1.2;this.audioFX.play('alarm')});
 }
 playEnding(){this.audioFX.setScene(6,1);this.state='story';this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='ambient';this.stopStory=showStory(ENDING,()=>this.finish(true),'탈출 기록 보기');}
 finish(won:boolean){if(this.state==='won'||this.state==='lost')return;const archived=finishProfile(browserStorage,won,this.run.floor,this.kills,this.elapsed);if(!archived)this.note('탈출 통계 저장에 실패했습니다.');this.audioFX.setScene(6,1);this.state=won?'won':'lost';this.audioFX.mode='ambient';this.controls.reset();this.clearShots();const removed=removeCheckpoint(browserStorage);if(won)this.audioFX.play('win');const learned=this.run.moves.length;this.updateHud();this.showModal(won?'탈출 성공 · 새로운 아침':'아직, 하늘에 닿지 못했다',`B${this.run.floor} · ${this.kills}마리 제압 · 기술 ${learned}회 습득 · ${formatDuration(this.elapsed)}. ${won?'뮤는 빛 앞에서 기다렸다. 이번 탈출은 여기서 끝났지만, 두 포켓몬의 이야기는 이제 시작이다.':'이번 판은 끝났습니다. 새로운 탈출을 시작할 수 있습니다.'}${removed?'':' 저장소에 접근할 수 없어 이전 기록을 지우지 못했습니다.'}`,'다시 탈출하기');}
 updateHud(){
  document.getElementById('hearts')!.innerHTML='♥'.repeat(this.hp)+`<span class="empty">${'♥'.repeat(STATS.hp-this.hp)}</span>`;document.getElementById('hearts')!.setAttribute('aria-label',`체력 ${this.hp} / ${STATS.hp}`);
  const cleared=this.run.rooms.filter(r=>r.kind==='combat'&&r.cleared).length;
  document.getElementById('counter')!.textContent=`B${this.run.floor} · ${this.run.floor===1?'뮤츠 '+this.finalPhase+'/3단계':'전투방 '+cleared+'/'+this.run.tuning.combatCount} · ${this.kills} 처치 · ${Math.floor(this.elapsed)}s`;
  document.getElementById('objective')!.textContent=objective(this.run,this.state==='playing'&&this.startDelay>0);document.getElementById('supplies')!.textContent=`열쇠 ${this.run.keys}`;
  document.getElementById('status')!.textContent=`B${this.run.floor} ${this.run.floor===1?'마지막 문':ROOM_NAME[this.run.room.kind]} ${String(this.run.current+1).padStart(2,'0')} · ${this.run.room.cleared?'문 개방':'전투 중'}${this.toxic>0?' · 중독':this.hazardSlow>0?' · 감전':''}`;
  document.getElementById('seed')!.textContent=`SEED ${this.run.seed.toString(16).toUpperCase()}`;
  const boss=this.enemies.find(e=>(e.kind==='gengar'||e.kind==='mewtwo')&&e.hp>0);document.getElementById('boss-hud')!.hidden=!boss;if(boss){document.getElementById('boss-name')!.textContent=boss.kind==='mewtwo'?`뮤츠 · ${MEWTWO_SCRIPT[this.finalPhase-1].emotion} / ${this.finalPhase}단계`:`팬텀 · 부서진 경비 / ${boss.phase}단계`;document.getElementById('boss-fill')!.style.width=`${boss.hp/boss.maxHp*100}%`}
  document.querySelector('.map>span')!.textContent=`B${this.run.floor} / ${['원본 격리','표본 보관','독성 처리','공명 실험','중앙 통제','지상 출입'][this.run.tuning.level]} 구역`;
  const target=this.interaction(),button=document.getElementById('interact')!;button.hidden=!target||this.state!=='playing';if(target)button.textContent=`${document.body.classList.contains('touch-ui')||matchMedia('(pointer:coarse)').matches?'':'E · '}${target.label}`;
  const attack=this.run.attack,form=FORMS[attack.visual.form];document.getElementById('build-info')!.textContent=`${attackLabel(attack)} · ${attack.count}갈래`;document.getElementById('build-info')!.title=`공격 ${attack.damage.toFixed(1)} · 발사 간격 ${attack.interval.toFixed(2)}초 · ${this.run.moves.length} 강화`;const icon=document.querySelector('.move-icon') as HTMLElement;icon.textContent=glyph(attack.visual.form);icon.style.color='#'+form.color.toString(16);document.querySelector('.loadout small')!.textContent=`주 기술 / ${MOVES.find(m=>m.id===attack.visual.form)?.type??'에스퍼'} · 효과 누적`;document.getElementById('sound')!.title=this.audioFX.snapshot.title;
  const counts=new Map<string,number>();for(const id of this.run.moves)counts.set(id,(counts.get(id)??0)+1);
  document.getElementById('build-list')!.textContent=counts.size?[...counts].map(([id,n])=>`${MOVES.find(m=>m.id===id)!.name}${n>1?' ×'+n:''}`).join(' · '):'염동력 · 기술을 모아 효과를 조합하세요';
  const map=document.getElementById('minimap')!,rooms=this.run.rooms,minX=Math.min(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y));
  map.replaceChildren();for(const room of rooms){const known=roomKnown(room,this.run.moves);if(!known)continue;const cell=document.createElement('span');cell.className='map-cell'+(room.id===this.run.current?' current':'')+(room.visited&&room.cleared?' cleared':'');cell.style.left=`${(room.x-minX)*19}px`;cell.style.top=`${(room.y-minY)*19}px`;cell.textContent=room.visited&&room.kind==='combat'&&room.cleared&&!room.rewardTaken&&roomReward(room,this.run.floor)!=='none'?'✧':mapSymbol(room,this.run.moves);cell.title=roomKnown(room,this.run.moves)?ROOM_NAME[room.kind]:'미탐험';map.append(cell)}
 }
}
