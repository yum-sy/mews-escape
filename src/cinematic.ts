// Code-drawn 2D animation: articulated character, layered sets and timed camera blocking.
export function playCinematic(host:HTMLElement,shot:string){
 const canvas=document.createElement('canvas');canvas.className='cinematic';host.replaceChildren(canvas);const c=canvas.getContext('2d')!;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,start=performance.now(),hiddenAt=0,disposed=false;
 const size=()=>{const box=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.max(1,box.width*dpr);canvas.height=Math.max(1,box.height*dpr)};const observer=new ResizeObserver(size);observer.observe(host);size();
 const vis=()=>{if(document.hidden)hiddenAt=performance.now();else if(hiddenAt){start+=performance.now()-hiddenAt;hiddenAt=0}};document.addEventListener('visibilitychange',vis);
 const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
 const line=(color:string,width:number,points:number[])=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke()};
 const mew=(x:number,y:number,scale:number,t:number,mood='happy')=>{
  c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(Math.sin(t*1.8)*.07);
  c.strokeStyle='#ce9abf';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(4,38);c.bezierCurveTo(72,90,111,-18+Math.sin(t*2)*28,66,-34);c.bezierCurveTo(43,-43,35,-12,60,-8);c.stroke();
  ellipse(0,18,21,33,'#d59fc3');ellipse(-17,43,12,19,'#e4bad7');ellipse(16,45,12,18,'#e4bad7');
  c.save();c.rotate(Math.sin(t*3)*.16);ellipse(-24,13,9,19,'#edc7df');ellipse(25,11,8,18,'#edc7df');c.restore();
  c.fillStyle='#f0c9e0';c.beginPath();c.moveTo(-27,-24);c.lineTo(-25,-58);c.lineTo(-6,-41);c.lineTo(9,-41);c.lineTo(27,-58);c.lineTo(29,-22);c.closePath();c.fill();ellipse(0,-21,33,29,'#f0c9e0');ellipse(-8,-30,18,13,'#fff2f5');
  const blink=Math.sin(t*1.1)>.985||mood==='sleep';
  if(blink){line('#5d4c70',2,[-19,-20,-10,-18]);line('#5d4c70',2,[10,-18,19,-20])}else{for(const x of [-15,15]){ellipse(x,-20,7,11,'#fff9ff');ellipse(x+1,-19,4,8,mood==='fear'?'#514579':'#629bb8');ellipse(x+2,-20,2,5,'#233d61');ellipse(x,-23,1.5,2,'white')}}
  c.strokeStyle='#a66d96';c.lineWidth=1.5;c.beginPath();c.arc(0,-8,4,0,mood==='happy'?Math.PI:-Math.PI);c.stroke();c.restore();
 };
 const human=(x:number,y:number,t:number,dir=1)=>{c.save();c.translate(x,y);c.scale(dir,1);ellipse(0,-71,13,16,'#111922');line('#111922',22,[0,-48,0,-10]);line('#111922',9,[-1,-35,20,-24,35,-35]);line('#111922',10,[0,-10,Math.sin(t*9)*20,22]);line('#111922',10,[0,-10,-Math.sin(t*9)*20,22]);c.restore()};
 const draw=(now:number)=>{if(disposed)return;const t=reduced?3:Math.min(8,(now-start)/1000),w=1000,h=500;
  c.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);c.clearRect(0,0,w,h);c.fillStyle='#08131c';c.fillRect(0,0,w,h);c.save();
  if(shot==='forest'||shot==='capture'){
   const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#263e4e');bg.addColorStop(.6,'#457968');bg.addColorStop(1,'#142e29');c.fillStyle=bg;c.fillRect(0,0,w,h);
   for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){const x=i*110-80+Math.sin(i*4)*35-t*(layer+1)*2;c.fillStyle=['#446e64','#254e45','#102f2a'][layer];c.fillRect(x,0,15+layer*14,440);ellipse(x,25+Math.sin(i)*60,90,100,['#436c60','#255044','#12392c'][layer])}
   for(let i=0;i<5;i++){c.fillStyle='#ecf5bd0a';c.beginPath();c.moveTo(250+i*170,0);c.lineTo(160+i*170,500);c.lineTo(270+i*170,500);c.lineTo(275+i*170,0);c.fill()}
   ellipse(500,500,650,100,'#153c31');
   for(let i=0;i<30;i++)ellipse((i*71+t*12)%1000,80+(i*37)%330+Math.sin(t+i)*12,1.5,1.5,'#dcf7bc88');
   if(shot==='forest')mew(470+Math.sin(t*.9)*100,245+Math.sin(t*2)*35,1.6,t);
   else{const p=Math.min(1,t/3);human(100+p*170,390,t);human(900-p*170,390,t,-1);mew(500,235+Math.sin(t*4)*9,1.5,t,'fear');
    c.save();c.translate(500,235);c.scale(3-p*2,3-p*2);c.globalAlpha=p;c.strokeStyle='#d3dee7';c.lineWidth=1.3;for(let i=-150;i<150;i+=24){c.beginPath();c.moveTo(i,-130);c.lineTo(i+160,130);c.stroke();c.beginPath();c.moveTo(i+160,-130);c.lineTo(i,130);c.stroke()}c.restore();
    c.fillStyle=`rgba(1,6,13,${Math.max(0,(t-5)/3)})`;c.fillRect(0,0,w,h)}
  }else{
   const shake=shot==='collapse'?Math.max(0,1-t/8)*5:0;c.translate(Math.sin(t*45)*shake,Math.cos(t*37)*shake);
   const zoom=1+t*.007;c.translate(500,250);c.scale(zoom,zoom);c.translate(-500,-250);
   const bg=c.createRadialGradient(500,210,10,500,210,650);bg.addColorStop(0,shot==='collapse'?'#552439':'#263c51');bg.addColorStop(1,'#060b14');c.fillStyle=bg;c.fillRect(-50,-50,1100,600);
   for(let i=0;i<9;i++){const x=i*145-80;line('#52637733',2,[500,220,x,500]);line('#52637733',2,[0,270+i*i*4,1000,270+i*i*4])}
   for(const x of [90,240,760,910]){c.fillStyle='#132535';c.fillRect(x-45,80,90,220);c.strokeStyle='#52677c';c.strokeRect(x-45,80,90,220);c.fillStyle=shot==='collapse'?'#d25c6e':'#78b6c5';c.fillRect(x-31,108,62,40);for(let i=0;i<6;i++){c.fillStyle=i%2?'#82988b':'#48596c';c.fillRect(x-30,170+i*17,25+i%3*9,3)}}
   if(shot==='experiment'||shot==='freedom'){
    ellipse(500,395,115,25,'#030912');c.fillStyle='#344c60';c.fillRect(390,370,220,18);c.fillRect(390,80,220,18);
    c.fillStyle='#8edbed12';c.fillRect(400,98,200,270);line('#9ac9e777',3,[400,98,400,368]);line('#9ac9e777',3,[600,98,600,368]);
    if(shot==='experiment'){mew(500,230+Math.sin(t*2)*5,1.4,t,'sleep');const scan=110+(t*80)%230;c.fillStyle='#b7f3ff55';c.fillRect(400,scan,200,3);c.font='16px monospace';c.fillStyle='#9dd2e7';c.fillText(`DAY ${t<2?'01':t<4?'12':t<6?'37':'??'}`,650,220);c.fillText('SUBJECT 151',650,250);for(let i=0;i<7;i++)line('#9dceda55',1,[650+i*13,270,650+i*13,270+Math.sin(t*10+i)*12]);c.fillStyle=`rgba(220,241,255,${Math.pow(Math.max(0,Math.sin(t*3)),18)*.38})`;c.fillRect(0,0,w,h)}
    else{line('#c2e3f2',2,[490,95,475,160,520,220,480,300,510,367]);for(let i=0;i<12;i++){const p=Math.min(1,t/3);c.save();c.translate(405+i*17+Math.sin(i*4)*p*110,110+(i*31)%230+p*p*150);c.rotate(t+i);c.fillStyle='#bce7ff66';c.fillRect(-4,-8,8,18);c.restore()}mew(500+Math.max(0,t-2)*28,235-Math.max(0,t-3)*22,1.4,t);const light=c.createLinearGradient(750,0,1000,0);light.addColorStop(0,'#e9ffe200');light.addColorStop(1,'#e9ffe2aa');c.fillStyle=light;c.fillRect(700,0,300,500)}
   }else{
    // Mewtwo's silhouette is staged as a distant presence; the close-up follows in the boss chapter.
    const pulse=1+Math.sin(t*3)*.06;ellipse(500,240,120*pulse,170*pulse,'#a48aef18');
    c.save();c.translate(500,250);c.scale(1.5,1.5);c.strokeStyle='#9b7ec2';c.lineWidth=18;c.beginPath();c.moveTo(10,48);c.bezierCurveTo(110,120,120,-20,65,15);c.stroke();ellipse(0,0,22,45,'#8c87a4');ellipse(0,-53,27,23,'#b7abc9');line('#b7abc9',12,[-20,-65,-24,-86]);line('#b7abc9',12,[20,-65,24,-86]);line('#9690ac',13,[-18,-20,-35,25]);line('#9690ac',13,[18,-20,35,25]);line('#9690ac',18,[-12,32,-25,78]);line('#9690ac',18,[12,32,25,78]);line('#efb5ff',3,[-18,-54,-7,-51]);line('#efb5ff',3,[7,-51,18,-54]);c.restore();
    for(let i=0;i<4;i++){const r=40+((t*100+i*90)%360);c.strokeStyle=`rgba(184,134,244,${(1-r/410)*.4})`;c.lineWidth=2;c.beginPath();c.ellipse(500,250,r,r*.5,0,0,Math.PI*2);c.stroke()}
    if(shot==='collapse'){human(260-t*55,390,t,-1);human(740+t*55,390,t);for(let i=0;i<24;i++){const y=((t*100+i*43)%580)-50;c.save();c.translate((i*149)%1000,y);c.rotate(t+i);c.fillStyle='#465366';c.fillRect(-8,-8,10+i%4*5,15);c.restore()}line('#040711',7,[450,0,475,70,445,140,480,190]);line('#040711',7,[750,0,720,100,760,170]);}
   }
  }
  c.restore();const vignette=c.createRadialGradient(500,250,130,500,250,590);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#020610bb');c.fillStyle=vignette;c.fillRect(0,0,w,h);
  c.fillStyle=`rgba(4,8,15,${reduced?0:Math.max(0,1-t*2, (t-7.5)*2)})`;c.fillRect(0,0,w,h);
  if(!reduced)frame=requestAnimationFrame(draw);
 };frame=requestAnimationFrame(draw);
 return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',vis)};
}
