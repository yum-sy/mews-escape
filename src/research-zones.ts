import Phaser from 'phaser';
import type {ResearchZone} from './research-patterns';
import type {Vec} from './combat';
import {researchZonePhase,researchZoneHits} from './research-zone-geometry';
export const MAX_RESEARCH_ZONES=12;
/** One bounded graphics batch, identical capsule geometry for drawing and collision. */
export class ResearchZones{
 private zones:(ResearchZone&{age:number})[]=[];private g:Phaser.GameObjects.Graphics;
 constructor(scene:Phaser.Scene){this.g=scene.add.graphics().setDepth(7)}
 add(z:ResearchZone){if(this.zones.length<MAX_RESEARCH_ZONES)this.zones.push({...z,age:0})}
 clear(){this.zones=[];this.g.clear()}
 update(dt:number,p:Vec){const g=this.g;g.clear();const hits:ResearchZone[]=[];
  for(const z of this.zones){z.age+=dt;const phase=researchZonePhase(z,z.age);if(phase==='expired')continue;
   const active=phase==='active',fade=Math.min(1,(z.warning+z.life-z.age)/.45),progress=Math.min(1,z.age/z.warning),color=z.style==='web'?0xd6b1e1:z.style==='gas'?0xaf88c7:0xa4b66c,dx=z.b.x-z.a.x,dy=z.b.y-z.a.y,len=Math.hypot(dx,dy),nx=-dy/(len||1),ny=dx/(len||1);
   g.lineStyle(z.r*2+4,0x15202a,.7*fade);g.lineBetween(z.a.x,z.a.y,z.b.x,z.b.y);g.fillStyle(0x15202a,.55*fade);g.fillCircle(z.a.x,z.a.y,z.r+2);g.fillCircle(z.b.x,z.b.y,z.r+2);
   g.lineStyle(z.r*2,color,(active?.2:.06)*fade);g.lineBetween(z.a.x,z.a.y,z.b.x,z.b.y);
   if(z.style==='web'){
    g.lineStyle(active?3:1.5,active?color:0xe5d1a3,(active?.95:.6)*fade);
    for(const side of [-1,1])g.lineBetween(z.a.x+nx*z.r*side,z.a.y+ny*z.r*side,z.b.x+nx*z.r*side,z.b.y+ny*z.r*side);
    const count=Math.max(2,Math.ceil(len/16));for(let i=0;i<count;i++){const t=i/count,u=(i+1)/count;g.lineBetween(z.a.x+dx*t+nx*z.r,z.a.y+dy*t+ny*z.r,z.a.x+dx*u-nx*z.r,z.a.y+dy*u-ny*z.r);g.lineBetween(z.a.x+dx*t-nx*z.r,z.a.y+dy*t-ny*z.r,z.a.x+dx*u+nx*z.r,z.a.y+dy*u+ny*z.r)}
    for(const end of [z.a,z.b]){g.fillStyle(color,.9*fade);g.fillCircle(end.x,end.y,4)}
    if(!active){g.lineStyle(2,color,.7);g.lineBetween(z.origin.x,z.origin.y,z.origin.x+(z.a.x-z.origin.x)*progress,z.origin.y+(z.a.y-z.origin.y)*progress)}
   }else{
    const outline:Vec[]=[],heading=Math.atan2(dy,dx);for(const [end,offset] of [[z.b,-Math.PI/2],[z.a,Math.PI/2]] as const)for(let j=0;j<=12;j++){const a=heading+offset+j*Math.PI/12;outline.push({x:end.x+Math.cos(a)*z.r,y:end.y+Math.sin(a)*z.r})}g.lineStyle(2,active?color:0xffd59b,(active?.7:.75)*fade);g.strokePoints(outline,true);
    const count=Math.max(1,Math.ceil(len/(z.r*.65)));
    for(let i=0;i<=count;i++){const t=i/count,x=z.a.x+dx*t,y=z.a.y+dy*t;if(active){g.fillStyle(color,.24*fade);g.fillCircle(x,y,z.r);for(let k=0;k<3;k++){const a=k*2.1+z.age*.9+i;g.fillStyle(k%2?0xd3b5e0:color,.4*fade);g.fillCircle(x+Math.cos(a)*z.r*.45,y+Math.sin(a)*z.r*.4,z.r*(z.style==='gas'?.4:.22))}}}
    if(!active&&z.style==='sludge'){const x=z.origin.x+(z.a.x-z.origin.x)*progress,y=z.origin.y+(z.a.y-z.origin.y)*progress-Math.sin(progress*Math.PI)*75;g.fillStyle(color,.95);g.fillCircle(x,y,8);g.fillStyle(0xe8edbb,.8);g.fillCircle(x-2,y-3,2)}
    if(!active&&z.style==='gas'){g.fillStyle(color,.35);for(let k=0;k<4;k++){const t=progress*k/4;g.fillCircle(z.a.x+dx*t,z.a.y+dy*t,z.r*(.2+progress*.3))}}
   }
   if(researchZoneHits(z,z.age,p))hits.push(z);
  }
  this.zones=this.zones.filter(z=>researchZonePhase(z,z.age)!=='expired');return hits;
 }
}
