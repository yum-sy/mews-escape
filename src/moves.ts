import {presentation,fusionLook,type Presentation} from './techniques';
export interface Attack{visual:Presentation;damage:number;interval:number;speed:number;range:number;size:number;count:number;pierce:number;homing:number;split:number;color:number;burn:number;slow:number;chain:number;poison:number;knockback:number;crit:number;lifesteal:number;bounce:number;blast:number}
export type Modifier=Partial<Omit<Attack,'color'|'visual'>>;
export interface Move{id:string;name:string;type:string;form:string;description:string;synergy:string;modifier:Modifier;color:number;priority:number;max:number}
export const MOVES:Move[]=[
 {id:'survey',name:'마음의눈',type:'탐색',form:'연구소 감지',description:'현재 층과 이후 층의 지도·방 종류 공개 · 공격력 변화 없음',synergy:'전투 강화 한 번을 포기하고 탐색 경로를 계획합니다. 적이나 보상 내용은 공개하지 않습니다.',modifier:{},color:0x9cdbcc,priority:-2,max:1},
 {id:'shadow',name:'섀도볼',type:'고스트',form:'관통 탄환',description:'공격력 성장 +0.22 (중첩 효율 감소) · 적 1마리 추가 관통 (후속 적중마다 위력 35% 감소 · 최대 2관통)',synergy:'유도·다중 탄환에도 관통이 적용됩니다.',modifier:{damage:.22,pierce:1},color:0xbca0ff,priority:2,max:2},
 {id:'swift',name:'스피드스타',type:'노말',form:'유도 탄환',description:'유도 강화 · 직접 피해 55%로 감소 (2단계 40%)',synergy:'관통 후 다음 적을 추적합니다. 상태 효과를 모은 뒤 선택하세요.',modifier:{homing:2.2},color:0xffe0a0,priority:1,max:2},
 {id:'tri',name:'트라이어택',type:'노말',form:'다중 탄환',description:'3발 합산 직접 피해 65% (2단계 5발 합산 50%)',synergy:'화력을 포기하고 효과를 넓게 전달합니다. 유도 감산과 곱해집니다.',modifier:{count:2},color:0xf5bce6,priority:0,max:2},
 {id:'flame',name:'불꽃세례',type:'불꽃',form:'화상',description:'적중 시 2초 동안 초당 0.65 화상 피해',synergy:'둔화와 함께 적용됩니다. 화상+중독 합계는 초당 0.9가 한계입니다.',modifier:{burn:.65},color:0xff9b71,priority:3,max:2},
 {id:'ice',name:'얼다바람',type:'얼음',form:'부채꼴 냉기',description:'냉기 3갈래로 위력 분산 · 2초 동안 22% 둔화',synergy:'다중 탄환으로 여러 적을 동시에 둔화합니다.',modifier:{slow:.22},color:0x91e6fa,priority:3,max:2},
 {id:'spark',name:'전기쇼크',type:'전기',form:'연쇄 피해',description:'적중 시 가까운 적 1마리에게 18% 피해 전달 · 탄환당 한 번',synergy:'관통탄도 첫 적중에서만 연쇄합니다. 분열탄은 연쇄하지 않습니다.',modifier:{chain:1},color:0xffe994,priority:3,max:3},
 {id:'split',name:'분열 강화',type:'강화',form:'적중 시 분열',description:'첫 적중에서 20% 위력의 탄환 2개로 분열',synergy:'유도·둔화는 유지, 지속 피해는 절반. 분열탄은 관통·연쇄·폭발하지 않습니다.',modifier:{split:2},color:0xd8c3ff,priority:0,max:1},
 {id:'psybeam',name:'환상빔',type:'에스퍼',form:'맥동 광선',description:'굵은 광선을 주기적으로 발사 · 공격력 성장 +0.3 (중첩 효율 감소) · 반경 +2',synergy:'분열·연쇄 피해도 함께 강해집니다.',modifier:{damage:.3,size:2},color:0xf3b9ef,priority:1,max:3},
 {id:'agility',name:'고속이동',type:'에스퍼',form:'연사 강화',description:'연사 성장 +0.02 · 중첩 효율 감소 · 최소 간격 0.155초',synergy:'다중 탄환과 함께 더 촘촘한 탄막을 만듭니다.',modifier:{interval:-.02},color:0xb6eadf,priority:0,max:2},

 {id:'poison',name:'독침',type:'독',form:'중독',description:'적중 시 2초 동안 초당 0.5 중독 피해',synergy:'화상과 함께 적용되지만 지속 피해 합계는 초당 0.9로 제한됩니다.',modifier:{poison:.5},color:0xc191ef,priority:3,max:2},
 {id:'dragon',name:'용의파동',type:'드래곤',form:'넉백',description:'적중한 적을 16px 밀어냅니다 (중첩 최대 18px). 보스는 25% 적용.',synergy:'추적하는 적을 밀어내고 다시 유도합니다.',modifier:{knockback:16},color:0x9faaff,priority:2,max:2},
 {id:'drain',name:'기가드레인',type:'풀',form:'흡수 연결',description:'조준한 적에게 흡수 줄기 · 직접 피해 240마다 HP 1 회복 · 중첩 최대 220당 1',synergy:'관통·다중 탄환의 적중도 회복량에 합산됩니다.',modifier:{lifesteal:1/240},color:0x9be3aa,priority:3,max:2},
 {id:'focus',name:'기충전',type:'노말',form:'치명타',description:'탄환마다 치명타 확률 +12% (최대 18%) · 치명타 피해 1.6배',synergy:'큰 탄환·관통의 피해를 함께 증폭합니다.',modifier:{crit:.12},color:0xffdebd,priority:0,max:2},
 {id:'ricochet',name:'반사 강화',type:'강화',form:'벽 반사',description:'탄환이 방 벽에 한 번 튕깁니다.',synergy:'튕긴 탄환도 유도·관통 효과를 유지합니다.',modifier:{bounce:1},color:0xade6df,priority:0,max:2},
 {id:'sludge',name:'오물폭탄',type:'독',form:'적중 폭발',description:'적중 시 주변 65px의 적에게 15% 추가 피해 · 탄환당 한 번',synergy:'첫 적중에서만 폭발합니다. 분열탄은 폭발하지 않습니다.',modifier:{blast:65},color:0xbc8acb,priority:4,max:1},
 {id:'water',name:'물대포',type:'물',form:'지속 물줄기',description:'누르는 동안 물줄기 · 탄속 +120 · 사거리 +120',synergy:'다중 물줄기·벽 반사·유도를 조합합니다.',modifier:{speed:120,range:120},color:0x8fc9fa,priority:2,max:2},
 {id:'icebeam',name:'냉동빔',type:'얼음',form:'지속 관통 빔',description:'누르는 동안 긴 빔 · 관통 +1 · 둔화 +12%',synergy:'유도로 휘고, 반사로 벽에서 꺾입니다. 화상·중독도 누적됩니다.',modifier:{range:180,pierce:1,slow:.12},color:0x9eeaff,priority:3,max:2},
 {id:'thunderbolt',name:'10만볼트',type:'전기',form:'즉발 번개',description:'조준 방향으로 즉시 방전 · 연쇄 대상 +1 · 공격력 +0.2',synergy:'각 원본 탄환의 첫 적중에서 전기가 퍼집니다.',modifier:{chain:1,damage:.2},color:0xffe994,priority:4,max:2},
 {id:'flamethrower',name:'화염방사',type:'불꽃',form:'연속 화염 분사',description:'누르는 동안 짧고 넓은 불줄기 · 화상 DPS +0.45',synergy:'다중 불줄기·유도·관통·연쇄·흡수를 함께 적용합니다.',modifier:{interval:-.012,burn:.45},color:0xff9872,priority:4,max:2},
];
// Coverage is a utility tradeoff, including when homing and multishot feed a beam.
export function coverageDamageScale(ids:readonly string[]){const tri=Math.min(2,ids.filter(id=>id==='tri').length),swift=Math.min(2,ids.filter(id=>id==='swift').length);return [1,.65,.5][tri]*[1,.55,.4][swift]}
export function composeAttack(ids:string[]):Attack{
 const a:Attack={visual:presentation(ids),damage:1,interval:.19,speed:600,range:720,size:5,count:1,pierce:0,homing:0,split:0,color:0xf3b9ef,burn:0,slow:0,chain:0,poison:0,knockback:0,crit:0,lifesteal:0,bounce:0,blast:0};let priority=-1;
 for(const id of ids){const move=MOVES.find(m=>m.id===id);if(!move)continue;for(const [key,value] of Object.entries(move.modifier))a[key as keyof Modifier]+=value;if(move.priority>=priority){a.color=move.color;priority=move.priority}}
 // Diminishing growth prevents old saves and stacked bonuses from bypassing the budget.
 const bonus=a.damage-1;a.damage=1+bonus/(1+bonus*.65);const rate=.19-a.interval;a.interval=.19-rate/(1+rate*12);
 const dot=a.burn+a.poison;if(dot>.9){a.burn*=.9/dot;a.poison*=.9/dot}
 a.count=Math.min(5,a.count);a.interval=Math.max(.155,a.interval);a.pierce=Math.min(2,a.pierce);a.homing=Math.min(4.4,a.homing);a.slow=Math.min(.45,a.slow);a.chain=Math.min(2,a.chain);a.size=Math.min(11,a.size);a.split=Math.min(2,a.split);a.speed=Math.min(960,a.speed);a.range=Math.min(1200,a.range);a.crit=Math.min(.18,a.crit);a.lifesteal=Math.min(1/220,a.lifesteal);a.knockback=Math.min(18,a.knockback);a.bounce=Math.min(2,a.bounce);a.blast=Math.min(100,a.blast);a.damage*=coverageDamageScale(ids)/a.count;a.color=fusionLook(a.visual).core;return a;
}

// Secondary hits cannot start another proc cascade; homing and status identity survive.
export const CHAIN_DAMAGE=.18,BLAST_DAMAGE=.15,PIERCE_RETAIN=.65,CRITICAL_MULTIPLIER=1.6;
export function splitAttack(a:Attack):Attack{return {...a,damage:a.damage*.2,size:Math.max(3,a.size*.7),range:360,split:0,chain:0,blast:0,pierce:0,bounce:0,lifesteal:0,burn:a.burn*.5,poison:a.poison*.5}}
