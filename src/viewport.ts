/** Fit the complete laboratory and all four thresholds, without the old outer margins. */
export function arenaView(width:number,height:number){
 const landscape=width>height;
 const world=landscape?{width:1060,height:560,x:560,y:364}:{width:1120,height:700,x:560,y:350};
 const zoom=Math.min(width/world.width,height/world.height);
 return {...world,zoom,left:(width-world.width*zoom)/2,top:(height-world.height*zoom)/2};
}
