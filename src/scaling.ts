import SPECIES from './species.json';
export {SPECIES};
export function speciesSize(name:keyof typeof SPECIES){const h=SPECIES[name].heightDm/10;const height=32*Math.sqrt(h/.4);const [x1,y1,x2,y2]=SPECIES[name].bounds;return{height,width:height*(x2-x1)/(y2-y1),radius:Math.max(10,height*.36)}}
export function difficulty(floor:number){const level=6-floor;return{level,hp:1+level*.5+level*level*.16,speed:1+level*.07,shotSpeed:1+level*.12,combatCount:5+level,hazardPeriod:Math.max(3.4,5-level*.3)}}
export function hazardPhase(time:number,period:number){const t=time%period;return t<1?'warning':t<1.9?'active':'idle'}
