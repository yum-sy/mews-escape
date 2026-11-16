import {stepBrain,type Brain,type Action} from './ai';
import {gengarDestination,radialDirections} from './boss-position';
import {gengarPattern} from './scaling';
import {normalize,type Vec} from './combat';
import type {BossKind} from './boss-roster';
export interface BossBrain extends Brain{dash?:number}
const fan=(origin:Vec,target:Vec,count:number,spread=.24)=>{const angle=Math.atan2(target.y-origin.y,target.x-origin.x);return Array.from({length:count},(_,i)=>({x:Math.cos(angle+(i-(count-1)/2)*spread),y:Math.sin(angle+(i-(count-1)/2)*spread)}))};
export function stepBoss(kind:BossKind,e:BossBrain,player:Vec,dt:number,floor:number):{v:Vec;actions:Action[]}{
 if(kind==='gengar')return stepBrain(kind,e,player,dt,floor);
 const actions:Action[]=[],still={x:0,y:0},phase=e.hp>110?1:2,p=gengarPattern(floor,phase),n=normalize(player.x-e.x,player.y-e.y),level=6-floor;
 e.cooldown-=dt;
 if(phase>e.phase){e.phase=phase;e.charge=0;e.dash=0;e.recovery=1.2;e.cooldown=1.3;return{v:still,actions:[{type:'phase',x:e.x,y:e.y}]}}
 if((e.recovery??0)>0){e.recovery=Math.max(0,e.recovery!-dt);return{v:still,actions}}
 if((e.dash??0)>0){e.dash=Math.max(0,e.dash!-dt);return{v:{x:e.dir.x*(phase===1?300:340),y:e.dir.y*(phase===1?300:340)},actions}}
 const volleyCount=phase===1?3:5,speed=p.speed;
 const volley=(directions:Vec[],tracking=0)=>{for(const dir of directions)actions.push({type:'shot',dir,speed,homing:tracking})};
 if(e.cooldown<=0&&e.charge<=0){
  e.cycle=(e.cycle??0)+1;e.aim={...player};e.charge=1.05;e.cooldown=p.interval+(kind==='muk'?.5:kind==='houndoom'?.2:0);
  if(kind==='banette'){
   e.dir=gengarDestination(e,player,e.cycle);actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:48,cue:'teleport',kind,tracking:phase===2,duration:1.05,directions:fan(e.dir,e.aim,volleyCount,.3)});
  }else if(kind==='houndoom'&&e.cycle%2===0){e.dir=n;actions.push({type:'warn',x:e.x,y:e.y,r:42,cue:'rush',duration:1.05,directions:[e.dir]})}
  else if(kind==='weezing'){actions.push({type:'warn',x:e.x,y:e.y,r:48,cue:'burst',duration:1.05,directions:radialDirections(p.count,e,e.aim,e.cycle)})}
  else{
   actions.push({type:'warn',x:e.x,y:e.y,r:42,cue:'aim',duration:1.05,directions:fan(e,e.aim,volleyCount)});
   if(kind==='muk'){actions.push({type:'pool',x:e.aim.x,y:e.aim.y,r:floor===6?36:42});if(phase===2&&floor<6){const side={x:Math.max(150,Math.min(970,player.x-n.y*110)),y:Math.max(190,Math.min(525,player.y+n.x*110))};actions.push({type:'pool',...side,r:38})}}
  }
 }
 if(e.charge>0){e.charge-=dt;if(e.charge<=0){
  if(kind==='banette'){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});volley(fan(e.dir,e.aim!,volleyCount,.3),phase===2?.65:0)}
  else if(kind==='houndoom'&&e.cycle!%2===0)e.dash=.48;
  else if(kind==='weezing'){volley(radialDirections(p.count,e,e.aim!,e.cycle!));if(phase===2&&floor<6)actions.push({type:'pool',x:e.x,y:e.y,r:42})}
  else volley(fan(e,e.aim!,volleyCount));
 }return{v:still,actions}}
 const distance=Math.hypot(player.x-e.x,player.y-e.y),advance=distance>230?1:distance<160?-1:0;
 const v=kind==='muk'?{x:n.x*(30+level*2),y:n.y*(30+level*2)}:kind==='weezing'?{x:(n.x*advance-n.y*.6)*35,y:(n.y*advance+n.x*.6)*35}:{x:n.x*advance*48,y:n.y*advance*48};
 return{v,actions};
}
