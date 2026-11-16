import {rng,shuffle} from './dungeon';
export const BOSS_ROSTER=['gengar','weezing','muk','houndoom','banette','hypno','magneton','marowak','mismagius'] as const;
export type BossKind=typeof BOSS_ROSTER[number];
export function bossForFloor(seed:number,floor:number):BossKind|'mewtwo'{if(floor===1)return'mewtwo';return shuffle([...BOSS_ROSTER],rng(seed^0xb055151))[6-floor]}
export const isLabBoss=(kind:string):kind is BossKind=>(BOSS_ROSTER as readonly string[]).includes(kind);
