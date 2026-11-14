import {playCinematic} from './cinematic';
export interface StoryShot{id:string;tag:string;title:string;text:string}
export function showStory(shots:StoryShot[],done:()=>void,lastLabel='전투 시작'){
 const host=document.getElementById('shell')!;let index=0,stop=()=>{},closed=false;
 const show=()=>{stop();const s=shots[index];host.hidden=false;document.body.dataset.screen='story';host.innerHTML=`<section class="intro-screen story-sequence"><div class="intro-top"><span>${s.tag}</span><span>MEW’S ESCAPE / FINAL CHAPTER</span></div><div class="story-stage" aria-hidden="true"></div><div class="intro-caption" aria-live="polite"><span>${index+1} / ${shots.length}</span><h2>${s.title}</h2><p>${s.text}</p><button id="story-next">${index===shots.length-1?lastLabel:'다음 →'}</button></div></section>`;stop=playCinematic(host.querySelector('.story-stage')!,s.id,true);const next=document.getElementById('story-next')!;next.onclick=()=>{if(closed)return;if(++index<shots.length)show();else{closed=true;stop();host.hidden=true;host.replaceChildren();document.body.dataset.screen='game';done()}};next.focus()};show();
 return()=>{closed=true;stop();host.hidden=true;host.replaceChildren()};
}
