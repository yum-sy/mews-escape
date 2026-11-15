export const files={mew:'mew-artwork.png',mewtwo:'mewtwo-artwork.png',forest:'forest-cinematic-v1.webp',lab:'lab-cinematic-v1.webp',intact:'lab-intact-v2.webp',operative:'capture-operative-v2.webp',chamber:'containment-v2.webp',researcher:'researcher-v2.webp',fleeing:'fleeing-researcher-v2.webp'};
let cached:Promise<Record<keyof typeof files,HTMLImageElement>>|undefined;
export function prepareCinematic(){
 return cached??=(async()=>{
  const entries=await Promise.all(Object.entries(files).map(async([key,file])=>{const img=new Image();img.decoding='async';img.src='./assets/'+file;await img.decode();return [key,img] as const}));
  return Object.fromEntries(entries) as Record<keyof typeof files,HTMLImageElement>;
 })().catch(error=>{cached=undefined;throw error});
}
