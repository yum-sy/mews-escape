import {perimeterWalls,cageBlocks} from './exploration-events';
import {designedBlocks} from './room-designs';
import {ROOM} from './data';
import {rng,type DungeonRoom} from './dungeon';
import type {Vec} from './combat';
export interface Block{x:number;y:number;w:number;h:number}
export function obstacles(room:DungeonRoom):Block[]{
 if(room.kind!=='combat')return[];
 return [...designedBlocks(room.seed),...perimeterWalls(room),...cageBlocks(room)];
}
export function overlapsBlock(p:Vec,r:number,b:Block){const x=Math.max(b.x-b.w/2,Math.min(p.x,b.x+b.w/2)),y=Math.max(b.y-b.h/2,Math.min(p.y,b.y+b.h/2));return Math.hypot(p.x-x,p.y-y)<r}
export function moveWithWalls(p:Vec,v:Vec,blocks:Block[],radius:number):Vec{const n={...p};const x={x:p.x+v.x,y:p.y};if(!blocks.some(b=>overlapsBlock(x,radius,b)))n.x=x.x;const y={x:n.x,y:p.y+v.y};if(!blocks.some(b=>overlapsBlock(y,radius,b)))n.y=y.y;return n}
export function debris(room:DungeonRoom){const random=rng(room.seed^0x151);return Array.from({length:12},(_,i)=>({x:130+random()*850,y:180+random()*350,angle:random()*180,kind:i%4}));}

// Damage recoil obeys the same solid geometry as normal movement.
export function knockbackPosition(p:Vec,dir:Vec,blocks:Block[],radius:number):Vec{
 const next=moveWithWalls(p,{x:dir.x*22,y:dir.y*22},blocks,radius);
 return {x:Math.max(ROOM.left+18,Math.min(ROOM.right-18,next.x)),y:Math.max(ROOM.top+22,Math.min(ROOM.bottom-22,next.y))};
}

// Swept contact against the same expanded rectangle used by weapon paths.
export function segmentBlockEntry(a:Vec,b:Vec,block:Block,padding=0):number|null{
 let lo=0,hi=1;
 for(const [start,delta,min,max] of [[a.x,b.x-a.x,block.x-block.w/2-padding,block.x+block.w/2+padding],[a.y,b.y-a.y,block.y-block.h/2-padding,block.y+block.h/2+padding]]){
  if(Math.abs(delta)<1e-9){if(start<min||start>max)return null;continue}
  const t1=(min-start)/delta,t2=(max-start)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return null;
 }
 return lo;
}
