import {rng,shuffle,type DungeonRoom} from './dungeon';
import {bossForFloor,BOSS_ROSTER} from './boss-roster';
export type SecretMode='cache'|'depth'|'annex';
export interface Origin{rooms:DungeonRoom[];current:number;mapFound:boolean}
export function secretRooms(seed:number,floor:number,mode:SecretMode):DungeonRoom[]{
 const room=(id:number,kind:DungeonRoom['kind']):DungeonRoom=>({id,x:id,y:0,kind,doors:{},visited:id===0,cleared:kind==='start'||kind==='reward',rewardTaken:false,seed:(seed^Math.imul(floor+id,0x17ac39))>>>0,secret:true,elite:mode==='depth'});
 if(mode==='cache')return[room(0,'reward')];
 if(mode==='annex'){const rooms=[room(0,'start'),room(1,'combat'),room(2,'reward')];rooms[0].doors.right=1;rooms[1].doors={left:0,right:2};rooms[2].doors.left=1;rooms[2].elite=true;return rooms;}
 const rooms=[room(0,'start'),room(1,'combat'),room(2,'boss')];rooms[0].doors.right=1;rooms[1].doors={left:0,right:2};rooms[2].doors.left=1;const reserve=shuffle(BOSS_ROSTER.filter(k=>![6,5,4,3,2].map(f=>bossForFloor(seed,f)).includes(k)),rng(seed^0xcafe731));rooms[2].boss=reserve[4-floor];rooms[2].bosses=[reserve[4-floor],reserve[(5-floor)%reserve.length]];return rooms;
}

import type {Run} from './run';
import type {Interaction} from './environment';
export function secretInteractions(run:Run):Interaction[]{
 if(!run.room.cleared)return[];
 const entrances:Interaction[]=[];if(run.annexAvailable)entrances.push({kind:'annex',x:880,y:200,label:'숨겨진 격리실 · 경계 +1 · 희귀 보상'});if(run.secretAvailable)entrances.push({kind:'secret',x:230,y:200,label:'숨겨진 보관실 진입 · 무료'});if(entrances.length)return entrances;
 if(!run.branch)return[];
 const atLift=run.room.kind==='boss'&&run.room.rewardTaken;const list:Interaction[]=[{kind:'return',x:atLift?560:230,y:atLift?365:200,label:'본층 복귀 · 재입장 불가'}];
 if(run.branch==='cache'&&run.room.rewardTaken&&run.floor<=4)list.push({kind:'depth',x:560,y:500,label:'폐쇄 실험층 · 열쇠 2 · 동시 보스 2마리 · 희귀 보상 · 경계 상승 유지'});
 return list;
}
