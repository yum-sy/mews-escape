import {roomDesign} from './room-designs';
import {lightProp,PROP_SIZE} from './prop-lighting';
import {doorBlockReason} from './progression';
import Phaser from 'phaser';
import {roomReward} from './rewards';
import {DIRECTIONS,type DungeonRoom,type Direction} from './dungeon';
import {floorTheme,breakableProps,roomEnvironment,type Interaction} from './environment';
export class LabPresentation{
 private props!:Phaser.GameObjects.Container;private items!:Phaser.GameObjects.Container;private consoleArt?:Phaser.GameObjects.Image;private rewardArt?:Phaser.GameObjects.Image;
 private rewardLabel:Phaser.GameObjects.Text;private doors:Phaser.GameObjects.Graphics;private doorText=new Map<Direction,Phaser.GameObjects.Text>();private neighbors:DungeonRoom[]=[];private moves:readonly string[]=[];private doorStamp='';private doorOpen=new Map<Direction,number>();
 private base:Phaser.GameObjects.Container;private live:Phaser.GameObjects.Graphics;private clock=0;private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;private room!:DungeonRoom;private floor=6;private cracks:Phaser.GameObjects.Graphics;private beams:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene){this.props=scene.add.container(0,0).setDepth(6);this.items=scene.add.container(0,0).setDepth(7);this.rewardLabel=scene.add.text(560,406,'',{fontFamily:'sans-serif',fontSize:'11px',color:'#b9c9c5'}).setOrigin(.5).setDepth(8);this.doors=scene.add.graphics().setDepth(7);for(const dir of DIRECTIONS)this.doorText.set(dir,scene.add.text(0,0,'',{fontFamily:'sans-serif',fontSize:'15px',color:'#d4e8e1',align:'center',backgroundColor:'#101d29'}).setOrigin(.5).setDepth(8));this.base=scene.add.container(0,0).setDepth(2);this.cracks=scene.add.graphics().setDepth(4);this.live=scene.add.graphics().setDepth(6);this.beams=scene.add.graphics().setDepth(8)}
 build(room:DungeonRoom,floor:number){this.room=room;this.floor=floor;this.doorOpen.clear();this.doorStamp='';this.clock=0;this.base.removeAll(true);this.items.removeAll(true);this.consoleArt=undefined;this.rewardArt=undefined;const t=floorTheme(floor),s=this.scene,g=s.add.graphics();this.base.add(g);
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
  this.base.add(s.add.text(560,151,`B${floor} / ${room.kind==='combat'?roomDesign(room.seed).name:room.service==='medical'?'의무실':t.sign}`,{fontFamily:'monospace',fontSize:'10px',color:'#b5c6d0'}).setOrigin(.5).setAlpha(.65));
  if(room.kind==='boss'&&floor>1){g.fillStyle(0x060a12,.8);g.fillRoundedRect(490,306,140,118,12);g.lineStyle(2,t.light,.35);g.strokeRoundedRect(490,306,140,118,12);for(let i=0;i<4;i++){g.lineStyle(1,0x66778a,.3);g.lineBetween(503,325+i*25,617,325+i*25)}}
  if(room.kind==='combat'){g.fillStyle(0x040c12,.35);g.fillEllipse(884,229,65,13);this.consoleArt=lightProp(s.add.image(880,199,'lab-props','0').setDisplaySize(PROP_SIZE.console,PROP_SIZE.console));this.items.add(this.consoleArt)}
  const reward=roomReward(room,floor);if(reward!=='none'){const size=reward==='heart'?PROP_SIZE.potion:reward==='key'?PROP_SIZE.key:PROP_SIZE.tm;this.rewardArt=lightProp(s.add.image(560,365,'lab-props',reward==='heart'||room.service==='medical'?'5':reward==='key'?'6':'4').setDisplaySize(size,size).setVisible(false));this.items.add(this.rewardArt)}
  this.refreshProps();
 }
 setDoors(rooms:DungeonRoom[],moves:readonly string[]=[]){this.neighbors=rooms;this.moves=moves;this.doorStamp=''}
 private drawDoors(dt:number){const stamp=[this.room.cleared,...this.neighbors.map(r=>`${r.visited}:${r.cleared}`),this.moves.includes('survey')].join('|');const moving=[...this.doorOpen.values()].some(p=>p>0&&p<1);if(stamp===this.doorStamp&&!moving)return;this.doorStamp=stamp;const g=this.doors;g.clear();
  for(const dir of DIRECTIONS){const next=this.room.doors[dir],label=this.doorText.get(dir)!;label.setVisible(next!==undefined);if(next===undefined)continue;const dest=this.neighbors[next];if(!dest)continue;
   const unlocked=!doorBlockReason(this.neighbors,this.room,dir),progress=this.doorOpen.get(dir)??(unlocked?1:0),p=Phaser.Math.Clamp(progress+(unlocked?1:-1)*dt*2.5,0,1);this.doorOpen.set(dir,p);
   const center={up:{x:560,y:136},down:{x:560,y:590},left:{x:78,y:364},right:{x:1042,y:364}}[dir],angle={up:0,down:Math.PI,left:-Math.PI/2,right:Math.PI/2}[dir],co=Math.cos(angle),si=Math.sin(angle);
   const point=(u:number,v:number)=>({x:center.x+u*co-v*si,y:center.y+u*si+v*co});
   const rect=(x:number,y:number,w:number,h:number,color:number,alpha=1)=>{g.fillStyle(color,alpha);g.fillPoints([point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)],true)};
   rect(-74,-22,148,80,0x000000,.45);rect(-68,-26,136,76,0x050a11);rect(-59,-19,118,64,0x516774);rect(-49,-21,98,70,0x060e18);
   rect(-43,-18,86,65,unlocked?0x244b47:0x1c2836,.9);for(let i=0;i<4;i++)rect(-42,-12+i*14,84,2,0x55777b,.5);
   // Leaves retract behind the frame; recessed windows and rails remain legible.
   rect(-56,-25,112,4,0xa1b5bd);rect(-56,43,112,5,0x8196a0);
   for(let i=0;i<6;i++){rect(-55+i*19,49,10,4,0xcbb16d,.75)}
   const panel=49*(1-p);rect(-49,-20,panel,61,0x697681);rect(49-panel,-20,panel,61,0x697681);if(panel>6){rect(-49,-12,panel,4,0xb29b61);rect(49-panel,-12,panel,4,0xb29b61);rect(-49,25,panel,4,0x263744);rect(49-panel,25,panel,4,0x263744)}
   if(panel>17){rect(-49,-3,panel-7,15,0x142733);rect(56-panel,-3,panel-7,15,0x142733);rect(-48,-2,panel-9,2,0x9ec0c9,.5);rect(57-panel,-2,panel-9,2,0x9ec0c9,.5)}
   const color=unlocked?0x85f0cb:0xe7a075;rect(-64,-15,5,48,color);rect(59,-15,5,48,color);
   if(unlocked){g.lineStyle(3,0xb9ffe3,.9);for(const v of [11,27])g.strokePoints([point(-12,v+7),point(0,v),point(12,v+7)],false)}else{const c=point(0,11);g.lineStyle(3,color,1);g.strokeCircle(c.x,c.y-6,7);g.fillStyle(color,1);g.fillRoundedRect(c.x-10,c.y-3,20,15,3)}
   const q=point(0,dir==='left'||dir==='right'?100:67);label.setPosition(q.x,q.y);label.setText(!unlocked?'':({up:'↑',down:'↓',left:'←',right:'→'}[dir]));label.setColor(unlocked?'#b4f3d9':'#efb48b');
  }
 }
 refreshProps(){const g=this.cracks;g.clear();this.props.removeAll(true);if(!this.room)return;const state=roomEnvironment(this.room);
  for(const p of breakableProps(this.room)){if(state.broken&(1<<p.id)){g.fillStyle(0x04090f,.4);g.fillEllipse(p.x+5,p.y+20,68,25);for(let i=0;i<9;i++){const x=p.x+Math.sin(i*9+p.id)*30,y=p.y+Math.cos(i*7)*18;g.fillStyle(i%2?0x96b5b4:0x526373,.8);g.fillTriangle(x,y,x+10,y+4,x+3,y-7)}continue}
   const size=p.kind==='crate'?PROP_SIZE.crate:PROP_SIZE.canister;g.fillStyle(0x020a10,.22);g.fillEllipse(p.x+4,p.y+24,51,12);this.props.add(lightProp(this.scene.add.image(p.x,p.y,'lab-props',p.kind==='crate'?'7':'8').setDisplaySize(size,size)));
  }
 }

 update(dt:number,active:Interaction|undefined,pending:boolean,cleared:boolean){if(!this.room)return;this.clock+=dt;this.drawDoors(dt);const t=floorTheme(this.floor),state=roomEnvironment(this.room),g=this.live;g.clear();this.beams.clear();const pulse=.6+Math.sin(this.clock*2)*.15;
  for(const x of [155,350,770,965]){g.fillStyle(t.light,state.powerOff?.025:.055);g.fillTriangle(x-27,145,x-75,245,x+75,245);g.fillStyle(t.light,state.powerOff?.18:pulse*.75);g.fillRect(x-20,142,40,3)}
  // Dust drifts slowly; the array is fixed and independent of frame rate.
  if(!this.reducedMotion)for(let i=0;i<18;i++){const x=115+(i*137%870)+Math.sin(this.clock*.2+i)*9,y=180+(i*79+this.clock*4)%370;g.fillStyle(t.light,.16);g.fillCircle(x,y,1)}
  if(this.consoleArt)lightProp(this.consoleArt,state.powerOff);
  const reward=roomReward(this.room,this.floor);this.rewardLabel.setVisible(pending);if(pending)this.rewardLabel.setText({none:'',heart:'회복약',key:'연구소 키',treasure:this.room.service==='medical'?'의무실 · 열쇠 1':this.room.opened?'기술머신':'기술머신 · 열쇠 1',boss:'기술머신'}[reward]);
  this.rewardArt?.setVisible(pending);if(pending){g.fillStyle(0x020a10,.3);g.fillEllipse(563,388,reward==='heart'?31:48,10);if(active?.kind==='reward'){g.lineStyle(1,0xc6d3b5,.55);g.strokeEllipse(560,389,56,12)}}
  if(this.room.kind==='boss'&&cleared&&this.floor>1&&!pending){g.lineStyle(3,t.light,pulse);g.strokeRoundedRect(495,310,130,110,10);for(let i=0;i<3;i++){const y=333+((this.clock*24+i*25)%65);g.lineStyle(2,t.light,.55);g.strokePoints([{x:545,y:y+6},{x:560,y},{x:575,y:y+6}],false)}}
  if(active){g.lineStyle(2,0xf6ead3,.8);g.strokeEllipse(active.x,active.y+22,66,16)}
 }
}
