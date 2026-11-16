import type {Kind} from './data';
export const NORMAL_VARIANTS:Partial<Record<Kind,{family:Kind;pace:number;strafe:number}>>={
 ekans:{family:'gastly',pace:1.00,strafe:0},
 arbok:{family:'houndour',pace:1.12,strafe:0},
 abra:{family:'shuppet',pace:1.12,strafe:0},
 kadabra:{family:'drowzee',pace:1.24,strafe:0},
 exeggcute:{family:'houndour',pace:1.12,strafe:0},
 exeggutor:{family:'koffing',pace:1.24,strafe:0},
 ditto:{family:'gastly',pace:1.00,strafe:0},
 murkrow:{family:'zubat',pace:1.12,strafe:0.35},
 sneasel:{family:'shuppet',pace:1.24,strafe:0},
 sableye:{family:'shuppet',pace:1.00,strafe:0.35},
 duskull:{family:'misdreavus',pace:1.12,strafe:0},
};
