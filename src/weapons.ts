import type {Attack} from './moves';
import type {Vec} from './combat';
import type {Block} from './lab';
export type WeaponKind='projectile'|'flame'|'beam'|'water'|'tether'|'pulse'|'arc';
export function weaponProfile(a:Attack){
 const f=a.visual.form;
 const kind:WeaponKind=f==='flamethrower'?'flame':f==='icebeam'?'beam':f==='water'?'water':f==='drain'?'tether':f==='psybeam'?'pulse':f==='spark'||f==='thunderbolt'?'arc':'projectile';
 const interval=kind==='flame'?.075:kind==='beam'||kind==='water'||kind==='tether'?.1:kind==='pulse'?a.interval*2:kind==='arc'?a.interval*1.5:a.interval;
 const range=kind==='flame'?Math.min(350,220+(a.range-720)*.25):kind==='water'?Math.min(580,a.range*.6):kind==='tether'?Math.min(480,a.range*.5):f==='spark'?Math.min(370,a.range*.45):a.range;
 return {kind,interval,range,held:['flame','beam','water','tether'].includes(kind),pellets:f==='ice'?3:f==='flame'?2:1,speed:f==='sludge'?.55:f==='dragon'?.72:f==='poison'?1.35:1};
}
export function tickAttack(a:Attack):Attack{const p=weaponProfile(a),scale=p.interval/a.interval;return {...a,damage:a.damage*scale,knockback:a.knockback*scale};}
export interface Target extends Vec{id:number;radius:number}
export interface PathPoint extends Vec{width:number}
export interface WeaponPath{points:PathPoint[];hits:number[];kind:WeaponKind;color:number;attack:Attack;reflections:number}
export const distanceToSegment=(p:Vec,a:Vec,b:Vec)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
// Short swept segments keep damage and the rendered path on the same geometry.
export function traceWeapon(origin:Vec,angle:number,a:Attack,targets:Target[],blocks:Block[],bounds:{left:number;right:number;top:number;bottom:number}):WeaponPath{
 const p=weaponProfile(a),points:PathPoint[]=[{...origin,width:a.size}],hits:number[]=[],seen=new Set<number>();let x=origin.x,y=origin.y,heading=angle,reflections=0;
 const limit=1+a.pierce+(p.kind==='flame'?1:0),homing=a.homing+(p.kind==='tether'?1.4:0);
 for(let travelled=0;travelled<p.range;travelled+=8){
  if(homing){const target=targets.filter(t=>!seen.has(t.id)).map(t=>({t,d:Math.hypot(t.x-x,t.y-y),turn:Math.atan2(Math.sin(Math.atan2(t.y-y,t.x-x)-heading),Math.cos(Math.atan2(t.y-y,t.x-x)-heading))})).filter(t=>Math.abs(t.turn)<.65).sort((a,b)=>a.d-b.d)[0];if(target)heading+=Math.max(-.04,Math.min(.04,target.turn*homing*.025))}
  const step=Math.min(8,p.range-travelled);let nx=x+Math.cos(heading)*step,ny=y+Math.sin(heading)*step;
  if(nx<bounds.left||nx>bounds.right||ny<bounds.top||ny>bounds.bottom){if(reflections>=a.bounce)break;if(nx<bounds.left||nx>bounds.right)heading=Math.PI-heading;if(ny<bounds.top||ny>bounds.bottom)heading=-heading;reflections++;nx=Math.max(bounds.left,Math.min(bounds.right,nx));ny=Math.max(bounds.top,Math.min(bounds.bottom,ny))}
  const width=p.kind==='flame'?a.size+travelled*.13:p.kind==='water'?a.size+3:a.size;
  if(blocks.some(b=>nx>=b.x-b.w/2-width&&nx<=b.x+b.w/2+width&&ny>=b.y-b.h/2-width&&ny<=b.y+b.h/2+width))break;
  const next={x:nx,y:ny,width};const candidates=targets.filter(t=>!seen.has(t.id)&&distanceToSegment(t,{x,y},next)<=t.radius+width).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
  points.push(next);for(const t of candidates){seen.add(t.id);hits.push(t.id);if(hits.length>=limit)return{points,hits,kind:p.kind,color:a.color,attack:a,reflections}}
  x=nx;y=ny;
 }
 return{points,hits,kind:p.kind,color:a.color,attack:a,reflections};
}
