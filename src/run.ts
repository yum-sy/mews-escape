import {generateDungeon,exitReady,type Direction} from './dungeon';
import {composeAttack,rewardOptions} from './moves';
import {difficulty} from './scaling';
export class Run{
 rooms;current=0;moves:string[]=[];floor=6;
 constructor(public seed:number){this.rooms=generateDungeon(seed)}
 get tuning(){return difficulty(this.floor)}
 ascend(){if(!this.canExit||this.floor<=2)return false;this.floor--;this.current=0;this.rooms=generateDungeon((this.seed+Math.imul(6-this.floor,0x9e3779b1))>>>0,this.tuning.combatCount);return true}
 get room(){return this.rooms[this.current]}
 get attack(){return composeAttack(this.moves)}
 get canExit(){return exitReady(this.rooms)}
 travel(direction:Direction){const id=this.room.doors[direction];if(!this.room.cleared||id===undefined)return false;if(this.rooms[id].kind==='boss'&&!this.rooms.filter(r=>r.kind==='combat').every(r=>r.cleared))return false;this.current=id;this.room.visited=true;return true}
 clear(){this.room.cleared=true}
 get rewardPending(){return this.room.cleared&&!this.room.rewardTaken&&(this.room.kind==='combat'||this.room.kind==='reward')}
 get choices(){return rewardOptions(this.room.seed,this.moves)}
 choose(id:string){if(!this.rewardPending||!this.choices.some(m=>m.id===id))return false;if(id!=='recover')this.moves.push(id);this.room.rewardTaken=true;return true}
}
