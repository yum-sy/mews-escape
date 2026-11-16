import {ENEMIES,type Kind} from './data';
import {normalize,type Vec} from './combat';
export interface Brain extends Vec{hp:number;cooldown:number;charge:number;dir:Vec;phase:number;recovery?:number;aim?:Vec}
export type Action={type:'shot';dir:Vec;homing?:number;speed?:number}|{type:'pool';x:number;y:number;r:number}|{type:'blink';x:number;y:number}|{type:'warn';x:number;y:number;r:number;cue?:'rush'|'burst'|'teleport'|'aim'|'notice'|'phase';duration?:number;directions?:Vec[];kind?:Kind}|{type:'phase';x:number;y:number};
export function bossPhase(hp:number){return hp>ENEMIES.gengar.hp*.5?1:2}
export function stepBrain(kind:Kind,e:Brain,player:Vec,dt:number,floor=2):{v:Vec;actions:Action[]}{
 const actions:Action[]=[],n=normalize(player.x-e.x,player.y-e.y),distance=Math.hypot(player.x-e.x,player.y-e.y);let v={x:0,y:0};e.cooldown-=dt;
 const shot=(dir:Vec)=>actions.push({type:'shot',dir});
 const fan=(count:number,spread:number,angle=Math.atan2(n.y,n.x))=>{for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;shot({x:Math.cos(a),y:Math.sin(a)})}};
 if(kind==='gastly'||kind==='houndour'){
  const sign=distance>270?1:distance<200?-1:0;v={x:n.x*ENEMIES[kind].speed*sign,y:n.y*ENEMIES[kind].speed*sign};
  if(e.cooldown<=0){fan(kind==='houndour'?3:1,.22);e.cooldown=kind==='houndour'?2:1.7}
 }else if(kind==='zubat'){
  if(e.cooldown<=0){e.cooldown=2.3;e.charge=.85;e.dir=n;actions.push({type:'warn',x:e.x,y:e.y,r:30,cue:'rush',duration:.37,directions:[e.dir]})}
  if(e.charge>0){e.charge-=dt;if(e.charge<.48)v={x:e.dir.x*360,y:e.dir.y*360}}else v={x:n.x*ENEMIES.zubat.speed,y:n.y*ENEMIES.zubat.speed};
 }else if(kind==='grimer'){
  v={x:n.x*ENEMIES.grimer.speed,y:n.y*ENEMIES.grimer.speed};if(e.cooldown<=0){actions.push({type:'pool',x:e.x,y:e.y,r:42});e.cooldown=3}
 }else if(kind==='koffing'){
  v={x:n.x*ENEMIES.koffing.speed,y:n.y*ENEMIES.koffing.speed};if(e.cooldown<=0){actions.push({type:'warn',x:e.x,y:e.y,r:65,cue:'burst',duration:.65,directions:Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}))});e.charge=.65;e.cooldown=2.6}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0)for(let i=0;i<8;i++)shot({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)})}
 }else if(kind==='shuppet'){
  v={x:n.x*ENEMIES.shuppet.speed,y:n.y*ENEMIES.shuppet.speed};if(e.cooldown<=0){e.dir={x:Math.max(140,Math.min(980,player.x-n.x*145)),y:Math.max(190,Math.min(540,player.y-n.y*145))};actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:28,cue:'teleport',duration:.7,kind:'shuppet'});e.charge=.7;e.cooldown=3.1}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});shot(n)}}
 }else if(kind==='gengar'){
  const next=bossPhase(e.hp);
  if(next>e.phase){e.phase=next;e.charge=0;e.recovery=1.2;e.cooldown=1.25;actions.push({type:'phase',x:e.x,y:e.y});return{v:{x:0,y:0},actions}}
  if((e.recovery??0)>0){e.recovery=Math.max(0,e.recovery!-dt);return{v:{x:0,y:0},actions}}
  v={x:n.x*(floor===6?25:35),y:n.y*(floor===6?25:35)};
  const count=floor===6?(e.phase===1?6:8):(e.phase===1?8:12),charge=floor===6?1.05:.9;
  if(e.cooldown<=0&&e.charge<=0){e.dir={x:player.x<560?800:320,y:player.y<360?470:250};actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:52,cue:'burst',duration:charge,kind:'gengar',directions:Array.from({length:count},(_,i)=>({x:Math.cos(i*Math.PI*2/count+e.phase*.17),y:Math.sin(i*Math.PI*2/count+e.phase*.17)}))});e.charge=charge;e.cooldown=floor===6?(e.phase===1?3.2:2.8):(e.phase===1?2.7:2.3)}
  if(e.charge>0){v={x:0,y:0};e.charge-=dt;if(e.charge<=0){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});for(let i=0;i<count;i++){const a=i*Math.PI*2/count+e.phase*.17;actions.push({type:'shot',dir:{x:Math.cos(a),y:Math.sin(a)},speed:floor===6?175:215})}if(e.phase===2&&floor<6)actions.push({type:'pool',x:player.x,y:player.y,r:48})}}

 }
 return{v,actions};
}
