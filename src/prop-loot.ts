import {ambushProp,pendingAmbush} from './exploration-events';
import {rng,type DungeonRoom} from './dungeon';
import {breakableProps,roomEnvironment} from './environment';
export type PropLoot='heart'|'key'|'reflector'|'decoy';
export type PropMethod='open'|'break';
export const PROP_CHANCE={crate:{open:.28,break:.08},canister:{open:.06,break:.20}} as const;
export function propDrop(seed:number,id:number,method?:PropMethod,kind:'crate'|'canister'='crate'):PropLoot|null{const roll=rng((seed^Math.imul(id+1,0x45d9f3b)^0x10a7)>>>0)();const chance=method?PROP_CHANCE[kind][method]:.13;if(roll>=chance)return null;const pick=roll/chance*.13;return pick<.06?'heart':pick<.08?'key':pick<.115?'reflector':pick<.13?'decoy':null}
export function availablePropLoot(room:DungeonRoom){const state=roomEnvironment(room);return breakableProps(room).flatMap(p=>{const kind=p.id===ambushProp(room)?pendingAmbush(room)===p.id?null:'reflector':propDrop(room.seed,p.id,(state.rewardRules??0)&(1<<p.id)?(state.openedProps??0)&(1<<p.id)?'open':'break':undefined,p.kind as 'crate'|'canister');return kind&&(state.broken&(1<<p.id))&&!((state.lootTaken??0)&(1<<p.id))?[{...p,kind}]:[]})}
export function takePropLoot(room:DungeonRoom,id:number,hp:number,maxHp:number){const item=availablePropLoot(room).find(p=>p.id===id);if(!item||item.kind==='heart'&&hp>=maxHp)return null;const state=roomEnvironment(room);state.lootTaken=(state.lootTaken??0)|(1<<id);return item.kind}
