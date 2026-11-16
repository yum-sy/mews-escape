import {occupiedCells} from './render-budget';
import type {Point} from './cinematic-motion';
type Rig={source:HTMLCanvasElement;output:HTMLCanvasElement;context:CanvasRenderingContext2D;stamp:string;nx:number;ny:number;cells:{i:number;j:number}[]};
// A continuous textured mesh avoids hard cut seams at joints and preserves the source illustration.
export function createIllustrationRig(mobile=false){
 const rigs=new Map<string,Rig>();
 const draw=(c:CanvasRenderingContext2D,key:string,image:HTMLImageElement,x:number,y:number,width:number,height:number,time:number,deform:(p:Point)=>Point,angle=0,flip=1)=>{
  if(!image.naturalWidth)return;
  let rig=rigs.get(key);
  if(!rig){const source=document.createElement('canvas');source.width=mobile?320:360;source.height=Math.round(source.width*image.naturalHeight/image.naturalWidth);const context=source.getContext('2d',{willReadFrequently:true})!;context.drawImage(image,0,0,source.width,source.height);const nx=key.startsWith('mew')?(mobile?10:20):(mobile?8:12),ny=key.startsWith('mew')?(mobile?12:24):(mobile?10:16);const cells=occupiedCells(context.getImageData(0,0,source.width,source.height).data,source.width,source.height,nx,ny);const output=document.createElement('canvas');output.width=source.width+80;output.height=source.height+80;rig={source,output,context:output.getContext('2d')!,stamp:'',nx,ny,cells};rigs.set(key,rig)}
  // 30 poses/sec with 60Hz scene motion bounds CPU work on mobile.
  const stamp=`${Math.round(time*30)}:${Math.round(width)}:${Math.round(height)}`;
  if(stamp!==rig.stamp){rig.stamp=stamp;const ctx=rig.context,sw=rig.source.width,sh=rig.source.height,nx=rig.nx,ny=rig.ny;ctx.clearRect(0,0,rig.output.width,rig.output.height);
   const points:Point[]=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const p=deform({x:i/nx,y:j/ny});points.push({x:p.x*sw+40,y:p.y*sh+40})}
   const tri=(a:Point,b:Point,d:Point,pa:Point,pb:Point,pd:Point)=>{
    const det=(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y);if(!det)return;
    const m11=((pb.x-pa.x)*(d.y-a.y)-(pd.x-pa.x)*(b.y-a.y))/det,m21=((pd.x-pa.x)*(b.x-a.x)-(pb.x-pa.x)*(d.x-a.x))/det;
    const m12=((pb.y-pa.y)*(d.y-a.y)-(pd.y-pa.y)*(b.y-a.y))/det,m22=((pd.y-pa.y)*(b.x-a.x)-(pb.y-pa.y)*(d.x-a.x))/det;
    ctx.save();ctx.beginPath();const center={x:(pa.x+pb.x+pd.x)/3,y:(pa.y+pb.y+pd.y)/3};
    // Subpixel overlap removes antialias hairlines without visible duplicate limbs.
    for(const [i,p] of [pa,pb,pd].entries()){const vx=p.x-center.x,vy=p.y-center.y,l=Math.hypot(vx,vy),xx=p.x+vx/l*.35,yy=p.y+vy/l*.35;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.closePath();ctx.clip();ctx.transform(m11,m12,m21,m22,pa.x-m11*a.x-m21*a.y,pa.y-m12*a.x-m22*a.y);const sx=Math.max(0,Math.floor(Math.min(a.x,b.x,d.x))-1),sy=Math.max(0,Math.floor(Math.min(a.y,b.y,d.y))-1),sw=Math.min(rig!.source.width,Math.ceil(Math.max(a.x,b.x,d.x))+1)-sx,sh=Math.min(rig!.source.height,Math.ceil(Math.max(a.y,b.y,d.y))+1)-sy;ctx.drawImage(rig!.source,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
   };
   for(const {i,j} of rig.cells){const a={x:i*sw/nx,y:j*sh/ny},b={x:(i+1)*sw/nx,y:j*sh/ny},d={x:i*sw/nx,y:(j+1)*sh/ny},e={x:b.x,y:d.y};const k=j*(nx+1)+i;tri(a,b,d,points[k],points[k+1],points[k+nx+1]);tri(b,e,d,points[k+1],points[k+nx+2],points[k+nx+1])}
  }
  c.save();c.translate(x,y);c.rotate(angle);c.scale(flip,1);c.drawImage(rig.output,-width/2-40*width/rig.source.width,-height/2-40*height/rig.source.height,width*rig.output.width/rig.source.width,height*rig.output.height/rig.source.height);c.restore();
 };
 return{draw,dispose:()=>rigs.clear()};
}
