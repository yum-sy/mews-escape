export function healthState(hp:number,max:number){const value=Math.max(0,Math.min(max,hp)),ratio=max>0?value/max:0;return{value,ratio,tone:ratio<=.3?'danger':ratio<=.6?'warning':'healthy'}}
const paths:Record<string,string>={
 empty:'M5 5h14v14H5z',
 monster:'M4 9 3 3l6 4h6l6-4-1 6v7l-5 5H9l-5-5zM7 11l3 2m7-2-3 2M9 17h6',
 map:'M2 5 8 2l8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17',
 crate:'M4 4h16v16H4zM4 4l16 16M20 4 4 20',
 boss:'M7 17C1 15 2 3 12 3s11 12 5 14v4H7zM8 21v-4m4 4v-4m4 4v-4M7 10h3v3H7zM14 10h3v3h-3zM11 16l1-2 1 2',
 key:'M9 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m4 4h9m-3 0v4m3-4v3',
 lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
 open:'M7 10V7a5 5 0 0 1 10 0M5 10h14v11H5z',
 reward:'M4 8h16v13H4zM2 5h20v4H2zM12 5v16M12 5C2 5 5-2 12 5m0 0c10 0 7-7 0 0',
 up:'M12 21V3m-8 8 8-8 8 8',
 decoy:'M8.00 2.00L9.33 2.00L9.33 2.67L10.00 2.67L10.00 3.33L10.67 3.33L10.67 4.00L12.00 4.00L12.00 3.33L12.67 3.33L12.67 2.67L13.33 2.67L13.33 2.00L14.67 2.00L14.67 2.67L15.33 2.67L15.33 4.00L16.00 4.00L16.00 5.33L16.67 5.33L16.67 6.00L17.33 6.00L17.33 7.33L18.00 7.33L18.00 9.33L18.67 9.33L18.67 12.00L19.33 12.00L19.33 14.00L20.00 14.00L20.00 15.33L20.67 15.33L20.67 16.67L21.33 16.67L21.33 17.33L22.00 17.33L22.00 18.67L21.33 18.67L21.33 19.33L20.00 19.33L20.00 20.00L18.00 20.00L18.00 20.67L17.33 20.67L17.33 21.33L15.33 21.33L15.33 22.00L10.67 22.00L10.67 21.33L9.33 21.33L9.33 20.67L6.67 20.67L6.67 21.33L3.33 21.33L3.33 20.67L2.67 20.67L2.67 20.00L2.00 20.00L2.00 18.67L2.67 18.67L2.67 17.33L3.33 17.33L3.33 16.67L4.00 16.67L4.00 16.00L4.67 16.00L4.67 15.33L5.33 15.33L5.33 14.67L4.67 14.67L4.67 13.33L4.00 13.33L4.00 12.00L4.67 12.00L4.67 10.67L4.00 10.67L4.00 10.00L3.33 10.00L3.33 7.33L4.00 7.33L4.00 6.00L4.67 6.00L4.67 5.33L6.00 5.33L6.00 4.67L6.67 4.67L6.67 4.00L7.33 4.00L7.33 2.67L8.00 2.67Z',
 shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z',
 read:'M4 3h16v18H4zM8 7h8m-8 5h8m-8 5h5',
 power:'M12 2v10M6 5a9 9 0 1 0 12 0',
 sound:'M3 9h4l6-5v16l-6-5H3zM17 8q6 4 0 8',
 mute:'M3 9h4l6-5v16l-6-5H3zM17 9l5 6m0-6-5 6',
};
const solidMarkers:Record<string,string>={
 boss:'M12 1C5 1 2 5 2 11c0 4 2 6 5 7v5h3v-4h1v4h2v-4h1v4h3v-5c3-1 5-3 5-7C22 5 19 1 12 1ZM5 9v5h5V9H5Zm9 0v5h5V9h-5Zm-2 6-2 3h4l-2-3Z',
};
export function symbol(name:string){if(name==='combat')return `<svg class="hud-symbol solid-marker" viewBox="0 0 24 24" aria-hidden="true">${[-45,45].map(angle=>`<g transform="rotate(${angle} 12 12)" stroke="#172730" stroke-width=".8" stroke-linejoin="round"><path fill="#f4f5e9" d="M12 1 15 5v10H9V5Z"/><path fill="#c6af78" d="M6 14h12v3h-4v5h-4v-5H6Z"/><path d="M12 5v8" fill="none" stroke="#78959e" stroke-width="1"/></g>`).join('')}</svg>`;if(solidMarkers[name])return `<svg class="hud-symbol solid-marker" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><path fill-rule="evenodd" d="${solidMarkers[name]}"/></svg>`;return `<svg class="hud-symbol" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]??paths.reward}"/></svg>`}
export function paintHealth(el:HTMLElement,hp:number,max:number){const h=healthState(hp,max);el.dataset.tone=h.tone;el.setAttribute('role','meter');el.setAttribute('aria-label','체력');el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax',String(max));el.setAttribute('aria-valuenow',String(h.value));el.setAttribute('aria-valuetext',`${h.value} / ${max}`);el.title=`체력 ${h.value} / ${max}`;el.innerHTML=Array.from({length:max},(_,i)=>`<i class="hp-segment${i<h.value?' filled':''}" aria-hidden="true"></i>`).join('')}
