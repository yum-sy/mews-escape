import Phaser from 'phaser';
import type {DungeonRoom} from './dungeon';
import {floorTheme,breakableProps,roomEnvironment,type Interaction} from './environment';
export class LabPresentation{
 private base:Phaser.GameObjects.Container;private live:Phaser.GameObjects.Graphics;private clock=0;private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;private room!:DungeonRoom;private floor=6;private cracks:Phaser.GameObjects.Graphics;private beams:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene){this.base=scene.add.container(0,0).setDepth(2);this.cracks=scene.add.graphics().setDepth(4);this.live=scene.add.graphics().setDepth(6);this.beams=scene.add.graphics().setDepth(8)}
 build(room:DungeonRoom,floor:number){this.room=room;this.floor=floor;this.clock=0;this.base.removeAll(true);const t=floorTheme(floor),s=this.scene,g=s.add.graphics();this.base.add(g);
  g.fillStyle(t.floor,.48);g.fillRect(80,140,960,450);
  // Service lanes and inspection grates provide orientation without covering hazards.
  for(const x of [170,890]){g.fillStyle(0x060c13,.35);g.fillRect(x,148,60,432);g.lineStyle(1,t.light,.09);for(let y=150;y<580;y+=12)g.lineBetween(x,y,x+60,y)}
  g.lineStyle(2,t.accent,.18);g.strokeRect(260,175,600,380);g.lineBetween(560,175,560,555);
  for(const x of [155,350,770,965]){
   g.fillStyle(0x030710,.5);g.fillEllipse(x+9,192,88,28);g.fillStyle(0x111c29,.95);g.fillRoundedRect(x-28,146,56,43,5);g.lineStyle(2,t.accent,.5);g.strokeRoundedRect(x-28,146,56,43,5);
   if(t.feature==='pods'||t.feature==='tanks'){g.fillStyle(t.light,.17);g.fillRoundedRect(x-20,150,40,30,8);g.lineStyle(1,t.light,.65);g.strokeEllipse(x,151,40,9);g.lineBetween(x-14,156,x-14,174)}
   else if(t.feature==='shelves'){for(let y=152;y<182;y+=10){g.lineStyle(2,t.accent,.7);g.lineBetween(x-21,y,x+21,y);for(let j=0;j<4;j++){g.fillStyle(t.light,.28);g.fillRect(x-18+j*10,y-4,6,5)}}}
   else if(t.feature==='coils'){g.lineStyle(2,t.light,.6);for(let r=5;r<23;r+=5)g.strokeEllipse(x,168,r*2,r);g.fillStyle(t.light,.6);g.fillCircle(x,168,4)}
   else if(t.feature==='consoles'){g.fillStyle(t.light,.2);g.fillRect(x-21,151,42,22);g.lineStyle(1,t.light,.7);g.lineBetween(x-16,163,x-6,163);g.lineBetween(x-3,157,x+17,157)}
   else{g.lineStyle(2,t.accent,.5);g.strokePoints([{x:x-24,y:178},{x:x-9,y:159},{x:x+6,y:182},{x:x+25,y:152}],false)}
  }
  // Broken overhead cable and its offset floor shadow.
  for(const offset of [5,0]){g.lineStyle(offset?5:2,offset?0x000000:t.accent,offset?.22:.55);g.strokePoints([{x:88+offset,y:245+offset},{x:140+offset,y:249+offset},{x:180+offset,y:232+offset},{x:205+offset,y:258+offset}],false)}
  if(floor<=3){g.lineStyle(3,0x080d15,.65);g.strokePoints([{x:820,y:560},{x:790,y:520},{x:815,y:492},{x:766,y:460},{x:784,y:425}],false);g.lineStyle(1,t.light,.15);g.lineBetween(815,492,850,475)}
  this.base.add(s.add.text(560,151,`B${floor} / ${t.sign}`,{fontFamily:'monospace',fontSize:'10px',color:'#b5c6d0'}).setOrigin(.5).setAlpha(.65));
  if(room.kind==='boss'&&floor>1){g.fillStyle(0x060a12,.8);g.fillRoundedRect(490,306,140,118,12);g.lineStyle(2,t.light,.35);g.strokeRoundedRect(490,306,140,118,12);for(let i=0;i<4;i++){g.lineStyle(1,0x66778a,.3);g.lineBetween(503,325+i*25,617,325+i*25)}}
  this.refreshProps();
 }
 refreshProps(){const g=this.cracks;g.clear();if(!this.room)return;const state=roomEnvironment(this.room),t=floorTheme(this.floor);
  for(const p of breakableProps(this.room)){if(state.broken&(1<<p.id)){g.fillStyle(0x04090f,.35);g.fillEllipse(p.x,p.y+9,38,14);for(let i=0;i<6;i++){const x=p.x+Math.sin(i*9+p.id)*20,y=p.y+Math.cos(i*7)*11;g.fillStyle(i%2?t.accent:0x526373,.7);g.fillTriangle(x,y,x+6,y+2,x+2,y-4)}continue}
   g.fillStyle(0x020609,.45);g.fillEllipse(p.x+7,p.y+16,40,15);g.fillStyle(p.kind==='crate'?0x3d4f5a:0x354d50,1);g.fillRoundedRect(p.x-15,p.y-15,30,30,p.kind==='crate'?2:9);g.lineStyle(2,t.accent,.65);g.strokeRoundedRect(p.x-15,p.y-15,30,30,p.kind==='crate'?2:9);g.lineStyle(2,t.light,.3);g.lineBetween(p.x-11,p.y-9,p.x+9,p.y-9);if(p.kind==='crate'){g.lineBetween(p.x-12,p.y-12,p.x+12,p.y+12);g.lineBetween(p.x+12,p.y-12,p.x-12,p.y+12)}else{g.fillStyle(t.light,.7);g.fillRect(p.x-5,p.y-5,10,6)}
  }
 }
 update(dt:number,active:Interaction|undefined,pending:boolean,cleared:boolean){if(!this.room)return;this.clock+=dt;const t=floorTheme(this.floor),state=roomEnvironment(this.room),g=this.live;g.clear();this.beams.clear();const pulse=.6+Math.sin(this.clock*2)*.15;
  for(const x of [155,350,770,965]){g.fillStyle(t.light,state.powerOff?.025:.055);g.fillTriangle(x-27,145,x-75,245,x+75,245);g.fillStyle(t.light,state.powerOff?.18:pulse*.75);g.fillRect(x-20,142,40,3)}
  // Dust drifts slowly; the array is fixed and independent of frame rate.
  if(!this.reducedMotion)for(let i=0;i<18;i++){const x=115+(i*137%870)+Math.sin(this.clock*.2+i)*9,y=180+(i*79+this.clock*4)%370;g.fillStyle(t.light,.16);g.fillCircle(x,y,1)}
  if(this.room.kind==='combat'){g.fillStyle(0x07121c,.95);g.fillRect(865,185,30,30);g.lineStyle(2,state.powerOff?0x526774:0xe6bc79,.8);g.strokeRect(865,185,30,30);g.lineStyle(3,state.powerOff?0x526774:0xe6bc79,1);g.lineBetween(880,191,880,state.powerOff?207:199)}
  if(pending){const y=365+Math.sin(this.clock*3)*3;g.fillStyle(0x000000,.3);g.fillEllipse(560,388,68,18);g.lineStyle(2,0xf4b8df,pulse);g.strokeEllipse(560,388,64,18);g.fillStyle(0x203749,1);g.fillRoundedRect(541,y-17,38,34,10);g.lineStyle(2,0xf4b8df,.9);g.strokeRoundedRect(541,y-17,38,34,10);g.fillStyle(0xf4b8df,.85);g.fillCircle(560,y,6);this.beams.fillStyle(0xf4b8df,.045);this.beams.fillTriangle(560,290,530,385,590,385)}
  if(this.room.kind==='boss'&&cleared&&this.floor>1){g.lineStyle(3,t.light,pulse);g.strokeRoundedRect(495,310,130,110,10);for(let i=0;i<3;i++){const y=333+((this.clock*24+i*25)%65);g.lineStyle(2,t.light,.55);g.strokePoints([{x:545,y:y+6},{x:560,y},{x:575,y:y+6}],false)}}
  if(active){g.lineStyle(2,0xf6ead3,.8);g.strokeEllipse(active.x,active.y+22,66,16)}
 }
}
