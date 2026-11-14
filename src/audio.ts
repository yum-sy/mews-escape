export class AudioFX{
 enabled=false;ctx:AudioContext|null=null;
 toggle(){this.enabled=!this.enabled;if(this.enabled){this.ctx??=new AudioContext();void this.ctx.resume()}return this.enabled}
 play(kind:'shoot'|'hit'|'hurt'|'win'){if(!this.enabled||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=kind==='hurt'?'sawtooth':'sine';const f={shoot:640,hit:230,hurt:100,win:880}[kind];o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(f*.4,c.currentTime+.13);g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.16);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.18)}
}
