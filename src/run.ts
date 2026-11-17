import {emptyActiveStock,collectActive} from './active-items';
import {entryLayout} from './encounter';
import {obstacles} from './lab';
import {roomEnvironment,sceneryBlocks} from './environment';
import type {Unlock,ActiveSkill} from './progression-unlocks';
import {encounterTeam,encounterKind} from './encounter-pool';
import {secretRooms,type SecretMode,type Origin} from './secret-route';
import {bossForFloor} from './boss-roster';
import {doorBlockReason} from './progression';
import {generateDungeon,exitReady,enemyLayout,type DungeonRoom,type Direction} from './dungeon';
import {composeAttack,MOVES} from './moves';
import {roomReward,itemOffers,rareCombatReward} from './rewards';
import {difficulty} from './scaling';
export class Run{
 unlocks:Unlock[]=[];activeSkill:ActiveSkill='reflector';activeStock=emptyActiveStock();
 get activeItem(){return this.activeStock[this.activeSkill]}
 get activeCharge(){return this.activeItem.count*3}
 set activeCharge(value:number){this.activeItem.count=Math.max(0,Math.min(this.activeItem.capacity,Math.floor(value/3)))}
 collectActive(kind:ActiveSkill){return collectActive(this.activeStock,kind)}
 threat=0;
 get alert(){return{hp:1+this.threat*.06,boss:1+this.threat*.05,speed:1+this.threat*.01,shot:1+this.threat*.015}}
 secretUsed=false;branch:SecretMode|null=null;origin:Origin|null=null;
 get secretAvailable(){return !this.branch&&!this.secretUsed&&this.floor>1&&this.rooms.filter(r=>r.environment?.recordRead).length>=2}
 enterSecret(){if(!this.secretAvailable||!this.room.cleared)return false;this.origin={rooms:this.rooms,current:this.current,mapFound:this.mapFound};this.secretUsed=true;this.branch='cache';this.rooms=secretRooms(this.seed,this.floor,'cache');this.current=0;this.mapFound=false;return true}
 enterDepth(){if(this.branch!=='cache'||!this.room.rewardTaken||this.floor>4||this.keys<2)return false;this.keys-=2;this.threat=Math.min(12,this.threat+2);this.branch='depth';this.rooms=secretRooms(this.seed,this.floor,'depth');this.current=0;this.mapFound=false;return true}
 leaveSecret(){if(!this.origin||!this.room.cleared)return false;this.rooms=this.origin.rooms;this.current=this.origin.current;this.mapFound=this.origin.mapFound;this.origin=null;this.branch=null;return true}
 keys=1;mapFound=false;rooms;current=0;moves:string[]=[];floor=6;
 constructor(public seed:number){this.rooms=roomsForFloor(seed,6)}
 get tuning(){const d=difficulty(this.floor),a=this.alert,elite=this.branch==='depth';return{...d,hp:d.hp*a.hp*(elite?1.35:1),bossHp:Math.round(d.bossHp*a.boss*(elite?.85:1)),speed:d.speed*a.speed*(elite?1.06:1),shotSpeed:d.shotSpeed*a.shot}}
 ascend(){if(this.branch||!this.canExit||this.floor<=1)return false;this.floor--;this.secretUsed=false;this.mapFound=false;this.current=0;this.rooms=roomsForFloor(this.seed,this.floor);return true}
 get room(){return this.rooms[this.current]}
 get attack(){return composeAttack(this.moves)}
 get canExit(){return exitReady(this.rooms)}
 travel(direction:Direction){if(doorBlockReason(this.rooms,this.room,direction))return false;this.current=this.room.doors[direction]!;this.room.visited=true;return true}
 clear(){this.room.cleared=true}
 claimRecovery(hp:number,max=6){if(this.room.service!=='medical'||!this.room.opened||!this.rewardPending||hp>=max)return null;this.room.rewardTaken=true;return Math.min(max,hp+2)}
 stabilize(hp:number,max=6){const state=roomEnvironment(this.room);if(this.room.kind!=='start'||!this.unlocks.includes('sanctuary')||state.stabilized||this.keys<2||(hp>=max&&this.activeItem.count===this.activeItem.capacity))return null;this.keys-=2;this.activeItem.count=Math.min(this.activeItem.capacity,this.activeItem.count+1);state.stabilized=true;return Math.min(max,hp+2)}
 useActive(){if(this.activeItem.count===0)return false;this.activeItem.count--;return true}
 get rewardKind(){return roomReward(this.room,this.floor)}
 get rewardPending(){return this.room.cleared&&!this.room.rewardTaken&&this.rewardKind!=='none'}
 get choices(){if(this.room.elite&&(!this.room.offer||this.room.offer.some(id=>!rareCombatReward(id))))return itemOffers(this.room.seed,this.moves,this.floor,'rare',3);if(this.room.secret&&!this.room.offer)return itemOffers(this.room.seed,this.mapFound?[...this.moves,'survey']:this.moves,this.floor,'treasure',3);return this.room.offer?this.room.offer.map(id=>MOVES.find(m=>m.id===id)!).filter(m=>this.moves.filter(id=>id===m.id).length<m.max&&(m.id!=='survey'||!this.mapFound)):['treasure','boss'].includes(this.rewardKind)?itemOffers(this.room.seed,this.mapFound?[...this.moves,'survey']:this.moves,this.floor,this.rewardKind as 'treasure'|'boss',2,this.room.service,this.unlocks.includes('resonance')):[]}
 openReward(){if(!this.rewardPending)return false;if(this.room.opened)return true;if(this.rewardKind==='treasure'){if(this.keys<1||(this.choices.length===0&&this.room.service!=='medical'))return false;this.keys--}this.room.offer=this.choices.map(m=>m.id);this.room.opened=true;return true}
 claimSupply(){if(!this.rewardPending||!['heart','key'].includes(this.rewardKind))return null;const kind=this.rewardKind;this.room.rewardTaken=true;if(kind==='key')this.keys++;return kind}
 skipReward(){if(!this.rewardPending)return false;if(this.rewardKind==='boss')this.keys+=this.room.elite&&this.choices.length===0?3:1;this.room.rewardTaken=true;return true}
 choose(id:string){if(!this.rewardPending||!this.room.opened||!this.choices.some(m=>m.id===id))return false;if(id==='survey')this.mapFound=true;else this.moves.push(id);if(this.room.elite)this.threat=Math.min(12,this.threat+1);if(this.rewardKind==='boss')this.keys++;this.room.rewardTaken=true;return true}
}

