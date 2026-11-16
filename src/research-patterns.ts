import type {Action,Brain} from './ai';
import {ENEMIES,type Kind} from './data';
import {normalize,type Vec} from './combat';
export const RESEARCH_KINDS=['skorupi','drapion','stunky','skuntank','spinarak','ariados','trubbish','garbodor','spiritomb','inkay','malamar'] as const;
export type ZoneStyle='gas'|'web'|'sludge';
export interface ResearchZone{type:'zone';a:Vec;b:Vec;origin:Vec;r:number;warning:number;life:number;style:ZoneStyle}
const clamp=(p:Vec):Vec=>({x:Math.max(165,Math.min(955,p.x)),y:Math.max(220,Math.min(510,p.y))});
export function researchDirections(kind:Kind,dir:Vec,cycle:number){const angle=Math.atan2(dir.y,dir.x);const offsets=kind==='drapion'?(cycle%2?[-.38,.38]:[-.22,0,.22]):kind==='spiritomb'?[-.45,0,.45]:kind==='inkay'?[-.25,.25]:kind==='malamar'?[-.48,-.24,0,.24,.48]:[0];return offsets.map(a=>({x:Math.cos(angle+a),y:Math.sin(angle+a)}))}
/** Snapshot aim at the start: moving sideways during the wind-up is always meaningful. */
export function stepResearch(kind:Kind,e:Brain,player:Vec,dt:number):{v:Vec;actions:Action[]}|undefined{
 if(!(RESEARCH_KINDS as readonly string[]).includes(kind))return;
 const actions:Action[]=[],still={x:0,y:0},n=normalize(player.x-e.x,player.y-e.y),distance=Math.hypot(player.x-e.x,player.y-e.y);
 e.cooldown-=dt;
 if((e.recovery??0)>0){e.recovery=Math.max(0,e.recovery!-dt);return{v:still,actions}}
 if(e.charge>0){e.charge=Math.max(0,e.charge-dt);if(e.charge===0){
  if(!['stunky','skuntank','spinarak','ariados','trubbish','garbodor'].includes(kind))for(const dir of researchDirections(kind,e.dir,e.cycle??1))actions.push({type:'shot',dir,speed:kind==='skorupi'?205:kind==='malamar'?215:160,homing:kind==='spiritomb'?.55:kind==='inkay'?.3:0,returning:kind==='malamar'});
  e.recovery=kind==='malamar'?.9:.65;
 }return{v:still,actions}}
 const desired=kind==='stunky'?115:kind==='skuntank'?150:260;
 if(e.cooldown<=0&&distance<=desired+45){
  e.dir=n;e.aim=clamp({x:e.x+n.x*Math.min(230,distance),y:e.y+n.y*Math.min(230,distance)});e.cycle=(e.cycle??0)+1;e.charge=kind==='malamar'||kind==='garbodor'?1.1:.9;e.cooldown=kind==='stunky'||kind==='trubbish'?4.2:3.8;
  const origin={x:e.x,y:e.y},zone=(style:ZoneStyle,a:Vec,b:Vec,r:number,life=2.7)=>actions.push({type:'zone',origin,a:clamp(a),b:clamp(b),r,warning:e.charge,life,style});
  if(kind==='stunky'||kind==='skuntank'){
   const reach=kind==='stunky'?115:155,r=kind==='stunky'?36:48;
   zone('gas',{x:e.x+n.x*32,y:e.y+n.y*32},{x:e.x+n.x*reach,y:e.y+n.y*reach},r);
   if(kind==='skuntank')zone('gas',{x:e.x-n.x*32,y:e.y-n.y*32},{x:e.x-n.x*95,y:e.y-n.y*95},36,2.2);
  }else if(kind==='spinarak'||kind==='ariados'){
   const c=e.aim,side={x:-n.y,y:n.x};
   if(kind==='spinarak')zone('web',{x:c.x-side.x*65,y:c.y-side.y*65},{x:c.x+side.x*65,y:c.y+side.y*65},12,3);
   else for(const sign of [-1,1])zone('web',{x:c.x+side.x*sign*48-n.x*45,y:c.y+side.y*sign*48-n.y*45},{x:c.x+side.x*sign*130+n.x*30,y:c.y+side.y*sign*130+n.y*30},14,3);
  }else if(kind==='trubbish'||kind==='garbodor'){
   for(const offset of kind==='trubbish'?[0]:[-85,0,85]){const c=clamp({x:e.aim.x-n.y*offset,y:e.aim.y+n.x*offset});zone('sludge',c,c,kind==='trubbish'?30:34,2.6)}
  }else actions.push({type:'warn',x:e.x,y:e.y,r:28,cue:'aim',duration:e.charge,directions:researchDirections(kind,e.dir,e.cycle),tracking:kind==='spiritomb'||kind==='inkay',returning:kind==='malamar'});
  return{v:still,actions};
 }
 const hold=distance>desired?1:distance<desired*.65?-1:0;
 return{v:{x:n.x*ENEMIES[kind].speed*hold,y:n.y*ENEMIES[kind].speed*hold},actions};
}
