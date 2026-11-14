export interface Vec{x:number;y:number}
export const normalize=(x:number,y:number):Vec=>{const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0}};
export const cardinal=(x:number,y:number):Vec=>Math.max(Math.abs(x),Math.abs(y))<.2?{x:0,y:0}:Math.abs(x)>Math.abs(y)?{x:Math.sign(x),y:0}:{x:0,y:Math.sign(y)};
export function intersects(a:Vec,b:Vec,r:number){return Math.hypot(a.x-b.x,a.y-b.y)<r}
export function damage(hp:number,invulnerable:number,amount=1){return invulnerable>0?{hp,invulnerable,hit:false}:{hp:Math.max(0,hp-amount),invulnerable:1.1,hit:true}}
