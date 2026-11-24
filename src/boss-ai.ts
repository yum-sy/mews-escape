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
 if((e.dash??0)>0){e.dash=Math.max(0,e.dash!-dt);return{v:{x:e.dir.x*(phase===1?330:380),y:e.dir.y*(phase===1?330:380)},actions}}
 const volleyCount=phase===1?3:5,speed=p.speed;
 const gasDirections=()=>e.cycle!%2?radialDirections(p.count,e,e.aim!,e.cycle!):[...fan(e,e.aim!,3,.18),...fan(e,{x:e.x*2-e.aim!.x,y:e.y*2-e.aim!.y},3,.18)];
 const curseDirections=()=>kind==='mismagius'?[...fan(e.dir,e.aim!,2,.35),...fan(e.dir,{x:e.dir.x*2-e.aim!.x,y:e.dir.y*2-e.aim!.y},2,.35)]:e.cycle!%2?fan(e.dir,e.aim!,volleyCount,.3):radialDirections(floor===6?4:6,e.dir,e.aim!,e.cycle!);
 const extraDirections=()=>kind==='magneton'?radialDirections(floor===6?4:8,e,e.aim!,e.cycle!):fan(e,e.aim!,kind==='hypno'?3:volleyCount,kind==='marowak'?.38:.24);
 const volley=(directions:Vec[],tracking=0)=>{for(const dir of directions)actions.push({type:'shot',dir,speed,homing:tracking,returning:kind==='marowak'})};
 if(e.cooldown<=0&&e.charge<=0){
  e.cycle=(e.cycle??0)+1;e.aim={...player};e.charge=1.05;e.cooldown=p.interval+(kind==='muk'?.18:kind==='houndoom'?.05:0);
  if(['hypno','magneton','marowak'].includes(kind)){actions.push({type:'warn',x:e.x,y:e.y,r:46,cue:kind==='magneton'?'burst':'aim',duration:1.05,directions:extraDirections(),tracking:kind==='hypno'&&phase===2,returning:kind==='marowak'})}
  else if(kind==='banette'||kind==='mismagius'){
   e.dir=kind==='mismagius'||e.cycle%2?gengarDestination(e,player,e.cycle):{x:e.x,y:e.y};actions.push({type:'warn',x:e.dir.x,y:e.dir.y,r:48,cue:'teleport',kind,tracking:phase===2,duration:1.05,directions:curseDirections()});
  }else if(kind==='houndoom'&&e.cycle%2===0){e.dir=n;actions.push({type:'warn',x:e.x,y:e.y,r:42,cue:'rush',duration:1.05,directions:[e.dir]})}
  else if(kind==='weezing'){actions.push({type:'warn',x:e.x,y:e.y,r:48,cue:'burst',duration:1.05,directions:gasDirections()})}
  else if(kind==='muk'&&e.cycle%2===0){
   // A locked line of individually warned sludge eruptions, not a bullet fan.
   const length=Math.min(330,Math.hypot(player.x-e.x,player.y-e.y));for(let i=1;i<=3;i++)actions.push({type:'pool',x:e.x+n.x*length*i/3,y:e.y+n.y*length*i/3,r:floor===6?28:34});
  }else{
   actions.push({type:'warn',x:e.x,y:e.y,r:42,cue:'aim',duration:1.05,directions:fan(e,e.aim,volleyCount)});
   if(kind==='muk'){actions.push({type:'pool',x:e.aim.x,y:e.aim.y,r:floor===6?36:42});if(phase===2&&floor<6){const side={x:Math.max(150,Math.min(970,player.x-n.y*110)),y:Math.max(190,Math.min(525,player.y+n.x*110))};actions.push({type:'pool',...side,r:38})}}
  }
 }
 if(e.charge>0){e.charge-=dt;if(e.charge<=0){
  if(['hypno','magneton','marowak'].includes(kind))volley(extraDirections(),kind==='hypno'&&phase===2?.5:0);
  else if(kind==='banette'||kind==='mismagius'){actions.push({type:'blink',x:e.dir.x,y:e.dir.y});volley(curseDirections(),phase===2?.65:0)}
  else if(kind==='houndoom'&&e.cycle!%2===0)e.dash=.56;
  else if(kind==='weezing'){volley(gasDirections());if(phase===2&&floor<6)actions.push({type:'pool',x:e.x,y:e.y,r:42})}
  else if(!(kind==='muk'&&e.cycle!%2===0))volley(fan(e,e.aim!,volleyCount));
 }return{v:still,actions}}
 const distance=Math.hypot(player.x-e.x,player.y-e.y),advance=distance>190?1:distance<115?-.35:.25,side=(e.cycle??0)%2?1:-1,speedMove=(floor===6?62:76+level*3)*(phase===2?1.12:1),orbit=kind==='weezing'?.85:.65;
 // Reposition between tells: pressure the player and alternate flanks instead of parking in a dead zone.
 const v=kind==='muk'?{x:n.x*(floor===6?48:62+level*3),y:n.y*(floor===6?48:62+level*3)}:{x:(n.x*advance-n.y*orbit*side)*speedMove,y:(n.y*advance+n.x*orbit*side)*speedMove};
 return{v,actions};
}
