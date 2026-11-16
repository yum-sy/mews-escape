import {cueMetrics} from './cue-layout';
import Phaser from 'phaser';
import type {Action} from './ai';
import {speciesSize} from './scaling';
export type Warning=Extract<Action,{type:'warn'}> & {label?:string};
/** World positions stay exact; line and label sizes have a screen-pixel minimum. */

export class Telegraphs{
 private cues:{root:Phaser.GameObjects.Container;ghost?:Phaser.GameObjects.Image;left:number;total:number}[]=[];
 constructor(private scene:Phaser.Scene){}
 clear(){for(const cue of this.cues)cue.root.destroy(true);this.cues=[]}
 show(w:Warning){const duration=w.duration??.7,s=this.scene,root=s.add.container(w.x,w.y).setDepth(21),g=s.add.graphics(),m=cueMetrics(s.cameras.main.zoom),color=w.tracking?0xf2b1fa:0xffd59b;root.add(g);let ghost:Phaser.GameObjects.Image|undefined;
  if(w.kind){const size=speciesSize(w.kind);ghost=s.add.image(0,0,w.kind,'body').setDisplaySize(size.width,size.height).setTint(0xc3a8ef).setAlpha(.4);root.add(ghost);g.lineStyle(m.line,0xe9bd80,.9);const r=w.r*.7;for(const [x,y] of [[-r,-r],[r,-r],[-r,r],[r,r]]){g.lineBetween(x,y,x-Math.sign(x)*12,y);g.lineBetween(x,y,x,y-Math.sign(y)*12)}}
  if(w.cue==='pool'){
   g.fillStyle(0xffce83,.14);g.fillCircle(0,0,w.r);g.lineStyle(m.line,0xffd59b,.9);g.strokeCircle(0,0,w.r);
   // Hatching denotes the whole unsafe area, not a point to stand on.
   g.lineStyle(m.line*.7,0xffd59b,.65);for(let y=-w.r+12;y<w.r;y+=16){const x=Math.sqrt(w.r*w.r-y*y);g.lineBetween(-x,y,x,y)}
   g.lineStyle(m.outline,0x10202a,1);g.lineBetween(-9,-9,9,9);g.lineBetween(-9,9,9,-9);g.lineStyle(m.line,color,1);g.lineBetween(-9,-9,9,9);g.lineBetween(-9,9,9,-9);
  }
  for(const d of w.directions??[]){const length=w.cue==='rush'?Math.max(150,m.length):m.length,start=w.r*.7;
   for(const [width,c] of [[m.outline,0x10202a],[m.line,color]]){g.lineStyle(width,c,.95);for(let n=start;n<length-14;n+=20)g.lineBetween(d.x*n,d.y*n,d.x*(n+12),d.y*(n+12))}
   const tip=m.arrow;g.fillStyle(color,1);g.fillTriangle(d.x*length,d.y*length,d.x*(length-tip*2)-d.y*tip,d.y*(length-tip*2)+d.x*tip,d.x*(length-tip*2)+d.y*tip,d.y*(length-tip*2)-d.x*tip);
   if(w.tracking){const at=length*.67;g.lineStyle(m.line,color,1);g.lineBetween(d.x*at-d.y*10,d.y*at+d.x*10,d.x*(at+13)-d.y*20,d.y*(at+13)+d.x*20)}
  }
  const label=w.label??(w.tracking?'출현 · 추적탄':{rush:'돌진',burst:w.kind?'출현 · 방사':'방사 공격',teleport:'이동 예고',aim:'발사 예고',notice:'!',phase:'패턴 변화',pool:'독 분출'}[w.cue??'aim']);
  const text=s.add.text(0,w.cue==='notice'?0:-w.r-24*m.fontScale,label,{fontFamily:'sans-serif',fontSize:w.cue==='notice'?'23px':'13px',color:w.tracking?'#f4c6ff':'#ffe0a7',backgroundColor:'#14202ae8',padding:{x:4,y:2},stroke:'#14202a',strokeThickness:2}).setOrigin(.5).setScale(m.fontScale);
  const view=s.cameras.main.worldView,pad=8*m.fontScale; // Keep labels readable near arena edges.
  text.x=Phaser.Math.Clamp(w.x,view.left+text.displayWidth/2+pad,view.right-text.displayWidth/2-pad)-w.x;
  text.y=Math.max(text.y,view.top+text.displayHeight/2+pad-w.y);root.add(text);
  this.cues.push({root,ghost,left:duration,total:duration});
 }
 update(dt:number){for(const c of this.cues){c.left-=dt;c.ghost?.setAlpha(.3+.4*(1-Math.max(0,c.left)/c.total))}this.cues=this.cues.filter(c=>{if(c.left<=0){c.root.destroy(true);return false}return true})}
}
