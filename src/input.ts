import {normalize,type Vec} from './combat';
export class Controls{
 private resetSticks:(()=>void)[]=[];
 keys=new Set<string>();move:Vec={x:0,y:0};aim:Vec={x:0,y:0};onPause=()=>{};onInteract=()=>{};onActive=()=>{};
 constructor(private active:()=>boolean=()=>true){
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.repeat){this.onPause();return}if(!this.active())return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)this.onInteract();if(e.code==='Space'&&!e.repeat)this.onActive()});
 window.addEventListener('keyup',e=>this.keys.delete(e.code));
 window.addEventListener('blur',()=>this.reset());
 window.addEventListener('resize',()=>this.reset());
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.body?.classList.add('touch-ui')});
 this.stick('move-stick',v=>this.move=v,true);this.stick('attack-stick',v=>this.aim=v);
 }
 reset(){this.resetSticks?.forEach(reset=>reset());this.keys.clear();this.move={x:0,y:0};this.aim={x:0,y:0};document.querySelectorAll<HTMLElement>('.stick i').forEach(e=>e.style.transform='')}
 movement(){const x=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA')),y=Number(this.keys.has('KeyS'))-Number(this.keys.has('KeyW'));return x||y?normalize(x,y):this.move}
 attack(){const x=Number(this.keys.has('ArrowRight'))-Number(this.keys.has('ArrowLeft')),y=Number(this.keys.has('ArrowDown'))-Number(this.keys.has('ArrowUp'));const keyboardActive=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].some(key=>this.keys.has(key));return keyboardActive?normalize(x,y):normalize(this.aim.x,this.aim.y)}
 private stick(id:string,set:(v:Vec)=>void,analog=false){const el=document.getElementById(id)!;const knob=el.querySelector<HTMLElement>('i')!;let pointer:number|null=null,downX=0,downY=0;const feedback=(v:Vec,dragged=false)=>{if(analog)return;const aiming=!!(v.x||v.y);el.dataset.aiming=String(aiming);if(dragged&&aiming)el.dataset.learned='true';if(aiming)el.style.setProperty('--aim-angle',`${Math.atan2(v.y,v.x)}rad`);const label=el.querySelector<HTMLElement>('.aim-label');if(label)label.textContent=aiming?'이 방향으로 발사':el.dataset.learned==='true'?'밀어서 공격':'밀어서 조준'};this.resetSticks.push(()=>{const old=pointer;pointer=null;if(old!==null&&el.hasPointerCapture?.(old))el.releasePointerCapture(old);knob.style.transform='';feedback({x:0,y:0})});
 const update=(e:PointerEvent,dragged=false)=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),limit=r.width*.3;const v=d<8?{x:0,y:0}:normalize(x,y);const strength=analog?Math.min(1,Math.max(0,(d-8)/(limit-8))):1;set({x:v.x*strength,y:v.y*strength});feedback(v,dragged);knob.style.transform=`translate(${v.x*Math.min(d,limit)}px,${v.y*Math.min(d,limit)}px)`};
 el.addEventListener('pointerdown',e=>{if(pointer!==null||!this.active())return;e.preventDefault();pointer=e.pointerId;downX=e.clientX;downY=e.clientY;el.setPointerCapture(pointer);update(e)});el.addEventListener('pointermove',e=>{if(e.pointerId===pointer)update(e,Math.hypot(e.clientX-downX,e.clientY-downY)>14)});
 const end=(e:PointerEvent)=>{if(e.pointerId===pointer){pointer=null;set({x:0,y:0});feedback({x:0,y:0});knob.style.transform=''}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
 }
}
