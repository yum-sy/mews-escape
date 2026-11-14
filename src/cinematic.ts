// Illustrated plates and props; Pokémon remain the unmodified recorded PokéAPI artwork.
const files={mew:'mew-artwork.png',mewtwo:'mewtwo-artwork.png',forest:'forest-cinematic-v1.png',lab:'lab-cinematic-v1.png',intact:'lab-intact-v2.png',operative:'capture-operative-v2.png',chamber:'containment-v2.png',researcher:'researcher-v2.png',fleeing:'fleeing-researcher-v2.png'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const p=clamp(v);return p*p*(3-2*p)};
export function playCinematic(host:HTMLElement,shot:string,hold=false){
 const canvas=document.createElement('canvas');canvas.className='cinematic';host.replaceChildren(canvas);const c=canvas.getContext('2d')!;
 const art=Object.fromEntries(Object.entries(files).map(([key,file])=>{const img=new Image();img.src='./assets/'+file;return[key,img]})) as Record<keyof typeof files,HTMLImageElement>;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let frame=0,start=performance.now(),hiddenAt=0,disposed=false,repaint=()=>{};
 const size=()=>{const box=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.max(1,box.width*dpr);canvas.height=Math.max(1,box.height*dpr);repaint()};
 const observer=new ResizeObserver(size);observer.observe(host);size();
 const vis=()=>{if(document.hidden)hiddenAt=performance.now();else if(hiddenAt){start+=performance.now()-hiddenAt;hiddenAt=0}};document.addEventListener('visibilitychange',vis);
 const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
 const path=(points:number[],color:string,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke()};
 const glow=(x:number,y:number,r:number,color:string)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)};
 const plate=(key:'forest'|'lab'|'intact',alpha=1)=>{const img=art[key];if(!img.naturalWidth)return;c.save();c.globalAlpha=alpha;c.drawImage(img,-30,-15,1060,530);c.restore()};
 // Uniform physical proportions even when the story panel changes shape on a phone.
 const sprite=(key:keyof typeof files,x:number,y:number,width:number,rotation=0,flip=1,alpha=1)=>{const img=art[key];if(!img.naturalWidth)return;c.save();c.translate(x,y);c.rotate(rotation);c.scale(flip,1);c.globalAlpha=alpha;const rawH=width*img.naturalHeight/img.naturalWidth*(canvas.width/1000)/(canvas.height/500),fit=Math.min(1,365/rawH),h=rawH*fit;const drawWidth=width*fit;c.drawImage(img,-drawWidth/2,-h/2,drawWidth,h);c.restore()};
 const pokemon=(key:'mew'|'mewtwo',x:number,y:number,width:number,t:number,quiet=false,alpha=1)=>{c.save();c.shadowColor=key==='mew'?'#efc6dc':'#b998e3';c.shadowBlur=quiet?2:12;sprite(key,x,y,width,Math.sin(t*1.5)*(quiet?.012:.035),1,alpha);c.restore()};
 const dust=(t:number,amount=35,dense=false)=>{for(let i=0;i<amount;i++){const x=(i*137+t*(dense?17:3))%1100-50,y=(i*83+t*(dense?23:5))%540-20;ellipse(x,y,dense?18+i%17:1+i%2,dense?9+i%11:1,'#c3b9a3'+(dense?'08':'38'))}};
 const sparks=(t:number,x:number,y:number)=>{for(let i=0;i<24;i++){const age=(t*1.1+i*.137)%1,dx=Math.sin(i*13)*age*100,dy=-age*70+age*age*190;path([x+dx,y+dy,x+dx-Math.sin(i*13)*8,y+dy-5],`rgba(255,214,145,${(1-age)*.8})`,1.3)}};
 const rubble=(t:number,strength=1)=>{for(let i=0;i<32;i++){const age=(t*.33+i*.127)%1,x=(i*173)%1100-50+Math.sin(i)*age*70,y=-40+age*age*620;c.save();c.translate(x,y);c.rotate(i+age*4);c.globalAlpha=strength;c.fillStyle=['#3e4851','#66717a','#9b9d96'][i%3];c.strokeStyle='#171f29';c.lineWidth=1.5;const s=4+i%13;c.beginPath();c.moveTo(-s,-s*.4);c.lineTo(-s*.3,-s*.8);c.lineTo(s*.4,-s);c.lineTo(s*.66,-s*.2);c.lineTo(s,s*.3);c.lineTo(s*.2,s*.8);c.lineTo(-s*.6,s*.4);c.closePath();c.fill();c.stroke();path([-s*.8,-s*.3,-s*.15,0,s*.35,-s*.8],'#b5b7ac66',1);path([-s*.15,0,s*.75,s*.25],'#1b2531aa',1);for(let j=0;j<4;j++)path([-s*.5+j*s*.2,s*.14,-s*.65+j*s*.2,s*.35],'#202b3566',.7);c.restore()}};
 const aura=(t:number,power:number)=>{glow(500,245,240,'#a77ee550');c.save();c.globalCompositeOperation='screen';for(let j=0;j<8;j++){c.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=115+Math.sin(a*5-t*3+j)*13+Math.sin(a*11+t*2)*6+j*7,x=500+Math.cos(a)*r,y=245+Math.sin(a)*r*1.25;if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}c.strokeStyle=`rgba(199,159,241,${power*(.14-j*.014)})`;c.lineWidth=j%3===0?3:1;c.stroke()}for(let i=0;i<10;i++){const a=i*2.4+t*.18,r=125+(i*23+t*24)%130;path([500+Math.cos(a)*r,245+Math.sin(a)*r*.7,500+Math.cos(a+.07)*(r+14),245+Math.sin(a+.07)*(r+14)*.7,500+Math.cos(a-.02)*(r+30),245+Math.sin(a-.02)*(r+30)*.7],`rgba(212,185,248,${power*.4})`,1)}c.restore()};
 const net=(x:number,y:number,rx:number,ry:number,alpha:number)=>{c.save();c.globalAlpha=alpha;c.translate(x,y);c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.clip();for(let i=-12;i<=12;i++){for(const dir of [-1,1]){c.beginPath();c.moveTo(i*22-rx*dir,-ry);c.quadraticCurveTo(i*22+Math.sin(i)*4,ry*.15,i*22+rx*dir,ry);c.strokeStyle='#252c28';c.lineWidth=3.4;c.stroke();c.strokeStyle='#c4bba0';c.lineWidth=1.5;c.stroke()}}c.restore();c.save();c.translate(x,y);c.globalAlpha=alpha;c.strokeStyle='#30382e';c.lineWidth=2.8;c.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=1+.035*Math.sin(a*8);const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;if(i===0)c.moveTo(px,py);else c.lineTo(px,py)}c.stroke();c.strokeStyle='#c9bda1';c.lineWidth=1.2;c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(Math.cos(a)*rx,Math.sin(a)*ry,4,5,'#47504b')}c.restore()};
 const pod=(t:number,broken=false)=>{ellipse(500,411,116,18,'#02091377');glow(500,245,140,broken?'#8ac6d311':'#87c7de20');
  const release=broken?ease((t-1.6)/2):0;
  const chamberFit=Math.min(1,365/(245*(art.chamber.naturalHeight/Math.max(1,art.chamber.naturalWidth))*(canvas.width/1000)/(canvas.height/500)));
  const escape=broken?ease((t-3)/3.5):0;
  pokemon('mew',500+escape*330,242-Math.sin(escape*Math.PI)*50-escape*10+Math.sin(t*2)*4,(broken?160-escape*45:146)*(chamberFit+(1-chamberFit)*escape),t,!broken);
  // Keep the heavy base intact; the cap loosens and the glass/rails peel outward.
  const podH=Math.min(365,245*(art.chamber.naturalHeight/Math.max(1,art.chamber.naturalWidth))*(canvas.width/1000)/(canvas.height/500));
  const top=-podH*.26,bottom=podH*.30;
  for(const part of ['top','bottom'] as const){c.save();c.translate(500+(part==='top'?-release*14:0),248+(part==='top'?-release*16:0));c.rotate(part==='top'?-release*.08:0);c.beginPath();c.rect(-250,part==='top'?-podH:bottom,500,part==='top'?podH+top:podH);c.clip();sprite('chamber',0,0,245);c.restore()}
  for(const side of [-1,1]){c.save();c.translate(500+side*release*68,248+release*30);c.rotate(side*release*.24);c.beginPath();c.rect(side<0?-500:0,top,500,bottom-top);c.clip();sprite('chamber',0,0,245);c.restore()}
  if(!broken){const scan=132+(t*53)%214;const g=c.createLinearGradient(0,scan-16,0,scan+5);g.addColorStop(0,'#9be3ec00');g.addColorStop(1,'#c3f4fa55');c.fillStyle=g;c.fillRect(500-71*chamberFit,scan-16,142*chamberFit,20);path([500-67*chamberFit,scan,500+67*chamberFit,scan],'#dafaff88',1);for(let i=0;i<9;i++)ellipse(500+(-62+i*16)*chamberFit,340-(t*14+i*29)%190,1,2,'#b3d8e755')}
  else{const crack=clamp(t/.9);c.save();c.globalAlpha=(1-release)*crack;path([495,115,482,167,510,211,487,257,523,306,507,369],'#d9eef2',1.4);path([510,211,546,194,566,169],'#e0f1f2',1);path([487,257,449,283,432,328],'#d9eef2',1);c.restore();if(t>1.6)for(let i=0;i<23;i++){const p=clamp((t-1.6)/2.5),x=450+i%6*18+Math.sin(i*7)*p*150,y=150+(i*37)%180+p*p*190;c.save();c.translate(x,y);c.rotate(i+p*3);c.globalAlpha=(1-p)*.8;c.fillStyle='#badce755';c.strokeStyle='#d1e6e7';c.lineWidth=.6;c.beginPath();c.moveTo(-4,-11);c.lineTo(7,-4);c.lineTo(0,15);c.closePath();c.fill();c.stroke();c.restore()}}
 };
 const draw=(now:number)=>{if(disposed)return;const t=reduced?4:Math.min(hold?7.2:8,(now-start)/1000);c.setTransform(canvas.width/1000,0,0,canvas.height/500,0,0);c.fillStyle='#111a22';c.fillRect(0,0,1000,500);c.save();
  const shake=shot==='collapse'&&!reduced?(1-ease((t-4)/4))*4:0,zoom=1+t*(shot==='awakening'?.012:.004);c.translate(500+Math.sin(t*49)*shake,250+Math.cos(t*41)*shake);c.scale(zoom,zoom);c.translate(-500,-250);
  if(['forest','capture','sunrise'].includes(shot)){
   plate('forest');dust(t);if(shot==='forest'){glow(690,85,320,'#fff0bd22');pokemon('mew',470+Math.sin(t*.8)*80,238+Math.sin(t*1.8)*17,210,t)}
   else if(shot==='sunrise'){glow(790,90,440,'#ffe6ac55');pokemon('mewtwo',405,300,170,t,true);pokemon('mew',620+Math.sin(t)*12,240,145,t)}
   else{const approach=ease(t/2.3),launch=ease((t-2.5)/1.3),caught=ease((t-3.8)/1.5);c.fillStyle=`rgba(10,19,23,${.1+approach*.12})`;c.fillRect(0,0,1000,500);
    sprite('operative',90+approach*130,300,205,0,1);sprite('operative',910-approach*125,308,193,0,-1);
    pokemon('mew',510+Math.sin(t*3)*(1-caught)*12,222+caught*55,174-caught*16,t);
    if(t>2.5){const x=300+launch*210,y=285-launch*63+caught*55;path([300,284,x-60,y+15],'#d0c7ae88',1.5);net(x,y,24+launch*91-caught*24,20+launch*103-caught*21,clamp((t-2.5)*4))}
    if(t>5.5){c.fillStyle=`rgba(5,10,15,${ease((t-5.5)/2.5)*.9})`;c.fillRect(0,0,1000,500)}
   }
  }else{
   if(shot==='experiment'||shot==='awakening')plate('intact');else if(shot==='collapse'){plate('intact');plate('lab',ease((t-.6)/1.3))}else plate('lab');
   dust(t,35,shot==='collapse');
   if(shot==='experiment'){
    sprite('researcher',250,276,209,Math.sin(t*.9)*.008,1,.92);pod(t);c.fillStyle='#182630bb';c.fillRect(665,196,166,92);c.strokeStyle='#b3c5bc44';c.strokeRect(665,196,166,92);c.fillStyle='#b9d6cc';c.font='11px monospace';c.fillText('SUBJECT 151 / OBSERVATION',677,215);c.font='22px monospace';c.fillText('DAY '+(t<2?'01':t<4?'12':t<6?'37':'??'),677,244);const points:number[]=[];for(let i=0;i<40;i++)points.push(677+i*3.5,268+Math.sin(i*.9+t*6)*(i%8<3?8:2));path(points,'#9cbeb7',1);
   }else if(shot==='freedom'){
    pod(t,true);glow(890,220,220,'#e1ebd544');dust(t,55,true);if(t>4){const p=ease((t-4)/3);path([610,259,650,245,694,220,730,192],'#d4c6db'+Math.floor((1-p)*32).toString(16).padStart(2,'0'),6)}
   }else if(shot==='reunion'){glow(900,210,280,'#ffedba44');pokemon('mewtwo',390,268,235,t,true);pokemon('mew',615+ease(t/5)*75,238,155,t)}
   else if(shot==='silence'){pokemon('mewtwo',475,290,235,t,true);pokemon('mew',730,245,145,t);dust(t,15)}
   else{
    const reveal=shot==='awakening'?ease((t-.6)/2):1,power=shot==='abandonment'?1:shot==='jealousy'?.85:.65;
    c.fillStyle=`rgba(7,8,20,${shot==='awakening'?.45-reveal*.15:.22})`;c.fillRect(0,0,1000,500);aura(t,power*reveal);
    ellipse(500,410,95,13,'#09081666');pokemon('mewtwo',500,255-Math.sin(t*1.4)*7,shot==='abandonment'?305:270,t,false,reveal);
    if(shot==='awakening'){for(let i=0;i<13;i++){const p=(t*.22+i*.13)%1;ellipse(380+i*21,420-p*330,1,3,'#d0ade866')}glow(500,215,80,'#d8baff'+Math.floor(reveal*.15*255).toString(16).padStart(2,'0'))}
    if(shot==='collapse'){
     sprite('fleeing',240-ease(t/4)*430,325+Math.sin(t*14)*5,260,Math.sin(t*7)*.025,-1);sprite('fleeing',735+ease((t-.4)/4)*430,320+Math.sin(t*14+2)*5,240,Math.sin(t*7+1)*.025,1);rubble(t);sparks(t,746,91);dust(t,90,true);
     c.fillStyle=`rgba(139,47,49,${.05+Math.sin(t*2)**2*.08})`;c.fillRect(0,0,1000,500);const impact=Math.max(0,1-Math.abs(t-.9)/.16)*.22;c.fillStyle=`rgba(231,220,208,${reduced?0:impact})`;c.fillRect(0,0,1000,500);
    }
    if(shot==='jealousy'||shot==='abandonment'){for(let i=0;i<12;i++){c.save();c.translate(190+(i*83)%640,80+(i*53-t*19+500)%330);c.rotate(Math.sin(t+i)*.4);c.fillStyle='#c0baac88';c.fillRect(-10,-14,20,28);for(let j=0;j<4;j++)path([-7,-8+j*4,5,-8+j*4],'#4d505466',.6);c.restore()}}
   }
  }
  c.restore();const vignette=c.createRadialGradient(500,250,160,500,250,580);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#020610bb');c.fillStyle=vignette;c.fillRect(0,0,1000,500);
  c.strokeStyle='#d8c8ab22';c.lineWidth=1;c.strokeRect(23,21,954,458);for(let i=0;i<130;i++){c.fillStyle=i%2?'#e2d5b509':'#00000016';c.fillRect(i*137%1000,i*83%500,1+i%3,1)}
  c.font='9px monospace';c.fillStyle='#cbbda766';c.fillText('ARCHIVE / 151 — '+shot.toUpperCase(),38,480);
  c.fillStyle=`rgba(4,8,15,${reduced?0:Math.max(0,1-t*2,hold?0:(t-7.5)*2)})`;c.fillRect(0,0,1000,500);if(!reduced)frame=requestAnimationFrame(draw);
 };repaint=()=>{if(reduced&&!disposed)draw(performance.now())};for(const img of Object.values(art))img.onload=repaint;frame=requestAnimationFrame(draw);
 return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',vis)};
}
