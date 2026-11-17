import type {StoragePort} from './save';
export const UNLOCKS={decoy:{name:'대타출동',goal:'첫 연구소 보스 제압'},resonance:{name:'공명 연구 보상',goal:'폐쇄층 쌍보스 제압'},sanctuary:{name:'안정화실',goal:'서로 다른 연구 기록 3개 수집'}} as const;
export type Unlock=keyof typeof UNLOCKS;
const KEY='mews-escape.unlocks.v1';
export function readUnlocks(s:StoragePort):Unlock[]{try{const a=JSON.parse(s.getItem(KEY)||'[]');return Array.isArray(a)?[...new Set(a.filter((v):v is Unlock=>typeof v==='string'&&v in UNLOCKS))]:[]}catch{return[]}}
export function grantUnlock(s:StoragePort,id:Unlock){const a=readUnlocks(s);if(a.includes(id))return false;try{s.setItem(KEY,JSON.stringify([...a,id]));return true}catch{return false}}
export function unlockSummary(s:StoragePort){const owned=readUnlocks(s);return(Object.keys(UNLOCKS) as Unlock[]).map(k=>`${owned.includes(k)?'✓':'◇'} ${UNLOCKS[k].name} · ${owned.includes(k)?'해금 완료':UNLOCKS[k].goal}`).join('\n')}
export type ActiveSkill='reflector'|'decoy';
export const ACTIVE_NAMES={reflector:'리플렉터',decoy:'대타출동'};
export const ACTIVE_CHARGE=3;
