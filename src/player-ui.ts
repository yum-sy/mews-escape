import type {Run} from './run';
import {composeAttack,MOVES,type Attack} from './moves';
import {fusionLook} from './techniques';
export function objective(run:Run,entryGrace=false):string{
 if(entryGrace&&!run.room.cleared)return'적이 뮤를 알아차리는 중 · 잠시 후 함께 움직입니다';
 if(run.floor===1)return run.room.cleared?'열린 문 너머로, 함께':'뮤츠를 넘어 지상으로';
 if(!run.room.cleared)return run.room.kind==='boss'?'팬텀을 진정시키고 승강기 확보':'방 안의 위협을 모두 제압';
 if(run.room.kind==='boss')return run.rewardPending?'중앙 보상 확인 → 승강기':'승강기를 타고 B'+(run.floor-1)+'로';
 if(run.rewardPending&&run.rewardKind==='treasure')return run.room.opened?'중앙 캡슐에서 기술 확인':run.keys?'열쇠 1개로 중앙 캡슐 열기':'열쇠가 필요합니다 · 다른 방 탐험';
 const remaining=run.rooms.filter(r=>r.kind==='combat'&&!r.cleared).length;
 return remaining?`열린 문으로 탐험 · 남은 전투방 ${remaining}`:'팬텀 구역의 봉인이 풀렸습니다';
}
export function attackTraits(a:Attack):string[]{
 const traits=[`${a.count}갈래`,a.pierce?`관통 ${a.pierce}`:''];
 if(a.homing)traits.push('유도');if(a.bounce)traits.push(`벽 반사 ${a.bounce}`);
 if(a.burn)traits.push('화상');if(a.poison)traits.push('중독');if(a.slow)traits.push(`둔화 ${Math.round(a.slow*100)}%`);
 if(a.chain)traits.push(`연쇄 ${a.chain}`);if(a.split)traits.push('적중 분열');if(a.blast)traits.push('주변 폭발');if(a.lifesteal)traits.push('생명 흡수');if(a.knockback)traits.push('밀어내기');if(a.crit)traits.push(`치명타 ${Math.round(a.crit*100)}%`);
 return traits.filter(Boolean);
}
export function rewardComparison(ids:string[],id:string){
 const before=composeAttack(ids),after=composeAttack([...ids,id]);
 // All lanes landing, direct damage only: not total combat DPS or status uptime.
 const direct=(a:Attack)=>a.damage*a.count/a.interval*(1+a.crit*.6);
 const delta=Math.round((direct(after)/direct(before)-1)*100);
 const rank=ids.filter(x=>x===id).length+1;
 return {rank,delta,caption:id==='survey'?'지도·방 종류 공개 · 화력 유지':delta===0?'직접 화력 유지':`직접 화력 ${delta>0?'+':''}${delta}%`,name:fusionLook(after.visual).name,traits:attackTraits(after),carrier:MOVES.find(m=>m.id===after.visual.form)?.name??'염동력'};
}
export function formatDuration(seconds:number){const n=Math.max(0,Math.floor(seconds));return `${Math.floor(n/60)}분 ${String(n%60).padStart(2,'0')}초`}

export function attackLabel(a:Attack){
 const carrier=MOVES.find(m=>m.id===a.visual.form)?.name??'염동력',fusion=fusionLook(a.visual).name;
 return carrier===fusion?carrier:`${carrier} · ${fusion}`;
}
