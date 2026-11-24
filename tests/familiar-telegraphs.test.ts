import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {cueMetrics} from '../src/cue-layout';
import {speciesSize} from '../src/scaling';
test('third encounter renderer omits arrowheads and teleport ghosts but retains an expiring faint path',()=>{
 const source=ts.createSourceFile('telegraphs.ts',readFileSync(new URL('../src/telegraphs.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true),node=source.statements.find(n=>ts.isClassDeclaration(n))!,js=ts.transpileModule(node.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,ctx={exports:{} as any,cueMetrics,speciesSize};vm.runInNewContext(js,ctx);
 for(const guidance of ['full','soft','subtle']){let triangles=0,lines=0,ghosts=0,alpha=1,destroyed=0;const root:any={setDepth(){return this},add(){return this},setAlpha(a:number){alpha=a;return this},destroy(){destroyed++}},g:any={lineStyle(){return this},fillStyle(){return this},lineBetween(){lines++},fillTriangle(){triangles++}},image:any={setDisplaySize(){return this},setTint(){return this},setAlpha(){return this}};const scene={cameras:{main:{zoom:.5}},add:{container:()=>root,graphics:()=>g,image:()=>{ghosts++;return image}}};const t=new ctx.exports.Telegraphs(scene);t.show({x:100,y:100,r:30,cue:'aim',kind:'gengar',duration:1,guidance,directions:[{x:1,y:0}]});assert.ok(lines>0);assert.equal(triangles,guidance==='full'?1:0);assert.equal(ghosts,guidance==='full'?1:0);assert.equal(alpha,guidance==='subtle'?.24:guidance==='soft'?.45:.75);t.update(.9);assert.equal(destroyed,0);t.update(.11);assert.equal(destroyed,1)}
});
