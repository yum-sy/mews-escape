import type {DungeonRoom} from './dungeon';
import type {Vec} from './combat';
export interface EnvironmentState{broken:number;powerOff:boolean;recordRead:boolean}
export const freshEnvironment=():EnvironmentState=>({broken:0,powerOff:false,recordRead:false});
export function roomEnvironment(room:DungeonRoom){return room.environment??(room.environment=freshEnvironment())}
export const FLOOR_THEMES=[
 {name:'원본 격리 구역',floor:0x253c48,light:0x89d9d2,accent:0x72b6af,sign:'ORIGIN / 151',feature:'pods'},
 {name:'표본 보관 구역',floor:0x283b38,light:0xb7dca0,accent:0x84aa78,sign:'SPECIMEN ARCHIVE',feature:'shelves'},
 {name:'독성 처리 구역',floor:0x34382b,light:0xd4d17b,accent:0xa6ba6e,sign:'BIOHAZARD / PURGE',feature:'tanks'},
 {name:'공명 실험 구역',floor:0x333047,light:0xbea2ed,accent:0x967dbb,sign:'RESONANCE ARRAY',feature:'coils'},
 {name:'중앙 통제 구역',floor:0x273747,light:0x8fbde9,accent:0x709ebe,sign:'CENTRAL CONTROL',feature:'consoles'},
 {name:'마지막 문',floor:0x363342,light:0xf1d4ab,accent:0xc8a4b8,sign:'SURFACE / EXIT',feature:'ruins'},
] as const;
export const floorTheme=(floor:number)=>FLOOR_THEMES[Math.max(0,Math.min(5,6-floor))];
export function breakableProps(room:DungeonRoom){if(room.kind==='boss')return[];const positions=[{x:170,y:280},{x:950,y:480},{x:300,y:535},{x:900,y:280}];return positions.map((p,i)=>({...p,id:i,kind:(room.seed+i)%2?'crate':'canister',radius:29}))}
export type InteractionKind='reward'|'lift'|'record'|'power';
export interface Interaction extends Vec{kind:InteractionKind;label:string}
export function roomInteractions(room:DungeonRoom,floor:number,canExit:boolean):Interaction[]{
 if(floor===1)return[];const state=room.environment??freshEnvironment(),items:Interaction[]=[];
 if(room.cleared){items.push({kind:'record',x:230,y:200,label:state.recordRead?'기록 다시 읽기':'연구 기록 조사'});if(!room.rewardTaken&&['combat','reward'].includes(room.kind))items.push({kind:'reward',x:560,y:365,label:'기술 캡슐 열기'});if(room.kind==='boss'&&canExit)items.push({kind:'lift',x:560,y:365,label:`B${floor-1} 승강기 작동`})}
 if(room.kind==='combat'&&!state.powerOff)items.push({kind:'power',x:880,y:200,label:'시설 전원 차단'});
 return items;
}
export function nearestInteraction(player:Vec,items:Interaction[]){return items.filter(i=>Math.hypot(i.x-player.x,i.y-player.y)<=72).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]}
export function breakProp(state:EnvironmentState,id:number){if(id<0||id>3||!Number.isInteger(id)||state.broken&(1<<id))return false;state.broken|=1<<id;return true}

export function sceneryBlocks(room:DungeonRoom){const state=room.environment??freshEnvironment();return breakableProps(room).filter(p=>!(state.broken&(1<<p.id))).map(p=>({x:p.x,y:p.y,w:50,h:48}))}
