import {normalize,type Vec} from './combat';
export type Trap=Vec&{kind:'laser'|'gas'|'electric';r:number};
export function trapHits(trap:Trap,p:Vec,radius=0){return trap.kind==='laser'?Math.abs(p.y-trap.y)<13+radius&&Math.abs(p.x-560)<415+radius:Math.hypot(p.x-trap.x,p.y-trap.y)<trap.r+radius}
export function trapPush(trap:Trap,p:Vec){if(trap.kind==='laser')return{x:0,y:p.y>=trap.y?1:-1};const d=normalize(p.x-trap.x,p.y-trap.y);return d.x||d.y?d:{x:0,y:-1}}
export const TRAP_RECOVERY=1.35;
export const trapDamage=(maxHp:number)=>Math.max(4,maxHp*.18);
