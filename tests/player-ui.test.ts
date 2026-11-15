import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Run} from '../src/run';
import {objective,rewardComparison,formatDuration} from '../src/player-ui';
test('objectives follow combat, key gates, claimed boss reward and final exit',()=>{
 const run=new Run(3);assert.match(objective(run),/남은 전투방/);
 run.current=run.rooms.findIndex(r=>r.kind==='combat');assert.match(objective(run),/위협/);
 run.current=run.rooms.findIndex(r=>r.kind==='reward');run.room.cleared=true;run.keys=0;assert.match(objective(run),/열쇠가 필요/);
 run.keys=1;assert.match(objective(run),/열쇠 1개/);run.openReward();assert.match(objective(run),/기술 확인/);
 run.current=run.rooms.findIndex(r=>r.kind==='boss');run.room.cleared=true;assert.match(objective(run),/보상 확인/);run.skipReward();assert.match(objective(run),/B5/);
 run.floor=1;assert.match(objective(run),/함께/);run.room.cleared=false;assert.match(objective(run),/뮤츠/);
});
test('reward comparisons show direct-fire tradeoffs, accumulated recipe and repeat rank',()=>{
 assert.equal(rewardComparison([],'tri').delta,-35);
 assert.equal(rewardComparison(['tri'],'swift').delta,-45);
 const recipe=rewardComparison(['flamethrower'],'icebeam');assert.equal(recipe.name,'열충격 융합');assert.equal(recipe.carrier,'냉동빔');assert.ok(recipe.traits.includes('화상'));
 assert.equal(rewardComparison(['swift'],'swift').rank,2);
 assert.equal(rewardComparison([],'poison').delta,0);
 assert.ok(rewardComparison([],'focus').delta>0);
 assert.equal(formatDuration(125.9),'2분 05초');
});
