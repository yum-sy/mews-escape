export function cueMetrics(zoom:number){const z=Math.max(.25,zoom);return{line:Math.max(2.5,2.5/z),outline:Math.max(5,5/z),fontScale:Math.max(1,1/z),arrow:Math.max(6,5/z),length:Math.max(115,70/z)}}
