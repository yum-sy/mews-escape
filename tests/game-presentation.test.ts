import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMS,presentation,techniqueMarks} from '../src/techniques';
import {composeAttack,splitAttack} from '../src/moves';
import {techniqueSound} from '../src/game-sound';
import {musicProfile,musicStep,type MusicScene} from '../src/music-score';
import {AudioFX} from '../src/audio';
test('every technique has distinct geometry and sound; marks remain finite during animation',()=>{
 const geometry=new Set<string>(),sounds=new Set<string>();
 for(const form of Object.keys(FORMS) as (keyof typeof FORMS)[]){const v=presentation([form]);geometry.add(JSON.stringify(techniqueMarks(v,.7,6)));sounds.add(JSON.stringify(techniqueSound(form)));
  for(let t=0;t<2;t+=.05)for(const mark of techniqueMarks(v,t,6))assert.ok(mark.points.every(Number.isFinite));
  for(const voice of [...techniqueSound(form),...techniqueSound(form,true)])assert.ok(voice.duration>0&&voice.from>0&&voice.to>0&&voice.gain<.2);
 }assert.equal(geometry.size,16);assert.equal(sounds.size,16);
});
test('carrier merges techniques while utilities preserve all accumulated effects',()=>{
 const a=composeAttack(['swift','flame','water','agility','split','ricochet']);assert.equal(a.visual.form,'water');assert.ok(a.homing&&a.burn&&a.split&&a.bounce);assert.equal(splitAttack(a).visual.form,'water');
 assert.equal(presentation(['water','shadow']).form,'water');assert.equal(presentation(['water','water']).rank,2);
 assert.notDeepEqual(techniqueMarks(presentation(['water']),0,6),techniqueMarks(presentation(['water','water']),0,6));
});
test('floor tension and all three final boss arrangements intensify while cleared rooms remove drums',()=>{
 let bpm=0;for(let floor=6;floor>=1;floor--){const s:MusicScene={floor,phase:1,mode:'combat'};assert.ok(musicProfile(s).bpm>bpm);bpm=musicProfile(s).bpm;}
 let density=0;bpm=0;for(let phase=1;phase<=3;phase++){const s:MusicScene={floor:1,phase,mode:'boss'},voices=Array.from({length:32},(_,i)=>musicStep(s,i)).flat();assert.ok(voices.length>density);assert.ok(musicProfile(s).bpm>bpm);density=voices.length;bpm=musicProfile(s).bpm;}
 for(let i=0;i<128;i++){assert.equal(musicStep({floor:1,phase:3,mode:'silent'},i).length,0);assert.ok(musicStep({floor:1,phase:3,mode:'ambient'},i).every(v=>!['kick','hat','snare'].includes(v.instrument)));}
});
test('game audio bounds voices, mutes all scheduled sources and recovers across phase and pause changes',async()=>{
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),pan:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
 const sources:{stops:number[];onended?:()=>void}[]=[];
 const source=()=>{const s={...node(),stops:[] as number[],start(){},stop(t:number){this.stops.push(t)}};sources.push(s);return s};
 let closed=false;const ctx={state:'running',currentTime:0,sampleRate:1000,destination:node(),resume:async()=>{},close:async()=>{closed=true},createGain:node,createStereoPanner:node,createDynamicsCompressor:node,createBiquadFilter:node,createOscillator:source,createBufferSource:source,createBuffer:(_a:number,n:number)=>({getChannelData:()=>new Float32Array(n)})};
 const previous=globalThis.window;Object.assign(globalThis,{window:{clearInterval}});
 try{const audio=new AudioFX(()=>ctx as unknown as AudioContext,false);audio.mode='boss';audio.setScene(1,1);await audio.toggle();for(let i=0;i<128;i++)audio.renderMusicStep(i,i*.1);assert.equal(audio.snapshot.voices,72);
 await audio.toggle();assert.equal(audio.snapshot.voices,0);assert.ok(sources.every(s=>s.stops.at(-1)!<=.06));await audio.toggle();audio.setScene(1,3);assert.equal(audio.snapshot.bpm,166);audio.renderMusicStep(0,0);assert.ok(audio.snapshot.voices>0);audio.mode='silent';assert.equal(audio.snapshot.voices,0);
 audio.mode='combat';audio.shoot(composeAttack(['water','spark']),0);assert.ok(audio.snapshot.voices>=2);sources.forEach(s=>s.onended?.());assert.equal(audio.snapshot.voices,0);audio.dispose();assert.ok(closed);
 }finally{Object.assign(globalThis,{window:previous})}
});
