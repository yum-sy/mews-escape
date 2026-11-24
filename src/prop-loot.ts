import {ambushProp,pendingAmbush} from './exploration-events';
import {rng,type DungeonRoom} from './dungeon';
import {breakableProps,roomEnvironment} from './environment';
export type PropLoot='heart'|'key'|'reflector'|'decoy';
export function propDrop(seed:number,id:number):PropLoot|null{const roll=rng((seed^Math.imul(id+1,0x45d9f3b)^0x10a7)>>>0)();return roll<.06?'heart':roll<.08?'key':roll<.115?'reflector':roll<.13?'decoy':null}
export function availablePropLoot(room:DungeonRoom){const state=roomEnvironment(room);return breakableProps(room).flatMap(p=>{const kind=p.id===ambushProp(room)?pendingAmbush(room)===p.id?null:'reflector':propDrop(room.seed,p.id);return kind&&(state.broken&(1<<p.id))&&!((state.lootTaken??0)&(1<<p.id))?[{...p,kind}]:[]})}
export function takePropLoot(room:DungeonRoom,id:number,hp:number,maxHp:number){const item=availablePropLoot(room).find(p=>p.id===id);if(!item||item.kind==='heart'&&hp>=maxHp)return null;const state=roomEnvironment(room);state.lootTaken=(state.lootTaken??0)|(1<<id);return item.kind}
