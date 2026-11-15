import {FORMS,glyph} from './techniques';
import {techniquePreview} from './technique-preview';
import Phaser from 'phaser';
import {CombatEffects} from './effects';
import {ROOM as R,STATS,ENEMIES,type Kind} from './data';
import {damage,intersects,normalize,canSpawnProjectile,type Vec} from './combat';
import {Controls} from './input';
import {AudioFX} from './audio';
import {Run} from './run';
import {FINAL_HP,stepMewtwo,nextFinalPhase,beamPhase,beamHits,type FinalPhase} from './finale';
import {browserStorage,readCheckpoint,writeCheckpoint,removeCheckpoint,restoreRun,type Checkpoint} from './save';
import {showStory} from './story-player';
import {DIRECTIONS,OPPOSITE,enemyLayout,type Direction} from './dungeon';
import {MOVES,composeAttack,splitAttack,CHAIN_DAMAGE,BLAST_DAMAGE,PIERCE_RETAIN,CRITICAL_MULTIPLIER,type Attack} from './moves';
import {setupShell} from './shell';
import {LAB_RECORDS,MEWTWO_SCRIPT,ENDING} from './story';
import {obstacles,debris,moveWithWalls,overlapsBlock,type Block} from './lab';
import {stepBrain} from './ai';
import {SPECIES,speciesSize,hazardPhase} from './scaling';

