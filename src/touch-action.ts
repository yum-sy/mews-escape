import {HOLD_MS,MOVE_TOLERANCE} from './hold-help';
/** Secondary fingers must not rely on the browser generating a compatibility click. */
export function bindTouchAction(button:HTMLButtonElement,action:()=>void){
 let pointer:number|null=null,x=0,y=0,started=0,suppressUntil=0;
 button.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||button.disabled||pointer!==null)return;pointer=e.pointerId;x=e.clientX;y=e.clientY;started=performance.now();button.setPointerCapture(e.pointerId)});
 button.addEventListener('pointerup',e=>{if(e.pointerId!==pointer)return;pointer=null;suppressUntil=performance.now()+700;e.preventDefault();if(!button.disabled&&performance.now()-started<HOLD_MS&&Math.hypot(e.clientX-x,e.clientY-y)<=MOVE_TOLERANCE)action()});
 const cancel=(e:PointerEvent)=>{if(e.pointerId===pointer){pointer=null;suppressUntil=performance.now()+700}};
 button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('click',e=>{if(button.disabled)return;if((e as PointerEvent).pointerType==='touch'||e.detail!==0&&performance.now()<suppressUntil){e.preventDefault();return}action()});
}
