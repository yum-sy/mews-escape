import Phaser from 'phaser';
import {ROOM as R,STATS,ENEMIES,type Kind} from './data';
import {damage,intersects,normalize,type Vec} from './combat';
import {Controls} from './input';
import {AudioFX} from './audio';
import {Run} from './run';
import {DIRECTIONS,OPPOSITE,enemyLayout,type Direction} from './dungeon';
import {MOVES,type Attack} from './moves';

type Enemy={id:number;sprite:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;bar:Phaser.GameObjects.Rectangle;kind:Kind;hp:number;cooldown:number;charge:number;dir:Vec;flash:number;burn:number;slow:number;statusTime:number};
type Shot={sprite:Phaser.GameObjects.Arc;glow:Phaser.GameObjects.Arc;v:Vec;life:number;hostile:boolean;attack:Attack;hit:Set<number>;remaining:number;child:boolean};
type State='ready'|'playing'|'paused'|'reward'|'won'|'lost';
const DOOR_POS:Record<Direction,Vec>={up:{x:560,y:112},right:{x:1055,y:364},down:{x:560,y:614},left:{x:65,y:364}};
function nextSeed(){const raw=new URLSearchParams(location.search).get('seed');const value=Number(raw);return raw!==null&&/^\d+$/.test(raw)&&Number.isSafeInteger(value)&&value>=0&&value<=0xffffffff?value:crypto.getRandomValues(new Uint32Array(1))[0]}
const ROOM_NAME={start:'격리실',combat:'실험실',reward:'기술 보관실',exit:'탈출 승강기'};
export class LabScene extends Phaser.Scene{
 controls=new Controls();audioFX=new AudioFX();player!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;
 doors:Partial<Record<Direction,{shape:Phaser.GameObjects.Rectangle;label:Phaser.GameObjects.Text}>>={};terminal!:Phaser.GameObjects.Text;
 enemies:Enemy[]=[];shots:Shot[]=[];hp=STATS.hp;inv=0;fire=0;elapsed=0;state:State='ready';kills=0;startDelay=1.2;hudTime=0;transitionDelay=0;
 run=new Run(nextSeed());
 preload(){['mew','gastly','zubat'].forEach(key=>this.load.image(key,`./assets/${key}.png`));this.load.image('tiles','./assets/lab-tiles.png');this.load.on('loaderror',()=>{document.getElementById('modal-copy')!.textContent='리소스를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'})}
 create(){
  this.buildRoom();
  for(const dir of DIRECTIONS){const p=DOOR_POS[dir],vertical=dir==='left'||dir==='right';this.doors[dir]={shape:this.add.rectangle(p.x,p.y,vertical?30:108,vertical?100:42,0x397a70).setDepth(5),label:this.add.text(p.x,p.y,'',{fontFamily:'monospace',fontSize:'10px',color:'#d0f5e7'}).setOrigin(.5).setDepth(6)}}
  this.terminal=this.add.text(560,410,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#a6dfd5',align:'center'}).setOrigin(.5).setDepth(6);
  this.shadow=this.add.ellipse(560,385,40,14,0x000000,.4);this.player=this.add.image(560,360,'mew').setScale(.92).setDepth(10);
  this.refreshRoom();this.updateHud();
  document.getElementById('primary')!.onclick=()=>{if(this.state==='paused')this.resume();else this.restart()};
  document.getElementById('secondary')!.onclick=()=>this.restart();
  document.getElementById('pause')!.onclick=()=>this.togglePause();this.controls.onPause=()=>this.togglePause();
  document.getElementById('sound')!.onclick=()=>{const on=this.audioFX.toggle();document.getElementById('sound')!.textContent=on?'소리 ON':'소리 OFF';document.getElementById('sound')!.setAttribute('aria-label',on?'소리 끄기':'소리 켜기')};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='playing')this.togglePause()});window.addEventListener('blur',()=>{if(this.state==='playing')this.togglePause()});
 }
 buildRoom(){
 this.cameras.main.setBackgroundColor('#080e18');
 const tex=this.textures.get('tiles');tex.add('floor',0,64,896,64,64);tex.add('wall',0,128,640,64,64);tex.add('desk',0,1280,1024,192,64);tex.add('cabinet',0,1536,960,192,64);
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
 clearActors(){
  this.enemies.forEach(e=>{e.sprite.destroy();e.shadow.destroy();e.bar.destroy()});this.enemies=[];
  this.clearShots();
 }
 clearShots(){this.shots.forEach(s=>{s.sprite.destroy();s.glow.destroy()});this.shots=[]}
 enterRoom(from?:Direction){
  this.clearActors();this.controls.reset();this.inv=1.2;this.fire=0;this.startDelay=1.2;this.transitionDelay=.65;
  const spawn:Record<Direction,Vec>={up:{x:560,y:R.top+48},down:{x:560,y:R.bottom-48},left:{x:R.left+48,y:364},right:{x:R.right-48,y:364}};
  const pos=from?spawn[from]:{x:560,y:365};this.player.setPosition(pos.x,pos.y).setAlpha(1);this.shadow.setPosition(pos.x,pos.y+25);
  enemyLayout(this.run.room).forEach((s,i)=>this.enemies.push({id:i,kind:s.kind,hp:ENEMIES[s.kind].hp,sprite:this.add.image(s.x,s.y,s.kind).setScale(s.kind==='gastly'?.95:.9).setDepth(9),shadow:this.add.ellipse(s.x,s.y+23,38,12,0x000000,.3),bar:this.add.rectangle(s.x,s.y-34,30,3,0xca8eb3).setDepth(12),cooldown:1.4+i*.35,charge:0,dir:{x:0,y:0},flash:0,burn:0,slow:0,statusTime:0}));
  this.refreshRoom();this.updateHud();if(this.run.rewardPending)this.showReward();
 }
 refreshRoom(){
  (this.children.getByName('room-label') as Phaser.GameObjects.Text).setText(`BIO-CONTAINMENT / ${String(this.run.current+1).padStart(2,'0')}`);
  for(const dir of DIRECTIONS){const d=this.doors[dir]!,next=this.run.room.doors[dir];d.shape.setVisible(next!==undefined);d.label.setVisible(next!==undefined);if(next===undefined)continue;
   const open=this.run.room.cleared;d.shape.setFillStyle(open?0x285e56:0x51333e).setStrokeStyle(2,open?0x83d5bd:0xac6677);d.label.setText(open?'OPEN':'LOCKED');
  }
  this.terminal.setText(this.run.room.kind==='exit'?(this.run.canExit?'탈출 승강기\n중앙으로 이동하여 탈출':'승강기 잠금\n모든 전투방을 클리어하세요'):this.run.room.kind==='start'?'열린 문으로 이동하여 탐험하세요':this.run.room.kind==='reward'?'기술 보관실 · 보상 수령 완료':'');
 }
 restart(){
  this.clearActors();this.run=new Run(nextSeed());this.hp=STATS.hp;this.inv=0;this.fire=0;this.kills=0;this.elapsed=0;
  this.player.clearTint().setAlpha(1);this.resume();this.enterRoom();
 }
 resume(){this.controls.reset();this.state='playing';document.getElementById('modal')!.hidden=true;document.getElementById('pause')!.textContent='Ⅱ'}
 togglePause(){if(this.state==='playing'){this.state='paused';this.controls.reset();this.showModal('일시정지','열린 문을 향해 이동하면 다음 방으로 넘어갑니다.','이어하기',true);document.getElementById('pause')!.textContent='▶'}else if(this.state==='paused')this.resume()}
 showModal(title:string,copy:string,button:string,secondary=false){
  document.getElementById('modal')!.hidden=false;document.querySelector('.panel')!.classList.remove('reward-panel');document.querySelector('h1')!.textContent=title;document.getElementById('modal-copy')!.textContent=copy;document.getElementById('primary')!.hidden=false;document.getElementById('primary')!.textContent=button;document.getElementById('secondary')!.hidden=!secondary;document.getElementById('instructions')!.style.display='none';document.getElementById('rewards')!.replaceChildren();
 }
 showReward(){
  this.state='reward';this.controls.reset();this.clearShots();this.showModal('기술 선택','하나를 선택하세요. 기존 효과에 누적되며 체력을 1 회복합니다.','');document.getElementById('primary')!.hidden=true;document.querySelector('.panel')!.classList.add('reward-panel');
  const container=document.getElementById('rewards')!;
  for(const move of this.run.choices){const button=document.createElement('button');button.className='reward-card';button.innerHTML=`<small>${move.type} / ${move.form}</small><strong>${move.name}</strong><span>${move.description}</span><em>${move.synergy}</em>`;button.onclick=()=>{if(this.state!=='reward'||!this.run.choose(move.id))return;this.hp=Math.min(STATS.hp,this.hp+1);this.audioFX.play('win');this.resume();this.refreshRoom();this.updateHud()};container.append(button)}
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
  const dt=Math.min(delta/1000,.033);this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.fire-=dt;this.startDelay-=dt;this.transitionDelay-=dt;
  const move=this.controls.movement();this.player.x=Phaser.Math.Clamp(this.player.x+move.x*STATS.speed*dt,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(this.player.y+move.y*STATS.speed*dt,R.top+22,R.bottom-22);if(move.x)this.player.setFlipX(move.x>0);
  this.player.setAlpha(this.inv>0?(Math.floor(this.inv*16)%2?.4:1):1);this.player.setAngle(move.x*5);this.shadow.setPosition(this.player.x,this.player.y+25);
  if(this.tryTravel(move))return;
  if(this.run.room.kind==='exit'&&this.run.canExit&&intersects(this.player,{x:560,y:365},55)){this.finish(true);return}
  const aim=this.controls.attack();if((aim.x||aim.y)&&this.fire<=0){const attack=this.run.attack;this.fire=attack.interval;const angle=Math.atan2(aim.y,aim.x);for(let i=0;i<attack.count;i++){const a=angle+(i-(attack.count-1)/2)*.15,dir={x:Math.cos(a),y:Math.sin(a)};this.shoot(this.player.x+dir.x*22,this.player.y+dir.y*22,dir,false,attack)}this.audioFX.play('shoot')}
  this.updateEnemies(dt);if(this.state!=='playing')return;
  this.updateShots(dt);if(this.state!=='playing')return;
  this.enemies=this.enemies.filter(e=>e.hp>0);
  if(this.run.room.kind==='combat'&&!this.run.room.cleared&&this.enemies.length===0){this.run.clear();this.clearShots();this.refreshRoom();this.updateHud();this.showReward();return}
  this.hudTime-=dt;if(this.hudTime<=0){this.updateHud();this.hudTime=.15}
 }
 updateEnemies(dt:number){
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   if(e.statusTime>0){e.statusTime-=dt;if(e.burn>0)this.hitEnemy(e,e.burn*dt);if(e.hp<=0)continue}else{e.burn=0;e.slow=0}
   const dx=this.player.x-e.sprite.x,dy=this.player.y-e.sprite.y,d=Math.hypot(dx,dy),n=normalize(dx,dy);e.cooldown-=dt;e.flash-=dt;let v={x:0,y:0};
   if(this.startDelay<=0){if(e.kind==='gastly'){const sign=d>270?1:d<200?-1:0;v={x:n.x*ENEMIES.gastly.speed*sign,y:n.y*ENEMIES.gastly.speed*sign};if(e.cooldown<=0){this.shoot(e.sprite.x,e.sprite.y,n,true);e.cooldown=2.1}}
    else{if(e.cooldown<=0){e.cooldown=2.7;e.charge=.85;e.dir=n}if(e.charge>0){e.charge-=dt;if(e.charge<.48)v={x:e.dir.x*360,y:e.dir.y*360}}else v={x:n.x*ENEMIES.zubat.speed,y:n.y*ENEMIES.zubat.speed}}
   }
   e.sprite.x=Phaser.Math.Clamp(e.sprite.x+v.x*(1-e.slow)*dt,R.left+22,R.right-22);e.sprite.y=Phaser.Math.Clamp(e.sprite.y+v.y*(1-e.slow)*dt,R.top+24,R.bottom-22);e.sprite.setFlipX(dx>0);e.sprite.setAngle(Math.sin(this.elapsed*7+e.sprite.x)*4);e.sprite.setTint(e.flash>0?0xffffff:e.charge>.48?0xff8b92:e.slow>0?0x91e6fa:e.burn>0?0xffaf71:0xffffff);e.sprite.setAlpha(e.flash>0?.65:1);e.shadow.setPosition(e.sprite.x,e.sprite.y+24);e.bar.setPosition(e.sprite.x,e.sprite.y-34).setDisplaySize(30*e.hp/ENEMIES[e.kind].hp,3);
   if(this.startDelay<=0&&intersects(this.player,e.sprite,29))this.hurt(n);if(this.state!=='playing')return;
  }
 }
 updateShots(dt:number){
  // Snapshot keeps child projectiles from being simulated recursively in their birth frame.
  for(const s of [...this.shots]){
   if(s.life<=0)continue;
   if(!s.hostile&&s.attack.homing>0){const target=this.enemies.filter(e=>e.hp>0&&!s.hit.has(e.id)).sort((a,b)=>Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(s.sprite.x,s.sprite.y,b.sprite.x,b.sprite.y))[0];if(target){const desired=normalize(target.sprite.x-s.sprite.x,target.sprite.y-s.sprite.y),mix=Math.min(1,s.attack.homing*dt),v=normalize(s.v.x/s.attack.speed*(1-mix)+desired.x*mix,s.v.y/s.attack.speed*(1-mix)+desired.y*mix);s.v={x:v.x*s.attack.speed,y:v.y*s.attack.speed}}}
   s.life-=dt;s.sprite.x+=s.v.x*dt;s.sprite.y+=s.v.y*dt;s.glow.setPosition(s.sprite.x,s.sprite.y);if(s.sprite.x<R.left||s.sprite.x>R.right||s.sprite.y<R.top||s.sprite.y>R.bottom)s.life=0;if(s.life<=0)continue;
   if(s.hostile){if(intersects(s.sprite,this.player,20)){s.life=0;this.hurt(normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y));if(this.state!=='playing')return}}
   else for(const e of this.enemies){
    if(e.hp<=0||s.hit.has(e.id)||!intersects(s.sprite,e.sprite,ENEMIES[e.kind].radius+s.attack.size))continue;
    const point={x:e.sprite.x,y:e.sprite.y};s.hit.add(e.id);e.burn=Math.max(e.burn,s.attack.burn);e.slow=Math.max(e.slow,s.attack.slow);e.statusTime=2;
    this.hitEnemy(e,s.attack.damage);this.burst(s.sprite.x,s.sprite.y,s.attack.color,5);this.audioFX.play('hit');
    const chained=this.enemies.filter(other=>other.hp>0&&other.id!==e.id&&intersects(point,other.sprite,175)).sort((a,b)=>Phaser.Math.Distance.Between(point.x,point.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(point.x,point.y,b.sprite.x,b.sprite.y)).slice(0,s.attack.chain);
    for(const other of chained){const line=this.add.line(0,0,point.x,point.y,other.sprite.x,other.sprite.y,0xfff0a0).setOrigin(0).setDepth(14);this.tweens.add({targets:line,alpha:0,duration:140,onComplete:()=>line.destroy()});this.hitEnemy(other,s.attack.damage*.55)}
    if(!s.child&&s.attack.split){const angle=Math.atan2(s.v.y,s.v.x);for(const offset of [-.7,.7]){const dir={x:Math.cos(angle+offset),y:Math.sin(angle+offset)};this.shoot(s.sprite.x,s.sprite.y,dir,false,{...s.attack,damage:s.attack.damage*.55,size:Math.max(3,s.attack.size*.7),range:360,split:0},true,e.id)}s.child=true}
    if(s.remaining--<=0){s.life=0;break}
   }
  }
  this.shots=this.shots.filter(s=>{if(s.life<=0){s.sprite.destroy();s.glow.destroy();return false}return true});
 }
 shoot(x:number,y:number,dir:Vec,hostile:boolean,attack=this.run.attack,child=false,ignore?:number){
  if(this.shots.length>=STATS.projectileCap)return;
  const color=hostile?0xffae72:attack.color,r=hostile?7:attack.size,speed=hostile?180:attack.speed;
  this.shots.push({sprite:this.add.circle(x,y,r,color).setStrokeStyle(2,hostile?0xffe0b6:0xffeaff).setDepth(13),glow:this.add.circle(x,y,r*2.5,color,.09).setDepth(12),v:{x:dir.x*speed,y:dir.y*speed},life:hostile?5:attack.range/speed,hostile,attack,hit:new Set(ignore===undefined?[]:[ignore]),remaining:attack.pierce,child});
 }
 hitEnemy(e:Enemy,amount:number){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);e.flash=.1;if(e.hp===0){this.kills++;this.burst(e.sprite.x,e.sprite.y,0xc29fed,10);e.sprite.destroy();e.bar.destroy();e.shadow.destroy()}}
 hurt(dir:Vec){const result=damage(this.hp,this.inv);if(!result.hit)return;this.hp=result.hp;this.inv=result.invulnerable;this.player.x=Phaser.Math.Clamp(this.player.x+dir.x*22,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(this.player.y+dir.y*22,R.top+22,R.bottom-22);this.cameras.main.shake(100,.004);this.audioFX.play('hurt');this.burst(this.player.x,this.player.y,0xf9a1b7,8);this.updateHud();if(this.hp<=0)this.finish(false)}
 burst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,3,3,color).setDepth(15),angle=Math.random()*Math.PI*2;this.tweens.add({targets:p,x:x+Math.cos(angle)*35,y:y+Math.sin(angle)*35,alpha:0,duration:280,onComplete:()=>p.destroy()})}}
 finish(won:boolean){this.state=won?'won':'lost';this.controls.reset();this.clearShots();if(won)this.audioFX.play('win');const learned=this.run.moves.length;this.run.moves=[];this.updateHud();this.showModal(won?'구역 탈출':'탈출 실패',`${this.kills}마리 처치 · 기술 ${learned}개 · ${this.elapsed.toFixed(1)}초. ${won?'Phase 2 완료!':'이번 판의 성장은 초기화되었습니다.'}`,'새 던전 시작')}
 updateHud(){
  document.getElementById('hearts')!.innerHTML='♥'.repeat(this.hp)+`<span class="empty">${'♥'.repeat(STATS.hp-this.hp)}</span>`;document.getElementById('hearts')!.setAttribute('aria-label',`체력 ${this.hp} / ${STATS.hp}`);
  const cleared=this.run.rooms.filter(r=>r.kind==='combat'&&r.cleared).length;
  document.getElementById('counter')!.textContent=`전투방 ${cleared}/5 · ${this.kills} 처치 · ${Math.floor(this.elapsed)}s`;
  document.getElementById('status')!.textContent=`${ROOM_NAME[this.run.room.kind]} ${String(this.run.current+1).padStart(2,'0')} · ${this.run.room.cleared?'문 개방':'전투 중'}`;
  document.getElementById('seed')!.textContent=`SEED ${this.run.seed.toString(16).toUpperCase()}`;
  const attack=this.run.attack;document.getElementById('build-info')!.textContent=`공격 ${attack.damage.toFixed(1)} · ${attack.count}발 동시 · ${this.run.moves.length} 강화`;
  const counts=new Map<string,number>();for(const id of this.run.moves)counts.set(id,(counts.get(id)??0)+1);
  document.getElementById('build-list')!.textContent=counts.size?[...counts].map(([id,n])=>`${MOVES.find(m=>m.id===id)!.name}${n>1?' ×'+n:''}`).join(' · '):'염동력 · 기술을 모아 효과를 조합하세요';
  const map=document.getElementById('minimap')!,rooms=this.run.rooms,minX=Math.min(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y));
  map.replaceChildren();for(const room of rooms){const known=room.visited||Object.values(this.run.room.doors).includes(room.id);if(!known)continue;const cell=document.createElement('span');cell.className='map-cell'+(room.id===this.run.current?' current':'')+(room.visited&&room.cleared?' cleared':'');cell.style.left=`${(room.x-minX)*19}px`;cell.style.top=`${(room.y-minY)*19}px`;cell.textContent=room.visited?({start:'S',combat:room.cleared?'·':'!',reward:'✧',exit:'E'}[room.kind]):'?';cell.title=room.visited?ROOM_NAME[room.kind]:'미탐험';map.append(cell)}
 }
}
