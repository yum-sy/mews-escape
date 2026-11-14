import {CAPTURE_FIRE,CAPTURE_CONTACT,operatorPose} from './cinematic-motion';
import {rubblePose} from './cinematic-stage';
export type CueKind='step'|'net'|'catch'|'scan'|'crack'|'glass'|'metal'|'collapse'|'debris'|'energy'|'escape'|'chime';
export type SoundCue={at:number;kind:CueKind;pan:number;level:number};
const crossing=(f:(t:number)=>number,value:number,max=8)=>{let a=0,b=max;for(let i=0;i<35;i++){const m=(a+b)/2;if(f(m)<value)a=m;else b=m}return(a+b)/2};
export function openingScore(shot:string):SoundCue[]{
 const score:SoundCue[]=[];const add=(at:number,kind:CueKind,pan=0,level=1)=>score.push({at,kind,pan,level});
 if(shot==='capture'){
  for(const delay of [0,.28])for(let distance=18;distance<=126;distance+=18)add(crossing(t=>operatorPose(t,delay).distance,distance,3),'step',delay?.65:-.65,delay?.7:1);
  add(CAPTURE_FIRE,'net',-.45);add(CAPTURE_CONTACT,'catch',.05);add(4.15,'catch',.05,.35);
 }else if(shot==='experiment'){for(const at of [0.3,2,4,6])add(at,'scan',.3,.65)}
 else if(shot==='awakening'){add(.6,'energy',0,.65);add(2.6,'energy',0,.9)}
 else if(shot==='collapse'){
  add(.72,'crack',-.35);add(.9,'collapse');add(1.25,'glass',.65,.6);
  for(const i of [0,3,6,9,13,17])add(crossing(t=>rubblePose(i,t).impact,0),'debris',(i%3-1)*.6,.45+i%3*.12);
 }else if(shot==='freedom'){add(.15,'crack',0,.5);add(1.1,'glass');add(1.25,'metal',-.2,.45);add(3,'metal',.4,.6);add(3.15,'escape',.2);add(3.25,'debris',-.45,.75);add(6.9,'chime',.7,.6)}
 return score.sort((a,b)=>a.at-b.at);
}
// Advance even while muted. Never replay missed effects after unlocking audio or returning to a tab.
export class SoundCursor{
 private previous=-.001;
 constructor(readonly cues:SoundCue[]){}
 advance(time:number,audible:boolean){const from=Math.max(this.previous,time-.22);this.previous=time;return audible?this.cues.filter(c=>c.at>from&&c.at<=time):[]}
 seek(time:number){this.previous=time}
}
