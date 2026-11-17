import {rng,type DungeonRoom} from './dungeon';
import {MOVES,type Move} from './moves';
export type RewardKind='none'|'heart'|'key'|'treasure'|'boss';
export function roomReward(room:DungeonRoom,floor:number):RewardKind{
 if(room.secret&&room.kind!=='start')return room.kind==='combat'&&!room.elite?'key':'boss';
 if(floor===1||room.kind==='start')return'none';
 if(room.kind==='reward')return'treasure';if(room.kind==='boss')return'boss';
 const roll=rng(room.seed^0x51a7)();return roll<.08?'treasure':roll<.55?'none':roll<.8?'key':'heart';
}
const rare=new Set(['survey','icebeam','flamethrower','thunderbolt','drain','split']);
export const rareCombatReward=(id:string)=>rare.has(id)&&id!=='survey';
export function rewardTier(id:string){return rare.has(id)?'희귀 변형':['shadow','psybeam','sludge'].includes(id)?'특수':'일반'}
// Quality is our own weighting rule, not a claim about Isaac's quality system.
export function itemWeight(id:string,floor:number){return rare.has(id)?(floor>=5?.4:.65):['shadow','psybeam','sludge'].includes(id)?.75:1}
export function itemOffers(seed:number,owned:string[],floor:number,pool:'treasure'|'boss'|'rare',count=2,service?:'medical'|'archive',resonance=false):Move[]{
 const random=rng(seed^0xa73f),bossPool=['agility','focus','dragon','ricochet','ice','shadow','psybeam','spark','poison','flame','water'];
 const available=MOVES.filter(m=>owned.filter(id=>id===m.id).length<m.max&&(pool==='rare'?rareCombatReward(m.id):pool==='treasure'?(service==='medical'?['drain','ice','icebeam','focus','dragon','ricochet','swift'].includes(m.id):true):bossPool.includes(m.id)||(resonance&&['icebeam','thunderbolt','split'].includes(m.id))));
 const result:Move[]=[];
 while(available.length&&result.length<count){let ticket=random()*available.reduce((n,m)=>n+itemWeight(m.id,floor),0),index=available.findIndex(m=>(ticket-=itemWeight(m.id,floor))<0);if(index<0)index=available.length-1;result.push(available.splice(index,1)[0])}
 return result;
}
