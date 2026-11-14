import {Run,roomsForFloor} from './run';
import {MOVES} from './moves';
import {DIRECTIONS,type Direction} from './dungeon';
export const SAVE_KEY='mews-escape.run.v1';
export interface Checkpoint{version:1;seed:number;floor:number;current:number;moves:string[];rooms:{visited:boolean;cleared:boolean;rewardTaken:boolean}[];hp:number;kills:number;elapsed:number;drain:number;entry:Direction|null;phase:1|2|3;ending:boolean;savedAt:number}
export interface StoragePort{getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
const integer=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
const finite=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function decodeSave(raw:string|null):Checkpoint|null{
 try{if(!raw||raw.length>30000)return null;const s=JSON.parse(raw) as Checkpoint;
  if(s.version!==1||!integer(s.seed,0,0xffffffff)||!integer(s.floor,1,6)||!integer(s.hp,1,6)||!integer(s.phase,1,3)||!integer(s.kills,0,10000)||!finite(s.elapsed,0,1e8)||!finite(s.drain,0,1)||!finite(s.savedAt,0,1e15)||typeof s.ending!=='boolean'||(s.entry!==null&&!DIRECTIONS.includes(s.entry)))return null;
  if(!Array.isArray(s.moves)||s.moves.length>50)return null;for(const id of s.moves){const m=MOVES.find(m=>m.id===id);if(!m||s.moves.filter(x=>x===id).length>m.max)return null}
  const rooms=roomsForFloor(s.seed,s.floor);if(!integer(s.current,0,rooms.length-1)||!Array.isArray(s.rooms)||s.rooms.length!==rooms.length)return null;
  for(const [i,r] of s.rooms.entries()){if(!r||['visited','cleared','rewardTaken'].some(k=>typeof r[k as keyof typeof r]!=='boolean'))return null;const kind=rooms[i].kind;if((kind==='start'||kind==='reward')&&!r.cleared)return null;if(r.rewardTaken&&(!r.visited||!r.cleared||!['combat','reward'].includes(kind)))return null}
  if(!s.rooms[s.current].visited||s.ending&&(s.floor!==1||s.phase!==3||!s.rooms[0].cleared)||s.floor!==1&&(s.phase!==1||s.ending))return null;
  if(s.floor===1&&s.rooms[0].cleared!==s.ending)return null;
  return s;
 }catch{return null}
}
export function restoreRun(s:Checkpoint){const run=new Run(s.seed);run.floor=s.floor;run.rooms=roomsForFloor(s.seed,s.floor);run.current=s.current;run.moves=[...s.moves];run.rooms.forEach((r,i)=>{r.visited=s.rooms[i].visited;r.cleared=s.rooms[i].cleared;r.rewardTaken=s.rooms[i].rewardTaken});return run}
export function readCheckpoint(storage:StoragePort){try{const raw=storage.getItem(SAVE_KEY),save=decodeSave(raw);return{save,status:raw&&!save?'저장 형식이 손상되었거나 지원되지 않습니다. 새 게임을 시작할 수 있습니다.':''}}catch{return{save:null,status:'브라우저 저장소에 접근할 수 없습니다. 자동 저장 없이 플레이합니다.'}}}
export function writeCheckpoint(storage:StoragePort,save:Checkpoint){try{storage.setItem(SAVE_KEY,JSON.stringify(save));return true}catch{return false}}
export function removeCheckpoint(storage:StoragePort){try{storage.removeItem(SAVE_KEY);return true}catch{return false}}
// Access itself may throw (private mode / denied storage); keep the UI playable.
export const browserStorage:StoragePort={getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v),removeItem:k=>window.localStorage.removeItem(k)};
