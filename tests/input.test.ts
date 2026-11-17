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

test('two touch pointers preserve analog movement, independent aiming and cancellation',()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 const make=()=>{const events:Record<string,(e:any)=>void>={};return{events,dataset:{} as Record<string,string>,style:{setProperty:()=>{}},label:{textContent:''},knob:{style:{transform:''}},getBoundingClientRect:()=>({left:0,top:0,width:124,height:124}),querySelector(selector:string){return selector==='i'?this.knob:this.label},setPointerCapture:()=>{},addEventListener:(name:string,fn:(e:any)=>void)=>events[name]=fn}};
 const move=make(),attack=make(),windowEvents:Record<string,()=>void>={};
 try{
  Object.assign(globalThis,{window:{addEventListener:(name:string,fn:()=>void)=>windowEvents[name]=fn},document:{getElementById:(id:string)=>id==='move-stick'?move:attack,querySelectorAll:()=>[move.knob,attack.knob]}});
  const c=new Controls(),event=(id:number,x:number,y:number)=>({pointerId:id,clientX:x,clientY:y,preventDefault:()=>{}});
  move.events.pointerdown(event(1,80,62));attack.events.pointerdown(event(2,90,40));
  assert.ok(c.move.x>0&&c.move.x<.5);assert.equal(c.move.y,0);assert.ok(c.attack().x>0&&c.attack().y<0);
  assert.equal(attack.dataset.aiming,'true');assert.equal(attack.label.textContent,'이 방향으로 발사');attack.events.pointermove(event(2,100,20));assert.equal(attack.dataset.learned,'true');const aim={...c.aim};attack.events.pointermove(event(1,0,0));assert.deepEqual(c.aim,aim);
  move.events.pointercancel(event(1,0,0));assert.deepEqual(c.move,{x:0,y:0});assert.deepEqual(c.aim,aim);
  attack.events.lostpointercapture(event(2,0,0));assert.deepEqual(c.aim,{x:0,y:0});assert.equal(attack.dataset.aiming,'false');assert.equal(attack.label.textContent,'밀어서 공격');
  move.events.pointerdown(event(3,124,62));assert.equal(c.move.x,1);c.reset();assert.deepEqual(c.move,{x:0,y:0});assert.equal(move.knob.style.transform,'');move.events.pointerdown(event(4,62,100));assert.ok(c.move.y>0);assert.equal(c.move.x,0);attack.events.pointerdown(event(5,90,40));windowEvents.resize();assert.deepEqual(c.move,{x:0,y:0});assert.deepEqual(c.aim,{x:0,y:0});
 }finally{Object.assign(globalThis,{window:previousWindow,document:previousDocument})}
});

test('menus retain native keyboard activation and scrolling; pause always remains available',()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 const events:Record<string,(e:any)=>void>={};const stick={querySelector:()=>({style:{transform:''}}),addEventListener:()=>{}};
 try{
  Object.assign(globalThis,{window:{addEventListener:(name:string,fn:(e:any)=>void)=>events[name]=fn},document:{getElementById:()=>stick}});
  let active=false,prevented=0,pauses=0,interactions=0;const c=new Controls(()=>active);c.onPause=()=>pauses++;c.onInteract=()=>interactions++;
  const press=(code:string)=>events.keydown({code,repeat:false,preventDefault:()=>prevented++});
  press('Space');press('ArrowDown');press('KeyE');assert.equal(prevented,0);assert.equal(c.keys.size,0);assert.equal(interactions,0);
  press('Escape');assert.equal(pauses,1);
  active=true;press('ArrowDown');press('KeyE');assert.equal(prevented,1);assert.equal(interactions,1);assert.ok(c.keys.has('ArrowDown'));
  active=false;events.keyup({code:'ArrowDown'});assert.ok(!c.keys.has('ArrowDown'));
 }finally{Object.assign(globalThis,{window:previousWindow,document:previousDocument})}
});
