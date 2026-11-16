import type {Kind} from './data';
import {NORMAL_VARIANTS} from './normal-patterns';
/** Wind-up and recovery remain inside live combat; no input lock or tutorial pause. */
export function enemyPose(kind:Kind,charge:number,recovery:number,time:number){
 const rush=kind==='zubat'||kind==='houndoom'||NORMAL_VARIANTS[kind]?.family==='zubat';
 if(charge>0)return rush?{x:1.14,y:.82,tilt:-12}:{x:.92,y:1.1,tilt:Math.sin(time*16)*3};
 if(recovery>0)return{x:1.08,y:.9,tilt:6};
 return{x:1,y:1,tilt:Math.sin(time*7)*4};
}
