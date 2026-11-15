import type {StoragePort} from './save';
const KEY='mews-escape.archive.v1';
export interface Profile{runs:number;wins:number;bestFloor:number;bestKills:number;bestTime:number|null;records:number[]}
const fresh=():Profile=>({runs:0,wins:0,bestFloor:6,bestKills:0,bestTime:null,records:[]});
export function readProfile(storage:StoragePort):Profile{try{const p=JSON.parse(storage.getItem(KEY)||'null') as Profile;if(!p||!Number.isInteger(p.runs)||p.runs<0||!Number.isInteger(p.wins)||p.wins<0||p.wins>p.runs||!Number.isInteger(p.bestFloor)||p.bestFloor<1||p.bestFloor>6||!Number.isInteger(p.bestKills)||p.bestKills<0||p.bestTime!==null&&(!Number.isFinite(p.bestTime)||p.bestTime<0)||!Array.isArray(p.records)||p.records.length>6||p.records.some(n=>!Number.isInteger(n)||n<0||n>5))return fresh();return{...p,records:[...new Set(p.records)]}}catch{return fresh()}}
const write=(storage:StoragePort,p:Profile)=>{try{storage.setItem(KEY,JSON.stringify(p));return true}catch{return false}};
export function rememberRecord(storage:StoragePort,index:number){if(!Number.isInteger(index)||index<0||index>5)return false;const p=readProfile(storage);if(!p.records.includes(index))p.records.push(index);return write(storage,p)}
export function finishProfile(storage:StoragePort,won:boolean,floor:number,kills:number,elapsed:number){const p=readProfile(storage);p.runs++;if(won){p.wins++;p.bestTime=Math.min(p.bestTime??Infinity,elapsed)}p.bestFloor=Math.min(p.bestFloor,floor);p.bestKills=Math.max(p.bestKills,kills);return write(storage,p)}
