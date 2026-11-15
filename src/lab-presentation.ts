import Phaser from 'phaser';
import {roomReward} from './rewards';
import {DIRECTIONS,type DungeonRoom,type Direction} from './dungeon';
import {floorTheme,breakableProps,roomEnvironment,type Interaction} from './environment';
export class LabPresentation{
 private rewardLabel:Phaser.GameObjects.Text;private doors:Phaser.GameObjects.Graphics;private doorText=new Map<Direction,Phaser.GameObjects.Text>();private neighbors:DungeonRoom[]=[];private doorOpen=new Map<Direction,number>();
 private base:Phaser.GameObjects.Container;private live:Phaser.GameObjects.Graphics;private clock=0;private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;private room!:DungeonRoom;private floor=6;private cracks:Phaser.GameObjects.Graphics;private beams:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene){this.rewardLabel=scene.add.text(560,420,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#efd5e5',backgroundColor:'#101d29'}).setOrigin(.5).setDepth(8);this.doors=scene.add.graphics().setDepth(7);for(const dir of DIRECTIONS)this.doorText.set(dir,scene.add.text(0,0,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#d4e8e1',align:'center',backgroundColor:'#101d29'}).setOrigin(.5).setDepth(8));this.base=scene.add.container(0,0).setDepth(2);this.cracks=scene.add.graphics().setDepth(4);this.live=scene.add.graphics().setDepth(6);this.beams=scene.add.graphics().setDepth(8)}
 build(room:DungeonRoom,floor:number){this.room=room;this.floor=floor;this.doorOpen.clear();this.clock=0;this.base.removeAll(true);const t=floorTheme(floor),s=this.scene,g=s.add.graphics();this.base.add(g);
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
  if(room.kind==='combat')this.base.add(s.add.text(880,252,'전원 차단기',{fontFamily:'sans-serif',fontSize:'14px',color:'#e9ce96'}).setOrigin(.5));
  this.refreshProps();
 }
 setDoors(rooms:DungeonRoom[]){this.neighbors=rooms}
 private drawDoors(dt:number){const g=this.doors;g.clear();const left=this.neighbors.filter(r=>r.kind==='combat'&&!r.cleared).length;
  for(const dir of DIRECTIONS){const next=this.room.doors[dir],label=this.doorText.get(dir)!;label.setVisible(next!==undefined);if(next===undefined)continue;const dest=this.neighbors[next];if(!dest)continue;
   const unlocked=this.room.cleared&&!(dest.kind==='boss'&&left>0),progress=this.doorOpen.get(dir)??(unlocked?1:0),p=Phaser.Math.Linear(progress,unlocked?1:0,Math.min(1,dt*8));this.doorOpen.set(dir,p);
   const center={up:{x:560,y:136},down:{x:560,y:590},left:{x:78,y:364},right:{x:1042,y:364}}[dir],angle={up:0,down:Math.PI,left:-Math.PI/2,right:Math.PI/2}[dir],co=Math.cos(angle),si=Math.sin(angle);
   const point=(u:number,v:number)=>({x:center.x+u*co-v*si,y:center.y+u*si+v*co});
   const rect=(x:number,y:number,w:number,h:number,color:number,alpha=1)=>{g.fillStyle(color,alpha);g.fillPoints([point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)],true)};
   rect(-68,-26,136,76,0x050a11);rect(-59,-19,118,64,0x516774);rect(-49,-21,98,70,0x060e18);
   rect(-43,-18,86,65,unlocked?0x244b47:0x1c2836,.9);for(let i=0;i<4;i++)rect(-42,-12+i*14,84,2,0x55777b,.5);
   const panel=49*(1-p);rect(-49,-20,panel,61,0x697681);rect(49-panel,-20,panel,61,0x697681);if(panel>6){rect(-49,-12,panel,4,0xb29b61);rect(49-panel,-12,panel,4,0xb29b61);rect(-49,25,panel,4,0x263744);rect(49-panel,25,panel,4,0x263744)}
   const color=unlocked?0x85f0cb:0xe7a075;rect(-64,-15,5,48,color);rect(59,-15,5,48,color);
   if(unlocked){g.lineStyle(3,0xb9ffe3,.9);for(const v of [11,27])g.strokePoints([point(-12,v+7),point(0,v),point(12,v+7)],false)}else{const c=point(0,11);g.lineStyle(3,color,1);g.strokeCircle(c.x,c.y-6,7);g.fillStyle(color,1);g.fillRoundedRect(c.x-10,c.y-3,20,15,3)}
   const q=point(0,dir==='left'||dir==='right'?100:67);label.setPosition(q.x,q.y);label.setText(!this.room.cleared?'전투 중 · 잠김':dest.kind==='boss'&&left>0?`보스 · 전투방 ${left}곳 남음`:({start:'격리실',combat:dest.cleared?'정리한 방':'전투 구역',reward:'기술 보관실',boss:'보스 제어실'}[dest.kind])+' '+({up:'↑',down:'↓',left:'←',right:'→'}[dir]));label.setColor(unlocked?'#b4f3d9':'#efb48b');
  }
 }
 refreshProps(){const g=this.cracks;g.clear();if(!this.room)return;const state=roomEnvironment(this.room);
  for(const p of breakableProps(this.room)){if(state.broken&(1<<p.id)){g.fillStyle(0x04090f,.4);g.fillEllipse(p.x+5,p.y+20,68,25);for(let i=0;i<9;i++){const x=p.x+Math.sin(i*9+p.id)*30,y=p.y+Math.cos(i*7)*18;g.fillStyle(i%2?0x96b5b4:0x526373,.8);g.fillTriangle(x,y,x+10,y+4,x+3,y-7)}continue}
   g.fillStyle(0x020609,.5);g.fillEllipse(p.x+12,p.y+29,74,27);
   if(p.kind==='crate'){g.fillStyle(0x293d4e,1);g.fillPoints([{x:p.x-28,y:p.y-18},{x:p.x+20,y:p.y-25},{x:p.x+30,y:p.y-14},{x:p.x+30,y:p.y+27},{x:p.x-20,y:p.y+32},{x:p.x-28,y:p.y+20}],true);g.fillStyle(0x6c8791,1);g.fillRect(p.x-26,p.y-17,49,42);g.fillStyle(0x9aafb0,1);g.fillPoints([{x:p.x-28,y:p.y-18},{x:p.x-19,y:p.y-27},{x:p.x+30,y:p.y-27},{x:p.x+22,y:p.y-18}],true);g.lineStyle(4,0x384f60,1);g.lineBetween(p.x-22,p.y-12,p.x+18,p.y+20);g.lineBetween(p.x+18,p.y-12,p.x-22,p.y+20);g.lineStyle(2,0xc0d3cc,.6);g.strokeRect(p.x-26,p.y-17,49,42)}
   else{g.fillStyle(0x365564,1);g.fillRect(p.x-24,p.y-22,48,49);g.fillEllipse(p.x,p.y+26,48,17);g.fillStyle(0x8faeaf,1);g.fillEllipse(p.x,p.y-22,48,18);g.lineStyle(3,0xb7d4cc,.7);g.strokeEllipse(p.x,p.y-22,48,18);g.lineStyle(3,0x213c4b,1);g.strokeEllipse(p.x,p.y+11,48,14);g.fillStyle(0xe8c57c,1);g.fillTriangle(p.x,p.y-11,p.x-12,p.y+9,p.x+12,p.y+9);g.lineStyle(3,0x3b3425,1);g.lineBetween(p.x,p.y-5,p.x,p.y+2)}
  }
 }
 update(dt:number,active:Interaction|undefined,pending:boolean,cleared:boolean){if(!this.room)return;this.clock+=dt;this.drawDoors(dt);const t=floorTheme(this.floor),state=roomEnvironment(this.room),g=this.live;g.clear();this.beams.clear();const pulse=.6+Math.sin(this.clock*2)*.15;
  for(const x of [155,350,770,965]){g.fillStyle(t.light,state.powerOff?.025:.055);g.fillTriangle(x-27,145,x-75,245,x+75,245);g.fillStyle(t.light,state.powerOff?.18:pulse*.75);g.fillRect(x-20,142,40,3)}
  // Dust drifts slowly; the array is fixed and independent of frame rate.
  if(!this.reducedMotion)for(let i=0;i<18;i++){const x=115+(i*137%870)+Math.sin(this.clock*.2+i)*9,y=180+(i*79+this.clock*4)%370;g.fillStyle(t.light,.16);g.fillCircle(x,y,1)}
  if(this.room.kind==='combat'){g.fillStyle(0x07121c,.95);g.fillRoundedRect(851,163,58,70,5);g.lineStyle(2,state.powerOff?0x526774:0xe6bc79,.8);g.strokeRoundedRect(851,163,58,70,5);g.lineStyle(7,state.powerOff?0x526774:0xe6bc79,1);g.lineBetween(880,180,880,state.powerOff?215:198);g.fillStyle(state.powerOff?0x526774:0xf6d48b,1);g.fillRoundedRect(868,state.powerOff?211:192,24,10,3)}
  const reward=roomReward(this.room,this.floor);this.rewardLabel.setVisible(pending);if(pending)this.rewardLabel.setText({none:'',heart:'회복제 · HP 1',key:'열쇠',treasure:this.room.opened?'기술 캡슐':'봉인 · 열쇠 1',boss:'보스 강화 · 열쇠 1'}[reward]);
  if(pending){const y=365+Math.sin(this.clock*3)*3;g.fillStyle(0x000000,.3);g.fillEllipse(560,398,90,24);g.lineStyle(2,0xf4b8df,pulse);g.strokeEllipse(560,398,88,24);g.fillStyle(0x203749,1);g.fillRoundedRect(525,y-29,70,58,16);g.lineStyle(2,0xf4b8df,.9);g.strokeRoundedRect(525,y-29,70,58,16);g.fillStyle(0xf4b8df,.85);if(reward==='key'){g.lineStyle(4,0xffd675,1);g.strokeCircle(550,y,8);g.lineBetween(558,y,578,y);g.lineBetween(570,y,570,y+7);g.lineBetween(577,y,577,y+7)}else if(reward==='heart'){g.fillStyle(0xf8a5bf,1);g.fillRect(555,y-13,10,26);g.fillRect(547,y-5,26,10)}else{g.fillCircle(560,y,11)}this.beams.fillStyle(0xf4b8df,.045);this.beams.fillTriangle(560,290,530,385,590,385)}
  if(this.room.kind==='boss'&&cleared&&this.floor>1&&!pending){g.lineStyle(3,t.light,pulse);g.strokeRoundedRect(495,310,130,110,10);for(let i=0;i<3;i++){const y=333+((this.clock*24+i*25)%65);g.lineStyle(2,t.light,.55);g.strokePoints([{x:545,y:y+6},{x:560,y},{x:575,y:y+6}],false)}}
  if(active){g.lineStyle(2,0xf6ead3,.8);g.strokeEllipse(active.x,active.y+22,66,16)}
 }
}
