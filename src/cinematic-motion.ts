import {LAB_EXIT} from './cinematic-stage';
// Seconds and normalized texture coordinates. Animation stays deterministic when paused/resized.
export const saturate=(n:number)=>Math.max(0,Math.min(1,n));
export const smooth=(n:number)=>{const p=saturate(n);return p*p*(3-2*p)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export type Point={x:number;y:number};
export type MewPose={x:number;y:number;width:number;bank:number;tuck:number;effort:number;look:number;tail:number};
export const CAPTURE_FIRE=2.9;
export const CAPTURE_CONTACT=3.55;
export function footCycle(distance:number,offset=0){
 const stride=36,phase=((distance/stride+offset)%1+1)%1;
 if(phase<.65)return{x:stride*(.325-phase),y:0};
 const swing=(phase-.65)/.35;
 return{x:stride*(-.325+.65*smooth(swing)),y:-Math.sin(swing*Math.PI)*17};
}
export function operatorPose(t:number,delay=0){
 const walk=smooth((t-delay)/2.25),distance=walk*138,settle=1-smooth((t-delay-1.95)/.4);
 const fire=t-CAPTURE_FIRE-delay*.3,recoil=fire<0?0:Math.exp(-fire*12)*Math.sin(Math.min(fire*18,Math.PI));
 return{distance,walk:settle,aim:smooth((t-delay-1.55)/1.1),recoil,breath:Math.sin(t*2)*.0015};
}
export function captureMew(t:number):MewPose{
 const alert=smooth((t-2.05)/.55),dodge=smooth((t-2.75)/.7),caught=smooth((t-CAPTURE_CONTACT)/.3),sink=smooth((t-3.85)/2.4),struggle=Math.sin((t-3.55)*12)*Math.exp(-Math.max(0,t-3.55)*1.4)*caught;
 return{x:510+alert*7+dodge*22+struggle*8,y:220+Math.sin(t*2)*3-alert*9+dodge*3+sink*58,width:169-sink*8,bank:-alert*.1+dodge*.19+struggle*.07,tuck:caught*.55,effort:alert*.2+caught*(1-sink),look:alert*.08,tail:t*3+struggle*.5};
}
export function escapeMew(t:number):MewPose{
 const startle=smooth((t-.15)/.35)*(1-smooth((t-.8)/.55)),inspect=smooth((t-1.3)/.7),crouch=smooth((t-2.4)/.55)*(1-smooth((t-3.15)/.35)),dash=smooth((t-3.15)/1.55),glide=smooth((t-4.7)/2.4);
 return{x:500-startle*9+inspect*8-crouch*12+dash*176+glide*(LAB_EXIT.x-684),y:242+startle*8+Math.sin(t*2)*2+crouch*17-dash*82+glide*(LAB_EXIT.y-160),width:146-dash*12-glide*76,bank:-startle*.13+inspect*.055+crouch*.16-dash*(1-glide)*.39+glide*.045,tuck:crouch*.8+dash*(1-glide)*.55,effort:startle*.9+crouch+dash*(1-glide)*.6,look:inspect*.075,tail:t*2.2-dash*1.6};
}
export function chamberOpening(t:number){return smooth((t-1.1)/1.9)}
const region=(v:number,a:number,b:number)=>smooth((v-a)/(b-a));
const rotate=(p:Point,pivot:Point,a:number):Point=>({x:pivot.x+(p.x-pivot.x)*Math.cos(a)-(p.y-pivot.y)*Math.sin(a),y:pivot.y+(p.x-pivot.x)*Math.sin(a)+(p.y-pivot.y)*Math.cos(a)});
const blend=(p:Point,q:Point,w:number):Point=>({x:mix(p.x,q.x,w),y:mix(p.y,q.y,w)});
export function deformOperator(p:Point,t:number,delay=0,width=205,height=243):Point{
 const pose=operatorPose(t,delay),left=footCycle(pose.distance),right=footCycle(pose.distance,.5);
 // Weight transfers at the pelvis; feet stay planted through 65% of each step.
 const lower=region(p.y,.50,.9),front=region(p.x,.29,.53);
 const foot={x:mix(left.x,right.x,front),y:mix(left.y,right.y,front)};
 let q={x:p.x+lower*foot.x/width*pose.walk,y:p.y+lower*foot.y/height*pose.walk};
 const knee= Math.sin(Math.PI*region(p.y,.51,.94));
 q.x+=knee*.018*Math.sin(pose.distance/36*Math.PI*2)*(front*2-1)*pose.walk;
 const upper=1-region(p.y,.48,.68),bob=(Math.cos(pose.distance/36*Math.PI*4)-1)*.005*pose.walk;
 q.y+=bob*upper+pose.breath*upper;
 // Both hands and launcher pivot together at the shoulder, independently from the head.
 const arms=region(p.x,.45,.63)*(1-region(p.y,.32,.58));
 q=blend(q,rotate(q,{x:.40,y:.31},(1-pose.aim)*.14-pose.recoil*.045),arms);
 q.x-=pose.recoil*.023*upper;
 const head=(1-region(p.y,.19,.27))*region(p.x,.30,.38);
 q=blend(q,rotate(q,{x:.43,y:.22},-.025*pose.aim+pose.breath),head);
 return q;
}
export function deformMew(p:Point,t:number,pose:MewPose):Point{
 let q={...p};const legs=region(p.y,.63,.92),side=region(p.x,.54,.66);
 q.x+=(side-.5)*(-pose.tuck*.10+Math.sin(t*4+side*2)*.026)*legs;
 q.y-=legs*(pose.tuck*.075+Math.sin(t*3+side*2)*.012*(1+pose.effort));
 const hands=Math.exp(-(((p.y-.455)/.055)**2))*Math.min(1,Math.abs(p.x-.52)*5);
 q.y+=hands*(Math.sin(t*5+p.x*9)*.016*(.4+pose.effort)-pose.tuck*.025);
 const head=1-region(p.y,.37,.48);q=blend(q,rotate(q,{x:.45,y:.40},pose.look+Math.sin(t*1.8)*.015),head);
 const tail=region(Math.abs(p.x-.51),.21,.35)*region(p.y,.27,.34)*(1-region(p.y,.63,.72));
 q.y+=Math.sin(pose.tail-p.x*6)*.04*tail*(.7+pose.effort*.3);
 q.x+=Math.sin(pose.tail*.8+p.y*7)*.014*tail;
 return q;
}
