import {test} from 'node:test';
import assert from 'node:assert/strict';
import {footCycle,operatorPose,captureMew,escapeMew,chamberOpening,deformOperator,deformMew,CAPTURE_CONTACT} from '../src/cinematic-motion';
test('planted feet cancel travel while swing feet lift and return to the floor',()=>{
 for(const d of [2,5,10,18])assert.ok(Math.abs((d+footCycle(d).x)-(2+footCycle(2).x))<1e-8);
 assert.ok(footCycle(29).y < -10);assert.equal(footCycle(36).y,0);
 assert.equal(operatorPose(3).distance,operatorPose(8).distance);
});
test('Mew waits for the capsule opening, anticipates the jump, then reaches the corridor',()=>{
 assert.ok(chamberOpening(3.15)>.99);
 for(let t=0;t<3.15;t+=.05)assert.ok(Math.abs(escapeMew(t).x-500)<20);
 assert.ok(escapeMew(2.95).tuck>.6);assert.ok(escapeMew(4.3).x>escapeMew(3.5).x);
 assert.ok(escapeMew(7.2).x>820);assert.ok(escapeMew(7.2).width<escapeMew(4).width);
 assert.ok(captureMew(CAPTURE_CONTACT+2).y>captureMew(CAPTURE_CONTACT).y+35);
});
test('animation poses and deformed meshes remain continuous and do not fold triangles',()=>{
 for(let t=0;t<=8;t+=.08){
  for(const warp of [(x:number,y:number)=>deformOperator({x,y},t),(x:number,y:number)=>deformMew({x,y},t,escapeMew(t))]){
   for(let y=0;y<16;y++)for(let x=0;x<12;x++){
    const a=warp(x/12,y/16),b=warp((x+1)/12,y/16),d=warp(x/12,(y+1)/16);
    const e=warp((x+1)/12,(y+1)/16);const areas=[(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y),(e.x-b.x)*(d.y-b.y)-(d.x-b.x)*(e.y-b.y)];for(const area of areas)assert.ok(Number.isFinite(area)&&area>0,`fold at ${t},${x},${y}`);
   }
  }
  const p=escapeMew(t),next=escapeMew(t+.001);assert.ok(Math.hypot(p.x-next.x,p.y-next.y)<1);
 }
});

test('debris lands on its floor plane and remains there instead of looping through the scene',async()=>{
 const {rubblePose,LAB_EXIT}=await import('../src/cinematic-stage');
 for(let i=0;i<30;i++){
  assert.equal(rubblePose(i,0).visible,false);
  for(let t=0;t<8;t+=.04){const p=rubblePose(i,t);assert.ok(p.y<=p.floor+.001)}
  const p=rubblePose(i,7);assert.equal(p.y,p.floor);assert.equal(p.landed,true);const later=rubblePose(i,8);for(const key of ['x','y','angle'] as const)assert.equal(later[key],p[key]);
 }
 const mew=escapeMew(7.2);assert.ok(mew.x-mew.width/2>=LAB_EXIT.left);assert.ok(mew.x+mew.width/2<=LAB_EXIT.right);assert.ok(Math.abs(mew.y-LAB_EXIT.y)<3);
});
