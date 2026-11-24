import {cageSegments} from './exploration-events';
import {segmentBlockEntry,type Block} from './lab';
import {stairLanding} from './stairs';
import {roomReward} from './rewards';
import type {DungeonRoom} from './dungeon';
import type {Vec} from './combat';
export interface EnvironmentState{eventsVersion?:1;stabilized?:boolean;gatesBroken?:number;ambushCleared?:number;broken:number;lootTaken?:number;powerOff:boolean;recordRead:boolean}
export const freshEnvironment=():EnvironmentState=>({eventsVersion:1,broken:0,powerOff:false,recordRead:false});
export function roomEnvironment(room:DungeonRoom){const state=room.environment??(room.environment=freshEnvironment());state.eventsVersion=1;return state}
export const FLOOR_THEMES=[
 {name:'원본 격리 구역',floor:0x253c48,light:0x89d9d2,accent:0x72b6af,sign:'ORIGIN / 151',feature:'pods'},
 {name:'표본 보관 구역',floor:0x283b38,light:0xb7dca0,accent:0x84aa78,sign:'SPECIMEN ARCHIVE',feature:'shelves'},
 {name:'독성 처리 구역',floor:0x34382b,light:0xd4d17b,accent:0xa6ba6e,sign:'BIOHAZARD / PURGE',feature:'tanks'},
 {name:'공명 실험 구역',floor:0x333047,light:0xbea2ed,accent:0x967dbb,sign:'RESONANCE ARRAY',feature:'coils'},
 {name:'중앙 통제 구역',floor:0x273747,light:0x8fbde9,accent:0x709ebe,sign:'CENTRAL CONTROL',feature:'consoles'},
 {name:'마지막 문',floor:0x363342,light:0xf1d4ab,accent:0xc8a4b8,sign:'SURFACE / EXIT',feature:'ruins'},
] as const;
export const floorTheme=(floor:number)=>FLOOR_THEMES[Math.max(0,Math.min(5,6-floor))];
export function breakableProps(room:DungeonRoom){if(room.kind==='boss')return[];const gate=cageSegments(room)[0],positions=[{x:gate?.x===190?140:170,y:280},{x:950,y:480},{x:300,y:535},{x:gate?.x===910?960:900,y:280}];return positions.map((p,i)=>({...p,id:i,kind:(room.seed+i)%2?'crate':'canister',radius:29}))}
export type InteractionKind='reward'|'lift'|'record'|'power'|'secret'|'depth'|'return'|'sanctuary'|'annex'|'crate';
export interface Interaction extends Vec{kind:InteractionKind;label:string;propId?:number}
export function roomInteractions(room:DungeonRoom,floor:number,canExit:boolean):Interaction[]{
 if(floor===1)return[];const state=room.environment??freshEnvironment(),items:Interaction[]=[];
 if(room.cleared){items.push({kind:'record',x:230,y:200,label:state.recordRead?'기록 다시 읽기':'연구 기록 조사'});const reward=roomReward(room,floor);if(!room.rewardTaken&&reward!=='none')items.push({kind:'reward',x:560,y:365,label:{heart:'회복제 사용 · HP 1',key:'열쇠 줍기',treasure:room.opened?'보상 선택':room.service==='medical'?'의무실 · 회복 또는 기술 · 열쇠 1':'기술 캡슐 해제 · 열쇠 1',boss:room.elite?'희귀 기술 보장 · 습득 시 경계 +1':room.secret?'숨겨진 기술 · 3개 중 선택 + 열쇠 1':'보스 보상 · 강화 + 열쇠 1'}[reward]});if(room.kind==='boss'&&canExit&&room.rewardTaken)items.push({kind:'lift',...stairLanding(room),label:`B${floor-1}로 올라가는 계단`})}
 if(room.kind==='combat'&&!state.powerOff)items.push({kind:'power',x:880,y:200,label:'시설 전원 차단'});
 return items;
}
export function nearestInteraction(player:Vec,items:Interaction[]){return items.filter(i=>Math.hypot(i.x-player.x,i.y-player.y)<=88).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]}
export function breakProp(state:EnvironmentState,id:number){if(id<0||id>3||!Number.isInteger(id)||state.broken&(1<<id))return false;state.broken|=1<<id;return true}

export function sceneryBlocks(room:DungeonRoom){const state=room.environment??freshEnvironment();return breakableProps(room).filter(p=>!(state.broken&(1<<p.id))).map(propBlock)}

export const propBlock=(p:Vec):Block=>({x:p.x,y:p.y,w:50,h:48});
export function pathHitsProp(prop:Vec,points:(Vec&{width:number})[]){return points.some((p,i)=>segmentBlockEntry(points[Math.max(0,i-1)],p,propBlock(prop),p.width+.001)!==null)}
