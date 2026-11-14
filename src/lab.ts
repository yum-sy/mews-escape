import {rng,type DungeonRoom} from './dungeon';
import type {Vec} from './combat';
export interface Block{x:number;y:number;w:number;h:number}
export function obstacles(room:DungeonRoom):Block[]{
 if(room.kind!=='combat')return[];
 return room.seed%3===0?[{x:420,y:320,w:70,h:45},{x:700,y:410,w:70,h:45}]:room.seed%3===1?[{x:400,y:395,w:80,h:40},{x:720,y:320,w:80,h:40}]:[{x:430,y:370,w:55,h:65},{x:690,y:370,w:55,h:65}];
}
export function overlapsBlock(p:Vec,r:number,b:Block){const x=Math.max(b.x-b.w/2,Math.min(p.x,b.x+b.w/2)),y=Math.max(b.y-b.h/2,Math.min(p.y,b.y+b.h/2));return Math.hypot(p.x-x,p.y-y)<r}
export function moveWithWalls(p:Vec,v:Vec,blocks:Block[],radius:number):Vec{const n={...p};const x={x:p.x+v.x,y:p.y};if(!blocks.some(b=>overlapsBlock(x,radius,b)))n.x=x.x;const y={x:n.x,y:p.y+v.y};if(!blocks.some(b=>overlapsBlock(y,radius,b)))n.y=y.y;return n}
export function debris(room:DungeonRoom){const random=rng(room.seed^0x151);return Array.from({length:12},(_,i)=>({x:130+random()*850,y:180+random()*350,angle:random()*180,kind:i%4}));}
