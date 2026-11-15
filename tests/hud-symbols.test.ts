import {test} from 'node:test';
import assert from 'node:assert/strict';
import {healthState,paintHealth} from '../src/hud-symbols';
test('health thresholds include exact 30 and 60 percent boundaries',()=>{for(const [hp,tone] of [[0,'danger'],[3,'danger'],[4,'warning'],[6,'warning'],[7,'healthy'],[10,'healthy']] as const)assert.equal(healthState(hp,10).tone,tone);assert.equal(healthState(1,6).tone,'danger');assert.equal(healthState(2,6).tone,'warning');assert.equal(healthState(4,6).tone,'healthy')});
test('segmented meter exposes current and maximum health without relying on color',()=>{const attrs:Record<string,string>={};const el={dataset:{},setAttribute:(k:string,v:string)=>attrs[k]=v,innerHTML:'',title:''};paintHealth(el as unknown as HTMLElement,3,6);assert.equal((el.innerHTML.match(/class="hp-segment/g)||[]).length,6);assert.equal((el.innerHTML.match(/ filled/g)||[]).length,3);assert.equal(attrs['aria-valuenow'],'3');assert.equal(attrs['aria-valuemax'],'6')});
