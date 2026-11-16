import type {Kind} from './data';
import {NORMAL_VARIANTS} from './normal-patterns';
/** Wind-up and recovery remain inside live combat; no input lock or tutorial pause. */
export function enemyPose(kind:Kind,charge:number,recovery:number,time:number){
 if(charge>0){if(['stunky','skuntank'].includes(kind))return{x:1.18,y:1.12,tilt:Math.sin(time*18)*2};if(['spinarak','ariados'].includes(kind))return{x:1.15,y:.72,tilt:-8};if(['trubbish','garbodor'].includes(kind))return{x:.9,y:1.16,tilt:-10};if(kind==='malamar')return{x:1.2,y:1.06,tilt:-14};if(kind==='inkay')return{x:.85,y:1.15,tilt:Math.sin(time*9)*12};if(kind==='spiritomb')return{x:1.12,y:1.08,tilt:Math.sin(time*12)*7}}
 const rush=kind==='zubat'||kind==='houndoom'||NORMAL_VARIANTS[kind]?.family==='zubat';
 if(charge>0)return rush?{x:1.14,y:.82,tilt:-12}:{x:.92,y:1.1,tilt:Math.sin(time*16)*3};
 if(recovery>0)return{x:1.08,y:.9,tilt:6};
 return{x:1,y:1,tilt:Math.sin(time*7)*4};
}
