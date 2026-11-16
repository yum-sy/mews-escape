/** Keep cadence anchored across 60/90/120Hz displays instead of accumulating lateness. */
export function nextFrame(now:number,last:number,hz=30){const step=1000/hz,elapsed=now-last;return elapsed+0.1<step?null:last+Math.floor((elapsed+.1)/step)*step}
export function occupiedCells(alpha:Uint8ClampedArray,width:number,height:number,nx:number,ny:number){
 const cells:{i:number;j:number}[]=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  let occupied=false;
  for(let y=Math.max(0,Math.floor(j*height/ny)-1);y<Math.min(height,Math.ceil((j+1)*height/ny)+1)&&!occupied;y++)for(let x=Math.max(0,Math.floor(i*width/nx)-1);x<Math.min(width,Math.ceil((i+1)*width/nx)+1);x++)if(alpha[(y*width+x)*4+3]>0){occupied=true;break}
  if(occupied)cells.push({i,j});
 }
 return cells;
}
