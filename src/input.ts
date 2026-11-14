import {normalize,type Vec} from './combat';
export class Controls{
 keys=new Set<string>();move:Vec={x:0,y:0};aim:Vec={x:0,y:0};onPause=()=>{};
 constructor(){
 window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='Escape'&&!e.repeat)this.onPause()});
 window.addEventListener('keyup',e=>this.keys.delete(e.code));
 window.addEventListener('blur',()=>this.reset());
 this.stick('move-stick',v=>this.move=v);this.stick('attack-stick',v=>this.aim=v);
 }
 reset(){this.keys.clear();this.move={x:0,y:0};this.aim={x:0,y:0};document.querySelectorAll<HTMLElement>('.stick i').forEach(e=>e.style.transform='')}
 movement(){const x=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA')),y=Number(this.keys.has('KeyS'))-Number(this.keys.has('KeyW'));return x||y?normalize(x,y):this.move}
 attack(){const x=Number(this.keys.has('ArrowRight'))-Number(this.keys.has('ArrowLeft')),y=Number(this.keys.has('ArrowDown'))-Number(this.keys.has('ArrowUp'));const keyboardActive=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].some(key=>this.keys.has(key));return keyboardActive?normalize(x,y):normalize(this.aim.x,this.aim.y)}
 private stick(id:string,set:(v:Vec)=>void){const el=document.getElementById(id)!;const knob=el.querySelector<HTMLElement>('i')!;let pointer:number|null=null;
 const update=(e:PointerEvent)=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),limit=r.width*.3;const v=d<8?{x:0,y:0}:normalize(x,y);set(v);knob.style.transform=`translate(${v.x*Math.min(d,limit)}px,${v.y*Math.min(d,limit)}px)`};
 el.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;el.setPointerCapture(pointer);update(e)});el.addEventListener('pointermove',e=>{if(e.pointerId===pointer)update(e)});
 const end=(e:PointerEvent)=>{if(e.pointerId===pointer){pointer=null;set({x:0,y:0});knob.style.transform=''}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
 }
}
