/** Optional APIs: refusal must never block starting or resuming a game. */
export async function enterLandscape(){
 if(!matchMedia('(pointer:coarse)').matches)return;
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{/* iOS and embedded browsers retain responsive layout. */}
 try{await (screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>})?.lock?.('landscape')}catch{/* Manual rotation stays available. */}
}
