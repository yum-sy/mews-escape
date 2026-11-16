/** Shared laboratory ambient light; retain highlights without full-white sticker edges. */
export const PROP_LIGHT={top:0xa6b8b8,bottom:0x718993,offTop:0x667a80,offBottom:0x485e69};
export function lightProp<T extends {setTint:(tl:number,tr:number,bl:number,br:number)=>unknown}>(image:T,off=false):T{
 const top=off?PROP_LIGHT.offTop:PROP_LIGHT.top,bottom=off?PROP_LIGHT.offBottom:PROP_LIGHT.bottom;
 image.setTint(top,top,bottom,bottom);return image;
}
export const PROP_SIZE={console:78,crate:64,canister:64,emitter:54,vent:86,plate:86,tm:66,potion:44,key:50} as const;
