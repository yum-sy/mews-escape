export const ROOM={width:1120,height:700,left:78,right:1042,top:136,bottom:590};
export const STATS={hp:6,speed:240,damage:1,shotInterval:.19,projectileSpeed:600,range:720,invulnerability:1.1,projectileCap:120};
export const ENEMIES={gastly:{hp:5,speed:66,radius:21},zubat:{hp:3,speed:100,radius:19}};
export type Kind=keyof typeof ENEMIES;
export const SPAWNS:{kind:Kind,x:number,y:number}[]=[{kind:'gastly',x:200,y:190},{kind:'gastly',x:920,y:190},{kind:'gastly',x:900,y:510},{kind:'zubat',x:240,y:480},{kind:'zubat',x:810,y:360},{kind:'zubat',x:560,y:190}];
