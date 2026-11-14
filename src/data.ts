export const ROOM={width:1120,height:700,left:78,right:1042,top:136,bottom:590};
export const STATS={hp:6,speed:240,damage:1,shotInterval:.19,projectileSpeed:600,range:720,invulnerability:1.1,projectileCap:120};
export const ENEMIES={
 gastly:{name:'고오스',hp:8,speed:76,radius:21,flying:true},
 zubat:{name:'주뱃',hp:5,speed:112,radius:19,flying:true},
 koffing:{name:'또가스',hp:10,speed:44,radius:22,flying:true},
 grimer:{name:'질퍽이',hp:12,speed:68,radius:23,flying:false},
 houndour:{name:'델빌',hp:9,speed:94,radius:21,flying:false},
 shuppet:{name:'어둠대신',hp:7,speed:98,radius:19,flying:true},
 mewtwo:{name:'뮤츠',hp:600,speed:48,radius:36,flying:true},
 gengar:{name:'팬텀',hp:220,speed:60,radius:32,flying:true},
};
export type Kind=keyof typeof ENEMIES;
export const NORMAL_KINDS:Kind[]=['gastly','zubat','koffing','grimer','houndour','shuppet'];
export const SPAWNS:{kind:Kind,x:number,y:number}[]=[{kind:'gastly',x:200,y:190},{kind:'gastly',x:920,y:190},{kind:'gastly',x:900,y:510},{kind:'zubat',x:240,y:480},{kind:'zubat',x:810,y:360},{kind:'zubat',x:560,y:190}];
