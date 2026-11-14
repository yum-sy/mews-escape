import Phaser from 'phaser';
import {LabScene} from './scene';
import './style.css';
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1120,height:700,backgroundColor:'#080e18',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[LabScene],input:{activePointers:4},render:{antialias:false,powerPreference:'low-power'},fps:{target:60}});
