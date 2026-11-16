import type {Vec} from './combat';
/** Flank the player's last seen position; lock the chosen point for the whole warning. */
export function gengarDestination(origin:Vec,player:Vec,cycle:number):Vec{
 const heading=Math.atan2(player.y-origin.y,player.x-origin.x),distance=150+(cycle%3)*20;
 const candidates=Array.from({length:24},(_,i)=>{const a=heading+cycle*2.399963+i*Math.PI/12;return{x:player.x+Math.cos(a)*distance,y:player.y+Math.sin(a)*distance}});
 const safe=candidates.filter(p=>p.x>=130&&p.x<=990&&p.y>=190&&p.y<=530&&Math.hypot(p.x-origin.x,p.y-origin.y)>=85);
 return safe[0]??candidates.find(p=>p.x>=130&&p.x<=990&&p.y>=190&&p.y<=530)!;
}
export function radialDirections(count:number,origin:Vec,target:Vec,cycle:number){const aim=Math.atan2(target.y-origin.y,target.x-origin.x)+(cycle%2?0:Math.PI/count);return Array.from({length:count},(_,i)=>({x:Math.cos(i*Math.PI*2/count+aim),y:Math.sin(i*Math.PI*2/count+aim)}))}
