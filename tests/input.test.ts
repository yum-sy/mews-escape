import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Controls} from '../src/input';
import {STATS} from '../src/data';

// Exercise the production input resolver without attaching browser listeners.
function controls(keys:string[]=[],aim={x:0,y:0}){
 const c=Object.create(Controls.prototype) as Controls;
 c.keys=new Set(keys);c.aim=aim;c.move={x:0,y:0};return c;
}
test('all eight keyboard directions keep the same projectile speed',()=>{
 for(const [keys,x,y] of [
  [['ArrowRight'],1,0],[['ArrowLeft'],-1,0],[['ArrowUp'],0,-1],[['ArrowDown'],0,1],
  [['ArrowRight','ArrowUp'],1,-1],[['ArrowRight','ArrowDown'],1,1],
  [['ArrowLeft','ArrowUp'],-1,-1],[['ArrowLeft','ArrowDown'],-1,1],
 ] as [string[],number,number][]){
  const v=controls(keys).attack();assert.equal(Math.sign(v.x),x);assert.equal(Math.sign(v.y),y);
  assert.ok(Math.abs(Math.hypot(v.x*STATS.projectileSpeed,v.y*STATS.projectileSpeed)-STATS.projectileSpeed)<1e-9);
 }
});
test('touch aiming preserves arbitrary angles across all quadrants',()=>{
 for(const angle of [0,.17,.62,1.8,2.7,3.9,5.2,6.1]){
  const v=controls([],{x:Math.cos(angle),y:Math.sin(angle)}).attack();
  assert.ok(Math.abs(v.x-Math.cos(angle))<1e-10);assert.ok(Math.abs(v.y-Math.sin(angle))<1e-10);
 }
});
test('releasing one diagonal key leaves the remaining cardinal direction',()=>{
 const c=controls(['ArrowUp','ArrowRight']);c.keys.delete('ArrowRight');assert.deepEqual(c.attack(),{x:0,y:-1});
 c.keys.clear();assert.deepEqual(c.attack(),{x:0,y:0});
});
test('opposite arrows cancel; keyboard does not mix axes with touch aim',()=>{
 assert.deepEqual(controls(['ArrowLeft','ArrowRight'],{x:0,y:1}).attack(),{x:0,y:0});
 assert.deepEqual(controls(['ArrowRight'],{x:0,y:-1}).attack(),{x:1,y:0});
});
test('movement and attack vectors remain independent',()=>{
 const c=controls(['KeyA','ArrowUp','ArrowRight']);assert.deepEqual(c.movement(),{x:-1,y:0});
 assert.ok(c.attack().x>0&&c.attack().y<0);
});
