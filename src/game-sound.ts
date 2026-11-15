import type {Attack} from './moves';
import type {Form} from './techniques';
export interface SoundVoice{wave:OscillatorType|'noise';from:number;to:number;duration:number;gain:number;pan:number;delay:number;filter?:BiquadFilterType;attack?:number}
const sound=(wave:SoundVoice['wave'],from:number,to:number,duration:number,gain:number,pan=0,delay=0,filter?:BiquadFilterType):SoundVoice=>({wave,from,to,duration,gain,pan,delay,filter});
export function techniqueSound(form:Form,impact=false):SoundVoice[]{
 let voices:SoundVoice[];
 switch(form){
  case 'shadow':voices=[sound('triangle',135,52,.24,.055),sound('noise',420,190,.18,.035,0,0,'bandpass')];break;
  case 'swift':voices=[sound('sine',1175,1760,.18,.03),sound('sine',2349,2349,.12,.012,.25,.025)];break;
  case 'tri':voices=[440,554.37,659.25].map((f,i)=>sound('sine',f,f*.9,.14,.025,(i-1)*.35,i*.016));break;
  case 'flame':voices=[sound('noise',1500,450,.16,.09,0,0,'bandpass'),sound('triangle',230,110,.1,.025)];break;
  case 'ice':voices=[sound('sine',1450,2100,.2,.025),sound('sine',2650,2460,.14,.015,.2,.025)];break;
  case 'spark':voices=[sound('sawtooth',1200,120,.09,.018),sound('noise',2100,900,.11,.045,0,0,'highpass')];break;
  case 'psybeam':voices=[sound('sine',920,270,.22,.04),sound('triangle',460,135,.18,.015)];break;
  case 'poison':voices=[sound('triangle',830,310,.13,.025),sound('noise',3300,1600,.06,.028,0,0,'bandpass')];break;
  case 'dragon':voices=[sound('sawtooth',185,92,.23,.025),sound('sine',370,185,.26,.03)];break;
  case 'drain':voices=[sound('sine',520,1040,.2,.035),sound('sine',780,1560,.16,.012,.2,.02)];break;
  case 'sludge':voices=[sound('triangle',94,48,.2,.05),sound('noise',700,230,.21,.09,0,0,'lowpass')];break;
  case 'water':voices=[sound('noise',1900,650,.17,.07,0,0,'bandpass'),sound('sine',640,180,.12,.026)];break;
  case 'icebeam':voices=[sound('sine',2100,1200,.25,.024),sound('noise',4200,2600,.16,.022,0,0,'highpass')];break;
  case 'thunderbolt':voices=[sound('sawtooth',120,1800,.14,.02),sound('noise',2500,650,.14,.07,0,0,'bandpass')];break;
  case 'flamethrower':voices=[sound('noise',2700,800,.23,.11,0,0,'lowpass'),sound('triangle',130,72,.2,.024)];break;
  default:voices=[sound('sine',620,290,.13,.035)];
 }
 return impact?voices.map(v=>({...v,from:v.from*.68,to:v.to*.48,duration:v.duration*.65,gain:v.gain*.7,delay:v.delay*.5})):voices;
}
export function attackSound(a:Attack,impact=false){
 const voices=techniqueSound(a.visual.form,impact);
 if(!impact){if(a.burn&&!['flame','flamethrower'].includes(a.visual.form))voices.push(sound('noise',1700,600,.1,.018,-.25,0,'bandpass'));if(a.slow&&!['ice','icebeam'].includes(a.visual.form))voices.push(sound('sine',2400,1800,.12,.008,.25));if(a.chain&&!['spark','thunderbolt'].includes(a.visual.form))voices.push(sound('noise',2700,1100,.06,.016,0,0,'highpass'))}
 return voices.slice(0,5);
}
