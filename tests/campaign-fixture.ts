import {Run,roomsForFloor} from '../src/run';
// Development-only automated player. It supplies normal movement/aim/interact/reward
// input. Normal mode never supplies health, invulnerability, enemy damage or a build.
// Explicit bosscheck mode isolates a boss with a documented starting build.
import {roomReward} from '../src/rewards';
import type {DungeonRoom} from '../src/dungeon';
import type {LabScene} from '../src/scene';
import {normalize,type Vec} from '../src/combat';
import {overlapsBlock,moveWithWalls} from '../src/lab';
import {ROOM as R,STATS} from '../src/data';
import {DIRECTIONS,type Direction} from '../src/dungeon';
import {hazardPhase,speciesSize} from '../src/scaling';
import {weaponProfile,distanceToSegment} from '../src/weapons';
const order={focused:['psybeam','shadow','agility','focus','poison','flame','flamethrower','icebeam','spark','drain','water','dragon','sludge','ricochet','ice','thunderbolt','split','swift','tri'],coverage:['tri','swift','poison','flame','spark','drain','flamethrower','icebeam','sludge','psybeam','agility','shadow','focus','water','dragon','ice','ricochet','thunderbolt','split']};
export function installCampaign(scene:LabScene){
 const box=document.createElement('aside');box.style.cssText='position:fixed;left:8px;top:8px;z-index:100;background:#08121ee8;color:white;padding:8px;font:11px monospace;max-width:480px';box.innerHTML='<select aria-label="자동 플레이 정책"><option value="focused">집중 화력</option><option value="coverage">다중·유도 우선</option></select> <button id="pilot-start">정상 규칙 자동 플레이 시작</button> <button id="pilot-resume">저장부터 정상 규칙 재개</button> <button id="pilot-stop">중단</button><div id="pilot-status"></div><details><summary>실행 기록</summary><pre id="pilot-report" style="max-height:240px;overflow:auto"></pre></details>';document.body.append(box);
 let scenario=false,enabled=false,policy:keyof typeof order='focused',last='',roomStart=0,hpStart=6,damage=0,hits=0,lastStory=0,nav:Vec[]=[],navGoal='',navAt=0,orbit=0;const orbitPoints=[{x:240,y:210},{x:840,y:210},{x:840,y:480},{x:240,y:480}];const frames:number[]=[],rooms:any[]=[],events:any[]=[];
 let begun=0,progressDamage=0,progressAt=0;const performanceSummary=()=>{const a=[...frames].sort((a,b)=>a-b);return{samples:a.length,medianMs:a[Math.floor(a.length*.5)]??0,p95Ms:a[Math.floor(a.length*.95)]??0,p99Ms:a[Math.floor(a.length*.99)]??0,over33ms:a.filter(x=>x>33.34).length}};
 const report=()=>({policy,seed:scene.run.seed,status:scene.state,floor:scene.run.floor,keys:scene.run.keys,room:scene.run.current,phase:scene.finalPhase,gameSeconds:+scene.elapsed.toFixed(1),wallSeconds:+((performance.now()-begun)/1000).toFixed(1),hp:scene.hp,hitsTaken:hits,damageApplied:+damage.toFixed(1),moves:scene.run.moves,rooms,events,performance:performanceSummary(),rules:(scenario?'Isolated boss scenario: full starting HP, documented legal build, other rooms pre-cleared. Normal combat rules; no in-fight cheats. ':'Normal engine. No setup cheats. ')+ 'Automated controller sees runtime enemy/projectile positions. No in-fight health, damage or invulnerability changes; not human or physical-device testing.'});
 let lastPublish=0;const publish=()=>{if(enabled&&performance.now()-lastPublish<1000)return;lastPublish=performance.now();document.getElementById('pilot-status')!.textContent=`${enabled?'RUNNING':'STOPPED'} · B${scene.run.floor} / ${scene.run.current} · HP ${scene.hp} · ${Math.floor(scene.elapsed)}s · hits ${hits} · ${scene.run.moves.length} upgrades`;document.getElementById('pilot-report')!.textContent=JSON.stringify(report(),null,2)};
 const originalHit=scene.hitEnemy.bind(scene);scene.hitEnemy=(e,amount)=>{if(enabled)damage+=Math.min(e.hp,amount);originalHit(e,amount)};
 const originalHurt=scene.hurt.bind(scene);scene.hurt=dir=>{const before=scene.hp;originalHurt(dir);if(enabled&&scene.hp<before){hits++;events.push({kind:'hurt',floor:scene.run.floor,room:scene.run.current,time:scene.elapsed,hp:scene.hp,position:{x:scene.player.x,y:scene.player.y},toxic:scene.toxic,nearest:scene.enemies.map(e=>({kind:e.kind,d:Math.round(Math.hypot(e.sprite.x-scene.player.x,e.sprite.y-scene.player.y))})).sort((a,b)=>a.d-b.d).slice(0,2)})}};
 let previousFrame=0;scene.events.on('postupdate',()=>{const now=performance.now(),d=now-previousFrame;previousFrame=now;if(enabled&&scene.state==='playing'&&frames.length<60000&&d>0&&d<500)frames.push(d)});
 document.getElementById('pilot-start')!.onclick=()=>{scenario=false;policy=(box.querySelector('select') as HTMLSelectElement).value as keyof typeof order;scene.menu();document.getElementById('shell')!.hidden=true;document.body.dataset.screen='game';scene.restart();enabled=true;begun=performance.now();frames.length=rooms.length=events.length=0;damage=hits=0;last='';nav=[];publish()};
 document.getElementById('pilot-resume')!.onclick=()=>{scene.menu();document.getElementById('shell')!.hidden=true;document.body.dataset.screen='game';scene.continueRun();policy=(box.querySelector('select') as HTMLSelectElement).value as keyof typeof order;enabled=true;begun=performance.now();frames.length=rooms.length=events.length=0;damage=hits=0;last='';nav=[];progressAt=scene.elapsed;publish()};
 if(new URLSearchParams(location.search).has('bosscheck')){const solo=document.createElement('button');solo.id='boss-check-start';solo.textContent='보스 단독 검증 시작 (가정 빌드)';box.prepend(solo);solo.onclick=()=>{document.getElementById('pilot-start')!.click();scenario=true;const floor=Number(new URLSearchParams(location.search).get('bosscheck'));scene.run=new Run(151);scene.run.floor=Math.max(1,Math.min(5,floor));scene.run.rooms=roomsForFloor(151,scene.run.floor);scene.run.rooms.forEach(r=>{r.visited=true;r.cleared=r.kind!=='boss'});scene.run.current=scene.run.rooms.find(r=>r.kind==='boss')!.id;scene.run.moves=['psybeam','flame','agility','focus','icebeam','shadow','ice','water','spark','agility','psybeam','poison','drain','flamethrower','focus','shadow'].slice(0,4+(5-scene.run.floor)*3);scene.finalPhase=1;scene.enterRoom('down');if(scene.state!=='story')scene.resume();publish()}}
 document.getElementById('pilot-stop')!.onclick=()=>{enabled=false;scene.controls.reset();scene.togglePause();publish()};
 function navigate(goal:Vec){const p=scene.player,key=`${scene.run.floor}:${scene.run.current}:${Math.round(goal.x/20)}:${Math.round(goal.y/20)}`;if(key!==navGoal||scene.elapsed-navAt>.6){navGoal=key;navAt=scene.elapsed;
  const nodes:Vec[]=[];for(let y=160;y<=560;y+=40)for(let x=100;x<=1020;x+=40)if(!scene.blocks.some(b=>overlapsBlock({x,y},23,b)))nodes.push({x,y});
  const closest=(v:Vec)=>nodes.reduce((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)<Math.hypot(b.x-v.x,b.y-v.y)?a:b),start=closest(p),end=closest(goal),queue=[start],previous=new Map<Vec,Vec|null>([[start,null]]);
  for(const n of queue){if(n===end)break;for(const v of nodes)if(!previous.has(v)&&Math.hypot(v.x-n.x,v.y-n.y)<=41){previous.set(v,n);queue.push(v)}}
  nav=[];if(previous.has(end)){let n:Vec|null=end;while(n){nav.unshift(n);n=previous.get(n)??null}}
 }
 while(nav.length&&Math.hypot(nav[0].x-p.x,nav[0].y-p.y)<25)nav.shift();const next=nav[0]??goal;return normalize(next.x-p.x,next.y-p.y)}
 function available(r:DungeonRoom){const kind=roomReward(r,scene.run.floor);return r.cleared&&!r.rewardTaken&&kind!=='none'&&(kind!=='heart'||scene.hp<6)&&(kind!=='treasure'||r.opened||scene.run.keys>0)}
 function nextDoor():Direction|undefined{
  const allClear=scene.run.rooms.filter(r=>r.kind==='combat').every(r=>r.cleared),queue=[scene.run.current],previous=new Map<number,{id:number;dir:Direction}>(),seen=new Set(queue);let destination:number|undefined;
  for(const id of queue){const r=scene.run.rooms[id];if(id!==scene.run.current&&(!r.cleared||available(r))){destination=id;break}for(const dir of DIRECTIONS){const next=r.doors[dir];if(next!==undefined&&!seen.has(next)&&(scene.run.rooms[next].kind!=='boss'||allClear)){seen.add(next);previous.set(next,{id,dir});queue.push(next)}}}
  if(destination===undefined)return;let step=previous.get(destination)!;while(step.id!==scene.run.current)step=previous.get(step.id)!;return step.dir;
 }
 scene.time.addEvent({delay:50,loop:true,callback:()=>{
  if(!enabled||document.hidden)return;
  const key=`${scene.run.floor}:${scene.run.current}:${scene.finalPhase}`;if(key!==last){if(last)rooms.push({key:last,seconds:+(scene.elapsed-roomStart).toFixed(1),hpStart,hpEnd:scene.hp,moves:scene.run.moves.length});last=key;roomStart=scene.elapsed;hpStart=scene.hp;nav=[];orbit=orbitPoints.reduce((best,q,i)=>Math.hypot(q.x-scene.player.x,q.y-scene.player.y)<Math.hypot(orbitPoints[best].x-scene.player.x,orbitPoints[best].y-scene.player.y)?i:best,0)}
  if(scene.state==='won'||scene.state==='lost'){rooms.push({key:last,seconds:+(scene.elapsed-roomStart).toFixed(1),hpStart,hpEnd:scene.hp,moves:scene.run.moves.length});enabled=false;scene.controls.reset();publish();return}
  if(scenario&&scene.run.floor>1&&scene.run.room.cleared&&scene.state==='playing'){rooms.push({key:last,seconds:+(scene.elapsed-roomStart).toFixed(1),hpStart,hpEnd:scene.hp,moves:scene.run.moves.length});enabled=false;scene.togglePause();publish();return}
  if(scene.state==='paused'){scene.resume();return}
  if(scene.state==='story'){if(performance.now()-lastStory>800){events.push({kind:'story',floor:scene.run.floor,phase:scene.finalPhase,title:document.querySelector('.intro-caption h2')?.textContent,text:document.querySelector('.intro-caption p')?.textContent});document.getElementById('story-next')?.click();lastStory=performance.now()}publish();return}
  if(scene.state==='reward'){const choices=scene.run.choices,rank=order[policy];const best=[...choices].sort((a,b)=>rank.indexOf(a.id)-rank.indexOf(b.id))[0];events.push({kind:'reward',floor:scene.run.floor,room:scene.run.current,offers:choices.map(c=>c.id),selected:!best||policy==='focused'&&['swift','tri'].includes(best.id)?'skip':best.id,hp:scene.hp,keys:scene.run.keys});if(!best||policy==='focused'&&['swift','tri'].includes(best.id))document.querySelector<HTMLButtonElement>('.reward-skip')?.click();else(document.querySelectorAll<HTMLButtonElement>('.reward-card')[choices.findIndex(c=>c.id===best.id)])?.click();return}
  if(scene.state!=='playing')return;
  const p=scene.player;scene.controls.keys.clear();
  if(!scene.run.room.cleared){
   const target=scene.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.sprite.x-p.x,a.sprite.y-p.y)-Math.hypot(b.sprite.x-p.x,b.sprite.y-p.y))[0];if(!target)return;
   if(Math.hypot(p.x-orbitPoints[orbit].x,p.y-orbitPoints[orbit].y)<55)orbit=(orbit+1)%orbitPoints.length;
   if(scene.startDelay>0){scene.controls.aim={x:0,y:0};scene.controls.move=navigate(orbitPoints[orbit]);publish();return}
   scene.controls.aim=normalize(target.sprite.x-p.x,target.sprite.y-p.y);
   const route=navigate(orbitPoints[orbit]);
   const desired=Math.min(280,Math.max(145,weaponProfile(scene.run.attack).range*.7));let best={x:0,y:0},bestCost=Infinity;
   for(let i=-1;i<24;i++){const v=i<0?{x:0,y:0}:{x:Math.cos(i*Math.PI/12),y:Math.sin(i*Math.PI/12)};let cost=0;
    for(const horizon of [.04,.1,.2,.4,.65]){let q={x:p.x,y:p.y};for(let step=0;step<horizon;step+=.025){const slice=Math.min(.025,horizon-step);q=moveWithWalls(q,{x:v.x*STATS.speed*(scene.hazardSlow>0?.6:1)*slice,y:v.y*STATS.speed*(scene.hazardSlow>0?.6:1)*slice},scene.blocks,speciesSize('mew').radius);q.x=Math.max(R.left+18,Math.min(R.right-18,q.x));q.y=Math.max(R.top+22,Math.min(R.bottom-22,q.y))}
     if(q.x<R.left+22||q.x>R.right-22||q.y<R.top+26||q.y>R.bottom-26){cost+=700;continue}
     if(i>=0&&Math.hypot(q.x-p.x,q.y-p.y)<STATS.speed*horizon*.7)cost+=300;
     for(const shot of scene.shots)if(shot.hostile){const d=distanceToSegment(q,{x:shot.sprite.x+shot.v.x*Math.max(0,horizon-.12),y:shot.sprite.y+shot.v.y*Math.max(0,horizon-.12)},{x:shot.sprite.x+shot.v.x*(horizon+.12),y:shot.sprite.y+shot.v.y*(horizon+.12)});cost+=Math.max(0,52-d)**2*2.5/(1+horizon*4)}
     for(const e of scene.enemies)if(e.hp>0){const d=Math.hypot(q.x-e.sprite.x,q.y-e.sprite.y);cost+=Math.max(0,e.radius+45-d)**2;if(e.kind==='zubat'&&e.charge>0)cost+=Math.max(0,50-distanceToSegment(q,e.sprite,{x:e.sprite.x+e.dir.x*220,y:e.sprite.y+e.dir.y*220}))**2*.3}
     for(const beam of scene.beams)if(beam.age>.15){const d=Math.abs((beam.axis==='x'?q.x:q.y)-beam.position);cost+=Math.max(0,65-d)**2*.3}
     for(const pool of scene.pools)cost+=Math.max(0,pool.r+35-Math.hypot(q.x-pool.x,q.y-pool.y))**2*.2;
     if(!scene.run.room.environment?.powerOff)for(const h of scene.env)if(hazardPhase(scene.roomClock+h.offset+horizon,scene.run.tuning.hazardPeriod)!=='idle'){const d=h.kind==='laser'?Math.abs(q.y-h.y):Math.hypot(q.x-h.x,q.y-h.y);cost+=Math.max(0,(h.kind==='laser'?38:h.r+25)-d)**2*.2}
     for(const block of scene.blocks)if(distanceToSegment(block,q,target.sprite)<Math.max(block.w,block.h)/2+12)cost+=120;
     cost+=Math.abs(Math.hypot(q.x-target.sprite.x,q.y-target.sprite.y)-desired)*.08;cost+=Math.max(0,110-Math.min(q.x-R.left,R.right-q.x,q.y-R.top,R.bottom-q.y))**2*.08;
    }
    if(route)cost+=(1-(v.x*route.x+v.y*route.y))*160;cost+=i<0?100:0;if(cost<bestCost){bestCost=cost;best=v}
   }
   if(damage!==progressDamage){progressDamage=damage;progressAt=scene.elapsed}
   scene.controls.move=best;if(scene.interaction()?.kind==='power')scene.interact();
  }else{
   scene.controls.aim={x:0,y:0};if(available(scene.run.room)||scene.run.room.kind==='boss'&&scene.run.canExit){scene.controls.move=navigate({x:560,y:365});if(scene.interaction()?.kind==='reward'||scene.interaction()?.kind==='lift')scene.interact()}
   else{const dir=nextDoor();if(dir){const goal={up:{x:560,y:130},down:{x:560,y:595},left:{x:70,y:364},right:{x:1050,y:364}}[dir];const close=Math.hypot(p.x-goal.x,p.y-goal.y)<80;scene.controls.move=close?normalize(goal.x-p.x,goal.y-p.y):navigate(goal)}else scene.controls.move={x:0,y:0}}
  }
  if(scene.elapsed>3600){enabled=false;scene.controls.reset()}
  publish();
 }});
}
