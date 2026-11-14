import {generateDungeon,exitReady,type Direction} from './dungeon';
import {composeAttack,rewardOptions} from './moves';
export class Run{
 rooms;current=0;moves:string[]=[];
 constructor(public seed:number){this.rooms=generateDungeon(seed)}
 get room(){return this.rooms[this.current]}
 get attack(){return composeAttack(this.moves)}
 get canExit(){return exitReady(this.rooms)}
 travel(direction:Direction){const id=this.room.doors[direction];if(!this.room.cleared||id===undefined)return false;this.current=id;this.room.visited=true;return true}
 clear(){this.room.cleared=true}
 get rewardPending(){return this.room.cleared&&!this.room.rewardTaken&&(this.room.kind==='combat'||this.room.kind==='reward')}
 get choices(){return rewardOptions(this.room.seed,this.moves)}
 choose(id:string){if(!this.rewardPending||!this.choices.some(m=>m.id===id))return false;this.moves.push(id);this.room.rewardTaken=true;return true}
}
