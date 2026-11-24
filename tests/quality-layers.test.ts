import test from 'node:test';
import assert from 'node:assert/strict';
import {presentation,supplementaryAccents,FORMS} from '../src/techniques';
import {musicStep,musicProfile} from '../src/music-score';
test('late elemental additions remain visible after a dominant fusion, with bounded ornaments',()=>{
 for(const id of ['drain','water','swift','tri','shadow','dragon','psybeam']){
  const marks=supplementaryAccents(presentation(['icebeam','flame',id]),.2,7);
  assert.ok(marks.length>0,id);assert.ok(marks.some(m=>m.color===FORMS[id as keyof typeof FORMS].color||id==='tri'));
 }
 for(const id of ['flame','ice'])assert.ok(supplementaryAccents(presentation(['water','thunderbolt',id]),.2,7).length>0,id);
 const all=presentation(Object.keys(FORMS));for(let t=0;t<10;t+=.13){const m=supplementaryAccents(all,t,9);assert.ok(m.length<=7);assert.ok(m.every(q=>q.points.every(Number.isFinite)))}
});
test('infiltration music develops across eight bars and keeps ambient percussion-free',()=>{
 const s={floor:6,phase:1,mode:'combat' as const};assert.notDeepEqual(musicStep(s,0),musicStep(s,32));
 for(let floor=6;floor>=1;floor--)for(let phase=1;phase<=3;phase++)for(const mode of ['ambient','combat','boss'] as const){
  const scene={floor,phase,mode};assert.ok(musicProfile(scene).bpm>0);
  for(let i=0;i<128;i++){const voices=musicStep(scene,i);assert.ok(voices.length<=8);for(const v of voices){assert.ok(Number.isFinite(v.frequency)&&v.frequency>0);assert.ok(v.volume>0&&v.volume<=.07);assert.ok(v.duration>0)}if(mode==='ambient')assert.ok(voices.every(v=>!['kick','hat','snare'].includes(v.instrument)))}
 }
});
