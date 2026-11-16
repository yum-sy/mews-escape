import {installHoldHelp} from './hold-help';
import {registerOffline} from './shell';
import Phaser from 'phaser';
import {LabScene} from './scene';
import './style.css';
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1120,height:700,backgroundColor:'#080e18',pixelArt:false,roundPixels:false,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[LabScene],input:{activePointers:4},render:{antialias:true,powerPreference:'low-power'},fps:{target:60,forceSetTimeOut:true,smoothStep:false}});

registerOffline();
installHoldHelp();

// Read parent bounds before refresh: refresh alone fits using the previous size.
let resizeFrame=0;
const fitViewport=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!game.isBooted)return;game.scale.getParentBounds();game.scale.refresh()})};
window.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('resize',fitViewport);
new ResizeObserver(fitViewport).observe(document.getElementById('game')!);

// The DOM opening/menu completely covers the laboratory: avoid rendering it underneath.
const syncSceneVisibility=()=>{for(const scene of game.scene.getScenes(true))scene.scene.setVisible(document.body.dataset.screen==='game')};
new MutationObserver(syncSceneVisibility).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
game.events.on('ready',syncSceneVisibility);
