import {MOVES} from './moves';
export const TECHNIQUE_ART=['psychic','shadow','swift','tri','flame','ice','spark','psybeam','poison','dragon','drain','sludge','water','icebeam','thunderbolt','flamethrower','split','agility','focus','ricochet','survey'] as const;
export function moveHint(id:string){const m=MOVES.find(m=>m.id===id);return m?`${m.name} · ${m.form}. ${m.description}`:'염동력 · 조준한 방향으로 발사'}
export function techniqueIcon(id:string){const index=Math.max(0,TECHNIQUE_ART.indexOf(id as typeof TECHNIQUE_ART[number]));return `<span class="tech-icon painted-tech" data-technique="${TECHNIQUE_ART[index]}" aria-hidden="true" style="background-position:${index%5*25}% ${Math.floor(index/5)*25}%"></span>`}
export function techniqueBadge(id:string){return `<span class="tech-badge" tabindex="0" data-hint="${moveHint(id)}" aria-label="${moveHint(id)}">${techniqueIcon(id)}</span>`}
const markup=new WeakMap<HTMLElement,string>();
export function stableMarkup(el:HTMLElement,html:string){if(markup.get(el)!==html){el.innerHTML=html;markup.set(el,html)}}
