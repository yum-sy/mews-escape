import type {StoragePort} from './save';
import type {Warning} from './telegraphs';
export const HINT_KEY='mews-escape.pattern-hints.v1';
export const PATTERN_HINTS={
 returning:{title:'되돌아오는 뼈다귀',text:'날아간 뼈다귀가 같은 길로 되돌아옵니다. 지나간 자리로 바로 들어가지 마세요.',icon:'→ ↩'},
 guard:{title:'가스 껍질',text:'또가스가 짙어지면 피해를 덜 받습니다. 공격하려고 밝아질 때 집중해서 공격하세요.',icon:'◉ → ◎'},
 rush:{title:'돌진',text:'화살표 방향으로 곧 돌진합니다. 옆으로 비켜 주세요.',icon:'→ ↗'},
 burst:{title:'방사 공격',text:'잔상이 출현 위치입니다. 화살표 사이의 빈틈으로 이동하세요.',icon:'↖ ↑ ↗'},
 teleport:{title:'순간이동',text:'잔상 위치로 나타납니다. 그 자리와 발사 화살표에서 벗어나세요.',icon:'◇ → ◇'},
 fan:{title:'조준 발사',text:'예고한 방향으로 발사합니다. 표시를 본 뒤 옆으로 이동하세요.',icon:'↖ ↑ ↗'},
 tracking:{title:'추적탄',text:'보라색 탄은 잠깐 뮤를 따라 꺾입니다. 멈추지 말고 옆으로 크게 돌아 피하세요.',icon:'↪ ↪'},
 beam:{title:'빔 공격',text:'길게 표시된 띠가 곧 위험해집니다. 띠를 가로질러 바깥으로 빠져나오세요.',icon:'║ →'},
 pool:{title:'독 분출',text:'빗금 친 구역에 독이 퍼집니다. 테두리 밖으로 이동하세요.',icon:'⊗ →'},
 phase:{title:'패턴 변화',text:'보스가 잠시 멈춘 뒤 공격이 강해집니다. 다음 방향·범위 예고를 확인하세요.',icon:'Ⅱ → ✦'},
 trap:{title:'연구소 함정',text:'노란 예고 뒤에 장치가 작동합니다. 적도 피해를 받으니 위험 구역으로 유인할 수 있어요.',icon:'⚠ →'},
} as const;
export type PatternId=keyof typeof PATTERN_HINTS;
export function warningPattern(w:Warning):PatternId|null{if(w.returning)return'returning';if(w.tracking)return'tracking';if(w.label==='빔 예고')return'beam';return w.cue==='aim'?'fan':w.cue&&w.cue!=='notice'?w.cue:null}
export class PatternHints{
 private seen=new Set<PatternId>();
 constructor(private storage:StoragePort){try{const ids=JSON.parse(storage.getItem(HINT_KEY)??'[]');if(Array.isArray(ids))for(const id of ids)if(typeof id==='string'&&Object.hasOwn(PATTERN_HINTS,id))this.seen.add(id as PatternId)}catch{}}
 needs(id:PatternId){return !this.seen.has(id)}
 acknowledge(id:PatternId){this.seen.add(id);try{this.storage.setItem(HINT_KEY,JSON.stringify([...this.seen]));return true}catch{return false}}
}
