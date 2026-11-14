import {openingScore,SoundCursor,type SoundCue} from './cinematic-score';
type Source=AudioScheduledSourceNode;
export class OpeningAudio{
 constructor(private makeContext:()=>AudioContext=()=>new AudioContext()){}
 private context:AudioContext|null=null;
 private output:GainNode|null=null;
 private active:OpeningTrack|null=null;
 enabled=false;
 get running(){return this.enabled&&this.context?.state==='running'}
 async toggle(){
  if(this.enabled){this.active?.silence();this.enabled=false;return false}
  try{
   this.context??=this.makeContext();
   if(!this.output){const compressor=this.context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.008;compressor.release.value=.18;this.output=this.context.createGain();this.output.gain.value=.6;this.output.connect(compressor);compressor.connect(this.context.destination)}
   await this.context.resume();this.enabled=this.context.state==='running';
  }catch{this.enabled=false}
  return this.enabled;
 }
 track(shot:string){this.active?.dispose();const track=new OpeningTrack(this,shot);this.active=track;return track}
 graph(){return this.running&&this.context&&this.output?{ctx:this.context,output:this.output}:null}
 async resume(){if(this.enabled)try{await this.context?.resume()}catch{/* A later explicit tap can retry. */}}
}
class OpeningTrack{
 private cursor:SoundCursor;
 private sources=new Set<Source>();
 private bus:GainNode|null=null;
 private noise:AudioBuffer|null=null;
 private disposed=false;
 private beat=-1;
 private hidden=false;
 constructor(private owner:OpeningAudio,private shot:string){this.cursor=new SoundCursor(openingScore(shot))}
 update(time:number){
  if(this.disposed)return;
  const graph=this.owner.graph(),audible=!!graph&&!this.hidden;
  const cues=this.cursor.advance(time,audible);
  if(!audible)return;
  if(!this.bus){this.bus=graph!.ctx.createGain();this.bus.gain.setValueAtTime(0,graph!.ctx.currentTime);this.bus.gain.linearRampToValueAtTime(1,graph!.ctx.currentTime+.22);this.bus.connect(graph!.output);this.ambience()}
  for(const cue of cues)this.effect(cue);
  const beat=Math.floor(time/1.35);if(beat!==this.beat){this.beat=beat;this.music(beat)}
 }
 pause(time:number){this.hidden=true;this.cursor.seek(time);this.silence()}
 resume(time:number){this.cursor.seek(time);this.hidden=false;void this.owner.resume()}
 silence(){
  const ctx=this.owner.graph()?.ctx;
  if(this.bus&&ctx){this.bus.gain.cancelScheduledValues(ctx.currentTime);this.bus.gain.setTargetAtTime(0,ctx.currentTime,.015)}
  for(const source of this.sources){try{source.stop(ctx?ctx.currentTime+.06:0)}catch{/* Already ended. */}}
  this.sources.clear();const old=this.bus;this.bus=null;if(old)window.setTimeout(()=>old.disconnect(),90);
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.silence()}
 private attach(source:Source,nodes:AudioNode[],duration:number){
  const graph=this.owner.graph();if(!graph||!this.bus)return;
  this.sources.add(source);source.onended=()=>{source.disconnect();for(const n of nodes)n.disconnect();this.sources.delete(source)};
  source.start(graph.ctx.currentTime);source.stop(graph.ctx.currentTime+duration);
 }
 private envelope(duration:number,volume:number,pan:number,attack=.008){
  const graph=this.owner.graph();if(!graph||!this.bus)return null;const {ctx}=graph,g=ctx.createGain(),p=ctx.createStereoPanner();p.pan.value=pan;
  g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),ctx.currentTime+attack);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);g.connect(p);p.connect(this.bus);return{ctx,g,p};
 }
 private tone(f:number,end:number,duration:number,volume:number,pan=0,type:OscillatorType='sine',attack=.008){const e=this.envelope(duration,volume,pan,attack);if(!e)return;const o=e.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,e.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(end,e.ctx.currentTime+duration);o.connect(e.g);this.attach(o,[e.g,e.p],duration+.02)}
 private hiss(duration:number,volume:number,frequency:number,pan=0,kind:BiquadFilterType='lowpass',end=frequency,attack=.008,endPan=pan){
  const e=this.envelope(duration,volume,pan,attack);if(!e)return;
  e.p.pan.linearRampToValueAtTime(endPan,e.ctx.currentTime+duration);
  if(!this.noise){this.noise=e.ctx.createBuffer(1,e.ctx.sampleRate*2,e.ctx.sampleRate);const data=this.noise.getChannelData(0);let seed=151;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1}}
  const n=e.ctx.createBufferSource(),filter=e.ctx.createBiquadFilter();n.buffer=this.noise;n.loop=true;filter.type=kind;filter.frequency.setValueAtTime(frequency,e.ctx.currentTime);filter.frequency.exponentialRampToValueAtTime(end,e.ctx.currentTime+duration);filter.Q.value=.7;n.connect(filter);filter.connect(e.g);this.attach(n,[filter,e.g,e.p],duration+.02);
 }
 private ambience(){
  if(this.shot==='forest'||this.shot==='capture'){this.hiss(9,.025,650,0,'bandpass',850,.6);this.tone(146.83,146.6,9,.018,-.3,'sine',.6);this.tone(220,220.3,9,.012,.3,'sine',.8)}
  else{const root=this.shot==='collapse'?43.65:55;this.tone(root,root*.995,9,.035,0,'sine',.4);this.tone(root*2.01,root*2,9,.012,-.2,'triangle',.5);this.hiss(9,this.shot==='collapse'?.065:.022,this.shot==='collapse'?180:320,0,'lowpass',120,.4)}
 }
 private music(beat:number){
  const peaceful=this.shot==='forest',notes=peaceful?[293.66,440,349.23,329.63,293.66,523.25]:this.shot==='freedom'?[220,261.63,329.63,392,440,523.25]:[146.83,155.56,220,164.81,146.83,207.65];
  const f=notes[beat%notes.length];this.tone(f,f,1.9,peaceful?.018:.011,beat%2?.3:-.3,'sine',.16);this.tone(f*1.5,f*1.5,2.1,.006,0,'sine',.2);
 }
 private effect({kind,pan,level}:SoundCue){const v=(n:number)=>n*level;
  switch(kind){
   case 'step':this.hiss(.13,v(.19),370,pan);this.hiss(.17,v(.05),2100,pan,'highpass');this.tone(92,58,.11,v(.065),pan);break;
   case 'net':this.hiss(.55,v(.14),1900,pan,'bandpass',550,.008,.05);this.tone(260,90,.16,v(.08),pan,'triangle');this.hiss(.055,v(.09),3700,pan,'highpass');break;
   case 'catch':this.hiss(.28,v(.09),1100,pan,'bandpass',380);this.tone(130,65,.17,v(.055),pan);break;
   case 'scan':this.tone(720,1080,.13,v(.025),pan);this.hiss(.35,v(.025),1500,pan,'bandpass',2400,.04);break;
   case 'crack':this.hiss(.09,v(.13),2700,pan,'highpass');this.tone(2170,1500,.12,v(.025),pan);break;
   case 'glass':this.hiss(.5,v(.13),2400,pan,'highpass',4200);for(const [i,f] of [1630,2347,3181,4273,5521].entries())this.tone(f,f*.94,.3+i*.12,v(.024/(1+i*.25)),Math.max(-1,Math.min(1,pan+(i-2)*.18)));break;
   case 'metal':this.tone(181,166,.55,v(.06),pan,'triangle');this.tone(461,430,.7,v(.025),pan);this.hiss(.12,v(.07),1400,pan);break;
   case 'collapse':this.tone(80,27,1.8,v(.19));this.hiss(2.8,v(.34),420,0,'lowpass',80,.015);this.hiss(.17,v(.1),1800,0,'bandpass');break;
   case 'debris':this.hiss(.3,v(.15),600,pan);this.tone(125,55,.18,v(.075),pan);break;
   case 'energy':this.tone(73,147,1.6,v(.07),pan,'sine',.25);this.tone(147,294,1.7,v(.018),pan,'triangle',.3);this.hiss(1.5,v(.04),350,pan,'bandpass',1700,.2);break;
   case 'escape':this.hiss(.65,v(.065),700,pan,'bandpass',1900,.07,.75);this.tone(392,784,.6,v(.024),pan,'sine',.08);break;
   case 'chime':this.tone(659.25,659.25,1,v(.025),pan,'sine',.015);this.tone(987.77,987.77,1.2,v(.012),pan,'sine',.02);break;
  }
 }
}
export const openingAudio=new OpeningAudio();
