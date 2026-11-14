import Phaser from 'phaser';
import {ROOM as R,STATS,SPAWNS,ENEMIES,type Kind} from './data';
import {damage,intersects,normalize,type Vec} from './combat';
import {Controls} from './input';
import {AudioFX} from './audio';
type Enemy={sprite:Phaser.GameObjects.Image,shadow:Phaser.GameObjects.Ellipse,bar:Phaser.GameObjects.Rectangle,kind:Kind,hp:number,cooldown:number,charge:number,dir:Vec,flash:number};
type Shot={sprite:Phaser.GameObjects.Arc,glow:Phaser.GameObjects.Arc,v:Vec,life:number,hostile:boolean};
export class LabScene extends Phaser.Scene{
 controls=new Controls();audioFX=new AudioFX();player!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;door!:Phaser.GameObjects.Rectangle;enemies:Enemy[]=[];shots:Shot[]=[];hp=STATS.hp;inv=0;fire=0;elapsed=0;state:'ready'|'playing'|'paused'|'won'|'lost'='ready';kills=0;startDelay=1.2;hudTime=0;
 preload(){['mew','gastly','zubat'].forEach(key=>this.load.image(key,`./assets/${key}.png`));this.load.image('tiles','./assets/lab-tiles.png');this.load.on('loaderror',()=>{document.getElementById('modal-copy')!.textContent='리소스를 불러오지 못했습니다. 페이지를 새로고침해 주세요.'})}
 create(){
 this.buildRoom();this.shadow=this.add.ellipse(560,385,40,14,0x000000,.4);this.player=this.add.image(560,360,'mew').setScale(.92).setDepth(10);
 this.spawnEnemies();this.updateHud();
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
 this.door=this.add.rectangle(560,112,108,42,0x51333e).setStrokeStyle(2,0xac6677);this.add.text(560,104,'LOCKED',{fontFamily:'monospace',fontSize:'11px',color:'#e9a0ac'}).setOrigin(.5).setName('door-label');
 const g=this.add.graphics();g.lineStyle(1,0x95b4cd,.08);g.strokeCircle(560,364,115);g.strokeCircle(560,364,122);g.lineBetween(410,364,710,364);g.lineBetween(560,214,560,514);
 this.add.text(560,355,'151',{fontFamily:'monospace',fontSize:'64px',color:'#647488'}).setAlpha(.11).setOrigin(.5);
 this.add.text(99,158,'BIO-CONTAINMENT  /  B01',{fontFamily:'monospace',fontSize:'9px',color:'#6e8b9b'}).setAlpha(.65);
 for(let y=0;y<700;y+=4)this.add.rectangle(560,y,1120,1,0x000000,.04).setDepth(30);
 }
 spawnEnemies(){SPAWNS.forEach((s,i)=>{const e:Enemy={kind:s.kind,hp:ENEMIES[s.kind].hp,sprite:this.add.image(s.x,s.y,s.kind).setScale(s.kind==='gastly'?.95:.9).setDepth(9),shadow:this.add.ellipse(s.x,s.y+23,38,12,0x000000,.3),bar:this.add.rectangle(s.x,s.y-34,30,3,0xca8eb3).setDepth(12),cooldown:1.4+i*.35,charge:0,dir:{x:0,y:0},flash:0};this.enemies.push(e)})}
 restart(){this.enemies.forEach(e=>{e.sprite.destroy();e.shadow.destroy();e.bar.destroy()});this.enemies=[];this.shots.forEach(s=>{s.sprite.destroy();s.glow.destroy()});this.shots=[];this.hp=STATS.hp;this.inv=0;this.fire=0;this.kills=0;this.elapsed=0;this.startDelay=1.2;this.player.setPosition(560,365).clearTint().setAlpha(1);this.spawnEnemies();this.door.setFillStyle(0x51333e).setStrokeStyle(2,0xac6677);(this.children.getByName('door-label') as Phaser.GameObjects.Text).setText('LOCKED');this.resume();this.updateHud()}
 resume(){this.controls.reset();this.state='playing';document.getElementById('modal')!.hidden=true;document.getElementById('pause')!.textContent='Ⅱ'}
 togglePause(){if(this.state==='playing'){this.state='paused';this.controls.reset();this.showModal('일시정지','격리실의 시간이 멈췄습니다.','이어하기',true);document.getElementById('pause')!.textContent='▶'}else if(this.state==='paused')this.resume()}
 showModal(title:string,copy:string,button:string,secondary=false){document.getElementById('modal')!.hidden=false;document.querySelector('h1')!.textContent=title;document.getElementById('modal-copy')!.textContent=copy;document.getElementById('primary')!.textContent=button;document.getElementById('secondary')!.hidden=!secondary;document.getElementById('instructions')!.style.display='none'}
 update(_time:number,delta:number){if(this.state!=='playing')return;const dt=Math.min(delta/1000,.033);this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.fire-=dt;this.startDelay-=dt;
 const move=this.controls.movement();this.player.x=Phaser.Math.Clamp(this.player.x+move.x*STATS.speed*dt,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(this.player.y+move.y*STATS.speed*dt,R.top+22,R.bottom-22);if(move.x)this.player.setFlipX(move.x>0);
 this.player.setAlpha(this.inv>0?(Math.floor(this.inv*16)%2?.4:1):1);this.player.setAngle(move.x*5);this.shadow.setPosition(this.player.x,this.player.y+25);
 const aim=this.controls.attack();if((aim.x||aim.y)&&this.fire<=0){this.fire=STATS.shotInterval;this.shoot(this.player.x+aim.x*22,this.player.y+aim.y*22,aim,false);this.audioFX.play('shoot')}
 for(const e of this.enemies){if(e.hp<=0)continue;const dx=this.player.x-e.sprite.x,dy=this.player.y-e.sprite.y,d=Math.hypot(dx,dy),n=normalize(dx,dy);e.cooldown-=dt;e.flash-=dt;let v={x:0,y:0};
 if(this.startDelay<=0){if(e.kind==='gastly'){const sign=d>270?1:d<200?-1:0;v={x:n.x*ENEMIES.gastly.speed*sign,y:n.y*ENEMIES.gastly.speed*sign};if(e.cooldown<=0){this.shoot(e.sprite.x,e.sprite.y,n,true);e.cooldown=2.1}}
 else{if(e.cooldown<=0){e.cooldown=2.7;e.charge=.85;e.dir=n}if(e.charge>0){e.charge-=dt;if(e.charge<.48)v={x:e.dir.x*360,y:e.dir.y*360}}else v={x:n.x*ENEMIES.zubat.speed,y:n.y*ENEMIES.zubat.speed}}}
 e.sprite.x=Phaser.Math.Clamp(e.sprite.x+v.x*dt,R.left+22,R.right-22);e.sprite.y=Phaser.Math.Clamp(e.sprite.y+v.y*dt,R.top+24,R.bottom-22);e.sprite.setFlipX(dx>0);e.sprite.setAngle(Math.sin(this.elapsed*7+e.sprite.x)*4);e.sprite.setTint(e.flash>0?0xffffff:e.charge>.48?0xff8b92:0xffffff);e.sprite.setAlpha(e.flash>0?.65:1);e.shadow.setPosition(e.sprite.x,e.sprite.y+24);e.bar.setPosition(e.sprite.x,e.sprite.y-34).setDisplaySize(30*e.hp/ENEMIES[e.kind].hp,3);
 if(this.startDelay<=0&&intersects(this.player,e.sprite,29))this.hurt(n);if(this.state!=='playing')break;
 }
 if(this.state!=='playing')return;
 for(const s of this.shots){s.life-=dt;s.sprite.x+=s.v.x*dt;s.sprite.y+=s.v.y*dt;s.glow.setPosition(s.sprite.x,s.sprite.y);if(s.sprite.x<R.left||s.sprite.x>R.right||s.sprite.y<R.top||s.sprite.y>R.bottom)s.life=0;if(s.life<=0)continue;
 if(s.hostile){if(intersects(s.sprite,this.player,20)){s.life=0;this.hurt(normalize(this.player.x-s.sprite.x,this.player.y-s.sprite.y))}}
 else for(const e of this.enemies){if(e.hp>0&&intersects(s.sprite,e.sprite,ENEMIES[e.kind].radius+7)){e.hp-=STATS.damage;e.flash=.12;s.life=0;this.burst(s.sprite.x,s.sprite.y,0xf1b6e3,5);this.audioFX.play('hit');if(e.hp<=0){this.kills++;this.burst(e.sprite.x,e.sprite.y,0xc29fed,12);e.sprite.destroy();e.bar.destroy();e.shadow.destroy()}break}}
 }
 this.shots=this.shots.filter(s=>{if(s.life<=0){s.sprite.destroy();s.glow.destroy();return false}return true});this.enemies=this.enemies.filter(e=>e.hp>0);
 this.hudTime-=dt;if(this.hudTime<=0){this.updateHud();this.hudTime=.15}if(this.state==='playing'&&this.enemies.length===0)this.finish(true);
 }
 shoot(x:number,y:number,dir:Vec,hostile:boolean){if(this.shots.length>=STATS.projectileCap)return;const color=hostile?0xffae72:0xf3b9ef,r=hostile?7:5,speed=hostile?180:STATS.projectileSpeed;this.shots.push({sprite:this.add.circle(x,y,r,color).setStrokeStyle(2,hostile?0xffe0b6:0xffeaff).setDepth(13),glow:this.add.circle(x,y,r*2.5,color,.09).setDepth(12),v:{x:dir.x*speed,y:dir.y*speed},life:hostile?5:STATS.range/speed,hostile})}
 hurt(dir:Vec){const result=damage(this.hp,this.inv);if(!result.hit)return;this.hp=result.hp;this.inv=result.invulnerable;this.player.x=Phaser.Math.Clamp(this.player.x+dir.x*22,R.left+18,R.right-18);this.player.y=Phaser.Math.Clamp(this.player.y+dir.y*22,R.top+22,R.bottom-22);this.cameras.main.shake(100,.004);this.audioFX.play('hurt');this.burst(this.player.x,this.player.y,0xf9a1b7,8);this.updateHud();if(this.hp<=0)this.finish(false)}
 burst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.rectangle(x,y,3,3,color).setDepth(15),angle=Math.random()*Math.PI*2;this.tweens.add({targets:p,x:x+Math.cos(angle)*35,y:y+Math.sin(angle)*35,alpha:0,duration:280,onComplete:()=>p.destroy()})}}
 finish(won:boolean){this.state=won?'won':'lost';this.controls.reset();if(won){this.door.setFillStyle(0x397a70).setStrokeStyle(2,0x8df2ce);(this.children.getByName('door-label') as Phaser.GameObjects.Text).setText('UNLOCKED');this.audioFX.play('win')}this.updateHud();this.showModal(won?'격리 해제':'탈출 실패',won?`모든 실험체를 처치했습니다. ${this.elapsed.toFixed(1)}초 · Phase 1 완료. 다음 구역은 이후 단계에서 열립니다.`:`처치 ${this.kills} / ${SPAWNS.length} · ${this.elapsed.toFixed(1)}초 생존. 다시 도전해 보세요.`,won?'다시 플레이':'다시 도전')}
 updateHud(){document.getElementById('hearts')!.innerHTML='♥'.repeat(this.hp)+`<span class="empty">${'♥'.repeat(STATS.hp-this.hp)}</span>`;document.getElementById('hearts')!.setAttribute('aria-label',`체력 ${this.hp} / ${STATS.hp}`);document.getElementById('counter')!.textContent=`${String(this.kills).padStart(2,'0')} / 06  처치   ·   ${Math.floor(this.elapsed)}s`;document.getElementById('status')!.textContent=this.state==='won'?'격리실 · 잠금 해제':'격리실 · B01'}
}
