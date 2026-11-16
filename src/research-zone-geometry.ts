import type {ResearchZone} from './research-patterns';
import type {Vec} from './combat';
import {distanceToSegment} from './weapons';
export function researchZonePhase(z:ResearchZone,age:number){return age<z.warning?'warning':age<z.warning+z.life?'active':'expired'}
export function researchZoneHits(z:ResearchZone,age:number,p:Vec){return researchZonePhase(z,age)==='active'&&distanceToSegment(p,z.a,z.b)<=z.r+9}
