export const HOLD_MS=500,MOVE_TOLERANCE=12;
export function installHoldHelp(){
 const tip=document.createElement('div');tip.id='hold-help';tip.setAttribute('role','tooltip');tip.hidden=true;document.getElementById('app')!.append(tip);
 let timer:ReturnType<typeof setTimeout>|undefined,hideTimer:ReturnType<typeof setTimeout>|undefined,target:HTMLElement|null=null,held:HTMLElement|null=null,pointer=-1,x=0,y=0;
 const cancel=()=>{clearTimeout(timer);timer=undefined};
 const hide=()=>{tip.hidden=true;target?.removeAttribute('aria-describedby')};
 const show=(el:HTMLElement)=>{clearTimeout(hideTimer);tip.textContent=el.dataset.hint??'';tip.hidden=false;el.setAttribute('aria-describedby',tip.id);const r=el.getBoundingClientRect();tip.style.left=`${Math.max(12,Math.min(innerWidth-tip.offsetWidth-12,r.left+r.width/2-tip.offsetWidth/2))}px`;tip.style.top=`${Math.max(12,r.top-tip.offsetHeight-12)}px`};
 document.addEventListener('pointerdown',e=>{if(pointer!==-1)return;const el=(e.target as Element).closest<HTMLElement>('[data-hint]');hide();if(!el)return;held=null;target=el;pointer=e.pointerId;x=e.clientX;y=e.clientY;timer=setTimeout(()=>{if(target?.isConnected){held=target;show(target)}},HOLD_MS)},true);
 document.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&Math.hypot(e.clientX-x,e.clientY-y)>MOVE_TOLERANCE){cancel();hide()}},true);
 const end=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;cancel();pointer=-1;if(e.type==='pointercancel'){held=null;hide()}else if(held)hideTimer=setTimeout(hide,2200)};
 document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
 document.addEventListener('click',e=>{if(held&&e.target instanceof Node&&held.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();held=null}},true);
 document.addEventListener('contextmenu',e=>{if((e.target as Element).closest('[data-hint]'))e.preventDefault()});
 document.addEventListener('focusin',e=>{const el=(e.target as Element).closest<HTMLElement>('.tech-badge[data-hint],.tech-overflow[data-hint]');if(el&&pointer===-1){target=el;show(el)}});
 document.addEventListener('focusout',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});window.addEventListener('blur',()=>{cancel();hide();pointer=-1;held=null});window.addEventListener('resize',()=>{cancel();hide();pointer=-1;held=null});
}
