import {NORMAL_KINDS,type Kind} from './data';
import {rng} from './dungeon';
export const UNLOCK_TIER:Partial<Record<Kind,number>>={"gastly": 0, "zubat": 0, "koffing": 1, "grimer": 0, "houndour": 1, "shuppet": 2, "drowzee": 1, "magnemite": 1, "cubone": 1, "misdreavus": 2, "ekans": 0, "arbok": 2, "skorupi": 0, "drapion": 3, "abra": 1, "kadabra": 3, "stunky": 0, "skuntank": 3, "spinarak": 1, "ariados": 3, "exeggcute": 1, "exeggutor": 4, "ditto": 2, "spiritomb": 2, "trubbish": 0, "garbodor": 3, "murkrow": 2, "sneasel": 4, "sableye": 3, "duskull": 2, "inkay": 2, "malamar": 4};
export function encounterWeights(floor:number,elite=false){
 const level=Math.max(0,Math.min(4,6-floor)),pool=NORMAL_KINDS.filter(kind=>UNLOCK_TIER[kind]!<=level);
 const current=elite?.95:.85,previous=level===1?1-current:elite?.04:.12,older=1-current-previous;
 const tierWeight=(tier:number)=>level===0?1:tier===level?current:tier===level-1?previous:older*Math.pow(.25,level-2-tier)/Array.from({length:level-1},(_,i)=>Math.pow(.25,i)).reduce((a,b)=>a+b,0);
 return pool.map(kind=>{const tier=UNLOCK_TIER[kind]!;return{kind,weight:tierWeight(tier)/pool.filter(k=>UNLOCK_TIER[k]===tier).length}});
}
export function encounterKind(seed:number,index:number,floor:number,elite=false):Kind{const pool=encounterWeights(floor,elite),random=rng(seed^Math.imul(index+1,0x6a71));let ticket=random()*pool.reduce((sum,p)=>sum+p.weight,0);return pool.find(p=>(ticket-=p.weight)<0)?.kind??pool[pool.length-1].kind}
