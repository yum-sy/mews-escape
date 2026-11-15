import type {WeaponPath} from './weapons';
import Phaser from 'phaser';
import type {Attack} from './moves';
import {techniqueMarks,presentation,FORMS,type Mark,type Presentation} from './techniques';
type Point={x:number;y:number};
export interface VisualShot{sprite:Point;v:Point;hostile:boolean;attack:Attack;trail:Point[];critical:boolean;child?:boolean}
type Particle={x:number;y:number;vx:number;vy:number;age:number;life:number;color:number;size:number;ring:boolean;shape?:string};
export function effectPalette(a:Attack){return [...new Set([a.color,...(a.burn?[0xff843e]:[]),...(a.slow?[0x8deaff]:[]),...(a.chain?[0xffe568]:[]),...(a.poison?[0xc780ff]:[]),...(a.lifesteal?[0x8cf5b1]:[])])]}
export class CombatEffects{
 private channelG:Phaser.GameObjects.Graphics;private channels:WeaponPath[]=[];private channelAge=0;private g:Phaser.GameObjects.Graphics;private particles:Particle[]=[];private clock=0;private links:{a:Point;b:Point;age:number;life:number;drain:boolean}[]=[];private awards:{x:number;y:number;age:number;visual:Presentation}[]=[];
 constructor(scene:Phaser.Scene){this.channelG=scene.add.graphics().setDepth(14);this.g=scene.add.graphics().setDepth(14)}
 clear(){this.setChannels([]);this.particles=[];this.links=[];this.awards=[];this.g.clear()}
 setChannels(paths:WeaponPath[]){this.channels=paths;this.channelAge=0;this.drawChannels(1)}
 fadeChannels(dt:number){this.channelAge+=dt;this.drawChannels(Math.max(0,1-this.channelAge/.12))}
 private drawChannels(globalAlpha:number){let alpha=globalAlpha;
  const g=this.channelG;g.clear();if(alpha<=0)return;
  for(const path of this.channels){alpha=globalAlpha*(path.opacity??1);const points=path.points,flame=path.kind==='flame',arc=path.kind==='arc';
   for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],t=i/points.length,pulse=Math.sin(this.clock*24-i*.8);
    g.lineStyle(to.width*2,path.color,alpha*(flame?.07:.16));g.lineBetween(from.x,from.y,to.x,to.y);
    g.lineStyle(flame?to.width*1.3:arc?3:Math.max(2,to.width*.65),flame?0xff9b39:path.color,alpha*(flame?.15:.85));g.lineBetween(from.x,from.y,to.x,to.y);
    if(!flame){g.lineStyle(arc?1:2,0xf3ffff,alpha*.85);const j=arc?pulse*6:0;g.lineBetween(from.x,from.y, to.x+j,to.y-j)}

    if(path.kind==='beam'&&i%7===0){g.lineStyle(1.5,0xcfffff,alpha*.8);const r=4+pulse*2;g.strokePoints([{x:to.x-r,y:to.y},{x:to.x,y:to.y-r},{x:to.x+r,y:to.y},{x:to.x,y:to.y+r}],true)}
    if(path.kind==='water'&&i%4===0){g.fillStyle(0xd3faff,alpha*.7);g.fillCircle(to.x+pulse*3,to.y-pulse*3,2)}
    if(path.kind==='pulse'&&i%3===0){g.fillStyle(0xf8aaff,alpha*.7);g.fillCircle(to.x+pulse*5,to.y-pulse*5,3)}
    if(path.kind==='tether'&&i%6===Math.floor(this.clock*25)%6){g.fillStyle(0xccffa9,alpha);g.fillEllipse(to.x,to.y,8,4)}
    if(i%13===Math.floor(this.clock*24)%13){const a=path.attack;for(const [enabled,color,offset] of [[a.burn,0xff8c45,-8],[a.slow,0xa8f4ff,8],[a.poison,0xd68dff,-13],[a.lifesteal,0x9afaac,13]] as number[][]){if(enabled){g.fillStyle(color,alpha*.85);g.fillCircle(to.x+offset,to.y-offset,2.5)}}}
   }
   if(flame&&points.length>1)for(let k=0;k<28;k++){
    const t=(k/28+this.clock*1.8)%1,index=Math.min(points.length-1,Math.max(1,Math.floor(t*(points.length-1)))),p=points[index],prev=points[index-1],angle=Math.atan2(p.y-prev.y,p.x-prev.x),co=Math.cos(angle),si=Math.sin(angle),offset=Math.sin(k*17.3+this.clock*3)*p.width*.6,x=p.x-si*offset,y=p.y+co*offset,r=(3+p.width*.32)*(1-t*.3),length=r*2.4;
    g.fillStyle(k%3?0xff842e:0xffd576,alpha*(.65-t*.3));g.fillTriangle(x+co*length,y+si*length,x-co*r-si*r,y-si*r+co*r,x-co*r+si*r,y-si*r-co*r);
    g.fillStyle(0xffdd8d,alpha*(1-t)*.6);g.fillCircle(x-co*r*.4,y-si*r*.4,r*.5);
   }
  }
 }
 impact(x:number,y:number,a:Attack,critical=false){
  const colors=effectPalette(a),count=critical?16:9;
  for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+Math.random()*.3,speed=55+Math.random()*110;this.add({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.22+Math.random()*.2,color:colors[i%colors.length],size:critical?4:2.5,ring:false,shape:FORMS[a.visual.form].shape})}
  this.add({x,y,vx:0,vy:0,age:0,life:.25,color:a.color,size:critical?32:18,ring:true});
 }
 upgrade(x:number,y:number,a:Attack,id?:string){const visual=id&&id in FORMS?presentation([id]):a.visual;this.awards.push({x,y,age:0,visual});if(this.awards.length>3)this.awards.shift();for(let i=0;i<24;i++){const t=i*Math.PI/12;this.add({x,y,vx:Math.cos(t)*85,vy:Math.sin(t)*85,age:0,life:.7,color:FORMS[visual.form].color,size:3,ring:false,shape:FORMS[visual.form].shape})}}
 private add(p:Particle){if(this.particles.length>=360)this.particles.shift();this.particles.push(p)}
 bolt(a:Point,b:Point){this.links.push({a:{x:a.x,y:a.y},b:{x:b.x,y:b.y},age:0,life:.2,drain:false});if(this.links.length>32)this.links.shift()}
 siphon(a:Point,b:Point){this.links.push({a:{x:a.x,y:a.y},b:{x:b.x,y:b.y},age:0,life:.45,drain:true});if(this.links.length>32)this.links.shift()}
 private marks(marks:Mark[],x:number,y:number,angle:number,alpha=1){const g=this.g,co=Math.cos(angle),si=Math.sin(angle),point=(u:number,v:number)=>({x:x+u*co-v*si,y:y+u*si+v*co});for(const m of marks){if(m.kind==='circle'){const p=point(m.points[0],m.points[1]);if(m.fill){g.fillStyle(m.color,m.alpha*alpha);g.fillCircle(p.x,p.y,m.points[2])}else{g.lineStyle(m.width,m.color,m.alpha*alpha);g.strokeCircle(p.x,p.y,m.points[2])}}else{const points:Point[]=[];for(let i=0;i<m.points.length;i+=2)points.push(point(m.points[i],m.points[i+1]));if(m.fill){g.fillStyle(m.color,m.alpha*alpha);g.fillPoints(points,true)}else{g.lineStyle(m.width,m.color,m.alpha*alpha);g.strokePoints(points,false)}}}}
 render(dt:number,shots:VisualShot[],enemies:{sprite:Point;hp:number;burn:number;slow:number;poison:number;radius:number}[]){
  this.clock+=dt;const g=this.g;g.clear();
  for(const s of shots){if(s.hostile)continue;const a=s.attack,p=s.sprite,r=a.size+Math.min(5,(a.damage-1)*1.2+a.burn*.5+a.poison*.4+a.slow*2),angle=Math.atan2(s.v.y,s.v.x);
   s.trail.push({x:p.x,y:p.y});if(s.trail.length>9)s.trail.shift();
   for(let i=1;i<s.trail.length;i++){const t=i/s.trail.length,from=s.trail[i-1],to=s.trail[i];g.lineStyle(Math.max(1,r*t*.7),a.color,t*(s.child?.2:.45));g.lineBetween(from.x,from.y,to.x,to.y)}
   g.fillStyle(a.color,s.child?.035:.1);g.fillCircle(p.x,p.y,r*2.5);
   this.marks(techniqueMarks(a.visual,this.clock,r),p.x,p.y,angle,s.child?.5:1);
   if(s.child)continue;
   // Secondary effects stay recognizable even when another move owns the main silhouette.
   const side=(offset:number)=>({x:p.x-Math.sin(angle)*offset,y:p.y+Math.cos(angle)*offset});
   if(a.burn){const q=side(r+5);g.fillStyle(0xff914d,.8);g.fillTriangle(q.x-3,q.y+4,q.x+3,q.y+4,q.x,q.y-6)}
   if(a.slow){const q=side(-r-5);g.lineStyle(1.2,0xb4f6ff,.9);g.lineBetween(q.x-4,q.y,q.x+4,q.y);g.lineBetween(q.x,q.y-4,q.x,q.y+4)}
   if(a.poison){const q=side(r+10);g.lineStyle(1,0xd48bff,.8);g.strokeCircle(q.x,q.y,3)}
   if(a.lifesteal){const q=side(-r-10);g.fillStyle(0x9bf4b2,.8);g.fillEllipse(q.x,q.y,7,3)}
   if(a.chain){const q=side(r+4);g.lineStyle(1.2,0xffec7b,.9);g.strokePoints([{x:q.x-8,y:q.y},{x:q.x-3,y:q.y-5},{x:q.x,y:q.y+3},{x:q.x+7,y:q.y-3}],false)}
   if(a.homing&&a.visual.form!=='swift'){g.lineStyle(1,0xffe7a5,.75);g.strokeCircle(p.x,p.y,r+7)}
   if(a.split){g.lineStyle(1,0xd7baff,.8);g.lineBetween(p.x-Math.cos(angle)*r*2,p.y-Math.sin(angle)*r*2,p.x-Math.cos(angle+.4)*r*3,p.y-Math.sin(angle+.4)*r*3);g.lineBetween(p.x-Math.cos(angle)*r*2,p.y-Math.sin(angle)*r*2,p.x-Math.cos(angle-.4)*r*3,p.y-Math.sin(angle-.4)*r*3)}
   if(a.visual.levels.agility){g.lineStyle(1,0xa8f4df,.5);for(const offset of [-r-3,r+3]){const q=side(offset);g.lineBetween(q.x,q.y,q.x-Math.cos(angle)*r*3,q.y-Math.sin(angle)*r*3)}}
   if(s.critical){g.lineStyle(2,0xffffff,.8);g.strokeCircle(p.x,p.y,r+6)}
   if(a.knockback){g.lineStyle(2,0xb2b5ff,.6);g.strokeEllipse(p.x,p.y,r*3,r*2)}
   if(a.bounce){g.lineStyle(1,0x8fffe4,.8);g.strokeCircle(p.x,p.y,r+3)}
  }
  for(const e of enemies){if(e.hp<=0)continue;const p=e.sprite;
   if(e.slow){g.lineStyle(2,0x9aeaff,.7);g.strokeEllipse(p.x,p.y+e.radius*.65,e.radius*2.5,10);for(let i=0;i<3;i++){const x=p.x+(i-1)*e.radius*.7;g.fillStyle(0xa3edff,.6);g.fillTriangle(x-4,p.y+e.radius,x+4,p.y+e.radius,x,p.y+e.radius-14)}}
   for(let i=0;i<3;i++){const t=(this.clock*1.7+i/3)%1,x=p.x+Math.sin(i*4+this.clock)*e.radius*.7,y=p.y+e.radius-t*e.radius*2;
    if(e.burn){g.fillStyle(i%2?0xffd66c:0xff7846,1-t);g.fillTriangle(x-4,y+5,x+4,y+5,x+Math.sin(this.clock*8)*3,y-8)}
    if(e.poison){g.lineStyle(2,0xcf8aff,1-t);g.strokeCircle(x+6,y,3+t*3)}
   }
  }
  for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const t=p.age/p.life;if(t>=1)continue;if(p.ring){g.lineStyle(2,p.color,1-t);g.strokeCircle(p.x,p.y,4+p.size*t)}else{g.fillStyle(p.color,1-t);const size=p.size*(1-t*.5);if(['ember','plume'].includes(p.shape??''))g.fillTriangle(p.x-size,p.y+size,p.x+size,p.y+size,p.x,p.y-size*2);else if(['snow','lance','needle'].includes(p.shape??''))g.fillPoints([{x:p.x,y:p.y-size*2},{x:p.x+size,y:p.y},{x:p.x,y:p.y+size*2},{x:p.x-size,y:p.y}],true);else if(['bolt','fork'].includes(p.shape??'')){g.lineStyle(1.5,p.color,1-t);g.lineBetween(p.x-size*2,p.y-size,p.x+size,p.y+size)}else if(p.shape==='leaf')g.fillEllipse(p.x,p.y,size*3,size);else g.fillCircle(p.x,p.y,size)}}
  for(const link of this.links){link.age+=dt;const progress=link.age/link.life;if(progress>=1)continue;const points:Point[]=[];for(let i=0;i<11;i++){const t=i/10,j=i===0||i===10?0:Math.sin(i*7.1+this.clock*10)*(link.drain?8:12);points.push({x:link.a.x+(link.b.x-link.a.x)*t+j,y:link.a.y+(link.b.y-link.a.y)*t-j})}g.lineStyle(link.drain?1:2,link.drain?0x9cf7b0:0xffea6d,(1-progress)*.8);g.strokePoints(points,false);if(link.drain){for(let i=0;i<3;i++){const t=Math.min(1,progress*1.4-i*.12);if(t<0)continue;g.fillStyle(0xc4ffaf,1-progress*.5);g.fillCircle(link.a.x+(link.b.x-link.a.x)*t,link.a.y+(link.b.y-link.a.y)*t,3)}}}
  this.links=this.links.filter(l=>l.age<l.life);
  for(const award of this.awards){award.age+=dt;const t=award.age/1.05;if(t<1){this.marks(techniqueMarks(award.visual,this.clock,18),award.x,award.y-45-t*28,-Math.PI/2,1-t);g.lineStyle(2,FORMS[award.visual.form].color,(1-t)*.65);g.strokeCircle(award.x,award.y,15+t*58)}}this.awards=this.awards.filter(a=>a.age<1.05);
  this.particles=this.particles.filter(p=>p.age<p.life);
 }
}
