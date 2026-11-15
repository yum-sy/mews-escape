import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arenaView} from '../src/viewport';
test('landscape framing enlarges the arena while retaining every door',()=>{
 for(const [w,h] of [[844,390],[667,375],[932,430],[1024,768]]){const v=arenaView(w,h);assert.ok(v.zoom>Math.min(w/1120,h/700));for(const [x,y] of [[30,84],[1090,644]]){const px=w/2+(x-v.x)*v.zoom,py=h/2+(y-v.y)*v.zoom;assert.ok(px>=-1e-8&&px<=w+1e-8&&py>=-1e-8&&py<=h+1e-8)}}
});
test('portrait retains complete world bounds',()=>{const v=arenaView(390,844);assert.equal(v.width,1120);assert.ok(v.zoom*700<=844)});
