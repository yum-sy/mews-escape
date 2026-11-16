import Phaser from 'phaser';
import {ENEMY_TECHNIQUES} from './enemy-techniques';
import type {Kind} from './data';
/** Cached vector art: one sprite per projectile, no particle emitter per bullet. */
export function enemyProjectile(scene:Phaser.Scene,kind:Kind,x:number,y:number){
 const key=`hostile-${kind}`,t=ENEMY_TECHNIQUES[kind];
 if(!scene.textures.exists(key)){
  const g=scene.add.graphics(),c=t.color;g.setVisible(false);g.lineStyle(2,0x172031,1);g.fillStyle(c,1);
  if(t.shape==='ember'||t.shape==='flame'){
   g.fillTriangle(4,8,29,24,4,40);g.fillEllipse(28,24,23,22);g.fillStyle(0xffedb4);g.fillTriangle(17,18,37,24,17,30);
   if(t.shape==='flame'){g.lineStyle(2,0xffbb65,.8);g.lineBetween(0,12,16,18);g.lineBetween(0,36,16,30)}
  }else if(t.shape==='gas'){
   g.fillCircle(18,17,9);g.fillCircle(28,25,11);g.fillCircle(14,29,8);g.lineStyle(2,0xe8f5c8,.9);g.strokeCircle(28,25,10);g.fillStyle(0x506a3e);g.fillCircle(24,22,2);g.fillCircle(31,26,2);
  }else if(t.shape==='needle'){
   g.fillTriangle(5,14,41,24,5,34);g.fillStyle(0xecfaff);g.fillTriangle(15,20,41,24,15,28);
  }else if(t.shape==='sludge'){
   g.fillCircle(24,24,12);g.fillCircle(12,19,6);g.fillCircle(32,34,5);g.fillStyle(0xf1c8f2);g.fillCircle(26,20,4);
  }else if(t.shape==='hex'){
   g.fillTriangle(24,5,41,24,24,43);g.fillTriangle(24,5,7,24,24,43);g.fillStyle(kind==='banette'?0x723354:0x443064);g.fillCircle(24,24,9);g.lineStyle(2,0xffe6f6);g.lineBetween(18,21,22,24);g.lineBetween(30,21,26,24);
  }else if(t.shape==='psy'){
   g.lineStyle(3,c);g.strokeEllipse(24,24,40,18);g.strokeEllipse(24,24,18,40);g.fillStyle(0xffedff);g.fillCircle(24,24,7);
  }else{
   g.fillCircle(24,24,13);g.lineStyle(3,0x564177);g.strokeCircle(24,24,10);g.lineStyle(2,0xf0ddff);g.strokeEllipse(24,24,21,10);g.fillStyle(0xe9d6ff);g.fillCircle(27,21,4);
  }
  g.generateTexture(key,48,48);g.destroy();
 }
 return scene.add.image(x,y,key).setDisplaySize(kind==='houndoom'?36:28,kind==='houndoom'?36:28).setDepth(20);
}
