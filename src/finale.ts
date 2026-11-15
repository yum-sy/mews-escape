import {normalize,type Vec} from './combat';
import type {Action,Brain} from './ai';
export const FINAL_HP=[420,520,640] as const;
export type FinalPhase=1|2|3;
export type FinalAction=Action|{type:'beam';axis:'x'|'y';position:number};
export function nextFinalPhase(phase:FinalPhase):FinalPhase|'ending'{return phase===3?'ending':(phase+1) as FinalPhase}
export function stepMewtwo(e:Brain&{cycle:number},player:Vec,phase:FinalPhase,dt:number):{v:Vec;actions:FinalAction[]}{
 const actions:FinalAction[]=[];e.cooldown-=dt;const n=normalize(player.x-e.x,player.y-e.y);
 if(e.cooldown<=0&&e.charge<=0){e.cooldown=phase===1?2.4:phase===2?2.1:1.85;e.charge=phase===3?1:.8;e.dir={x:player.x<560?820:300,y:player.y<360?460:250};actions.push({type:'warn',x:phase===1?e.x:e.dir.x,y:phase===1?e.y:e.dir.y,r:55})}
 if(e.charge>0){e.charge-=dt;if(e.charge<=0){e.cycle++;
  if(phase>1)actions.push({type:'blink',x:e.dir.x,y:e.dir.y});
  const origin=phase>1?e.dir:e,angle=Math.atan2(player.y-origin.y,player.x-origin.x);
  const fan=(count:number,spread:number,homing=0)=>{for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;actions.push({type:'shot',dir:{x:Math.cos(a),y:Math.sin(a)},homing,speed:phase===3?275:245})}};
  if(phase===1){fan(5,.23);if(e.cycle%2===0)for(let i=0;i<10;i++){const a=i*Math.PI/5+.15;actions.push({type:'shot',dir:{x:Math.cos(a),y:Math.sin(a)},speed:205})}}
  else if(phase===2){fan(3,.45,1.15);if(e.cycle%2===0)fan(7,.28)}
  else{for(let i=0;i<12;i++){const a=i*Math.PI/6+e.cycle*.2;actions.push({type:'shot',dir:{x:Math.cos(a),y:Math.sin(a)},speed:255})}actions.push({type:'beam',axis:e.cycle%2?'x':'y',position:e.cycle%2?player.x:player.y});if(e.cycle%3===0)actions.push({type:'beam',axis:e.cycle%2?'y':'x',position:e.cycle%2?player.y:player.x})}
 }}
 return{v:e.charge>0?{x:0,y:0}:{x:n.x*(phase===1?36:48),y:n.y*(phase===1?36:48)},actions};
}
export function beamPhase(age:number){return age<1?'warning':age<1.5?'active':'expired'}
export function beamHits(axis:'x'|'y',position:number,p:Vec){return Math.abs((axis==='x'?p.x:p.y)-position)<23}
