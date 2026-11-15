import {Run,roomsForFloor} from '../src/run';
import {FINAL_HP} from '../src/finale';
const plans={focused:['psybeam','shadow','agility','focus','poison','flame','flamethrower','icebeam','spark','drain','water','dragon','sludge','ricochet','ice','thunderbolt','split','swift','tri'],coverage:['tri','swift','poison','flame','spark','drain','flamethrower','icebeam','sludge','psybeam','agility','shadow','focus','water','dragon','ice','ricochet','thunderbolt','split']};
const rows=[];
for(const [policy,order] of Object.entries(plans))for(let seed=1;seed<=300;seed++){
 const run=new Run(seed);
 for(let floor=6;floor>=2;floor--){run.floor=floor;run.rooms=roomsForFloor(seed,floor);
  // Optimistic collection: every combat supply, then treasure rooms, then boss.
  for(const kind of ['combat','reward','boss'])for(const room of run.rooms.filter(r=>r.kind===kind)){
   run.current=room.id;room.visited=true;run.clear();if(!run.rewardPending||run.claimSupply())continue;
   if(run.openReward()){const choice=[...run.choices].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))[0];if(!choice||policy==='focused'&&['tri','swift'].includes(choice.id))run.skipReward();else run.choose(choice.id)}
  }
  const a=run.attack,dps=a.damage*a.count/a.interval*(1+a.crit*.6)+a.burn+a.poison;
  rows.push({policy,seed,floor,moves:run.moves.length,keys:run.keys,idealDps:+dps.toFixed(2),bossHp:run.tuning.bossHp,stationarySeconds:+(run.tuning.bossHp/dps).toFixed(1)});
 }
 const a=run.attack,dps=a.damage*a.count/a.interval*(1+a.crit*.6)+a.burn+a.poison,hp=FINAL_HP.reduce((a,b)=>a+b,0);
 rows.push({policy,seed,floor:1,moves:run.moves.length,keys:run.keys,idealDps:+dps.toFixed(2),bossHp:hp,stationarySeconds:+(hp/dps).toFixed(1)});
}
console.log(JSON.stringify({note:'Optimistic reward economy and stationary all-hit expected DPS, not a playthrough or win rate. All supplies collected before treasure; secondary targets excluded.',rows},null,2));
