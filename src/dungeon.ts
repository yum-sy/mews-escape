import type {EnvironmentState} from './environment';
import {NORMAL_KINDS,type Kind} from './data';
export type Direction='up'|'right'|'down'|'left';
export const DIRECTIONS:Direction[]=['up','right','down','left'];
export const DELTA:Record<Direction,[number,number]>={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
export const OPPOSITE:Record<Direction,Direction>={up:'down',right:'left',down:'up',left:'right'};
export type RoomKind='start'|'combat'|'reward'|'boss';
export interface DungeonRoom{service?:'medical'|'archive';secret?:boolean;elite?:boolean;bosses?:Kind[];boss?:Kind;offer?:string[];opened?:boolean;environment?:EnvironmentState;id:number;x:number;y:number;kind:RoomKind;doors:Partial<Record<Direction,number>>;visited:boolean;cleared:boolean;rewardTaken:boolean;seed:number}
export function rng(seed:number){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function generateDungeon(seed:number,combatCount=5):DungeonRoom[]{
 const random=rng(seed),rooms:DungeonRoom[]=[];
 const add=(x:number,y:number):DungeonRoom=>({id:rooms.length,x,y,kind:'combat',doors:{},visited:false,cleared:false,rewardTaken:false,seed:Math.floor(random()*0xffffffff)});
 rooms.push(add(0,0));
 while(rooms.length<combatCount+4){
  const options=rooms.flatMap(room=>DIRECTIONS.map(dir=>({room,dir,x:room.x+DELTA[dir][0],y:room.y+DELTA[dir][1]}))).filter(o=>!rooms.some(r=>r.x===o.x&&r.y===o.y));
  const o=options[Math.floor(random()*options.length)],room=add(o.x,o.y);
  o.room.doors[o.dir]=room.id;room.doors[OPPOSITE[o.dir]]=o.room.id;rooms.push(room);
 }
 const distance=new Map([[0,0]]),queue=[0];for(const id of queue)for(const next of Object.values(rooms[id].doors))if(!distance.has(next)){distance.set(next,distance.get(id)!+1);queue.push(next)}
 const farthest=[...rooms].sort((a,b)=>distance.get(b.id)!-distance.get(a.id)!)[0];farthest.kind='boss';farthest.cleared=false;
 rooms[0].kind='start';rooms[0].cleared=true;rooms[0].visited=true;
 for(const room of shuffle(rooms.filter(r=>r.kind==='combat'),random).slice(0,2)){room.kind='reward';room.cleared=true}
 return rooms;
}
export function enemyLayout(room:DungeonRoom):{kind:Kind;x:number;y:number}[]{
 if(room.cleared)return[];
 if(room.kind==='boss')return room.bosses?.map((kind,i)=>({kind,x:i?740:380,y:290}))??[{kind:room.boss??'gengar',x:560,y:290}];
 if(room.kind!=='combat')return[];
 const random=rng(room.seed),points=shuffle([{x:320,y:250},{x:800,y:250},{x:360,y:480},{x:800,y:480},{x:560,y:260},{x:560,y:460}],random);
 return points.slice(0,3+Math.floor(random()*3)).map((p,i)=>({...p,kind:NORMAL_KINDS[(room.id+i+Math.floor(random()*3))%NORMAL_KINDS.length]}));
}
export function exitReady(rooms:DungeonRoom[]){return rooms.some(r=>r.kind==='boss')&&rooms.every(r=>r.kind!=='boss'||r.cleared)}
