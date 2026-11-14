import Phaser from 'phaser';
import type {Attack} from './moves';
type Point={x:number;y:number};
export interface VisualShot{sprite:Point;v:Point;hostile:boolean;attack:Attack;trail:Point[];critical:boolean}
type Particle={x:number;y:number;vx:number;vy:number;age:number;life:number;color:number;size:number;ring:boolean};
export function effectPalette(a:Attack){return [...new Set([a.color,...(a.burn?[0xff843e]:[]),...(a.slow?[0x8deaff]:[]),...(a.chain?[0xffe568]:[]),...(a.poison?[0xc780ff]:[]),...(a.lifesteal?[0x8cf5b1]:[])])]}
export class CombatEffects{
 private g:Phaser.GameObjects.Graphics;private particles:Particle[]=[];private clock=0;
 constructor(scene:Phaser.Scene){this.g=scene.add.graphics().setDepth(14)}
 clear(){this.particles=[];this.g.clear()}
 impact(x:number,y:number,a:Attack,critical=false){
  const colors=effectPalette(a),count=critical?16:9;
  for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+Math.random()*.3,speed=55+Math.random()*110;this.add({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.22+Math.random()*.2,color:colors[i%colors.length],size:critical?4:2.5,ring:false})}
  this.add({x,y,vx:0,vy:0,age:0,life:.25,color:a.color,size:critical?32:18,ring:true});
 }
 upgrade(x:number,y:number,a:Attack){for(let i=0;i<32;i++){const t=i*Math.PI/16;this.add({x,y,vx:Math.cos(t)*110,vy:Math.sin(t)*110,age:0,life:.85,color:effectPalette(a)[i%effectPalette(a).length],size:3,ring:false})}this.add({x,y,vx:0,vy:0,age:0,life:.7,color:a.color,size:85,ring:true})}
 private add(p:Particle){if(this.particles.length>=360)this.particles.shift();this.particles.push(p)}
 bolt(a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y;for(let i=0;i<12;i++){const t=i/11,j=i===0||i===11?0:Math.sin(i*7.1)*12;this.add({x:a.x+dx*t+j,y:a.y+dy*t-j,vx:0,vy:0,age:0,life:.18,color:0xffed89,size:3,ring:false})}}
 render(dt:number,shots:VisualShot[],enemies:{sprite:Point;hp:number;burn:number;slow:number;poison:number;radius:number}[]){
  this.clock+=dt;const g=this.g;g.clear();
  for(const s of shots){if(s.hostile)continue;const a=s.attack,p=s.sprite,palette=effectPalette(a),r=a.size+Math.min(5,(a.damage-1)*1.2+a.burn*.5+a.poison*.4+a.slow*2),angle=Math.atan2(s.v.y,s.v.x);
   s.trail.push({x:p.x,y:p.y});if(s.trail.length>9)s.trail.shift();
   for(let i=1;i<s.trail.length;i++){const t=i/s.trail.length,from=s.trail[i-1],to=s.trail[i];g.lineStyle(Math.max(1,r*t*1.15),palette[(i+Math.floor(this.clock*12))%palette.length],t*.65);g.lineBetween(from.x,from.y,to.x,to.y)}
   g.fillStyle(a.color,.13);g.fillCircle(p.x,p.y,r*2.2);
   if(a.homing){const points:Point[]=[];for(let i=0;i<10;i++){const t=angle+this.clock*4+i*Math.PI/5,rr=i%2?r*.48:r*1.65;points.push({x:p.x+Math.cos(t)*rr,y:p.y+Math.sin(t)*rr})}g.fillStyle(0xffe7a5,1);g.fillPoints(points,true)}
   else if(a.slow||a.speed>600||a.size>5){const points=[{x:p.x+Math.cos(angle)*r*2.4,y:p.y+Math.sin(angle)*r*2.4},{x:p.x+Math.cos(angle+1.57)*r,y:p.y+Math.sin(angle+1.57)*r},{x:p.x-Math.cos(angle)*r*1.8,y:p.y-Math.sin(angle)*r*1.8},{x:p.x-Math.cos(angle+1.57)*r,y:p.y-Math.sin(angle+1.57)*r}];g.fillStyle(a.slow?0x9eeaff:a.color,1);g.fillPoints(points,true);g.lineStyle(1,0xffffff,.8);g.strokePoints(points,true)}
   else if(a.burn){g.fillStyle(0xff713e,.9);g.fillTriangle(p.x-Math.cos(angle)*r*3,p.y-Math.sin(angle)*r*3,p.x+Math.cos(angle+1.57)*r,p.y+Math.sin(angle+1.57)*r,p.x-Math.cos(angle+1.57)*r,p.y-Math.sin(angle+1.57)*r);g.fillStyle(0xffda84,1);g.fillCircle(p.x,p.y,r)}
   else{g.fillStyle(a.pierce?0x57418b:a.color,1);g.fillCircle(p.x,p.y,r);g.lineStyle(2,a.color,1);g.strokeCircle(p.x,p.y,r+2)}
   g.fillStyle(0xffffff,.95);g.fillCircle(p.x,p.y,Math.max(2,r*.35));
   const orbit=palette.slice(1);orbit.forEach((color,i)=>{const t=this.clock*9+i*Math.PI*2/orbit.length;g.fillStyle(color,.95);g.fillCircle(p.x+Math.cos(t)*(r+4),p.y+Math.sin(t)*(r+4),2.3)});
   if(a.chain){g.lineStyle(1.5,0xffec7b,.9);g.beginPath();g.moveTo(p.x-r*2,p.y);g.lineTo(p.x-r,p.y-r*1.7);g.lineTo(p.x+r*.4,p.y+r*1.5);g.lineTo(p.x+r*1.6,p.y-r);g.strokePath()}
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
  for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const t=p.age/p.life;if(t>=1)continue;if(p.ring){g.lineStyle(2,p.color,1-t);g.strokeCircle(p.x,p.y,4+p.size*t)}else{g.fillStyle(p.color,1-t);g.fillCircle(p.x,p.y,p.size*(1-t*.5))}}
  this.particles=this.particles.filter(p=>p.age<p.life);
 }
}
