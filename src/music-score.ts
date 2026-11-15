export type MusicMode='ambient'|'combat'|'boss'|'silent';
export interface MusicScene{floor:number;phase:number;mode:MusicMode}
export type Voice={instrument:'pad'|'bass'|'pluck'|'lead'|'kick'|'hat'|'snare';frequency:number;duration:number;volume:number;pan:number;delay?:number};
export function musicProfile(s:MusicScene){
 const depth=Math.max(0,Math.min(5,6-s.floor)),final=s.floor===1&&s.mode==='boss',phase=Math.max(1,Math.min(3,s.phase));
 const bpm=final?[112,138,166][phase-1]:[64,74,84,96,108,116][depth]+(s.mode==='boss'?12:s.mode==='ambient'?-10:0);
 return{bpm,depth,final,phase,subdivision:60/bpm/4,title:final?['대면','질투','버림받은 분노'][phase-1]:['원본 격리','표본 보관','독성 처리','공명 실험','중앙 통제','마지막 문'][depth]};
}
const midi=(n:number)=>440*2**((n-69)/12);
export function musicStep(s:MusicScene,step:number):Voice[]{
 if(s.mode==='silent')return[];const p=musicProfile(s),n=step%32,bar=Math.floor(step/32)%4,v:Voice[]=[];
 const add=(instrument:Voice['instrument'],note:number,duration:number,volume:number,pan=0)=>v.push({instrument,frequency:midi(note),duration,volume,pan});
 const roots=p.final?[38,34,37,33]:[38,41,34,36],root=roots[bar],pulse=p.subdivision;
 if(n===0){add('pad',root+12,pulse*31,.014,-.3);add('pad',root+19,pulse*30,.011,.3);if(p.depth>=3||p.final)add('pad',root+(p.final&&p.phase===3?25:27),pulse*29,.006)}
 if(n%8===0||p.final&&p.phase>=2&&n%8===6)add('bass',root,pulse*(p.final?2.4:3.4),.035);
 const melody=p.final?[0,7,3,10,0,6,3,1]:[0,7,10,3,2,7,3,10],spacing=p.final?(p.phase===1?4:p.phase===2?2:1):p.depth>=4?2:4;
 if(n%spacing===0&&s.mode!=='ambient'){const index=Math.floor(n/spacing)%8;add(p.final&&p.phase===3?'lead':'pluck',root+24+melody[index],pulse*(p.final?1.2:2.2),p.final?.02:.014,index%2?.3:-.3)}
 if(s.mode==='ambient'&&n%8===4)add('pluck',root+24+melody[n/4%8],pulse*5,.009,.3);
 const drums=s.mode!=='ambient'&&(p.depth>0||p.final||s.mode==='boss');
 if(drums){if(n%8===0||p.final&&p.phase===3&&n%8===3)add('kick',30,.17,.07);if(n%8===4)add('snare',55,.13,.025);if(p.final&&p.phase>=2?n%2===0:n%4===2)add('hat',90,.055,.012,n%4?.25:-.25)}
 return v;
}
