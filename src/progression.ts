import {ROOM} from './data';
import type {Vec} from './combat';
import type {Direction,DungeonRoom} from './dungeon';
export function doorBlockReason(rooms:DungeonRoom[],room:DungeonRoom,direction:Direction){
 const target=room.doors[direction];
 if(target===undefined||!rooms[target])return 'missing';
 if(!room.cleared)return 'combat';
 if(rooms[target].kind==='boss'&&rooms.some(r=>r.kind==='combat'&&!r.cleared))return 'floor';
 return null;
}
export function thresholdDirection(p:Vec,move:Vec):Direction|undefined{
 if(Math.abs(p.x-560)<48){if(p.y<=ROOM.top+26&&move.y<0)return 'up';if(p.y>=ROOM.bottom-26&&move.y>0)return 'down'}
 if(Math.abs(p.y-364)<48){if(p.x<=ROOM.left+22&&move.x<0)return 'left';if(p.x>=ROOM.right-22&&move.x>0)return 'right'}
}

/** Local, read-only report: no storage writes, network calls or hidden-room disclosure in the HUD. */
export function progressionReport(run:{seed:number;floor:number;current:number;keys:number;moves:string[];rooms:DungeonRoom[]},state:string,position:Vec,enemies:{kind:string;hp:number;sprite:Vec}[]){
 return JSON.stringify({seed:run.seed,floor:run.floor,room:run.current,state,position:{x:Math.round(position.x),y:Math.round(position.y)},keys:run.keys,moves:run.moves,enemies:enemies.filter(e=>e.hp>0).map(e=>({kind:e.kind,hp:+e.hp.toFixed(2),x:Math.round(e.sprite.x),y:Math.round(e.sprite.y)})),rooms:run.rooms.map(r=>({id:r.id,visited:r.visited,cleared:r.cleared,rewardTaken:r.rewardTaken,opened:!!r.opened}))});
}
