import {gengarDestination,radialDirections} from './boss-position';
import {gengarPattern} from './scaling';
import {ENEMIES,type Kind} from './data';
import {normalize,type Vec} from './combat';
export interface Brain extends Vec{hp:number;cooldown:number;charge:number;dir:Vec;phase:number;cycle?:number;recovery?:number;aim?:Vec}
export type Action={type:'shot';dir:Vec;homing?:number;speed?:number}|{type:'pool';x:number;y:number;r:number}|{type:'blink';x:number;y:number}|{type:'warn';x:number;y:number;r:number;cue?:'rush'|'burst'|'teleport'|'aim'|'notice'|'phase'|'pool';tracking?:boolean;duration?:number;directions?:Vec[];kind?:Kind}|{type:'phase';x:number;y:number};
export function bossPhase(hp:number){return hp>ENEMIES.gengar.hp*.5?1:2}
export function stepBrain(kind:Kind,e:Brain,player:Vec,dt:number,floor=2):{v:Vec;actions:Action[]}{
 const actions:Action[]=[],n=normalize(player.x-e.x,player.y-e.y),distance=Math.hypot(player.x-e.x,player.y-e.y);let v={x:0,y:0};e.cooldown-=dt;
 if(kind!=='gengar'&&(e.recovery??0)>0){e.recovery=Math.max(0,e.recovery!-dt);return{v,actions}}
 const shot=(dir:Vec)=>actions.push({type:'shot',dir});
 const fan=(count:number,spread:number,angle=Math.atan2(n.y,n.x))=>{for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;shot({x:Math.cos(a),y:Math.sin(a)})}};
 if(kind==='gastly'||kind==='houndour'){
  const sign=distance>270?1:distance<200?-1:0;v={x:n.x*ENEMIES[kind].speed*sign,y:n.y*ENEMIES[kind].speed*sign};
  if(e.cooldown<=0&&e.charge<=0){e.dir=n;e.charge=.6;e.cooldown=kind==='houndour'?2:1.7;const angle=Math.atan2(n.y,n.x),count=kind==='houndour'?3:1;actions.push({type:'warn',x:e.x,y:e.y,r:28,cue:'aim',duration:.6,directions:Array.from({length:count},(_,i)=>({x:Math.cos(angle+(i-(count-1)/2)*.22),y:Math.sin(angle+(i-(count-1)/2)*.22)}))})}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0){fan(kind==='houndour'?3:1,.22,Math.atan2(e.dir.y,e.dir.x));e.recovery=.45}}
 }else if(kind==='zubat'){
  const dx=player.x-e.x,dy=player.y-e.y,aligned=Math.abs(dx)<52||Math.abs(dy)<52;
  if(e.cooldown<=0&&e.charge<=0&&aligned){e.cooldown=2.3;e.charge=1.08;e.dir=Math.abs(dx)<Math.abs(dy)?{x:0,y:Math.sign(dy)}:{x:Math.sign(dx),y:0};actions.push({type:'warn',x:e.x,y:e.y,r:30,cue:'rush',duration:.6,directions:[e.dir]})}
  if(e.charge>0){e.charge-=dt;if(e.charge>0&&e.charge<.48)v={x:e.dir.x*360,y:e.dir.y*360};if(e.charge<=0)e.recovery=.65}else v={x:n.x*60,y:n.y*60};
 }else if(kind==='grimer'){
  v={x:n.x*ENEMIES.grimer.speed,y:n.y*ENEMIES.grimer.speed};if(e.cooldown<=0){actions.push({type:'pool',x:e.x,y:e.y,r:42});e.cooldown=3}
 }else if(kind==='koffing'){
  v={x:0,y:0};if(e.cooldown<=0){actions.push({type:'warn',x:e.x,y:e.y,r:65,cue:'burst',duration:.65,directions:Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}))});e.charge=.65;e.cooldown=2.6}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0)for(let i=0;i<8;i++)shot({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)})}
 }else if(kind==='shuppet'){
  v={x:n.x*ENEMIES.shuppet.speed,y:n.y*ENEMIES.shuppet.speed};if(e.cooldown<=0){e.dir={x:Math.max(140,Math.min(980,player.x-n.x*145)),y:Math.max(190,Math.min(540,player.y-n.y*145))};actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:28,cue:'teleport',duration:.8,kind:'shuppet',directions:[normalize(player.x-e.dir.x,player.y-e.dir.y)]});e.aim={...player};e.charge=.8;e.cooldown=3.1}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});shot(normalize((e.aim??player).x-e.dir.x,(e.aim??player).y-e.dir.y))}}
 }else if(kind==='gengar'){
  const next=bossPhase(e.hp);
  if(next>e.phase){e.phase=next;e.charge=0;e.recovery=1.2;e.cooldown=1.25;actions.push({type:'phase',x:e.x,y:e.y});return{v:{x:0,y:0},actions}}
  if((e.recovery??0)>0){e.recovery=Math.max(0,e.recovery!-dt);return{v:{x:0,y:0},actions}}
  v={x:n.x*(floor===6?25:35),y:n.y*(floor===6?25:35)};
  const pattern=gengarPattern(floor,e.phase),count=pattern.count,charge=pattern.warning;
  const shadowDirections=()=>{if(e.cycle!%2)return radialDirections(count,e.dir,e.aim??player,e.cycle!);const a=Math.atan2((e.aim??player).y-e.dir.y,(e.aim??player).x-e.dir.x);return Array.from({length:e.phase===1?3:5},(_,i)=>({x:Math.cos(a+(i-(e.phase===1?1:2))*.2),y:Math.sin(a+(i-(e.phase===1?1:2))*.2)}))};
  if(e.cooldown<=0&&e.charge<=0){e.cycle=(e.cycle??0)+1;e.dir=gengarDestination(e,player,e.cycle);e.aim={...player};actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:52,cue:'burst',duration:charge,kind:'gengar',directions:shadowDirections()});e.charge=charge;e.cooldown=pattern.interval}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});for(const dir of shadowDirections())actions.push({type:'shot',dir,speed:pattern.speed});if(e.phase===2&&floor<6)actions.push({type:'pool',x:player.x,y:player.y,r:48})}}

 }
 return{v,actions};
}
