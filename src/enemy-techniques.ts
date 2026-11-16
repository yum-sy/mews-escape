import type {Kind} from './data';
export const ENEMY_TECHNIQUES:Record<Kind,{name:string;color:number;shape:'orb'|'ember'|'gas'|'needle'|'sludge'|'flame'|'hex'|'psy';sound:'shadow'|'flame'|'sludge'|'dragon'|'psybeam'}>={
 gastly:{name:'섀도볼',color:0xb299ed,shape:'orb',sound:'shadow'},
 zubat:{name:'날개치기',color:0x99dcf2,shape:'needle',sound:'dragon'},
 koffing:{name:'스모그',color:0xb8d574,shape:'gas',sound:'sludge'},
 grimer:{name:'오물공격',color:0xb783d6,shape:'sludge',sound:'sludge'},
 houndour:{name:'불꽃세례',color:0xffbb66,shape:'ember',sound:'flame'},
 shuppet:{name:'야습',color:0xa9c4f5,shape:'needle',sound:'shadow'},
 gengar:{name:'섀도볼 · 그림자 포위',color:0xb28aee,shape:'hex',sound:'shadow'},
 weezing:{name:'오물폭탄 · 독가스 포위',color:0xc1e779,shape:'gas',sound:'sludge'},
 muk:{name:'더스트슈트 · 독 늪',color:0xd49ce5,shape:'sludge',sound:'sludge'},
 houndoom:{name:'화염방사 · 니트로차지',color:0xff8c52,shape:'flame',sound:'flame'},
 banette:{name:'섀도클로 · 저주',color:0xf2a6d6,shape:'hex',sound:'shadow'},
 mewtwo:{name:'사이코브레이크',color:0xf0a5f7,shape:'psy',sound:'psybeam'},
};

export const gasShellClosed=(e:{kind:string;charge:number;cooldown:number})=>e.kind==='koffing'&&e.charge<=0&&e.cooldown<1.1;
export function enemyWarning(kind:Kind,cue?:string,tracking=false){const base=ENEMY_TECHNIQUES[kind].name.split(' · ')[0];return cue==='rush'?(kind==='houndoom'?'니트로차지':'날개치기 · 돌진'):cue==='pool'?(kind==='muk'?'독 늪':'오물 · 바닥 주의'):tracking?'저주 · 추적':base+(cue==='teleport'?' · 출현':'')}
