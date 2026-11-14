// Local browser QA only: the import is guarded by import.meta.env.DEV and absent in production.
import type {LabScene} from '../src/scene';
import {Run} from '../src/run';
export function installFixture(scene:LabScene){
 const button=document.createElement('button');button.textContent='개발 검증 · 팬텀 + 효과 조합';button.style.cssText='position:fixed;left:10px;top:10px;z-index:100;font-size:10px';document.body.append(button);
 button.onclick=()=>{
  document.getElementById('shell')!.hidden=true;document.body.dataset.screen='game';scene.restart();
  scene.run=new Run(3);scene.run.rooms.filter(r=>r.kind==='combat').forEach(r=>r.cleared=true);
  scene.run.current=scene.run.rooms.find(r=>r.kind==='boss')!.id;scene.run.room.visited=true;
  scene.run.moves=['swift','shadow','tri','poison','flame','ice','drain','spark','split','ricochet','sludge'];
  scene.enterRoom('down');scene.resume();button.hidden=true;
  const panel=document.createElement('div');panel.style.cssText='position:fixed;left:12px;bottom:70px;z-index:100;display:flex;gap:5px';
  for(const [label,moves] of Object.entries({'기본':[],'화염 2단계':['flame','flame','flamethrower'],'얼음 관통':['icebeam','icebeam','psybeam'],'복합 강화':['swift','tri','shadow','flame','ice','spark','poison','ricochet']})){
   const choice=document.createElement('button');choice.textContent=label;choice.onclick=()=>{scene.clearShots();scene.run.moves=moves;scene.hp=6;scene.inv=60;scene.effects.upgrade(scene.player.x,scene.player.y,scene.run.attack);scene.updateHud()};panel.append(choice);
  }document.body.append(panel);
 };
}
