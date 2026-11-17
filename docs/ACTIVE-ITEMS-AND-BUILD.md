# Active items and compact build inspection — 2026-11-17

The main technique is a borderless image/name at the health row. Tap it to pause and read all learned techniques, their ranks/effects and currently applicable fusion mechanics. Closing or Escape resumes without clearing enemies or projectiles. Extra technique badges are no longer displayed over the arena.

Active inventory starts with zero of both items and capacity one each. Pickups fill missing stock first. Only a pickup when stock equals current capacity expands both stock and capacity by one. Reflector has a hard maximum of four; Substitute has a hard maximum of two. Usage consumes exactly one of the selected item. At the hard maximum the pickup remains on the floor. Inventories and capacities are independent and saved. New runs reset both to zero; older checkpoints migrate their existing charge to the selected item's usable count.

Breakable props retain deterministic 6% health / 2% key drops, adding 3.5% Reflector / 1.5% Substitute. Before Substitute unlock, that roll provides Reflector. The floor-map cache retains priority. Collected loot uses the existing persistent consumed bit and cannot be farmed by reload. Combat clears no longer recharge items. The already-unlocked paid stabilization device restores one current-item use within capacity (and health), once per floor; it does not expand capacity.

The selected active item sits above the attack stick. The touch target is transparent; only its outline and count/capacity are drawn. Reflector uses a shield. Substitute uses the exterior alpha contour of PokeAPI's substitute sprite, not a generated replacement.

Source: https://github.com/PokeAPI/sprites/blob/master/sprites/pokemon/substitute.png
Downloaded original: assets/sources/substitute-pokeapi.png (96×96, opaque bounds 33,33–63,63).
Derived outline: src/hud-symbols.ts and public/assets/decoy-outline.svg. Sprite remains Pokémon artwork; availability through PokeAPI is not a claim of unrestricted commercial licensing. No new raster artwork generation. Small local SVGs are included in offline caching.

Validation: 170 automated tests, including independent zero-start inventories, refill versus overflow growth, both hard caps, pickup persistence, malformed save rejection, prior checkpoints and existing combat regressions. Browser checks cover compact HUD, readable/scrollable build inspection and resume, actual prop destruction and pickup, outline buttons and counts.

## Paired controls and readability follow-up
Both item buttons now appear side by side above the aiming pad, each with a transparent 52×56 touch target; shield artwork is 36px and Substitute artwork 33px. Each button directly uses its own stock. A second item cannot replace an already-running effect or consume stock while blocked. Space retains the last-used/default selected item.

The aim instruction is inside the pad. HP is labelled to the left of the segmented health bar without increasing total top-row width. Critical HUD labels use pale text, four-direction 1px dark edging and a short shadow rather than extra panels.

171 tests pass. Browser QA at 667×375 and 390×844 confirms alignment, no console errors, Reflector 4→3 while Substitute remains 2, and Substitute 2→1 while Reflector remains 4.

### Mobile simultaneous input follow-up (2026-11-17)
- Pad-to-item target gap increased to 24px; item target gap to 16px. Counts sit above the 52×56px targets; aiming hides the in-pad instruction.
- Touch pointer-up activates each item independently, including secondary fingers. Compatibility clicks cannot spend twice; cancellation, dragging and long-press help do not spend stock.
- Real Controls harness verifies movement + captured aim beyond the pad + third-finger activation, independent releases and cancellation. Browser review verified 667×375 and 390×844 layout, plus actual reflector 4→3 and substitute 2→1 in 844×390 combat. No browser errors.
- 174 tests and production build passed. This is simulated input/browser-size verification, not a physical handset ergonomics test.
