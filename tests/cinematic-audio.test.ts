import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openingScore,SoundCursor} from '../src/cinematic-score';
import {operatorPose,CAPTURE_FIRE,CAPTURE_CONTACT} from '../src/cinematic-motion';
import {rubblePose} from '../src/cinematic-stage';
test('capture audio follows planted strides and the actual net launch/contact times',()=>{
 const cues=openingScore('capture');assert.equal(cues.find(c=>c.kind==='net')!.at,CAPTURE_FIRE);assert.equal(cues.find(c=>c.kind==='catch')!.at,CAPTURE_CONTACT);
 for(const cue of cues.filter(c=>c.kind==='step')){const distance=operatorPose(cue.at,cue.pan>0?.28:0).distance;assert.ok(Math.abs(distance/18-Math.round(distance/18))<1e-7)}
});
test('glass release, collapse and debris impacts use the visual action clock',()=>{
 assert.equal(openingScore('freedom').find(c=>c.kind==='glass')!.at,1.1);
 assert.equal(openingScore('collapse').find(c=>c.kind==='collapse')!.at,.9);
 for(const cue of openingScore('collapse').filter(c=>c.kind==='debris'))assert.ok([0,3,6,9,13,17].some(i=>Math.abs(rubblePose(i,cue.at).impact)<1e-7));
 for(const name of ['forest','capture','experiment','awakening','collapse','freedom']){const cues=openingScore(name);assert.ok(cues.every((c,i)=>c.at>=0&&c.at<8&&Math.abs(c.pan)<=1&&(!i||c.at>=cues[i-1].at)))}
});
test('mute, pause, repeated frames and time jumps do not replay stale effects',()=>{
 const cursor=new SoundCursor(openingScore('capture'));cursor.advance(2.8,false);assert.equal(cursor.advance(2.95,true).filter(c=>c.kind==='net').length,1);assert.equal(cursor.advance(2.95,true).length,0);
 cursor.advance(3.7,false);assert.equal(cursor.advance(3.8,true).length,0);cursor.seek(4.3);assert.equal(cursor.advance(4.3,true).length,0);
 const skipped=new SoundCursor(openingScore('collapse'));assert.equal(skipped.advance(7,true).length,0);
});

test('audio graph mutes, pauses and disposes every active source and recovers after resume',async()=>{
 const {OpeningAudio}=await import('../src/cinematic-audio');
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),pan:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
 const sources:{stops:number[];starts:number;stop:(t:number)=>void}[]=[];
 const source=()=>{const stops:number[]=[];const n={...node(),stops,starts:0,start(){this.starts++},stop(t:number){stops.push(t)}};sources.push(n);return n};
 const ctx={state:'running',currentTime:0,sampleRate:1000,destination:node(),resume:async()=>{},createGain:node,createStereoPanner:node,createDynamicsCompressor:node,createBiquadFilter:node,createOscillator:source,createBufferSource:source,createBuffer:(_a:number,n:number)=>({getChannelData:()=>new Float32Array(n)})};
 const original=globalThis.window;Object.assign(globalThis,{window:{setTimeout}});
 try{
  const owner=new OpeningAudio(()=>ctx as unknown as AudioContext);const track=owner.track('collapse');track.update(0);assert.equal(sources.length,0);
  assert.equal(await owner.toggle(),true);track.update(.04);assert.ok(sources.length>0);assert.ok(sources.every(s=>s.starts===1));
  track.pause(.1);assert.ok(sources.every(s=>s.stops.at(-1)!<=.06));const count=sources.length;track.update(.9);assert.equal(sources.length,count);
  track.resume(.9);track.update(.94);assert.ok(sources.length>count);await owner.toggle();assert.ok(sources.every(s=>s.stops.at(-1)!<=.06));
  await owner.toggle();track.update(1.1);track.dispose();assert.ok(sources.every(s=>s.stops.at(-1)!<=.06));const disposedCount=sources.length;track.update(3);assert.equal(sources.length,disposedCount);
 }finally{Object.assign(globalThis,{window:original})}
});
