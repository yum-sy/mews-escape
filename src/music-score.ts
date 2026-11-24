export type MusicMode='ambient'|'combat'|'boss'|'silent';
export interface MusicScene{floor:number;phase:number;mode:MusicMode}
export type Voice={instrument:'pad'|'bass'|'pluck'|'lead'|'kick'|'hat'|'snare';frequency:number;duration:number;volume:number;pan:number;delay?:number};
export function musicProfile(s:MusicScene){
 const depth=Math.max(0,Math.min(5,6-s.floor)),final=s.floor===1&&s.mode==='boss',phase=Math.max(1,Math.min(3,s.phase));
 const bpm=final?[112,138,166][phase-1]:[92,98,104,110,116,122][depth]+(s.mode==='boss'?12:s.mode==='ambient'?-8:0);
 return{bpm,depth,final,phase,subdivision:60/bpm/4,title:final?['대면','질투','버림받은 분노'][phase-1]:['잠입 · 원본 격리','암호 · 표본 보관','침식 · 독성 처리','공명 · 실험 구역','추적 · 중앙 통제','마지막 문'][depth]};
}
const midi=(n:number)=>440*2**((n-69)/12);
// Original eight-bar infiltration theme: clipped pulse melody, chromatic replies and a stalking bass.
// No melody or recording is copied from Pokémon's soundtrack.
const phrases=[
 [12,-1,7,8,-1,7,3,-1,0,-1,3,7,6,-1,3,-1],
 [10,-1,6,7,-1,3,6,-1,8,7,-1,3,1,-1,0,-1],
 [7,8,-1,12,10,-1,7,-1,6,-1,3,1,0,-1,1,3],
 [6,-1,7,10,13,-1,10,7,6,3,-1,1,0,-1,-1,-1],
];
export function musicStep(s:MusicScene,step:number):Voice[]{
 if(s.mode==='silent')return[];const p=musicProfile(s),n=step%16,bar=Math.floor(step/16)%8,v:Voice[]=[];
 const add=(instrument:Voice['instrument'],note:number,duration:number,volume:number,pan=0)=>v.push({instrument,frequency:midi(note),duration,volume,pan});
 const root=[38,38,36,37,34,34,33,37][bar],pulse=p.subdivision,ambient=s.mode==='ambient';
 if(n===0){add('pad',root+12,pulse*15,.009,-.25);add('pad',root+19,pulse*14,.007,.25)}
 const bassPattern=[0,-1,-1,12,-1,-1,7,-1,0,-1,12,-1,-1,7,-1,1];
 if(bassPattern[n]>=0&&(!ambient||n===0||n===6||n===8||n===13))add('bass',root+bassPattern[n],pulse*1.4,.032);
 const note=phrases[Math.floor(bar/2)][n];
 if(note>=0&&(!ambient||n%2===0))add('pluck',root+24+note,pulse*(n%4===0?2.1:1.25),ambient?.012:.019,n%4<2?-.15:.15);
 if((p.depth>=2||p.final)&&n%4===2)add('lead',root+19+[0,3,1,6][Math.floor(n/4)],pulse*1.6,ambient?.005:.01,.35);
 if(p.final&&p.phase>=2&&n%2===1)add('lead',root+36+[0,7,6,3][n%4],pulse*.8,.012,-.3);
 if(p.final&&p.phase===3){add('pluck',root+36+[0,3,7,10,6,7,3,1][n%8],pulse*.7,.011,n%2?.4:-.4)}
 if(!ambient){if(n===0||n===8||p.final&&p.phase===3&&n===11)add('kick',30,.15,.055);if(n===4||n===12)add('snare',55,.12,.023);if(n%4===2||p.final&&p.phase>=2&&n%2===0)add('hat',90,.045,.009,n%4?.25:-.25)}
 return v;
}
