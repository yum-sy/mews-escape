import {generateDungeon,exitReady,enemyLayout,type DungeonRoom,type Direction} from './dungeon';
import {composeAttack,MOVES} from './moves';
import {roomReward,itemOffers} from './rewards';
import {difficulty} from './scaling';
export class Run{
 keys=1;rooms;current=0;moves:string[]=[];floor=6;
 constructor(public seed:number){this.rooms=generateDungeon(seed)}
 get tuning(){return difficulty(this.floor)}
 ascend(){if(!this.canExit||this.floor<=1)return false;this.floor--;this.current=0;this.rooms=roomsForFloor(this.seed,this.floor);return true}
 get room(){return this.rooms[this.current]}
 get attack(){return composeAttack(this.moves)}
 get canExit(){return exitReady(this.rooms)}
 travel(direction:Direction){const id=this.room.doors[direction];if(!this.room.cleared||id===undefined)return false;if(this.rooms[id].kind==='boss'&&!this.rooms.filter(r=>r.kind==='combat').every(r=>r.cleared))return false;this.current=id;this.room.visited=true;return true}
 clear(){this.room.cleared=true}
 get rewardKind(){return roomReward(this.room,this.floor)}
 get rewardPending(){return this.room.cleared&&!this.room.rewardTaken&&this.rewardKind!=='none'}
 get choices(){return this.room.offer?this.room.offer.map(id=>MOVES.find(m=>m.id===id)!).filter(m=>this.moves.filter(id=>id===m.id).length<m.max):['treasure','boss'].includes(this.rewardKind)?itemOffers(this.room.seed,this.moves,this.floor,this.rewardKind as 'treasure'|'boss'):[]}
 openReward(){if(!this.rewardPending)return false;if(this.room.opened)return true;if(this.rewardKind==='treasure'){if(this.keys<1||this.choices.length===0)return false;this.keys--}this.room.offer=this.choices.map(m=>m.id);this.room.opened=true;return true}
 claimSupply(){if(!this.rewardPending||!['heart','key'].includes(this.rewardKind))return null;const kind=this.rewardKind;this.room.rewardTaken=true;if(kind==='key')this.keys++;return kind}
 skipReward(){if(!this.rewardPending)return false;if(this.rewardKind==='boss')this.keys++;this.room.rewardTaken=true;return true}
 choose(id:string){if(!this.rewardPending||!this.room.opened||!this.choices.some(m=>m.id===id))return false;this.moves.push(id);if(this.rewardKind==='boss')this.keys++;this.room.rewardTaken=true;return true}
}

export function roomsForFloor(seed:number,floor:number):DungeonRoom[]{
 if(floor===1)return[{id:0,x:0,y:0,kind:'boss',doors:{},visited:true,cleared:false,rewardTaken:false,seed}];
 return generateDungeon((seed+Math.imul(6-floor,0x9e3779b1))>>>0,difficulty(floor).combatCount);
}

export function roomEnemies(room:DungeonRoom,floor:number):ReturnType<typeof enemyLayout>{
 if(room.cleared)return[];if(floor===1)return[{kind:'mewtwo',x:560,y:260}];const layout=enemyLayout(room),level=6-floor;
 if(room.kind==='combat'&&level>=2)layout.push({kind:level>=3?'koffing':'houndour',x:560,y:365});return layout;
}
