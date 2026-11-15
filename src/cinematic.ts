import {files,prepareCinematic} from './cinematic-assets';
import {openingAudio} from './cinematic-audio';
import {rubblePose,LAB_EXIT} from './cinematic-stage';
import {createIllustrationRig} from './cinematic-rig';
import {captureMew,escapeMew,chamberOpening,operatorPose,deformOperator,deformMew,CAPTURE_FIRE,CAPTURE_CONTACT,type MewPose} from './cinematic-motion';
// Illustrated plates and props; Pokémon remain the unmodified recorded PokéAPI artwork.

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const p=clamp(v);return p*p*(3-2*p)};
export function playCinematic(host:HTMLElement,shot:string,hold=false,previewTime?:()=>number){
 const canvas=document.createElement('canvas');canvas.className='cinematic';host.replaceChildren(canvas);const c=canvas.getContext('2d')!;
 let art:Record<keyof typeof files,HTMLImageElement>;let ready=false;const mobile=matchMedia('(pointer:coarse)').matches||innerHeight<600;
 const rig=createIllustrationRig(mobile);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let stageHeight=1,frame=0,start=performance.now(),hiddenAt=0,disposed=false,repaint=()=>{};
 const size=()=>{const box=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,mobile?1:1.5);canvas.width=Math.max(1,box.width*dpr);canvas.height=Math.max(1,box.height*dpr);stageHeight=Math.min(canvas.height,canvas.width/2);repaint()};
 const soundtrack=document.body.dataset.screen==='intro'?openingAudio.track(shot):null;
 const audioTimer=soundtrack?window.setInterval(()=>{if(ready&&!document.hidden)soundtrack.update(Math.min(8,(performance.now()-start)/1000))},40):undefined;
 const observer=new ResizeObserver(size);observer.observe(host);size();
 const vis=()=>{if(document.hidden){hiddenAt=performance.now();soundtrack?.pause(Math.min(8,(hiddenAt-start)/1000))}else if(hiddenAt){start+=performance.now()-hiddenAt;hiddenAt=0;soundtrack?.resume(Math.min(8,(performance.now()-start)/1000))}};document.addEventListener('visibilitychange',vis);
 const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
 const path=(points:number[],color:string,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke()};
 const glow=(x:number,y:number,r:number,color:string)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)};
 const contactShadow=(x:number,y:number,rx:number,ry:number,opacity=.3)=>{c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,.08,0,0,1);g.addColorStop(0,`rgba(3,8,12,${opacity})`);g.addColorStop(.45,`rgba(3,8,12,${opacity*.6})`);g.addColorStop(1,'#03080c00');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()};
 const masks=new Map<string,HTMLCanvasElement>();
 const castShadow=(key:keyof typeof files,x:number,y:number,width:number,height:number,opacity=.13,lean=-.28)=>{const img=art[key];if(!img.naturalWidth)return;let mask=masks.get(key);if(!mask){mask=document.createElement('canvas');mask.width=256;mask.height=Math.round(256*img.naturalHeight/img.naturalWidth);const ctx=mask.getContext('2d')!;ctx.drawImage(img,0,0,mask.width,mask.height);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#03090f';ctx.fillRect(0,0,mask.width,mask.height);masks.set(key,mask)}c.save();c.globalAlpha=opacity;c.translate(x,y);c.transform(1,0,lean,-.19,0,0);c.filter='blur(3px)';c.drawImage(mask,-width/2,-height,width,height);c.restore()};
 const plate=(key:'forest'|'lab'|'intact',alpha=1)=>{const img=art[key];if(!img.naturalWidth)return;c.save();c.globalAlpha=alpha;c.drawImage(img,-30,-15,1060,530);c.restore()};
 // Uniform physical proportions even when the story panel changes shape on a phone.
 const sprite=(key:keyof typeof files,x:number,y:number,width:number,rotation=0,flip=1,alpha=1)=>{const img=art[key];if(!img.naturalWidth)return;c.save();c.translate(x,y);c.rotate(rotation);c.scale(flip,1);c.globalAlpha=alpha;const rawH=width*img.naturalHeight/img.naturalWidth*(canvas.width/1000)/(stageHeight/500),fit=Math.min(1,365/rawH),h=rawH*fit;const drawWidth=width*fit;c.drawImage(img,-drawWidth/2,-h/2,drawWidth,h);c.restore()};
 const pokemon=(key:'mew'|'mewtwo',x:number,y:number,width:number,t:number,quiet=false,alpha=1)=>{if(key==='mew'){c.save();c.globalAlpha=alpha;movingMew({x,y,width,bank:Math.sin(t*1.5)*(quiet?.012:.035),tuck:quiet?.1:0,effort:quiet?.05:.18,look:Math.sin(t*.8)*.02,tail:t*1.5},t);c.restore();return}c.save();c.shadowColor='#b998e3';c.shadowBlur=quiet?2:12;sprite(key,x,y,width,Math.sin(t*1.5)*(quiet?.012:.035),1,alpha);c.restore()};
 const dimensions=(key:keyof typeof files,width:number)=>{const img=art[key],raw=width*img.naturalHeight/Math.max(1,img.naturalWidth)*(canvas.width/1000)/(stageHeight/500),fit=Math.min(1,365/Math.max(1,raw));return{width:width*fit,height:raw*fit}};
 const movingMew=(pose:MewPose,t:number,key='mew-rig')=>{const d=dimensions('mew',pose.width);rig.draw(c,key,art.mew,pose.x,pose.y,d.width,d.height,t,p=>deformMew(p,t,pose),pose.bank)};
 const operator=(t:number,side:number)=>{const delay=side<0?0:.28,pose=operatorPose(t,delay),d=dimensions('operative',side<0?205:193),x=side<0?82+pose.distance:918-pose.distance,y=421-d.height*.47;
  castShadow('operative',x,423,d.width,d.height,.14,.3);contactShadow(x,424,d.width*.33,8,.17);
  for(const u of [.11,.65]){const foot=deformOperator({x:u,y:.96},t,delay,d.width,d.height);contactShadow(x+(foot.x-.5)*d.width*-side,y+d.height*.46,13,3,.34)}
  rig.draw(c,'operator-'+side,art.operative,x,y,d.width,d.height,t,p=>deformOperator(p,t,delay,d.width,d.height),0,-side);
  const muzzle=deformOperator({x:.865,y:.185},t,delay,d.width,d.height);return{x:x+(muzzle.x-.5)*d.width*-side,y:y+(muzzle.y-.5)*d.height};
 };
 const dust=(t:number,amount=35,dense=false)=>{for(let i=0;i<amount;i++){const x=(i*137+t*(dense?17:3))%1100-50,y=(i*83+t*(dense?23:5))%540-20;ellipse(x,y,dense?18+i%17:1+i%2,dense?9+i%11:1,'#c3b9a3'+(dense?'08':'38'))}};
 const sparks=(t:number,x:number,y:number)=>{for(let i=0;i<24;i++){const age=(t*1.1+i*.137)%1,dx=Math.sin(i*13)*age*100,dy=-age*70+age*age*190;path([x+dx,y+dy,x+dx-Math.sin(i*13)*8,y+dy-5],`rgba(255,214,145,${(1-age)*.8})`,1.3)}};
 const rubble=(t:number,front=false)=>{for(let i=0;i<30;i++){const p=rubblePose(i,t);if(!p.visible||(p.floor>=365)!==front)continue;const size=3+i%8;contactShadow(p.x+8,p.floor+4,size*1.8,3,.13+Math.max(0,1-(p.floor-p.y)/100)*.15);c.save();c.translate(p.x,p.y);c.scale(1,p.landed?.5:1);c.rotate(p.angle);c.fillStyle=['#3e4851','#59636b','#787e76'][i%3];c.strokeStyle='#171f29';c.lineWidth=.8;c.beginPath();c.moveTo(-size,-size*.4);c.lineTo(-size*.3,-size*.8);c.lineTo(size*.4,-size);c.lineTo(size*.66,-size*.2);c.lineTo(size,size*.3);c.lineTo(size*.2,size*.8);c.lineTo(-size*.6,size*.4);c.closePath();c.fill();c.stroke();path([-size*.8,-size*.3,-size*.15,0,size*.35,-size*.8],'#b5b7ac66',.7);path([-size*.15,0,size*.75,size*.25],'#1b2531aa',.7);c.restore();if(p.impact>0&&p.impact<.8){const age=p.impact/.8;c.save();c.globalAlpha=(1-age)*.2;glow(p.x,p.floor-3,8+age*28,'#b9b19b55');c.restore()}}};
 const aura=(t:number,power:number)=>{glow(500,245,240,'#a77ee550');c.save();c.globalCompositeOperation='screen';for(let j=0;j<8;j++){c.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=115+Math.sin(a*5-t*3+j)*13+Math.sin(a*11+t*2)*6+j*7,x=500+Math.cos(a)*r,y=245+Math.sin(a)*r*1.25;if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}c.strokeStyle=`rgba(199,159,241,${power*(.14-j*.014)})`;c.lineWidth=j%3===0?3:1;c.stroke()}for(let i=0;i<10;i++){const a=i*2.4+t*.18,r=125+(i*23+t*24)%130;path([500+Math.cos(a)*r,245+Math.sin(a)*r*.7,500+Math.cos(a+.07)*(r+14),245+Math.sin(a+.07)*(r+14)*.7,500+Math.cos(a-.02)*(r+30),245+Math.sin(a-.02)*(r+30)*.7],`rgba(212,185,248,${power*.4})`,1)}c.restore()};
 const net=(x:number,y:number,rx:number,ry:number,alpha:number)=>{c.save();c.globalAlpha=alpha;c.translate(x,y);c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.clip();for(let i=-12;i<=12;i++){for(const dir of [-1,1]){c.beginPath();c.moveTo(i*22-rx*dir,-ry);c.quadraticCurveTo(i*22+Math.sin(i)*4,ry*.15,i*22+rx*dir,ry);c.strokeStyle='#252c28';c.lineWidth=3.4;c.stroke();c.strokeStyle='#c4bba0';c.lineWidth=1.5;c.stroke()}}c.restore();c.save();c.translate(x,y);c.globalAlpha=alpha;c.strokeStyle='#30382e';c.lineWidth=2.8;c.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=1+.035*Math.sin(a*8);const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;if(i===0)c.moveTo(px,py);else c.lineTo(px,py)}c.stroke();c.strokeStyle='#c9bda1';c.lineWidth=1.2;c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(Math.cos(a)*rx,Math.sin(a)*ry,4,5,'#47504b')}c.restore()};
 const pod=(t:number,broken=false)=>{const pd=dimensions('chamber',245);castShadow('chamber',500,428,pd.width,pd.height,.15*(broken?1-chamberOpening(t):1));contactShadow(500,428,pd.width*.40,15,.48);glow(500,245,140,broken?'#8ac6d311':'#87c7de20');
  const release=broken?chamberOpening(t):0;
  const chamberFit=Math.min(1,365/(245*(art.chamber.naturalHeight/Math.max(1,art.chamber.naturalWidth))*(canvas.width/1000)/(stageHeight/500)));
  const escape=broken?ease((t-3.15)/1.55):0;
  const pose:MewPose=broken?escapeMew(t):{x:500+Math.sin(t*1.3)*2,y:242+Math.sin(t*1.7)*4,width:146,bank:Math.sin(t)*.025,tuck:.13,effort:.12,look:Math.sin(t*.8)*.025,tail:t*1.5};
  pose.width*=chamberFit+(1-chamberFit)*escape;
  // The creature crosses the opening toward the camera before turning toward the exit.
  const foreground=broken&&t>=3.3;
  const depth=broken?ease((t-4.7)/2.4):0;contactShadow(pose.x+14*(1-depth),411-depth*114,pose.width*.34,10-depth*6,.18);
  if(!foreground)movingMew(pose,t);
  // Keep the heavy base intact; the cap loosens and the glass/rails peel outward.
  const podH=Math.min(365,245*(art.chamber.naturalHeight/Math.max(1,art.chamber.naturalWidth))*(canvas.width/1000)/(stageHeight/500));
  const top=-podH*.26,bottom=podH*.30;
  const capFall=broken?ease((t-1.25)/2):0;
  for(const part of ['top','bottom'] as const){c.save();c.translate(500+(part==='top'?-capFall*112:0),248+(part==='top'?capFall*capFall*200:0));c.rotate(part==='top'?-capFall*.8:0);c.beginPath();c.rect(-250,part==='top'?-podH:bottom,500,part==='top'?podH+top:podH);c.clip();sprite('chamber',0,0,245);c.restore()}
  if(broken)contactShadow(290,431,65,11,capFall*.28);
  // Rails pivot from the base, fall outward and settle; their feet do not slide through the floor.
  const settled=release*1.55,railX=pd.width*.34;
  for(const side of [-1,1]){if(broken)contactShadow(500+side*(railX+90*release),428,85,9,release*.23);c.save();c.translate(500+side*railX,248+bottom+release*(428-248-bottom));c.rotate(side*settled);c.beginPath();c.rect((side<0?-500:0)-side*railX,top-bottom,500,bottom-top);c.clip();sprite('chamber',-side*railX,-bottom,245);c.restore()}
  if(!broken){const scan=174+(t*53)%174;const g=c.createLinearGradient(0,scan-16,0,scan+5);g.addColorStop(0,'#9be3ec00');g.addColorStop(1,'#c3f4fa55');c.fillStyle=g;c.fillRect(500-71*chamberFit,scan-16,142*chamberFit,20);path([500-67*chamberFit,scan,500+67*chamberFit,scan],'#dafaff88',1);for(let i=0;i<9;i++)ellipse(500+(-62+i*16)*chamberFit,340-(t*14+i*29)%175,1,2,'#b3d8e755')}
  else{const crack=clamp(t/.9);c.save();c.globalAlpha=(1-release)*crack;c.translate(500,0);c.scale(chamberFit,1);c.translate(-500,0);c.beginPath();c.rect(435,157,130,196);c.clip();path([495,115,482,167,510,211,487,257,523,306,507,369],'#d9eef2',1.4);path([510,211,546,194,566,169],'#e0f1f2',1);path([487,257,449,283,432,328],'#d9eef2',1);c.restore();if(t>1.1)for(let i=0;i<23;i++){const age=Math.max(0,t-1.1),sy=150+(i*37)%180,hit=Math.sqrt((425-sy)/170),fall=Math.min(age,hit),x=450+i%6*18+Math.sin(i*7)*fall*65,y=sy+170*fall*fall;c.save();c.translate(x,y);c.scale(1,age>=hit?.25:1);c.rotate(i+fall*3);c.globalAlpha=.5*(1-ease((t-4.8)/2));c.fillStyle='#badce755';c.strokeStyle='#d1e6e7';c.lineWidth=.6;c.beginPath();c.moveTo(-4,-11);c.lineTo(7,-4);c.lineTo(0,15);c.closePath();c.fill();c.stroke();c.restore()}}
  if(foreground){c.save();if(t>6.4){c.beginPath();c.rect(0,0,LAB_EXIT.right,500);c.clip();c.globalAlpha=1-ease((t-6.9)/.7)}movingMew(pose,t);c.restore()}
 };
 let lastFrame=0;const draw=(now:number)=>{if(disposed||!ready)return;if(mobile&&now-lastFrame<32){frame=requestAnimationFrame(draw);return}lastFrame=now;const t=import.meta.env.DEV&&previewTime?previewTime():reduced?4:Math.min(hold?7.2:8,(now-start)/1000);c.setTransform(1,0,0,1,0,0);c.fillStyle='#0a1017';c.fillRect(0,0,canvas.width,canvas.height);c.setTransform(canvas.width/1000,0,0,stageHeight/500,0,(canvas.height-stageHeight)/2);c.fillStyle='#111a22';c.fillRect(0,0,1000,500);c.save();c.beginPath();c.rect(0,0,1000,500);c.clip();c.save();
  const shake=shot==='collapse'&&!reduced?(1-ease((t-4)/4))*4:0,zoom=1+t*(shot==='awakening'?.012:.004);c.translate(500+Math.sin(t*49)*shake,250+Math.cos(t*41)*shake);c.scale(zoom,zoom);c.translate(-500,-250);
  if(['forest','capture','sunrise'].includes(shot)){
   plate('forest');dust(t);if(shot==='forest'){glow(690,85,320,'#fff0bd22');contactShadow(454+Math.sin(t*.8)*80,425,60,12,.18);pokemon('mew',470+Math.sin(t*.8)*80,238+Math.sin(t*1.8)*17,210,t)}
   else if(shot==='sunrise'){glow(790,90,440,'#ffe6ac55');contactShadow(390,402,60,10,.3);contactShadow(610,398,36,7,.18);pokemon('mewtwo',405,300,170,t,true);pokemon('mew',620+Math.sin(t)*12,240,145,t)}
   else{const approach=ease(t/2.3),caught=ease((t-CAPTURE_CONTACT)/.3);c.fillStyle=`rgba(10,19,23,${.1+approach*.12})`;c.fillRect(0,0,1000,500);
    const muzzle=operator(t,-1);operator(t,1);const pose=captureMew(t);contactShadow(pose.x-16,425,pose.width*.34,12,.2);movingMew(pose,t);
    if(t>CAPTURE_FIRE){const flight=clamp((t-CAPTURE_FIRE)/(CAPTURE_CONTACT-CAPTURE_FIRE)),arc=Math.sin(flight*Math.PI)*22,x=muzzle.x+(pose.x-muzzle.x)*flight,y=muzzle.y+(pose.y-muzzle.y)*flight-arc;
     // A fast thrown bundle opens in flight, then sags and tightens with the captive's weight.
     const captive=dimensions('mew',pose.width),spread=ease((flight-.15)/.65),settle=ease((t-CAPTURE_CONTACT)/1.3),wobble=Math.sin((t-CAPTURE_CONTACT)*15)*Math.exp(-Math.max(0,t-CAPTURE_CONTACT)*2)*caught;
     path([muzzle.x,muzzle.y,x-30*spread,y+10*spread],'#d0c7ae66',1);
     c.save();c.translate(x,y);c.rotate((1-flight)*-.5+wobble*.035);net(0,0,8+spread*captive.width*.64-settle*captive.width*.08,9+spread*captive.height*.66-settle*captive.height*.08,clamp((t-CAPTURE_FIRE)*15));c.restore();
     const recoil=operatorPose(t).recoil;if(recoil>0)glow(muzzle.x,muzzle.y,18,'#d7d5bc'+Math.floor(recoil*70).toString(16).padStart(2,'0'));
    }
    c.save();c.beginPath();c.moveTo(-30,300);c.lineTo(95,350);c.lineTo(125,500);c.lineTo(-30,500);c.closePath();c.moveTo(1030,290);c.lineTo(917,350);c.lineTo(888,500);c.lineTo(1030,500);c.closePath();c.clip();plate('forest');c.restore();
    if(t>6.5){c.fillStyle=`rgba(5,10,15,${ease((t-6.5)/1.5)*.9})`;c.fillRect(0,0,1000,500)}
   }
  }else{
   if(shot==='experiment'||shot==='awakening')plate('intact');else if(shot==='collapse'){plate('intact');plate('lab',ease((t-.6)/1.3))}else plate('lab');
   dust(t,35,shot==='collapse');
   if(shot==='experiment'){
    const rd=dimensions('researcher',209);const ry=421-rd.height*.47;castShadow('researcher',250,423,rd.width,rd.height);contactShadow(250,423,rd.width*.21,7,.32);sprite('researcher',250,ry,209,Math.sin(t*.9)*.008,1,.92);pod(t);c.fillStyle='#182630bb';c.fillRect(665,196,166,92);c.strokeStyle='#b3c5bc44';c.strokeRect(665,196,166,92);c.fillStyle='#b9d6cc';c.font='11px monospace';c.fillText('SUBJECT 151 / OBSERVATION',677,215);c.font='22px monospace';c.fillText('DAY '+(t<2?'01':t<4?'12':t<6?'37':'??'),677,244);const points:number[]=[];for(let i=0;i<40;i++)points.push(677+i*3.5,268+Math.sin(i*.9+t*6)*(i%8<3?8:2));path(points,'#9cbeb7',1);
   }else if(shot==='freedom'){
    glow(LAB_EXIT.x,LAB_EXIT.y,155,'#d5e3cf22');pod(t,true);dust(t,35,true);
   }else if(shot==='reunion'){glow(900,210,280,'#ffedba44');contactShadow(405,407,75,12,.33);contactShadow(640+ease(t/5)*75,395,40,8,.2);pokemon('mewtwo',390,268,235,t,true);pokemon('mew',615+ease(t/5)*75,238,155,t)}
   else if(shot==='silence'){contactShadow(490,422,78,12,.33);contactShadow(745,400,38,8,.18);pokemon('mewtwo',475,290,235,t,true);pokemon('mew',730,245,145,t);dust(t,15)}
   else{
    const reveal=shot==='awakening'?ease((t-.6)/2):1,power=shot==='abandonment'?1:shot==='jealousy'?.85:.65;
    c.fillStyle=`rgba(7,8,20,${shot==='awakening'?.45-reveal*.15:.22})`;c.fillRect(0,0,1000,500);aura(t,power*reveal);
    if(shot==='collapse')rubble(t,false);contactShadow(518,410,92,13,.38);pokemon('mewtwo',500,255-Math.sin(t*1.4)*7,shot==='abandonment'?305:270,t,false,reveal);
    if(shot==='awakening'){for(let i=0;i<13;i++){const p=(t*.22+i*.13)%1;ellipse(380+i*21,420-p*330,1,3,'#d0ade866')}glow(500,215,80,'#d8baff'+Math.floor(reveal*.15*255).toString(16).padStart(2,'0'))}
    if(shot==='collapse'){
     for(const side of [-1,1]){const run=ease((t-(side>0?.4:0))/4),x=side<0?240-run*430:735+run*430,fd=dimensions('fleeing',side<0?260:240),ground=421,y=ground-fd.height*.47-Math.abs(Math.sin(t*10))*5;castShadow('fleeing',x,ground,fd.width,fd.height);contactShadow(x,ground,fd.width*.3,8,.25);sprite('fleeing',x,y,side<0?260:240,Math.sin(t*7)*.025,side)}rubble(t,true);sparks(t,746,91);dust(t,90,true);
     c.fillStyle=`rgba(139,47,49,${.05+Math.sin(t*2)**2*.08})`;c.fillRect(0,0,1000,500);const impact=Math.max(0,1-Math.abs(t-.9)/.16)*.22;c.fillStyle=`rgba(231,220,208,${reduced?0:impact})`;c.fillRect(0,0,1000,500);
    }
    if(shot==='jealousy'||shot==='abandonment'){for(let i=0;i<12;i++){c.save();c.translate(190+(i*83)%640,80+(i*53-t*19+500)%330);c.rotate(Math.sin(t+i)*.4);c.fillStyle='#c0baac88';c.fillRect(-10,-14,20,28);for(let j=0;j<4;j++)path([-7,-8+j*4,5,-8+j*4],'#4d505466',.6);c.restore()}}
   }
  }
  c.restore();const vignette=c.createRadialGradient(500,250,160,500,250,580);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#020610bb');c.fillStyle=vignette;c.fillRect(0,0,1000,500);
  c.strokeStyle='#d8c8ab22';c.lineWidth=1;c.strokeRect(23,21,954,458);for(let i=0;i<130;i++){c.fillStyle=i%2?'#e2d5b509':'#00000016';c.fillRect(i*137%1000,i*83%500,1+i%3,1)}
  c.font='9px monospace';c.fillStyle='#cbbda766';c.fillText('ARCHIVE / 151 — '+shot.toUpperCase(),38,480);
  c.fillStyle=`rgba(4,8,15,${reduced?0:Math.max(0,1-t*2,hold?0:(t-7.5)*2)})`;c.fillRect(0,0,1000,500);c.restore();if(!reduced)frame=requestAnimationFrame(draw);
 };repaint=()=>{if(reduced&&!disposed)draw(performance.now())};void prepareCinematic().then(images=>{if(disposed)return;art=images;ready=true;start=performance.now();frame=requestAnimationFrame(draw)}).catch(()=>{if(!disposed){host.textContent='장면을 불러오지 못했습니다. 다음 장면 또는 건너뛰기를 눌러 주세요.'}});
 return()=>{disposed=true;window.clearInterval(audioTimer);soundtrack?.dispose();cancelAnimationFrame(frame);observer.disconnect();rig.dispose();masks.clear();document.removeEventListener('visibilitychange',vis)};
}
