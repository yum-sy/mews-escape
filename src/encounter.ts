import type {Vec} from './combat';
import type {Kind} from './data';
import {ROOM} from './data';
import type {DungeonRoom} from './dungeon';
import {overlapsBlock,type Block} from './lab';
import {speciesSize} from './scaling';
export const ENTRY_SECONDS=.65;
export const ENTRY_DISTANCE=190;
/** Keep the landing and every real doorway clear without placing actors inside furniture. */
export function entryLayout(layout:{kind:Kind;x:number;y:number}[],player:Vec,blocks:Block[],doors:DungeonRoom['doors']){
 const thresholds={up:{x:560,y:ROOM.top},down:{x:560,y:ROOM.bottom},left:{x:ROOM.left,y:364},right:{x:ROOM.right,y:364}};
 const result:typeof layout=[];
 const candidates:Vec[]=[];for(let y=220;y<=510;y+=45)for(let x=220;x<=900;x+=55)candidates.push({x,y});
 for(const enemy of layout){const radius=speciesSize(enemy.kind).radius;
  const safe=(p:Vec)=>Math.hypot(p.x-player.x,p.y-player.y)>=ENTRY_DISTANCE+radius&&!blocks.some(b=>overlapsBlock(p,radius,b))&&Object.keys(doors).every(d=>{const q=thresholds[d as keyof typeof thresholds];return Math.hypot(p.x-q.x,p.y-q.y)>=145+radius})&&result.every(e=>Math.hypot(p.x-e.x,p.y-e.y)>radius+speciesSize(e.kind).radius+18);
  const point=safe(enemy)?enemy:[...candidates].sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y)).find(safe);
  if(!point)throw new Error('No safe enemy landing');
  result.push({...enemy,x:point.x,y:point.y});
 }
 return result;
}
