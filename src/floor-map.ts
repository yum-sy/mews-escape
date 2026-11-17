import {ACTIVE_LIMITS} from './active-items';
import {rng,type DungeonRoom} from './dungeon';
import {breakableProps,roomEnvironment} from './environment';
import {availablePropLoot,takePropLoot} from './prop-loot';
import type {Run} from './run';
/** Exactly one cache per explorable floor. No reward roll or key is required. */
export function mapCache(rooms:DungeonRoom[],floor:number,seed:number){
 if(floor===1)return null; // The final arena is a single already-visible room.
 const eligible=rooms.filter(r=>r.kind!=='boss'&&r.kind!=='start'&&breakableProps(r).length);
 if(!eligible.length)return null;const random=rng(seed^Math.imul(floor,0x73a91));const room=eligible[Math.floor(random()*eligible.length)],props=breakableProps(room),prop=props[Math.floor(random()*props.length)];return{roomId:room.id,propId:prop.id};
}
export function floorLoot(run:Run){const cache=mapCache(run.rooms,run.floor,run.seed),here=cache?.roomId===run.current;
 const ordinary=availablePropLoot(run.room).filter(p=>!here||p.id!==cache!.propId).map(p=>p.kind==='decoy'&&!run.unlocks.includes('decoy')?{...p,kind:'reflector' as const}:p);
 const prop=here?breakableProps(run.room).find(p=>p.id===cache!.propId):undefined;
 const map=prop&&!run.mapFound&&(roomEnvironment(run.room).broken&(1<<prop.id))?[{...prop,kind:'map' as const}]:[];
 return [...ordinary,...map];
}
export function takeFloorLoot(run:Run,id:number,hp:number,maxHp:number){const item=floorLoot(run).find(p=>p.id===id);if(!item)return null;if((item.kind==='reflector'||item.kind==='decoy')&&run.activeStock[item.kind].count>=ACTIVE_LIMITS[item.kind])return null;if(item.kind!=='map'){const taken=takePropLoot(run.room,id,hp,maxHp);if(taken&&(item.kind==='reflector'||item.kind==='decoy')){run.collectActive(item.kind);return item.kind}return taken;}run.mapFound=true;return'map'}
