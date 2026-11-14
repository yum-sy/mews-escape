import {test} from 'node:test';import assert from 'node:assert/strict';import {cardinal,normalize,damage,intersects} from '../src/combat';import {STATS,SPAWNS,ROOM} from '../src/data';
test('diagonal movement has same speed as axial movement',()=>assert.ok(Math.abs(Math.hypot(...Object.values(normalize(1,1)))-1)<1e-10));
test('attack is cardinal and has a deadzone',()=>{assert.deepEqual(cardinal(.1,.1),{x:0,y:0});assert.deepEqual(cardinal(-.8,.3),{x:-1,y:0});assert.deepEqual(cardinal(.3,.8),{x:0,y:1})});
test('invulnerability blocks repeated damage; HP cannot go negative',()=>{const hit=damage(6,0);assert.equal(hit.hp,5);assert.equal(damage(hit.hp,hit.invulnerable).hp,5);assert.equal(damage(1,0,4).hp,0)});
test('projectile hit radius and range are bounded',()=>{assert.equal(intersects({x:0,y:0},{x:19,y:0},20),true);assert.equal(intersects({x:0,y:0},{x:21,y:0},20),false);assert.ok(STATS.projectileCap<=120);assert.ok(STATS.range/STATS.projectileSpeed<2)});
test('spawns stay inside room and outside initial player contact',()=>{for(const s of SPAWNS){assert.ok(s.x>ROOM.left&&s.x<ROOM.right&&s.y>ROOM.top&&s.y<ROOM.bottom);assert.ok(!intersects(s,{x:560,y:365},150))}});
