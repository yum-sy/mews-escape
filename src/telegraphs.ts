import Phaser from 'phaser';
import type {Action} from './ai';
import {speciesSize} from './scaling';
export type Warning=Extract<Action,{type:'warn'}> & {label?:string};
/** Attack-direction previews and destination silhouettes, paused with combat simulation. */
export class Telegraphs{
 private cues:{root:Phaser.GameObjects.Container;ghost?:Phaser.GameObjects.Image;left:number;total:number}[]=[];
 constructor(private scene:Phaser.Scene){}
 clear(){for(const cue of this.cues)cue.root.destroy(true);this.cues=[]}
 show(w:Warning){const duration=w.duration??.7,s=this.scene,root=s.add.container(w.x,w.y).setDepth(15),g=s.add.graphics();root.add(g);let ghost:Phaser.GameObjects.Image|undefined;
  if(w.kind){const size=speciesSize(w.kind);ghost=s.add.image(0,0,w.kind,'body').setDisplaySize(size.width,size.height).setTint(0xc3a8ef).setAlpha(.35);root.add(ghost);g.lineStyle(2,0xe9bd80,.8);const r=w.r*.7;for(const [x,y] of [[-r,-r],[r,-r],[-r,r],[r,r]]){g.lineBetween(x,y,x-Math.sign(x)*10,y);g.lineBetween(x,y,x,y-Math.sign(y)*10)}}
  for(const d of w.directions??[]){const length=w.cue==='rush'?150:105,start=w.r*.7;g.lineStyle(2,0xffc78e,.75);for(let n=start;n<length-12;n+=18)g.lineBetween(d.x*n,d.y*n,d.x*(n+10),d.y*(n+10));g.fillStyle(0xffc78e,.9);g.fillTriangle(d.x*length,d.y*length,d.x*(length-12)-d.y*5,d.y*(length-12)+d.x*5,d.x*(length-12)+d.y*5,d.y*(length-12)-d.x*5)}
  const label=w.label??({rush:'돌진',burst:w.kind?'출현 · 방사':'방사 공격',teleport:'이동 예고',aim:'발사 예고',notice:'!',phase:'패턴 변화'}[w.cue??'aim']);
  root.add(s.add.text(0,w.cue==='notice'?0:-w.r-21,label,{fontFamily:'sans-serif',fontSize:w.cue==='notice'?'23px':'13px',color:'#ffe0a7',stroke:'#18202b',strokeThickness:4}).setOrigin(.5));
  this.cues.push({root,ghost,left:duration,total:duration});
 }
 update(dt:number){for(const c of this.cues){c.left-=dt;c.ghost?.setAlpha(.25+.4*(1-Math.max(0,c.left)/c.total));c.root.setAlpha(c.left<.08?Math.max(.4,c.left/.08):1)}this.cues=this.cues.filter(c=>{if(c.left<=0){c.root.destroy(true);return false}return true})}
}
