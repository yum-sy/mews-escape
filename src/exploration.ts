import type {DungeonRoom} from './dungeon';
export const hasSurvey=(moves:readonly string[],floorMap=false)=>moves.includes('survey');
export function roomKnown(room:DungeonRoom,moves:readonly string[],floorMap=false){return room.visited||floorMap}
export function roomLabel(room:DungeonRoom,moves:readonly string[],floorMap=false){return roomKnown(room,moves,floorMap)?({start:'격리실',combat:room.cleared?'정리한 방':'실험실',reward:'기술 보관실',boss:'승강기 제어실'}[room.kind]):'미탐험'}
export function mapSymbol(room:DungeonRoom,moves:readonly string[],floorMap=false){if(!roomKnown(room,moves,floorMap))return'?';if(!room.visited)return({start:'S',combat:'·',reward:'✧',boss:'B'}[room.kind]);return room.kind==='start'?'S':room.kind==='boss'?(room.cleared?'↑':'B'):room.kind==='reward'?(room.rewardTaken?'·':'✧'):room.cleared?'·':'!'}

export function roomMapIcon(room:DungeonRoom){return room.kind==='start'?'crate':room.kind==='combat'?(room.cleared?'crate':'combat'):room.kind==='reward'?'reward':room.cleared?'up':'boss'}
export function roomMapLabel(room:DungeonRoom){return room.kind==='start'?'기물 방 · 격리실':room.kind==='combat'?(room.cleared?'기물 방 · 전투 완료':'전투 방'):room.kind==='reward'?'보상 방':room.cleared?'승강기':'보스 방'}
