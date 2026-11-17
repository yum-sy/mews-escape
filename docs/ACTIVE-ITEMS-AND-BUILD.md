# Active items and compact build inspection — 2026-11-17

The main technique is a borderless image/name at the health row. Tap it to pause and read all learned techniques, their ranks/effects and currently applicable fusion mechanics. Closing or Escape resumes without clearing enemies or projectiles. Extra technique badges are no longer displayed over the arena.

Active inventory starts with zero of both items and capacity one each. Pickups fill missing stock first. Only a pickup when stock equals current capacity expands both stock and capacity by one. Reflector has a hard maximum of four; Substitute has a hard maximum of two. Usage consumes exactly one of the selected item. At the hard maximum the pickup remains on the floor. Inventories and capacities are independent and saved. New runs reset both to zero; older checkpoints migrate their existing charge to the selected item's usable count.

Breakable props retain deterministic 6% health / 2% key drops, adding 3.5% Reflector / 1.5% Substitute. Before Substitute unlock, that roll provides Reflector. The floor-map cache retains priority. Collected loot uses the existing persistent consumed bit and cannot be farmed by reload. Combat clears no longer recharge items. The already-unlocked paid stabilization device restores one current-item use within capacity (and health), once per floor; it does not expand capacity.

The selected active item sits above the attack stick. The touch target is transparent; only its outline and count/capacity are drawn. Reflector uses a shield. Substitute uses the exterior alpha contour of PokeAPI's substitute sprite, not a generated replacement.

Source: https://github.com/PokeAPI/sprites/blob/master/sprites/pokemon/substitute.png
Downloaded original: assets/sources/substitute-pokeapi.png (96×96, opaque bounds 33,33–63,63).
Derived outline: src/hud-symbols.ts and public/assets/decoy-outline.svg. Sprite remains Pokémon artwork; availability through PokeAPI is not a claim of unrestricted commercial licensing. No new raster artwork generation. Small local SVGs are included in offline caching.

Validation: 170 automated tests, including independent zero-start inventories, refill versus overflow growth, both hard caps, pickup persistence, malformed save rejection, prior checkpoints and existing combat regressions. Browser checks cover compact HUD, readable/scrollable build inspection and resume, actual prop destruction and pickup, outline buttons and counts.
