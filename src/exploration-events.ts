import type {DungeonRoom} from './dungeon';
import type {Kind} from './data';
import type {Block} from './lab';
/** Seeded physical partitions. Nothing here is a damaging liquid floor. */
export function perimeterWalls(room:DungeonRoom):Block[]{
 if(room.kind!=='combat')return[];
 const variant=(room.seed>>>4)%4;
 const corners=[{x:130,y:181,w:100,h:82},{x:978,y:181,w:124,h:82},{x:152,y:553,w:144,h:74},{x:978,y:553,w:124,h:74}];
 return variant===0?[]:variant===1?corners.slice(0,2):variant===2?corners.slice(2):corners;
}
export function cageSegments(room:DungeonRoom){
 if(room.kind!=='combat'||room.secret||(room.seed>>>8)%4!==1)return[];
 const side=room.doors.right!==undefined?'right':room.doors.left!==undefined?'left':null;if(!side)return[];
 const x=side==='right'?910:190;
 return Array.from({length:6},(_,id)=>({id,x,y:173.5+75*id,w:26,h:75}));
}
export function cageBlocks(room:DungeonRoom){return cageSegments(room).filter(p=>!((room.environment?.gatesBroken??0)&(1<<p.id)))}
export function breakCage(room:DungeonRoom,id:number){const s=room.environment;if(!s||!cageSegments(room).some(p=>p.id===id)||((s.gatesBroken??0)&(1<<id)))return false;s.gatesBroken=(s.gatesBroken??0)|(1<<id);return true}
export function ambushProp(room:DungeonRoom):number|null{
 if(room.kind!=='combat'||room.secret||(room.seed>>>6)%5!==0)return null;
 return room.seed%2?0:3; // Only a crate, never a liquid canister.
}
export function ambushKind(room:DungeonRoom,floor:number):Kind{
 const pairs:Kind[][]=[['shuppet','gastly'],['trubbish','grimer'],['ariados','skuntank'],['spiritomb','drapion'],['malamar','garbodor']];return pairs[Math.max(0,Math.min(4,6-floor))][(room.seed>>>12)%2];
}
export function pendingAmbush(room:DungeonRoom){const id=ambushProp(room),s=room.environment;return id!==null&&!!s&&(s.broken&(1<<id))!==0&&((s.ambushCleared??0)&(1<<id))===0?id:null}
export function annexEvidence(rooms:DungeonRoom[]){return rooms.some(r=>r.kind==='combat'&&r.cleared&&r.environment?.powerOff&&r.environment.broken===15&&pendingAmbush(r)===null)}

export function annexSpecimen(floor:number,seed:number):Kind{const pools:Kind[][]=[['ditto','spiritomb'],['sableye','drapion'],['malamar','garbodor'],['sneasel','exeggutor'],['malamar','spiritomb']];return pools[Math.max(0,Math.min(4,6-floor))][(seed>>>7)%2]}
