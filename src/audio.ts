import type {Attack} from './moves';
import {attackSound,techniqueSound,type SoundVoice} from './game-sound';
import {FORMS,type Form} from './techniques';
import {musicProfile,musicStep,type MusicMode,type MusicScene} from './music-score';
export class AudioFX{
 enabled=false;ctx:AudioContext|null=null;private _mode:MusicMode='silent';private scene:MusicScene={floor:6,phase:1,mode:'silent'};
 private timer:number|undefined;private musicBus:GainNode|null=null;private fxBus:GainNode|null=null;private voices=new Map<AudioScheduledSourceNode,{group:'music'|'fx';nodes:AudioNode[]}>();private noise:AudioBuffer|null=null;
 private next=0;private step=0;private lastHit=-1;private lastShot=-1;private procTime=new Map<string,number>();private token=0;private listening=false;
 constructor(private factory:()=>AudioContext=()=>new AudioContext(),private autoSchedule=true){}
 get mode(){return this._mode}set mode(mode:MusicMode){if(mode===this._mode)return;this._mode=mode;this.scene.mode=mode;this.resetMusic();if(mode==='silent')this.stop('fx')}
 get snapshot(){return{...musicProfile(this.scene),mode:this.mode,enabled:this.enabled,voices:this.voices.size}}
 setScene(floor:number,phase=1){if(this.scene.floor===floor&&this.scene.phase===phase)return;this.scene.floor=floor;this.scene.phase=phase;this.resetMusic()}
 async toggle(){if(this.enabled){this.enabled=false;this.token++;window.clearInterval(this.timer);this.timer=undefined;this.stop();return false}
  const token=++this.token;try{this.ctx??=this.factory();if(!this.musicBus){const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-17;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.006;compressor.release.value=.16;compressor.connect(this.ctx.destination);this.musicBus=this.ctx.createGain();this.fxBus=this.ctx.createGain();this.musicBus.gain.value=.65;this.fxBus.gain.value=.7;this.musicBus.connect(compressor);this.fxBus.connect(compressor)}await this.ctx.resume();if(token!==this.token)return false;this.enabled=this.ctx.state==='running';if(this.enabled){this.resetMusic();if(this.autoSchedule){this.timer=window.setInterval(()=>this.pump(),25);if(!this.listening){document.addEventListener('visibilitychange',this.visibility);this.listening=true}}}return this.enabled}catch{return this.enabled=false}}
 private visibility=()=>{if(document.hidden)this.stop();else if(this.enabled){void this.ctx?.resume().catch(()=>{});this.resetMusic()}};
 private stop(group?:'music'|'fx'){if(!this.ctx)return;const now=this.ctx.currentTime;for(const [source,record] of this.voices){if(group&&record.group!==group)continue;const envelope=record.nodes[0] as GainNode;envelope.gain.cancelScheduledValues(now);envelope.gain.setTargetAtTime(.0001,now,.012);try{source.stop(now+.06)}catch{}this.voices.delete(source)}}
 private resetMusic(){this.stop('music');this.step=0;this.next=(this.ctx?.currentTime??0)+.04}
 private pump(){if(!this.enabled||!this.ctx||this.ctx.state!=='running'||document.hidden||this.mode==='silent')return;const now=this.ctx.currentTime;if(this.next<now-.15){this.next=now+.02;this.step=0}while(this.next<now+.1){this.renderMusicStep(this.step++,this.next);this.next+=musicProfile(this.scene).subdivision}}
 renderMusicStep(step:number,at:number){for(const v of musicStep(this.scene,step)){const common={from:v.frequency,to:v.frequency,duration:v.duration,gain:v.volume,pan:v.pan,delay:0};let spec:SoundVoice;
  if(v.instrument==='hat'||v.instrument==='snare')spec={...common,wave:'noise',from:v.instrument==='hat'?6500:1800,to:v.instrument==='hat'?4500:750,filter:v.instrument==='hat'?'highpass':'bandpass'};
  else if(v.instrument==='kick')spec={...common,wave:'sine',from:110,to:35};
  else spec={...common,wave:v.instrument==='lead'?'triangle':v.instrument==='bass'?'triangle':'sine',attack:v.instrument==='pad'?.2:.012};
  this.voice(spec,at,'music');
 }}
 private voice(v:SoundVoice,at:number,group:'music'|'fx'){
  const c=this.ctx;if(!this.enabled||!c||c.state!=='running'||!this.musicBus||!this.fxBus||this.voices.size>=72)return;
  const t=Math.max(c.currentTime,at)+v.delay,g=c.createGain(),pan=c.createStereoPanner(),nodes:AudioNode[]=[g,pan];pan.pan.value=v.pan;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v.gain),t+(v.attack??.006));g.gain.exponentialRampToValueAtTime(.0001,t+v.duration);g.connect(pan);pan.connect(group==='music'?this.musicBus:this.fxBus);
  let source:AudioScheduledSourceNode;
  if(v.wave==='noise'){if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);let seed=150;for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=seed/2147483648-1}}const n=c.createBufferSource(),f=c.createBiquadFilter();n.buffer=this.noise;n.loop=true;f.type=v.filter??'bandpass';f.Q.value=.65;f.frequency.setValueAtTime(v.from,t);f.frequency.exponentialRampToValueAtTime(v.to,t+v.duration);n.connect(f);f.connect(g);nodes.push(f);source=n}
  else{const o=c.createOscillator();o.type=v.wave;o.frequency.setValueAtTime(v.from,t);o.frequency.exponentialRampToValueAtTime(v.to,t+v.duration);o.connect(g);source=o}
  this.voices.set(source,{group,nodes});source.onended=()=>{source.disconnect();nodes.forEach(n=>n.disconnect());this.voices.delete(source)};source.start(t);source.stop(t+v.duration+.025);
 }
 shoot(a:Attack,at=this.ctx?.currentTime??0,companions:Attack[]=[]){if(!this.enabled||at-this.lastShot<.055)return;this.lastShot=at;for(const v of attackSound(a))this.voice(v,at,'fx');for(const layer of companions)for(const v of techniqueSound(layer.visual.form).slice(0,1))this.voice({...v,gain:v.gain*.35/Math.sqrt(companions.length),delay:v.delay+.025},at,'fx')}
 hit(a:Attack,at=this.ctx?.currentTime??0){if(!this.enabled||at-this.lastHit<.055)return;this.lastHit=at;for(const v of attackSound(a,true))this.voice(v,at,'fx')}
 reward(id:string,a:Attack){const at=this.ctx?.currentTime??0;this.play('win');const form=id in FORMS?id as Form:a.visual.form;for(const v of techniqueSound(form))this.voice({...v,gain:v.gain*.8,delay:v.delay+.12},at,'fx')}
 proc(kind:'chain'|'split'|'bounce'|'heal'){const now=this.ctx?.currentTime??0;if(now-(this.procTime.get(kind)??-1)<.12)return;this.procTime.set(kind,now);const form:Form={chain:'spark',split:'swift',bounce:'ice',heal:'drain'}[kind] as Form;for(const v of techniqueSound(form,true))this.voice({...v,gain:v.gain*.6},now,'fx')}
 play(kind:'shoot'|'hit'|'hurt'|'win'|'clear'|'alarm'|'read',_color=0){const f={shoot:620,hit:230,hurt:100,win:660,clear:523.25,alarm:140,read:520}[kind],now=this.ctx?.currentTime??0;this.voice({wave:kind==='hurt'?'triangle':'sine',from:f,to:kind==='hurt'?55:f,duration:.18,gain:.04,pan:0,delay:0},now,'fx');if(kind==='win'||kind==='clear')for(let i=1;i<=2;i++)this.voice({wave:'sine',from:f*[1,1.25,1.5][i],to:f*[1,1.25,1.5][i],duration:.35,gain:.026,pan:0,delay:i*.075},now,'fx')}
 environment(kind:'door'|'switch'|'glass'|'lift'|'crate'|'reward'){const now=this.ctx?.currentTime??0;if(now-(this.procTime.get('env')??-1)<.08)return;this.procTime.set('env',now);const form:Form={door:'shadow',switch:'spark',glass:'ice',lift:'dragon',crate:'sludge',reward:'swift'}[kind] as Form;for(const v of techniqueSound(form))this.voice({...v,gain:v.gain*.7,duration:v.duration*(kind==='lift'?2:1)},now,'fx')}
 dispose(){this.token++;this.enabled=false;window.clearInterval(this.timer);this.stop();if(this.listening)document.removeEventListener('visibilitychange',this.visibility);this.listening=false;void this.ctx?.close()}
}
