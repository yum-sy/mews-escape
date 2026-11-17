import type {Attack} from './moves';
export function fusionRules(a:Attack){const l=a.visual.levels;return{thermal:!!((l.flame||l.flamethrower)&&(l.ice||l.icebeam)),conductive:!!(l.water&&(l.spark||l.thunderbolt)),toxicDrain:!!(l.drain&&(l.poison||l.sludge)),bankShot:!!(l.shadow&&l.ricochet)}}
export function fusionDamageScale(a:Attack){const r=fusionRules(a);return(r.thermal?.75:1)*(r.conductive?.9:1)*(r.toxicDrain?.9:1)*(r.bankShot?.85:1)}
export function reflectionAttack(a:Attack):Attack{return fusionRules(a).bankShot?{...a,pierce:Math.min(3,a.pierce+1),damage:a.damage*1.15,homing:a.homing*.7}:a}
export function thermalBank(a:Attack,dealt:number,current:number){return fusionRules(a).thermal?Math.min(4,current+Math.max(0,dealt)/3):current}
export const FUSION_HELP='냉기+불꽃: 축적 후 공격을 놓아 열충격 · 물+전기: 젖은 적 사이 전도 · 독+흡수: 중독된 적에서 흡수 강화 · 섀도볼+반사: 벽을 맞힌 뒤 관통 증가';
