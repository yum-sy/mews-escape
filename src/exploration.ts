import {pendingAmbush} from './exploration-events';
import type {DungeonRoom} from './dungeon';
export const hasSurvey=(moves:readonly string[],floorMap=false)=>moves.includes('survey');
export function roomKnown(room:DungeonRoom,moves:readonly string[],floorMap=false){return room.visited||floorMap}
export function roomLabel(room:DungeonRoom,moves:readonly string[],floorMap=false){return roomKnown(room,moves,floorMap)?({start:'격리실',combat:room.cleared?'정리한 방':'실험실',reward:room.service==='medical'?'의무실':'기술 보관실',boss:'비상 계단실'}[room.kind]):'미탐험'}
export function mapSymbol(room:DungeonRoom,moves:readonly string[],floorMap=false){if(!roomKnown(room,moves,floorMap))return'?';if(!room.visited)return({start:'S',combat:'·',reward:'✧',boss:'B'}[room.kind]);return room.kind==='start'?'S':room.kind==='boss'?(room.cleared?'↑':'B'):room.kind==='reward'?(room.rewardTaken?'·':'✧'):room.cleared?'·':'!'}

export function roomMapIcon(room:DungeonRoom){return room.kind==='start'?'empty':room.kind==='combat'?(room.cleared&&pendingAmbush(room)===null?'empty':'combat'):room.kind==='reward'?(room.rewardTaken?'empty':'reward'):room.cleared?'up':'boss'}
export function roomMapLabel(room:DungeonRoom){return room.kind==='start'?'빈 방 · 격리실':room.kind==='combat'?(room.cleared&&pendingAmbush(room)===null?'빈 방 · 전투 완료':'교차한 검 · 전투 방'):room.kind==='reward'?(room.rewardTaken?'빈 방 · 보상 수령 완료':room.service==='medical'?'의무실 · 회복 또는 기술':'보상 방'):room.cleared?'계단':'보스 방'}
