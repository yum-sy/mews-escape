// Local browser QA only: the import is guarded by import.meta.env.DEV and absent in production.
import type {LabScene} from '../src/scene';
import {MOVES} from '../src/moves';
import {roomsForFloor} from '../src/run';
import {Run} from '../src/run';
export function installFixture(scene:LabScene){
 const reward=document.createElement('button');reward.textContent='보상 검증';reward.style.cssText='position:fixed;left:10px;top:10px;z-index:101;font-size:10px';reward.onclick=()=>{scene.clearActors();scene.run.current=scene.run.rooms.find(r=>r.kind==='combat')!.id;scene.run.room.cleared=true;scene.run.room.rewardTaken=false;scene.showReward()};document.body.append(reward);
 const finale=document.createElement('button');finale.textContent='개발 검증 · B2 승강기';finale.style.cssText='position:fixed;right:10px;bottom:145px;z-index:100;font-size:10px';document.body.append(finale);
 finale.onclick=()=>{scene.menu();document.getElementById('shell')!.hidden=true;document.body.dataset.screen='game';scene.restart();scene.run.floor=2;scene.run.rooms=roomsForFloor(3,2);scene.run.seed=3;scene.run.current=scene.run.rooms.find(r=>r.kind==='boss')!.id;scene.run.rooms.forEach(r=>{r.cleared=true;r.visited=true});scene.run.moves=MOVES.flatMap(m=>Array(m.max).fill(m.id));scene.enterRoom('down');scene.resume();finale.hidden=true};
 const damage=document.createElement('button');damage.textContent='검증 피해 200';damage.style.cssText='position:fixed;right:10px;bottom:65px;z-index:100;font-size:10px';damage.onclick=()=>{const boss=scene.enemies.find(e=>e.kind==='mewtwo');if(scene.state==='playing'&&boss)scene.hitEnemy(boss,200)};document.body.append(damage);
 const protect=document.createElement('button');protect.textContent='검증 무적 30초';protect.style.cssText='position:fixed;right:10px;bottom:105px;z-index:100;font-size:10px';protect.onclick=()=>{scene.inv=30};document.body.append(protect);
 const button=document.createElement('button');button.textContent='개발 검증 · 팬텀 + 효과 조합';button.style.cssText='position:fixed;left:100px;top:10px;z-index:100;font-size:10px';document.body.append(button);
 button.onclick=()=>{
  scene.menu();
  document.getElementById('shell')!.hidden=true;document.body.dataset.screen='game';scene.restart();
  scene.run=new Run(3);scene.run.rooms.filter(r=>r.kind==='combat').forEach(r=>r.cleared=true);
  scene.run.current=scene.run.rooms.find(r=>r.kind==='boss')!.id;scene.run.room.visited=true;
  scene.run.moves=['swift','shadow','tri','poison','flame','ice','drain','spark','split','ricochet','sludge'];
  scene.enterRoom('down');scene.resume();button.hidden=true;
  const panel=document.createElement('div');panel.style.cssText='position:fixed;left:12px;bottom:70px;z-index:100;display:flex;gap:5px';
  for(const [label,moves] of Object.entries({'기본':[],'화염 2단계':['flame','flame','flamethrower'],'얼음 관통':['psybeam','icebeam','icebeam'],'복합 강화':['swift','tri','shadow','flame','ice','spark','poison','ricochet']})){
   const choice=document.createElement('button');choice.textContent=label;choice.onclick=()=>{scene.clearShots();scene.run.moves=moves;scene.hp=6;scene.inv=60;scene.effects.upgrade(scene.player.x,scene.player.y,scene.run.attack);scene.updateHud()};panel.append(choice);
  }document.body.append(panel);
 };
}
