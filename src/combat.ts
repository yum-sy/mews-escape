import {STATS} from './data';
export interface Vec{x:number;y:number}
export const normalize=(x:number,y:number):Vec=>{const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0}};
export function intersects(a:Vec,b:Vec,r:number){return Math.hypot(a.x-b.x,a.y-b.y)<r}
export function damage(hp:number,invulnerable:number,amount=1){return invulnerable>0?{hp,invulnerable,hit:false}:{hp:Math.max(0,hp-amount),invulnerable:STATS.invulnerability,hit:true}}

// Reserve hostile projectile slots so a high-output build cannot silence a boss.
export function canSpawnProjectile(shots:readonly {hostile:boolean}[],hostile:boolean){return shots.length<120&&shots.filter(s=>s.hostile===hostile).length<(hostile?40:80)}
