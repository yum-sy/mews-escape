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
 };
}