export function roomsForFloor(seed:number,floor:number):DungeonRoom[]{
 if(floor===1)return[{id:0,x:0,y:0,kind:'boss',doors:{},visited:true,cleared:false,rewardTaken:false,seed}];
 const rooms=generateDungeon((seed+Math.imul(6-floor,0x9e3779b1))>>>0,difficulty(floor).combatCount);rooms.find(r=>r.kind==='boss')!.boss=bossForFloor(seed,floor);rooms.filter(r=>r.kind==='reward').forEach((r,i)=>r.service=i===0?'archive':'medical');return rooms;
}

export function roomEnemies(room:DungeonRoom,floor:number):ReturnType<typeof enemyLayout>{
 if(room.cleared)return[];if(floor===1)return[{kind:'mewtwo',x:560,y:260}];const layout=enemyLayout(room),level=6-floor;
 if(room.kind==='combat'){
 const count=floor===6?2+room.seed%2:floor===5?3+room.seed%2:floor===4?4:floor===3?4+room.seed%2:4+room.seed%3;
 const points=[...layout,{kind:'gastly' as const,x:560,y:365}];while(points.length<count)points.push({kind:'gastly',x:560,y:365});const team=encounterTeam(room.seed,count,floor,!!room.secret);return entryLayout(points.slice(0,count).map((e,i)=>({...e,kind:team[i]})),{x:560,y:365},[...obstacles(room),...sceneryBlocks(room)],room.doors);
 }return layout;
}
