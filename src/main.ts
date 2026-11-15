import {registerOffline} from './shell';
import Phaser from 'phaser';
import {LabScene} from './scene';
import './style.css';
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1120,height:700,backgroundColor:'#080e18',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[LabScene],input:{activePointers:4},render:{antialias:false,powerPreference:'low-power'},fps:{target:60,forceSetTimeOut:true,smoothStep:false}});

registerOffline();

// Read parent bounds before refresh: refresh alone fits using the previous size.
let resizeFrame=0;
const fitViewport=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!game.isBooted)return;game.scale.getParentBounds();game.scale.refresh()})};
window.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('resize',fitViewport);
new ResizeObserver(fitViewport).observe(document.getElementById('game')!);
