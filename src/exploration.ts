import type {DungeonRoom} from './dungeon';
export const hasSurvey=(moves:readonly string[])=>moves.includes('survey');
export function roomKnown(room:DungeonRoom,moves:readonly string[]){return room.visited||hasSurvey(moves)}
export function roomLabel(room:DungeonRoom,moves:readonly string[]){return roomKnown(room,moves)?({start:'격리실',combat:room.cleared?'정리한 방':'실험실',reward:'기술 보관실',boss:'승강기 제어실'}[room.kind]):'미탐험'}
export function mapSymbol(room:DungeonRoom,moves:readonly string[]){if(!roomKnown(room,moves))return'?';if(!room.visited)return({start:'S',combat:'·',reward:'✧',boss:'B'}[room.kind]);return room.kind==='start'?'S':room.kind==='boss'?(room.cleared?'↑':'B'):room.kind==='reward'?(room.rewardTaken?'·':'✧'):room.cleared?'·':'!'}
