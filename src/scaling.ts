import {isLabBoss} from './boss-roster';
import ARTWORK from './artwork-frames.json';
import SPECIES from './species.json';
export {SPECIES};
export function speciesSize(name:keyof typeof SPECIES){const h=SPECIES[name].heightDm/10,baseHeight=32*Math.sqrt(h/.4);const [x1,y1,x2,y2]=ARTWORK[name].bounds,baseWidth=baseHeight*(x2-x1)/(y2-y1),boss=isLabBoss(name)||name==='mewtwo',scale=boss?Math.min(1.45,140/baseHeight,160/baseWidth):1,height=baseHeight*scale;return{height,width:baseWidth*scale,radius:Math.max(10,height*(boss?.32:.36))}}
export function difficulty(floor:number){const level=6-floor;return{level,hp:1+level*.4+level*level*.075,bossHp:[90,180,300,440,580,580][level],speed:1+level*.07,shotSpeed:1+level*.12,combatCount:5+level,hazardPeriod:Math.max(3.4,5-level*.3)}}
export function hazardPhase(time:number,period:number){const t=time%period;return t<1?'warning':t<1.9?'active':'idle'}

/** Keep a full second of readable warning; difficulty rises through lanes and rhythm. */
export function gengarPattern(floor:number,phase:number){const level=Math.max(0,Math.min(4,6-floor));return{count:6+level+(phase===1?0:2),speed:175+level*10,warning:level<2?1.05:1,interval:(phase===1?2.7:2.35)-level*.1}}
export const POOL_WARNING=1;
export const TRACKING_SECONDS=.9;
export function poolPhase(age:number){return age<POOL_WARNING?'warning':age<4?'active':'expired'}
