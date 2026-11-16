import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NORMAL_KINDS,ENEMIES} from '../src/data';
import {encounterWeights} from '../src/encounter-pool';
import {ENEMY_TECHNIQUES} from '../src/enemy-techniques';
import SPECIES from '../src/species.json';
import ARTWORK from '../src/artwork-frames.json';
const replacements=['skorupi','drapion','stunky','skuntank','spinarak','ariados','trubbish','garbodor','spiritomb','inkay','malamar'] as const;
test('themed replacements use verified poison, ghost, dark or psychic species and retain staged counts',()=>{
 assert.equal(NORMAL_KINDS.length,32);for(const kind of replacements){assert.ok(NORMAL_KINDS.includes(kind));assert.ok(SPECIES[kind].types.some(t=>['poison','ghost','dark','psychic'].includes(t)));assert.ok(ARTWORK[kind].file.endsWith('.webp'));assert.ok(ENEMY_TECHNIQUES[kind].name)}
 for(const retired of ['sandshrew','sandslash','slowpoke','slowbro','voltorb','electrode','wooper','quagsire','porygon','baltoy','bronzor']){assert.ok(!Object.hasOwn(ENEMIES,retired));assert.ok(!Object.hasOwn(ARTWORK,retired))}
 assert.deepEqual([6,5,4,3,2].map(f=>encounterWeights(f).length),[7,15,23,29,32]);
});
