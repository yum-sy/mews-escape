import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NORMAL_KINDS} from '../src/data';
import {BOSS_ROSTER} from '../src/boss-roster';
import {ENEMY_TECHNIQUES} from '../src/enemy-techniques';
import {stepBoss,type BossBrain} from '../src/boss-ai';

test('boss species never occur in the ordinary monster pool; normal attacks have distinct visual identities',()=>{
 for(const boss of [...BOSS_ROSTER,'mewtwo'])assert.ok(!NORMAL_KINDS.includes(boss as any));
 assert.equal(new Set(NORMAL_KINDS.map(k=>`${ENEMY_TECHNIQUES[k].shape}:${ENEMY_TECHNIQUES[k].color}`)).size,NORMAL_KINDS.length);
});
test('second boss cycles differ and their preview directions remain locked',()=>{
 for(const kind of BOSS_ROSTER){const e:BossBrain={x:560,y:290,hp:220,cooldown:0,charge:0,dir:{x:0,y:0},phase:1,cycle:1};const actions=stepBoss(kind,e,{x:560,y:480},.016,6).actions;
  if(kind==='muk'){assert.equal(actions.filter(a=>a.type==='pool').length,3);assert.ok(actions.every(a=>a.type==='pool'));}
  else{const w=actions.find(a=>a.type==='warn');assert.ok(w?.type==='warn');assert.ok(w.duration!>=1);const shots=[];for(let i=0;i<70;i++)shots.push(...stepBoss(kind,e,{x:100,y:200},.016,6).actions.filter(a=>a.type==='shot'));
   if(kind==='houndoom'){assert.equal(w.cue,'rush');assert.equal(shots.length,0);assert.ok(e.dash!>0)}else assert.deepEqual(shots.map(s=>s.dir),w.directions);
  }
 }
});

import {stepBrain,type Brain} from '../src/ai';
import {gasShellClosed} from '../src/enemy-techniques';
test('Zubat waits for lane alignment, locks its charge and gives a recovery opening',()=>{
 const e:Brain={x:300,y:300,hp:5,cooldown:0,charge:0,dir:{x:0,y:0},phase:1};
 assert.equal(stepBrain('zubat',e,{x:500,y:500},.016).actions.length,0);
 const start=stepBrain('zubat',e,{x:310,y:500},.016);assert.deepEqual(e.dir,{x:0,y:1});assert.equal(start.actions[0].type,'warn');
 for(let i=0;i<35;i++)assert.deepEqual(stepBrain('zubat',e,{x:700,y:300},.016).v,{x:0,y:0});
 let dashed=false;for(let i=0;i<40;i++){const r=stepBrain('zubat',e,{x:700,y:300},.016);if(r.v.y>300){dashed=true;assert.equal(r.v.x,0)}}assert.ok(dashed);assert.ok(e.recovery!>0);
});
test('Koffing opens on a timer even under constant fire; armor never makes it invulnerable',()=>{
 const e:Brain={x:300,y:300,hp:10,cooldown:.3,charge:0,dir:{x:0,y:0},phase:1};let closed=0,open=0,shots=0;
 for(let i=0;i<400;i++){const r=stepBrain('koffing',e,{x:500,y:500},.016);assert.deepEqual(r.v,{x:0,y:0});gasShellClosed({...e,kind:'koffing'})?closed++:open++;shots+=r.actions.filter(a=>a.type==='shot').length}
 assert.ok(closed>0&&open>0&&shots>=16);
});
