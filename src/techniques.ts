export const FORMS={
 psychic:{name:'염동력',color:0xf3b9ef,glyph:'◎',shape:'orb'},
 shadow:{name:'섀도볼',color:0xb394ff,glyph:'◉',shape:'vortex'},
 swift:{name:'스피드스타',color:0xffdf83,glyph:'★',shape:'star'},
 tri:{name:'트라이어택',color:0xf4e8bc,glyph:'△',shape:'trinity'},
 flame:{name:'불꽃세례',color:0xff8645,glyph:'♨',shape:'ember'},
 ice:{name:'얼다바람',color:0x96ebff,glyph:'❄',shape:'snow'},
 spark:{name:'전기쇼크',color:0xffe566,glyph:'ϟ',shape:'bolt'},
 psybeam:{name:'환상빔',color:0xf4a7ed,glyph:'≋',shape:'helix'},
 poison:{name:'독침',color:0xd18bfa,glyph:'⌁',shape:'needle'},
 dragon:{name:'용의파동',color:0x999dff,glyph:')))',shape:'crescent'},
 drain:{name:'기가드레인',color:0x91efad,glyph:'❧',shape:'leaf'},
 sludge:{name:'오물폭탄',color:0xc883d9,glyph:'●',shape:'glob'},
 water:{name:'물대포',color:0x78caff,glyph:'◈',shape:'drop'},
 icebeam:{name:'냉동빔',color:0xa4f4ff,glyph:'╬',shape:'lance'},
 thunderbolt:{name:'10만볼트',color:0xffee88,glyph:'ϟϟ',shape:'fork'},
 flamethrower:{name:'화염방사',color:0xff974b,glyph:'♨♨',shape:'plume'},
} as const;
export type Form=keyof typeof FORMS;
export interface Presentation{form:Form;rank:number;levels:Record<string,number>;variant:number}
export function presentation(ids:readonly string[]):Presentation{
 const levels:Record<string,number>={};let form:Form='psychic';
 for(const id of ids){levels[id]=(levels[id]??0)+1;if(form==='psychic'&&id in FORMS)form=id as Form}
 // Carrier precedence is order-independent: the other techniques fuse into its core/edge.
 for(const channel of ['icebeam','flamethrower','water','drain','psybeam','thunderbolt','spark'] as Form[])if(levels[channel]){form=channel;break}
 return{form,rank:Math.min(3,levels[form]??1),levels,variant:0};
}
export function fusionLook(v:Presentation){
 const l=v.levels,fire=!!(l.flame||l.flamethrower),cold=!!(l.ice||l.icebeam),electric=!!(l.spark||l.thunderbolt),toxic=!!(l.poison||l.sludge);
 const base={name:FORMS[v.form].name,core:FORMS[v.form].color as number,edge:0xf4eaff,recipe:'single'};
 if(fire&&cold)return{name:'열충격 융합',core:0x9be9ff,edge:0xff853b,recipe:'thermal'};
 if(l.water&&electric)return{name:'전도 수류',core:0x83d6ff,edge:0xffe65f,recipe:'conductive'};
 if(fire&&toxic)return{name:'부식 화염',core:0xffab54,edge:0xcb80ed,recipe:'corrosive'};
 if(l.shadow&&(fire||cold))return{name:fire?'암흑 화염':'암흑 냉기',core:fire?0xffa272:0x9feaff,edge:0xa787e2,recipe:'shadow'};
 if(l.drain&&(toxic||electric))return{name:toxic?'독성 흡수':'전기 흡수',core:0xa6edb0,edge:toxic?0xcd8ee8:0xffe875,recipe:'siphon'};
 const other=Object.keys(l).sort().find(id=>id in FORMS&&id!==v.form) as Form|undefined;
 if(!other&&(l.split||l.ricochet||l.focus||l.agility))return{name:base.name+' 융합',core:base.core,edge:l.ricochet?0xade6df:l.focus?0xffdebd:0xd8c3ff,recipe:'fused'};
 return other?{name:FORMS[v.form].name+' 융합',core:base.core,edge:FORMS[other].color,recipe:'fused'}:base;
}
export const modifierGlyph:Record<string,string>={split:'⑂',agility:'»',focus:'⊕',ricochet:'◇',recover:'+'};
export function glyph(id:string){return id in FORMS?FORMS[id as Form].glyph:modifierGlyph[id]??'◎'}
export type Mark={kind:'line'|'polygon'|'circle';points:number[];color:number;alpha:number;width:number;fill:boolean};
// Local coordinates, +X is the direction of fire. Shared by the game and the QA gallery.
export function techniqueMarks(v:Presentation,time:number,r:number):Mark[]{
 const look=fusionLook(v),out:Mark[]=[],color=look.core;
 const line=(p:number[],c:number=color,w=2,a=1)=>out.push({kind:'line',points:p,color:c,alpha:a,width:w,fill:false});
 const poly=(p:number[],c:number=color,a=1)=>out.push({kind:'polygon',points:p,color:c,alpha:a,width:1,fill:true});
 const circle=(x:number,y:number,rad:number,c:number=color,a=1,fill=true,w=2)=>out.push({kind:'circle',points:[x,y,rad],color:c,alpha:a,width:w,fill});
 const star=(x:number,y:number,rad:number,c:number=color)=>{const p:number[]=[];for(let i=0;i<10;i++){const a=i*Math.PI/5+time*2,rr=i%2?rad*.43:rad;p.push(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}poly(p,c)};
 switch(v.form){
  case 'psychic':circle(0,0,r*.9,color,.65);circle(0,0,r*1.3,color,.7,false,1);break;
  case 'shadow':circle(0,0,r*1.6,0x24143e);for(let j=0;j<3;j++){const p:number[]=[];for(let i=0;i<12;i++){const a=i*.25+j*2.09+time*6,rr=r*(.5+i*.1);p.push(Math.cos(a)*rr,Math.sin(a)*rr)}line(p,color,2,.8)}break;
  case 'swift':star(0,0,r*1.8);star(-r*2,r*.8,r*.5,0xfff5cb);break;
  case 'tri':{const colors=[0xff9977,0x93e5ff,0xffe66b];circle(0,0,r*1.2,colors[v.variant%3]);for(let i=0;i<3;i++){const a=time*5+i*2.094;circle(Math.cos(a)*r*1.7,Math.sin(a)*r*1.7,r*.35,colors[i])}break}
  case 'flame':poly([r*.8,0,-r*.6,-r*1.1,-r*3,-r*.5,-r*2.1,0,-r*3.5,r*.9,-r*.7,r],0xff6335);poly([r*.7,0,-r*1.4,-r*.6,-r*.7,0,-r*1.5,r*.65],0xffe18a);break;
  case 'ice':for(let i=0;i<6;i++){const a=i*Math.PI/3+time*.8,x=Math.cos(a)*r*1.7,y=Math.sin(a)*r*1.7;line([0,0,x,y],color,2);line([x*.6-y*.25,y*.6+x*.25,x*.8,y*.8,x*.6+y*.25,y*.6-x*.25],color,1)}break;
  case 'spark':line([-r*3,0,-r*1.5,-r,r*.1,r*.8,-r*.3,-r*.4,r,0],0xffe878,4);line([-r*3,0,-r*1.5,-r,r*.1,r*.8,-r*.3,-r*.4,r,0],0xfffcdf,1.3);break;
  case 'psybeam':for(const side of [-1,1]){const p:number[]=[];for(let i=0;i<14;i++)p.push(-i*r*.5,Math.sin(i*.65-time*12)*r*.65*side);line(p,side<0?0x98dfff:color,2.7,.85)}poly([r,0,-r*2,-r*.4,-r*3,0,-r*2,r*.4],0xffefff);break;
  case 'poison':poly([r,0,-r*3.4,-r*.55,-r*2.7,0,-r*3.4,r*.55]);line([0,0,-r*3,0],0xf6d9ff,1);circle(-r*2,r,r*.3,color,.7);break;
  case 'dragon':for(let i=0;i<3;i++){const p:number[]=[];for(let j=0;j<13;j++){const a=-1.25+j/12*2.5;p.push(Math.cos(a)*r*(1.1+i*.32)-r*(1.1+i*1.35),Math.sin(a)*r*(1.1+i*.32))}line(p,i%2?0xd9b9ff:color,3,.95-i*.15)}break;
  case 'drain':poly([r,0,-r,-r,-r*2.7,0,-r,r],0x82df9e);line([r*.5,0,-r*2.3,0],0xdfffc5,1.5);for(const side of [-1,1])line([-r*1.5,0,-r*.5,side*r*.65],0xc7ffa9,1);break;
  case 'sludge':for(let i=0;i<5;i++){const a=i*1.257+time*2;circle(Math.cos(a)*r*.7,Math.sin(a)*r*.7,r*(.7+i%2*.2),i%2?color:0x794a92)}circle(-r*.3,-r*.4,r*.35,0xedd5e9,.6);break;
  case 'water':poly([r,0,-r*.5,-r,-r*4.2,0,-r*.5,r],0x4799ed);circle(0,0,r*.95,0x86dbff,.8);line([r*.5,-r*.2,-r*2.6,-r*.3],0xe3ffff,2);for(let i=0;i<3;i++)circle(-r*(2+i),Math.sin(time*8+i)*r*.7,r*.23,0xd4f5ff,.65);break;
  case 'icebeam':poly([r*1.1,0,-r,-r*.65,-r*7,-r*.2,-r*7,r*.2,-r,r*.65],0x80d8ef,.7);line([r,0,-r*7,0],0xf0ffff,3);for(let i=1;i<4;i++)poly([-i*r*1.7,-r*.65,-i*r*1.7-r*.5,0,-i*r*1.7,r*.65,-i*r*1.7+r*.5,0],color,.8);break;
  case 'thunderbolt':for(const side of [-1,1]){const p:number[]=[r,0];for(let i=1;i<8;i++)p.push(-i*r,Math.sin(i*7+time*17)*r*.8+side*r*.45);line(p,0xffd64b,3);line(p,0xffffe8,1)}break;
  case 'flamethrower':for(let i=7;i>=0;i--){const x=-i*r*.65,y=Math.sin(time*14+i)*r*.22,rr=r*(.55+i*.16);circle(x,y,rr,i>3?0xef532c:0xffb43d,.8-i*.07)}poly([r,0,-r*2,-r*.5,-r*4,0,-r*2,r*.5],0xffe8a3,.9);break;
 }
 out.push(...fusionAccents(v,time,r));
 // Rank changes are geometric, not just a different tint.
 if(v.rank>1)for(const side of [-1,1])line([-r*2,side*r*(1.9+v.rank*.2),-r*.6,side*r*(1.4+v.rank*.2),r*.2,side*r*(1.8+v.rank*.2)],color,1.2,.6);
 return out;
}

/** Integrated silhouettes: decorative only, never new damage paths or orbiting shots. */
export function fusionAccents(v:Presentation,time:number,r:number):Mark[]{
 const look=fusionLook(v),out:Mark[]=[];if(look.recipe==='single')return out;
 const line=(points:number[],color=look.edge,width=2.5,alpha=.9)=>out.push({kind:'line' as const,points,color,width,alpha,fill:false});
 const poly=(points:number[],color=look.edge,alpha=.85)=>out.push({kind:'polygon' as const,points,color,width:1,alpha,fill:true});
 const circle=(x:number,y:number,size:number,color=look.edge,alpha=.75)=>out.push({kind:'circle' as const,points:[x,y,size],color,width:2,alpha,fill:false});
 if(look.recipe==='thermal'){
  for(const side of [-1,1]){poly([r,0,-r*.6,side*r*.5,-r*3.5,side*r*1.7,-r*2.3,side*r*.25],look.edge);poly([r*.6,0,-r,side*r*1.65,-r*1.5,side*r*.55],look.core);line([-r*3,side*r*.6,-r*2,side*r*.9,-r*.4,0],0xf0ffff,1.5)}
 }else if(look.recipe==='conductive'){
  for(const side of [-1,1])line([-r*3,side*r*.4,-r*2,side*r*1.3,-r*1.6,side*r*.2,-r*.4,side*r*1.5,r,0],look.edge,3);
 }else if(look.recipe==='corrosive'){
  for(const side of [-1,1]){poly([r*.5,0,-r*.7,side*r,-r*3.3,side*r*1.5,-r*2.3,0],look.edge,.7);circle(-r*2.4,side*r*(.7+Math.sin(time*9)*.2),r*.45);circle(-r*3.5,side*r*.4,r*.25)}
 }else if(look.recipe==='shadow'){
  poly([r*1.5,0,0,-r*2,-r*3,0,0,r*2],0x281735,.8);
  for(const side of [-1,1])line([r,0,-r*.2,side*r*1.3,-r*2.8,side*r*.8,-r*1,0],look.edge,3);
  poly([r,0,-r,-r*.5,-r*2,0,-r,r*.5],look.core);
 }else if(look.recipe==='siphon'){
  for(const side of [-1,1]){poly([-r*.3,0,-r*1.3,side*r*1.6,-r*2.2,side*r*.7,-r*2.8,0],look.edge);line([-r*2.5,0,-r*1.5,side*r*.6,-r*.5,0],look.core,2)}
 }else{
  for(const side of [-1,1])poly([r,0,-r,side*r*1.35,-r*3.4,side*r*.7,-r*1.7,0],look.edge,.7);
 }
 out.push(...supplementaryAccents(v,time,r));
 // Later ingredients remain visible even when the primary recipe wins precedence.
 const l=v.levels;
 if((l.spark||l.thunderbolt)&&look.recipe!=='conductive')line([-r*3,0,-r*2.1,-r*.7,-r*1.5,r*.5,r*.7,0],0xffe86b,2);
 if((l.poison||l.sludge)&&look.recipe!=='corrosive'&&look.recipe!=='siphon')for(const side of [-1,1])circle(-r*2.3,side*r*.65,r*.35,0xd18bfa);
 if(l.split)for(const side of [-1,1])line([-r*2.5,0,-r*3.8,side*r],look.edge,2);
 if(l.agility)for(const side of [-1,1])line([-r*3.2,side*r*.6,-r*4.8,side*r*.6],0xccecff,1.5);
 if(l.focus){line([r*.8,-r,r*1.2,-r,r*1.2,-r*.6],0xffdebd,2);line([r*.8,r,r*1.2,r,r*1.2,r*.6],0xffdebd,2)}
 if(l.ricochet)line([r*.3,-r*1.6,r*1.6,0,r*.3,r*1.6],0xade6df,2);
 return out;
}

/** Independent ingredients use sparse ornaments along the SAME attack, not extra damaging shots. */
export function supplementaryAccents(v:Presentation,time:number,r:number):Mark[]{
 r=Math.min(14,r*1.4);
 const l=v.levels,recipe=fusionLook(v).recipe,forms:Form[]=[];
 const represented:Record<string,string[]>={thermal:['flame','flamethrower','ice','icebeam'],conductive:['water','spark','thunderbolt'],corrosive:['flame','flamethrower','poison','sludge'],shadow:['shadow','flame','flamethrower','ice','icebeam'],siphon:['drain','poison','sludge','spark','thunderbolt']};
 for(const family of [['flamethrower','flame'],['icebeam','ice'],['shadow'],['swift'],['tri'],['drain'],['water'],['dragon'],['psybeam']] as Form[][]){const id=family.find(f=>l[f]&&f!==v.form&&!represented[recipe]?.includes(f));if(id)forms.push(id)}
 const out:Mark[]=[];if(!forms.length)return out;
 // At most three secondary ornaments at a time; long builds cycle through every ingredient.
 const start=Math.floor(time*2)%forms.length;
 for(let k=0;k<Math.min(3,forms.length);k++){
  const id=forms[(start+k)%forms.length],x=-r*(1.8+k*1.25),y=(k%2?-1:1)*r*(1.1+Math.sin(time*6+k)*.2),c=FORMS[id].color;
  const line=(points:number[],width=2)=>out.push({kind:'line',points,color:c,alpha:.85,width,fill:false});
  const poly=(points:number[])=>out.push({kind:'polygon',points,color:c,alpha:.8,width:1,fill:true});
  if(id==='flame'||id==='flamethrower')poly([x+r,y,x-r*.7,y-r*.7,x-r*.2,y,x-r*.7,y+r*.7]);
  else if(id==='ice'||id==='icebeam'){poly([x+r*.7,y,x,y-r*.8,x-r*.7,y,x,y+r*.8]);}
  else if(id==='swift'){const p:number[]=[];for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=r*(i%2?.25:.65);p.push(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}poly(p)}
  else if(id==='tri')for(let i=0;i<3;i++)out.push({kind:'circle',points:[x+i*r*.6,y,r*.22],color:[0xffad61,0x9cecff,0xffe66b][i],alpha:.9,width:1,fill:true});
  else if(id==='water')poly([x+r*.6,y,x-r*.3,y-r*.4,x-r*1.3,y,x-r*.3,y+r*.4]);
  else if(id==='drain'){poly([x+r*.7,y,x,y-r*.5,x-r*.8,y,x,y+r*.5]);line([x-r*.7,y,x+r*.5,y],1)}
  else if(id==='shadow')line([x+r*.7,y-r*.7,x-r*.6,y-r*.4,x-r,y+r*.4,x+r*.4,y+r*.7],3);
  else if(id==='dragon')line([x-r*.5,y-r,x+r*.3,y-r*.5,x+r*.6,y,x+r*.3,y+r*.5,x-r*.5,y+r],2.5);
  else line([x-r,y-r*.4,x-r*.5,y+r*.4,x,y-r*.4,x+r*.5,y+r*.4,x+r,y-r*.4]);
 }
 return out;
}