type Enemy={id:number;sprite:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;bar:Phaser.GameObjects.Rectangle;kind:Kind;hp:number;cooldown:number;charge:number;dir:Vec;flash:number;burn:number;slow:number;statusTime:number;poison:number;phase:number;maxHp:number;radius:number;cycle:number};
type Shot={sprite:Phaser.GameObjects.Arc;glow:Phaser.GameObjects.Arc;v:Vec;life:number;hostile:boolean;attack:Attack;hit:Set<number>;remaining:number;child:boolean;bounces:number;trail:Vec[];critical:boolean;procAvailable:boolean;tracking:number;speed:number};
type State='ready'|'playing'|'paused'|'reward'|'record'|'won'|'lost'|'story';
const DOOR_POS:Record<Direction,Vec>={up:{x:560,y:112},right:{x:1055,y:364},down:{x:560,y:614},left:{x:65,y:364}};
function nextSeed(){const raw=new URLSearchParams(location.search).get('seed');const value=Number(raw);return raw!==null&&/^\d+$/.test(raw)&&Number.isSafeInteger(value)&&value>=0&&value<=0xffffffff?value:crypto.getRandomValues(new Uint32Array(1))[0]}
const ROOM_NAME={start:'격리실',combat:'실험실',reward:'기술 보관실',boss:'승강기 제어실'};
export class LabScene extends Phaser.Scene{
 effects!:CombatEffects;controls=new Controls();audioFX=new AudioFX();player!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;
 doors:Partial<Record<Direction,{shape:Phaser.GameObjects.Rectangle;label:Phaser.GameObjects.Text}>>={};terminal!:Phaser.GameObjects.Text;
 enemies:Enemy[]=[];shots:Shot[]=[];hp=STATS.hp;inv=0;fire=0;elapsed=0;state:State='ready';kills=0;startDelay=1.2;hudTime=0;transitionDelay=0;
 run=new Run(nextSeed());finalPhase:FinalPhase=1;entry:Direction|null=null;stopStory=()=>{};saveStatus='';
 beams:{shape:Phaser.GameObjects.Rectangle;axis:'x'|'y';position:number;age:number}[]=[];
 menu=()=>{};roomDecor!:Phaser.GameObjects.Container;blocks:Block[]=[];roomClock=0;drain=0;noteTime=0;toxic=0;toxicTick=0;hazardSlow=0;
 pools:{shape:Phaser.GameObjects.Arc;x:number;y:number;r:number;age:number}[]=[];
 env:{shape:Phaser.GameObjects.Rectangle|Phaser.GameObjects.Arc;kind:'laser'|'gas'|'electric';x:number;y:number;r:number;offset:number}[]=[];
 preload(){Object.keys(SPECIES).forEach(key=>this.load.image(key,`./assets/${key}.png`));this.load.image('tiles','./assets/lab-tiles.png');this.load.on('loaderror',()=>{document.getElementById('modal-copy')!.textContent='리소스를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'})}
 create(){
  for(const [key,data] of Object.entries(SPECIES)){const [x,y,right,bottom]=data.bounds;this.textures.get(key).add('body',0,x,y,right-x,bottom-y)}
  this.buildRoom();this.effects=new CombatEffects(this);this.roomDecor=this.add.container(0,0).setDepth(3);
  for(const dir of DIRECTIONS){const p=DOOR_POS[dir],vertical=dir==='left'||dir==='right';this.doors[dir]={shape:this.add.rectangle(p.x,p.y,vertical?30:108,vertical?100:42,0x397a70).setDepth(5),label:this.add.text(p.x,p.y,'',{fontFamily:'monospace',fontSize:'10px',color:'#d0f5e7'}).setOrigin(.5).setDepth(6)}}
  this.terminal=this.add.text(560,410,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#a6dfd5',align:'center'}).setOrigin(.5).setDepth(6);
  this.shadow=this.add.ellipse(560,385,40,14,0x000000,.4);this.player=this.add.image(560,360,'mew','body').setDisplaySize(speciesSize('mew').width,speciesSize('mew').height).setDepth(17);
  this.decorateRoom();this.refreshRoom();this.updateHud();
  document.getElementById('primary')!.onclick=()=>{if(this.state==='paused'||this.state==='record')this.resume();else this.restart()};
  document.getElementById('secondary')!.onclick=()=>this.restart();
  document.getElementById('back-menu')!.onclick=()=>{this.stopStory();this.state='ready';this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='silent';this.menu()};
  document.getElementById('interact')!.onclick=()=>this.readRecord();this.controls.onInteract=()=>this.readRecord();
  this.menu=setupShell(restore=>restore?this.continueRun():this.restart());
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
  this.roomDecor.removeAll(true);this.blocks=this.run.floor===1?[]:obstacles(this.run.room);this.env=[];
  for(const d of debris(this.run.room)){let item:Phaser.GameObjects.GameObject;
   if(d.kind===0){const stain=this.add.ellipse(d.x,d.y,25,9,0x642f40,.45).setAngle(d.angle);item=stain}
   else if(d.kind===1)item=this.add.image(d.x,d.y,'tiles','paper').setDisplaySize(30,26).setTint(0xa6a5b0).setAngle(d.angle).setAlpha(.65);
   else if(d.kind===2)item=this.add.image(d.x,d.y,'tiles','glass').setDisplaySize(32,25).setTint(0x96b2bc).setAngle(d.angle).setAlpha(.6);
   else item=this.add.rectangle(d.x,d.y,19,7,0xa8a6b2,.45).setAngle(d.angle);
   this.roomDecor.add(item);
  }
  for(const b of this.blocks){this.roomDecor.add(this.add.rectangle(b.x+4,b.y+7,b.w+7,b.h+8,0x000000,.4));this.roomDecor.add(this.add.image(b.x,b.y,'tiles',this.run.room.seed%2?'desk':'cabinet').setDisplaySize(b.w,b.h).setTint(0x526675));this.roomDecor.add(this.add.rectangle(b.x,b.y-5,b.w*.5,4,0x43575e))}
  this.roomDecor.add(this.add.image(230,200,'tiles','paper').setDisplaySize(32,32).setTint(0x9bdbd0));this.roomDecor.add(this.add.text(230,225,'기록 / E',{fontFamily:'sans-serif',fontSize:'9px',color:'#7daca8'}).setOrigin(.5));
  if(this.run.floor===1){this.roomDecor.add(this.add.rectangle(560,116,180,40,0xcce9d0,.45));this.roomDecor.add(this.add.text(560,115,'SURFACE / 地上',{fontFamily:'monospace',fontSize:'12px',color:'#f0fff1'}).setOrigin(.5));this.roomDecor.add(this.add.circle(560,350,135,0xa380db,.045).setStrokeStyle(2,0xa48ac6,.35));this.roomDecor.add(this.add.text(560,165,'PROJECT 150 / 最後の扉',{fontFamily:'monospace',fontSize:'10px',color:'#baa8d3'}).setOrigin(.5))}
  if(this.run.room.kind==='combat'){
   const kinds=['laser','gas','electric'] as const;const count=this.run.tuning.level>=2?2:1;
   for(let i=0;i<count;i++){const kind=kinds[(this.run.room.seed+i)%3],x=i?780:340,y=kind==='laser'?350:445,r=50;const shape=kind==='laser'?this.add.rectangle(560,y,830,12,0xf59b77,.1):this.add.circle(x,y,r,kind==='gas'?0x99c279:0x8fcbe6,.1);this.roomDecor.add(shape);this.env.push({shape,kind,x:kind==='laser'?560:x,y,r,offset:i*2});this.roomDecor.add(this.add.text(kind==='laser'?175:x,y-(kind==='laser'?20:r+14),{laser:'LASER / 예고 후 작동',gas:'독가스 / 중독 잔류',electric:'전기 / 피해·이동 둔화'}[kind],{fontFamily:'sans-serif',fontSize:'8px',color:'#9aa8b7'}).setOrigin(.5))}
  }
 }
 note(text:string){document.getElementById('room-note')!.textContent=text;this.noteTime=4}
 readRecord(){if(this.state!=='playing'||!this.run.room.cleared||!intersects(this.player,{x:230,y:200},80))return;this.state='record';this.controls.reset();this.audioFX.mode='silent';this.audioFX.play('read');const record=LAB_RECORDS[(this.run.current+this.run.tuning.level)%LAB_RECORDS.length];this.showModal(record.title,record.text,'기록 닫기')}
 warn(x:number,y:number,r:number){const ring=this.add.circle(x,y,r,0xe4ad7d,.04).setStrokeStyle(2,0xffc294,.65).setDepth(4);this.tweens.add({targets:ring,alpha:.1,duration:650,onComplete:()=>ring.destroy()})}
 addPool(x:number,y:number,r:number){if(this.pools.length>=12)return;const shape=this.add.circle(x,y,r,0x95bd64,.06).setStrokeStyle(1,0xc5d389,.5).setDepth(4);this.pools.push({shape,x,y,r,age:0})}
 addBeam(axis:'x'|'y',position:number){if(this.beams.length>=4)return;const shape=this.add.rectangle(axis==='x'?position:560,axis==='y'?position:363,axis==='x'?26:964,axis==='y'?26:454,0xffcd9b,.1).setStrokeStyle(2,0xffc696,.9).setDepth(7);this.beams.push({shape,axis,position,age:0})}
 updateHazards(dt:number){
  for(const b of this.beams){b.age+=dt;const phase=beamPhase(b.age);b.shape.setFillStyle(phase==='active'?0xffe4fd:0xffb579,phase==='active'?.9:.12).setStrokeStyle(phase==='warning'?2:0,0xffbd86,.85);if(phase==='active'&&this.startDelay<=0&&beamHits(b.axis,b.position,this.player))this.hurt({x:0,y:0});if(this.state!=='playing')return}
  this.beams=this.beams.filter(b=>{if(beamPhase(b.age)==='expired'){b.shape.destroy();return false}return true});
  this.hazardSlow=Math.max(0,this.hazardSlow-dt);this.toxic=Math.max(0,this.toxic-dt);this.toxicTick-=dt;if(this.toxic>0&&this.toxicTick<=0){this.toxicTick=1.3;this.hurt({x:0,y:0});if(this.state!=='playing')return}
  for(const p of this.pools){p.age+=dt;p.shape.setAlpha(p.age<.8?.2:.6);if(p.age>=.8&&p.age<3.8&&intersects(this.player,p,p.r)){if(this.toxic<=0)this.toxicTick=.65;this.toxic=2}if(this.state!=='playing')return}
  this.pools=this.pools.filter(p=>{if(p.age>=3.8){p.shape.destroy();return false}return true});
  for(const hazard of this.env){const phase=this.run.room.cleared?'idle':hazardPhase(this.roomClock+hazard.offset,this.run.tuning.hazardPeriod);hazard.shape.setAlpha(phase==='active'?.65:phase==='warning'?.25:.035);
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
 clearShots(){this.shots.forEach(s=>{s.sprite.destroy();s.glow.destroy()});this.shots=[]}
 enterRoom(from?:Direction){
  this.entry=from??null;
  this.clearActors();this.controls.reset();this.inv=1.2;this.fire=0;this.startDelay=1.2;this.transitionDelay=.65;
  const spawn:Record<Direction,Vec>={up:{x:560,y:R.top+48},down:{x:560,y:R.bottom-48},left:{x:R.left+48,y:364},right:{x:R.right-48,y:364}};
  const pos=from?spawn[from]:{x:560,y:365};this.player.setPosition(pos.x,pos.y).setAlpha(1);this.shadow.setPosition(pos.x,pos.y+25);
  this.roomClock=0;this.toxic=0;this.toxicTick=0;this.hazardSlow=0;this.decorateRoom();
  const layout=this.run.floor===1?(this.run.room.cleared?[]:[{kind:'mewtwo' as Kind,x:560,y:260}]):enemyLayout(this.run.room);
  if(this.run.room.kind==='combat'&&this.run.tuning.level>=2)layout.push({kind:this.run.tuning.level>=3?'koffing':'houndour',x:560,y:365});
  layout.forEach((spawn,i)=>{const size=speciesSize(spawn.kind),maxHp=spawn.kind==='mewtwo'?FINAL_HP[this.finalPhase-1]:ENEMIES[spawn.kind].hp*this.run.tuning.hp*(spawn.kind==='gengar'?1+this.run.tuning.level*.15:1);
   this.enemies.push({id:i,kind:spawn.kind,hp:maxHp,maxHp,radius:size.radius,sprite:this.add.image(spawn.x,spawn.y,spawn.kind,'body').setDisplaySize(size.width,size.height).setDepth(spawn.kind==='mewtwo'?16:9),shadow:this.add.ellipse(spawn.x,spawn.y+size.height*.4,size.width*.6,12,0x000000,.3),bar:this.add.rectangle(spawn.x,spawn.y-size.height*.6,30,3,0xca8eb3).setDepth(12),cooldown:.5+i*.15,charge:0,dir:{x:0,y:0},flash:0,burn:0,slow:0,statusTime:0,poison:0,phase:spawn.kind==='mewtwo'?this.finalPhase:1,cycle:0});
  });
  this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';

  this.refreshRoom();this.updateHud();this.checkpoint();if(this.run.floor===1){if(this.run.room.cleared)this.playEnding();else this.finalDialogue();return}if(this.run.rewardPending)this.showReward();
 }
 refreshRoom(){
  (this.children.getByName('room-label') as Phaser.GameObjects.Text).setText(`B${this.run.floor} / ${String(this.run.current+1).padStart(2,'0')}`);
  for(const dir of DIRECTIONS){const d=this.doors[dir]!,next=this.run.room.doors[dir];d.shape.setVisible(next!==undefined);d.label.setVisible(next!==undefined);if(next===undefined)continue;
   const open=this.run.room.cleared&&!(this.run.rooms[next].kind==='boss'&&!this.run.rooms.filter(r=>r.kind==='combat').every(r=>r.cleared));d.shape.setFillStyle(open?0x285e56:0x51333e).setStrokeStyle(2,open?0x83d5bd:0xac6677);d.label.setText(open?(this.run.rooms[next].kind==='boss'?'GENGAR':'OPEN'):'LOCKED');
  }
  this.terminal.setText(this.run.floor===1?'':this.run.room.kind==='boss'?(this.run.room.cleared?`B${this.run.floor-1}행 승강기\n중앙으로 이동하여 상승`:'격리 실패 / 팬텀'):this.run.room.kind==='start'?'깨진 격리 장치. 위층에서 소리가 들린다.':this.run.room.kind==='reward'?'기술 보관실 · 보상 수령 완료':'');

 }
 restart(){
  this.stopStory();this.finalPhase=1;this.clearActors();this.run=new Run(nextSeed());this.hp=STATS.hp;this.drain=0;this.inv=0;this.fire=0;this.kills=0;this.elapsed=0;
  this.player.clearTint().setAlpha(1);this.resume();this.enterRoom();
 }
 resume(){this.controls.reset();this.state='playing';document.getElementById('modal')!.hidden=true;this.audioFX.setScene(this.run.floor,this.finalPhase);this.audioFX.mode=this.run.room.kind==='boss'&&!this.run.room.cleared?'boss':this.run.room.cleared?'ambient':'combat';document.getElementById('pause')!.textContent='Ⅱ'}
 togglePause(){if(this.state==='playing'){this.state='paused';this.audioFX.mode='silent';this.controls.reset();this.showModal('일시정지',this.saveStatus||'진행은 마지막 체크포인트에 저장되어 있습니다. 전투 중 종료하면 이 방 또는 보스 단계 시작부터 이어집니다.','이어하기',true);document.getElementById('pause')!.textContent='▶'}else if(this.state==='paused')this.resume()}
 showModal(title:string,copy:string,button:string,secondary=false){
  document.getElementById('modal')!.hidden=false;document.querySelector('.panel')!.classList.remove('reward-panel');document.getElementById('modal-title')!.textContent=title;document.getElementById('modal-copy')!.textContent=copy;document.getElementById('primary')!.hidden=false;document.getElementById('primary')!.textContent=button;document.getElementById('secondary')!.hidden=!secondary;document.getElementById('instructions')!.style.display='none';document.getElementById('rewards')!.replaceChildren();
 }
 showReward(){
  this.state='reward';this.controls.reset();this.clearShots();this.showModal('기술 선택','하나를 선택하세요. 기존 효과에 누적되며 체력을 1 회복합니다.','');document.getElementById('primary')!.hidden=true;document.querySelector('.panel')!.classList.add('reward-panel');
  const container=document.getElementById('rewards')!;
  for(const move of this.run.choices){const button=document.createElement('button');button.className='reward-card';button.style.setProperty('--technique-color','#'+move.color.toString(16));const preview=composeAttack([...this.run.moves,move.id]);button.innerHTML=`<small>${move.type} / ${move.form}</small><strong>${move.name}</strong><span>${move.description}</span><em>${move.synergy}</em><span class="reward-form">${move.id in FORMS?'발사 형태 → '+FORMS[preview.visual.form].name:'형태 유지 · '+move.form}</span>`;button.prepend(techniquePreview(preview.visual));button.onclick=()=>{if(this.state!=='reward'||!this.run.choose(move.id))return;this.hp=Math.min(STATS.hp,this.hp+1);this.checkpoint();this.resume();this.audioFX.reward(move.id,this.run.attack);this.effects.upgrade(this.player.x,this.player.y,this.run.attack,move.id);this.note(`${move.name} · ${this.run.moves.filter(id=>id===move.id).length}단계`);this.refreshRoom();this.updateHud()};container.append(button)}
 }
 tryTravel(move:Vec){
  if(!this.run.room.cleared||this.transitionDelay>0)return false;
  const p=this.player;let dir:Direction|undefined;
  if(Math.abs(p.x-560)<48){if(p.y<=R.top+26&&move.y<0)dir='up';if(p.y>=R.bottom-26&&move.y>0)dir='down'}
  if(Math.abs(p.y-364)<48){if(p.x<=R.left+22&&move.x<0)dir='left';if(p.x>=R.right-22&&move.x>0)dir='right'}
  if(dir&&this.run.travel(dir)){this.enterRoom(OPPOSITE[dir]);return true}return false;
 }
 update(_time:number,delta:number){
  if(this.state!=='playing')return;
  const dt=Math.min(delta/1000,.033);this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.fire-=dt;this.startDelay-=dt;this.transitionDelay-=dt;this.roomClock+=dt;this.noteTime-=dt;if(this.noteTime<=0)document.getElementById('room-note')!.textContent='';
  const move=this.controls.movement(),position=moveWithWalls(this.player,{x:move.x*STATS.speed*dt*(this.hazardSlow>0?.6:1),y:move.y*STATS.speed*dt*(this.hazardSlow>0?.6:1)},this.blocks,speciesSize('mew').radius);this.player.x=Phaser.Math.Clamp(position.x,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(position.y,R.top+22,R.bottom-22);if(move.x)this.player.setFlipX(move.x>0);
  this.player.setAlpha(this.inv>0?(Math.floor(this.inv*16)%2?.4:1):1);this.player.setAngle(move.x*5);this.shadow.setPosition(this.player.x,this.player.y+25);
  if(this.tryTravel(move))return;
  if(this.run.room.kind==='boss'&&this.run.canExit&&intersects(this.player,{x:560,y:365},55)){if(this.run.ascend()){this.enterRoom();this.note(`B${this.run.floor} 도착 · 적과 시설의 위협이 증가합니다`)}else this.playEnding();return}
  this.updateHazards(dt);if(this.state!=='playing')return;
  const aim=this.controls.attack();if((aim.x||aim.y)&&this.fire<=0){const attack=this.run.attack;this.fire=attack.interval;const angle=Math.atan2(aim.y,aim.x);for(let i=0;i<attack.count;i++){const a=angle+(i-(attack.count-1)/2)*.15,dir={x:Math.cos(a),y:Math.sin(a)};this.shoot(this.player.x+dir.x*22,this.player.y+dir.y*22,dir,false,{...attack,visual:{...attack.visual,variant:i}})}this.audioFX.shoot(attack)}
  this.updateEnemies(dt);if(this.state!=='playing')return;
  this.updateShots(dt);if(this.state!=='playing')return;
  this.effects.render(dt,this.shots,this.enemies);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  if((this.run.room.kind==='combat'||this.run.room.kind==='boss')&&!this.run.room.cleared&&this.enemies.length===0){if(this.run.floor===1){const next=nextFinalPhase(this.finalPhase);if(next==='ending'){this.run.clear();this.checkpoint();this.playEnding()}else{this.finalPhase=next;this.enterRoom('down')}return}this.run.clear();this.checkpoint();this.clearShots();this.pools.forEach(p=>p.shape.destroy());this.pools=[];this.audioFX.play('clear');this.audioFX.mode='ambient';this.refreshRoom();this.updateHud();if(this.run.room.kind==='combat')this.showReward();else this.note(`팬텀의 발작이 멎었다. B${this.run.floor-1}행 승강기가 움직인다.`);return}
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
   s.life-=dt;s.sprite.x+=s.v.x*dt;s.sprite.y+=s.v.y*dt;s.glow.setPosition(s.sprite.x,s.sprite.y);if(s.sprite.x<R.left||s.sprite.x>R.right||s.sprite.y<R.top||s.sprite.y>R.bottom){if(!s.hostile&&s.bounces>0){s.bounces--;this.audioFX.proc('bounce');this.effects.impact(s.sprite.x,s.sprite.y,s.attack);if(s.sprite.x<R.left||s.sprite.x>R.right)s.v.x*=-1;if(s.sprite.y<R.top||s.sprite.y>R.bottom)s.v.y*=-1;s.sprite.setPosition(Phaser.Math.Clamp(s.sprite.x,R.left,R.right),Phaser.Math.Clamp(s.sprite.y,R.top,R.bottom))}else s.life=0}if(this.blocks.some(b=>overlapsBlock(s.sprite,s.hostile?7:s.attack.size,b)))s.life=0;if(s.life<=0)continue;
   if(s.hostile){if(intersects(s.sprite,this.player,20)){s.life=0;this.hurt(normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y));if(this.state!=='playing')return}}
   else for(const e of this.enemies){
    if(e.hp<=0||s.hit.has(e.id)||!intersects(s.sprite,e.sprite,e.radius+s.attack.size))continue;
    const point={x:e.sprite.x,y:e.sprite.y};s.hit.add(e.id);e.burn=Math.max(e.burn,s.attack.burn);e.slow=Math.max(e.slow,s.attack.slow);e.poison=Math.max(e.poison,s.attack.poison);e.statusTime=2;
    const dealt=Math.min(e.hp,s.attack.damage);if(s.attack.lifesteal)this.effects.siphon(point,this.player);this.drain+=dealt*s.attack.lifesteal;if(this.drain>=1){const heal=Math.floor(this.drain);this.hp=Math.min(STATS.hp,this.hp+heal);this.drain-=heal;this.audioFX.proc('heal')}
    this.effects.impact(point.x,point.y,s.attack,s.critical);this.hitEnemy(e,s.attack.damage);
    if(e.hp>0&&s.attack.knockback){const v=normalize(s.v.x,s.v.y),power=s.attack.knockback*(e.kind==='gengar'||e.kind==='mewtwo'?.25:1),p=moveWithWalls(e.sprite,{x:v.x*power,y:v.y*power},ENEMIES[e.kind].flying?[]:this.blocks,e.radius);e.sprite.setPosition(Phaser.Math.Clamp(p.x,R.left+e.radius,R.right-e.radius),Phaser.Math.Clamp(p.y,R.top+e.radius,R.bottom-e.radius))}
    if(s.procAvailable&&s.attack.blast){this.burst(point.x,point.y,0xb991cf,10);const ring=this.add.circle(point.x,point.y,s.attack.blast,0xb991cf,.06).setStrokeStyle(2,0xb991cf,.45);this.tweens.add({targets:ring,alpha:0,duration:220,onComplete:()=>ring.destroy()});for(const other of this.enemies)if(other.id!==e.id&&other.hp>0&&intersects(point,other.sprite,s.attack.blast))this.hitEnemy(other,s.attack.damage*BLAST_DAMAGE)}this.burst(s.sprite.x,s.sprite.y,s.attack.color,5);this.audioFX.hit(s.attack);
    const chained=this.enemies.filter(other=>other.hp>0&&other.id!==e.id&&intersects(point,other.sprite,175)).sort((a,b)=>Phaser.Math.Distance.Between(point.x,point.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(point.x,point.y,b.sprite.x,b.sprite.y)).slice(0,s.procAvailable?s.attack.chain:0);
    if(chained.length)this.audioFX.proc('chain');for(const other of chained){this.effects.bolt(point,other.sprite);this.hitEnemy(other,s.attack.damage*CHAIN_DAMAGE)}
    if(!s.child&&s.attack.split){this.audioFX.proc('split');const angle=Math.atan2(s.v.y,s.v.x);for(const offset of [-.7,.7]){const dir={x:Math.cos(angle+offset),y:Math.sin(angle+offset)};this.shoot(s.sprite.x,s.sprite.y,dir,false,splitAttack(s.attack),true,e.id)}s.child=true}
    s.procAvailable=false;if(s.remaining--<=0){s.life=0;break}s.attack={...s.attack,damage:s.attack.damage*PIERCE_RETAIN};
   }
  }
  this.shots=this.shots.filter(s=>{if(s.life<=0){s.sprite.destroy();s.glow.destroy();return false}return true});
 }
 shoot(x:number,y:number,dir:Vec,hostile:boolean,attack=this.run.attack,child=false,ignore?:number,tracking=0,shotSpeed?:number){
  if(!canSpawnProjectile(this.shots,hostile))return;
  const critical=!hostile&&!child&&Math.random()<attack.crit;
  if(critical)attack={...attack,damage:attack.damage*CRITICAL_MULTIPLIER,size:Math.min(13,attack.size+1)};
  const color=hostile?0xff9c64:attack.color,r=hostile?7:attack.size,speed=hostile?(shotSpeed??220*this.run.tuning.shotSpeed):attack.speed;
  this.shots.push({sprite:this.add.circle(x,y,r,color).setStrokeStyle(2,hostile?0xffe0b6:0xffeaff).setDepth(hostile?20:13).setVisible(hostile),glow:this.add.circle(x,y,r*2.5,color,.09).setDepth(hostile?19:12).setVisible(hostile),v:{x:dir.x*speed,y:dir.y*speed},life:hostile?5:attack.range/speed,hostile,attack,hit:new Set(ignore===undefined?[]:[ignore]),remaining:attack.pierce,child,bounces:attack.bounce,trail:[],critical,procAvailable:!child,tracking,speed});
 }
 hitEnemy(e:Enemy,amount:number){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);e.flash=.1;if(e.hp===0){if(e.kind!=='mewtwo'||this.finalPhase===3)this.kills++;this.burst(e.sprite.x,e.sprite.y,0xc29fed,10);e.sprite.destroy();e.bar.destroy();e.shadow.destroy()}}
 hurt(dir:Vec){const result=damage(this.hp,this.inv);if(!result.hit)return;this.hp=result.hp;this.inv=result.invulnerable;this.player.x=Phaser.Math.Clamp(this.player.x+dir.x*22,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(this.player.y+dir.y*22,R.top+22,R.bottom-22);this.cameras.main.shake(100,.004);this.audioFX.play('hurt');this.burst(this.player.x,this.player.y,0xf9a1b7,8);this.updateHud();if(this.hp<=0)this.finish(false)}
 burst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,3,3,color).setDepth(15),angle=Math.random()*Math.PI*2;this.tweens.add({targets:p,x:x+Math.cos(angle)*35,y:y+Math.sin(angle)*35,alpha:0,duration:280,onComplete:()=>p.destroy()})}}
 checkpoint(){
  const save:Checkpoint={version:1,seed:this.run.seed,floor:this.run.floor,current:this.run.current,moves:[...this.run.moves],rooms:this.run.rooms.map(({visited,cleared,rewardTaken})=>({visited,cleared,rewardTaken})),hp:this.hp,kills:this.kills,elapsed:this.elapsed,drain:this.drain,entry:this.entry,phase:this.finalPhase,ending:this.run.floor===1&&this.run.room.cleared,savedAt:Date.now()};
  this.saveStatus=writeCheckpoint(browserStorage,save)?'':'자동 저장 실패 · 브라우저 저장 공간/권한을 확인해 주세요.';if(this.saveStatus)this.note(this.saveStatus);
 }
 continueRun(){const result=readCheckpoint(browserStorage);if(!result.save){this.restart();this.note(result.status||'저장이 없어 새 게임을 시작합니다.');return}const s=result.save;this.run=restoreRun(s);this.hp=s.hp;this.kills=s.kills;this.elapsed=s.elapsed;this.drain=s.drain;this.finalPhase=s.phase;this.resume();this.enterRoom(s.entry??undefined);if(this.run.floor!==1)this.note('체크포인트에서 이어합니다.');}
 finalDialogue(){
  this.state='story';this.controls.reset();this.audioFX.mode='silent';this.clearShots();const script=MEWTWO_SCRIPT[this.finalPhase-1];
  const shots=this.finalPhase===1?[{id:'reunion',tag:'B1 · 지상 출입 구역',title:'문 앞에서 기다리던 존재',text:'뮤는 햇빛을 보고 웃으며 출구로 향했다. 싸울 이유가 없다면, 그대로 지나가면 될 일이었다. 그러나 뮤츠는 그 무해함을 무시로 받아들였다.'}]:[];
  shots.push({id:this.finalPhase===1?'awakening':this.finalPhase===2?'jealousy':'abandonment',tag:`MEWTWO / ${this.finalPhase}단계 · ${script.emotion}`,title:script.emotion,text:script.line+'<br><small>'+script.direction+'</small>'});
  this.stopStory=showStory(shots,()=>{this.resume();this.inv=1.2;this.startDelay=1.2;this.audioFX.play('alarm')});
 }
 playEnding(){this.audioFX.setScene(6,1);this.state='story';this.controls.reset();this.clearActors();document.getElementById('modal')!.hidden=true;this.audioFX.mode='ambient';this.stopStory=showStory(ENDING,()=>this.finish(true),'탈출 기록 보기');}
 finish(won:boolean){this.audioFX.setScene(6,1);this.state=won?'won':'lost';this.audioFX.mode='ambient';this.controls.reset();this.clearShots();const removed=removeCheckpoint(browserStorage);if(won)this.audioFX.play('win');const learned=this.run.moves.length;this.updateHud();this.showModal(won?'탈출 성공 · 새로운 아침':'탈출 실패',`${this.kills}마리 처치 · 기술 ${learned}개 · ${this.elapsed.toFixed(1)}초. ${won?'뮤는 빛 앞에서 기다렸다. 이번 탈출은 여기서 끝났지만, 두 포켓몬의 이야기는 이제 시작이다.':'이번 판은 끝났습니다. 새로운 탈출을 시작할 수 있습니다.'}${removed?'':' 저장소에 접근할 수 없어 이전 기록을 지우지 못했습니다.'}`,'새 던전 시작');}
 updateHud(){
  document.getElementById('hearts')!.innerHTML='♥'.repeat(this.hp)+`<span class="empty">${'♥'.repeat(STATS.hp-this.hp)}</span>`;document.getElementById('hearts')!.setAttribute('aria-label',`체력 ${this.hp} / ${STATS.hp}`);
  const cleared=this.run.rooms.filter(r=>r.kind==='combat'&&r.cleared).length;
  document.getElementById('counter')!.textContent=`B${this.run.floor} · ${this.run.floor===1?'뮤츠 '+this.finalPhase+'/3단계':'전투방 '+cleared+'/'+this.run.tuning.combatCount} · ${this.kills} 처치 · ${Math.floor(this.elapsed)}s`;
  document.getElementById('status')!.textContent=`B${this.run.floor} ${this.run.floor===1?'마지막 문':ROOM_NAME[this.run.room.kind]} ${String(this.run.current+1).padStart(2,'0')} · ${this.run.room.cleared?'문 개방':'전투 중'}${this.toxic>0?' · 중독':this.hazardSlow>0?' · 감전':''}`;
  document.getElementById('seed')!.textContent=`SEED ${this.run.seed.toString(16).toUpperCase()}`;
  const boss=this.enemies.find(e=>(e.kind==='gengar'||e.kind==='mewtwo')&&e.hp>0);document.getElementById('boss-hud')!.hidden=!boss;if(boss){document.getElementById('boss-name')!.textContent=boss.kind==='mewtwo'?`뮤츠 · ${MEWTWO_SCRIPT[this.finalPhase-1].emotion} / ${this.finalPhase}단계`:`팬텀 · 부서진 경비 / ${boss.phase}단계`;document.getElementById('boss-fill')!.style.width=`${boss.hp/boss.maxHp*100}%`}
  document.querySelector('.map>span')!.textContent=`B${this.run.floor} / ${['원본 격리','표본 보관','독성 처리','공명 실험','중앙 통제','지상 출입'][this.run.tuning.level]} 구역`;
  const canRead=this.run.room.cleared&&intersects(this.player,{x:230,y:200},80);document.getElementById('interact')!.hidden=!canRead;
  const attack=this.run.attack,form=FORMS[attack.visual.form];document.getElementById('build-info')!.textContent=`${form.name} Lv.${attack.visual.rank} · ${attack.count}발`;document.getElementById('build-info')!.title=`공격 ${attack.damage.toFixed(1)} · 발사 간격 ${attack.interval.toFixed(2)}초 · ${this.run.moves.length} 강화`;const icon=document.querySelector('.move-icon') as HTMLElement;icon.textContent=glyph(attack.visual.form);icon.style.color='#'+form.color.toString(16);document.querySelector('.loadout small')!.textContent=`주 기술 / ${MOVES.find(m=>m.id===attack.visual.form)?.type??'에스퍼'} · 효과 누적`;document.getElementById('sound')!.title=this.audioFX.snapshot.title;
  const counts=new Map<string,number>();for(const id of this.run.moves)counts.set(id,(counts.get(id)??0)+1);
  document.getElementById('build-list')!.textContent=counts.size?[...counts].map(([id,n])=>`${MOVES.find(m=>m.id===id)!.name}${n>1?' ×'+n:''}`).join(' · '):'염동력 · 기술을 모아 효과를 조합하세요';
  const map=document.getElementById('minimap')!,rooms=this.run.rooms,minX=Math.min(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y));
  map.replaceChildren();for(const room of rooms){const known=room.visited||Object.values(this.run.room.doors).includes(room.id);if(!known)continue;const cell=document.createElement('span');cell.className='map-cell'+(room.id===this.run.current?' current':'')+(room.visited&&room.cleared?' cleared':'');cell.style.left=`${(room.x-minX)*19}px`;cell.style.top=`${(room.y-minY)*19}px`;cell.textContent=room.visited?({start:'S',combat:room.cleared?'·':'!',reward:'✧',boss:room.cleared?'↑':'B'}[room.kind]):'?';cell.title=room.visited?ROOM_NAME[room.kind]:'미탐험';map.append(cell)}
 }
}
