import type {ActiveSkill} from './progression-unlocks';
export const ACTIVE_LIMITS={reflector:4,decoy:2} as const;
export type ActiveStock=Record<ActiveSkill,{count:number;capacity:number}>;
export const emptyActiveStock=():ActiveStock=>({reflector:{count:0,capacity:1},decoy:{count:0,capacity:1}});
export function collectActive(stock:ActiveStock,kind:ActiveSkill){const item=stock[kind];if(item.count>=ACTIVE_LIMITS[kind])return false;if(item.count===item.capacity)item.capacity++;item.count++;return true}
export function validActiveStock(value:unknown):value is ActiveStock{if(!value||typeof value!=='object')return false;return(['reflector','decoy'] as const).every(k=>{const v=(value as ActiveStock)[k];return v&&Number.isInteger(v.count)&&Number.isInteger(v.capacity)&&v.capacity>=1&&v.capacity<=ACTIVE_LIMITS[k]&&v.count>=0&&v.count<=v.capacity})}
