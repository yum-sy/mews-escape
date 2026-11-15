import {MOVES} from './moves';
const shapes:Record<string,string>={
 psychic:'M20 12a8 8 0 1 1-8-8m0 4a4 4 0 1 0 4 4M12 2v4m8 0 2-2',
 shadow:'M19 5a9 9 0 1 0 0 14A8 8 0 0 1 19 5z',
 swift:'m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z',
 tri:'M12 3v6m-8 10 6-5m10 5-6-5M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4M4 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4m16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
 flame:'M12 2c2 7-6 7-6 13a6 6 0 0 0 12 0c0-3-2-5-3-6 0 4-4 4-3-7z',
 ice:'M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4',
 spark:'m14 2-10 12h7l-1 8 10-13h-7z',
 psybeam:'M2 9q5-7 10 0t10 0M2 15q5-7 10 0t10 0',
 poison:'m4 20 14-14 3 3-14 14M17 7l-3-3 7-2-2 7',
 dragon:'M4 5q12 7 0 14m7-16q14 9 0 18m6-17 5 8-5 8',
 drain:'M4 20C1 4 12 3 21 3c0 12-5 18-17 17zm0 0L17 7m-9 9v-5m4 1h5',
 sludge:'M5 9a4 4 0 1 1 7-4 5 5 0 1 1 7 9 4 4 0 1 1-7 6 5 5 0 1 1-7-11z',
 water:'M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13zM8 15q0 4 4 4',
 icebeam:'M2 10h14m-14 4h14m1-11v18m-5-14 10 10m-10 0L22 7',
 thunderbolt:'m9 2-6 12h6l-1 8m10-20-6 12h6l-1 8',
 flamethrower:'M2 10h5m-5 4h5m2-2 13-8-3 8 3 8z',
 split:'M3 12h7m0 0 10-8m-10 8 10 8m-5-16h5v5m-5 6h5v5',
 agility:'m3 4 8 8-8 8m9-16 8 8-8 8',
 focus:'M12 2v5m0 10v5M2 12h5m10 0h5M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',
 ricochet:'M21 2v20M2 4l16 8-16 8m0-5v5h5',
 survey:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
};
export function moveHint(id:string){const m=MOVES.find(m=>m.id===id);return m?`${m.name} · ${m.form}. ${m.description}`:'염동력 · 조준한 방향으로 발사'}
export function techniqueIcon(id:string){const color=MOVES.find(m=>m.id===id)?.color??0xf3b9ef;return `<svg class="tech-icon" viewBox="0 0 24 24" aria-hidden="true" style="color:#${color.toString(16)}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${shapes[id]??shapes.psychic}"/></svg>`}
export function techniqueBadge(id:string){return `<span class="tech-badge" tabindex="0" data-hint="${moveHint(id)}" aria-label="${moveHint(id)}">${techniqueIcon(id)}</span>`}
const markup=new WeakMap<HTMLElement,string>();
export function stableMarkup(el:HTMLElement,html:string){if(markup.get(el)!==html){el.innerHTML=html;markup.set(el,html)}}
