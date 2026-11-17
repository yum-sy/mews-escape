import {rng,type DungeonRoom} from './dungeon';
import type {Vec} from './combat';
/** Seeded landings stay in the same place after re-entry or checkpoint restore. */
export function stairLanding(room:DungeonRoom):Vec{
 // The top of each 106px flight meets the north wall at y=140.
 const choices=[{x:350,y:246},{x:770,y:246}];
 return choices[Math.floor(rng(room.seed^0x57a1)()*choices.length)];
}
export function onStairLanding(room:DungeonRoom,player:Vec){const p=stairLanding(room);return Math.abs(player.x-p.x)<27&&Math.abs(player.y-p.y)<20}
