import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOVES} from '../src/moves';
import {techniqueIcon,moveHint,stableMarkup} from '../src/technique-icons';
test('every reward has a distinct vector icon and a named effect hint',()=>{const icons=MOVES.map(m=>techniqueIcon(m.id).match(/<path d="([^"]+)/)![1]);assert.equal(new Set(icons).size,MOVES.length);for(const m of MOVES){assert.ok(moveHint(m.id).startsWith(m.name));assert.ok(moveHint(m.id).includes(m.description))}});
test('unchanged HUD icons retain their DOM while a finger is held',()=>{let writes=0;const el={set innerHTML(_:string){writes++}} as HTMLElement;stableMarkup(el,'<svg/>');stableMarkup(el,'<svg/>');assert.equal(writes,1);stableMarkup(el,'<svg>new</svg>');assert.equal(writes,2)});
