// Landmarks in the 1000×500 illustrated stage, shared by motion, effects and occlusion.
export const LAB_EXIT={x:835,y:235,left:801,right:872,top:170,bottom:301};
export function rubblePose(index:number,time:number){
 const floor=320+(index%7)*16,start=-45-(index%4)*18,spawn=.72+(index%11)*.14,gravity=330;
 const age=Math.max(0,time-spawn),impact=Math.sqrt((floor-start)/gravity),after=age-impact;
 const bounce=after>0&&after<.42?Math.sin(after/.42*Math.PI)*(12+index%5*2)*(1-after/.42):0;
 return{x:65+(index*137)%860+Math.sin(index*2)*Math.min(age,impact)*24,y:age<impact?start+gravity*age*age:floor-bounce,floor,visible:time>=spawn,landed:after>=.42,impact:after,angle:index*.7+Math.min(age,impact+.42)*(index%2?1:-1)*1.7};
}
