import {ENEMIES,type Kind} from './data';
import type {StoragePort} from './save';
export type Guidance='full'|'soft'|'subtle';
export const guidanceFor=(count:number):Guidance=>count>=3?'subtle':count===2?'soft':'full';
const KEY='mews-escape.encounters.v1';
/** One encounter per species per room. Persist room ordinals so reload/phase changes cannot consume lessons. */
export class EncounterFamiliarity{
 private counts:Partial<Record<Kind,number>>={};private rooms:Record<string,Partial<Record<Kind,number>>>={};private active:Partial<Record<Kind,number>>={};
 constructor(private storage:StoragePort){try{const p=JSON.parse(storage.getItem(KEY)||'null');if(p&&typeof p==='object'){for(const k of Object.keys(ENEMIES) as Kind[])if(Number.isInteger(p.counts?.[k])&&p.counts[k]>=1&&p.counts[k]<=3)this.counts[k]=p.counts[k];if(p.rooms&&typeof p.rooms==='object')for(const [id,raw] of Object.entries(p.rooms).slice(-128)){if(!/^\d+:\d:(main|cache|depth):\d+$/.test(id))continue;const values:Partial<Record<Kind,number>>={};for(const k of Object.keys(ENEMIES) as Kind[]){const n=(raw as any)?.[k];if(Number.isInteger(n)&&n>=1&&n<=3)values[k]=n}this.rooms[id]=values}}}catch{/* Keep in-session learning when storage is unavailable. */}}
 enter(id:string,kinds:Kind[]){const room=this.rooms[id]??{};for(const kind of new Set(kinds))if(!room[kind]){const n=Math.min(3,(this.counts[kind]??0)+1);this.counts[kind]=n;room[kind]=n}this.rooms[id]=room;this.active=room;const ids=Object.keys(this.rooms);for(const old of ids.slice(0,Math.max(0,ids.length-128)))delete this.rooms[old];try{this.storage.setItem(KEY,JSON.stringify({counts:this.counts,rooms:this.rooms}))}catch{}}
 guidance(kind:Kind){return guidanceFor(this.active[kind]??this.counts[kind]??0)}
}
