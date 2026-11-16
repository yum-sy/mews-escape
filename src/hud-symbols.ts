export function healthState(hp:number,max:number){const value=Math.max(0,Math.min(max,hp)),ratio=max>0?value/max:0;return{value,ratio,tone:ratio<=.3?'danger':ratio<=.6?'warning':'healthy'}}
const paths:Record<string,string>={
 empty:'M5 5h14v14H5z',
 monster:'M4 9 3 3l6 4h6l6-4-1 6v7l-5 5H9l-5-5zM7 11l3 2m7-2-3 2M9 17h6',
 map:'M2 5 8 2l8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17',
 crate:'M4 4h16v16H4zM4 4l16 16M20 4 4 20',
 boss:'m3 7 4 4 5-7 5 7 4-4-2 13H5z',
 key:'M9 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m4 4h9m-3 0v4m3-4v3',
 lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
 open:'M7 10V7a5 5 0 0 1 10 0M5 10h14v11H5z',
 combat:'m4 3 16 17m0-17L4 20M3 15l6 6m6 0 6-6',
 reward:'M4 8h16v13H4zM2 5h20v4H2zM12 5v16M12 5C2 5 5-2 12 5m0 0c10 0 7-7 0 0',
 up:'M12 21V3m-8 8 8-8 8 8',
 shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z',
 read:'M4 3h16v18H4zM8 7h8m-8 5h8m-8 5h5',
 power:'M12 2v10M6 5a9 9 0 1 0 12 0',
 sound:'M3 9h4l6-5v16l-6-5H3zM17 8q6 4 0 8',
 mute:'M3 9h4l6-5v16l-6-5H3zM17 9l5 6m0-6-5 6',
};
export function symbol(name:string){return `<svg class="hud-symbol" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]??paths.reward}"/></svg>`}
export function paintHealth(el:HTMLElement,hp:number,max:number){const h=healthState(hp,max);el.dataset.tone=h.tone;el.setAttribute('role','meter');el.setAttribute('aria-label','체력');el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax',String(max));el.setAttribute('aria-valuenow',String(h.value));el.setAttribute('aria-valuetext',`${h.value} / ${max}`);el.title=`체력 ${h.value} / ${max}`;el.innerHTML=Array.from({length:max},(_,i)=>`<i class="hp-segment${i<h.value?' filled':''}" aria-hidden="true"></i>`).join('')}
