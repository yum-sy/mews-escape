# Exploration and combat quality expansion — 2026-11-17

## Implemented
- Twelve laboratory obstacle layouts, with reachable central and cardinal-door routes.
- Complementary enemy roles within the existing sampled floor tiers. Terrain enemies capped at one on B6/B5 and two later. Early encounter counts remain unchanged.
- Optional exploration: finding and defeating the floor boss permits ascent without clearing side combat rooms. Hidden dual-boss rooms still require both bosses.
- Medical reward rooms offer two techniques or two health, using the same one-key opening cost. Claiming recovery consumes the reward. Boss pools expanded; hidden rewards retain their rare pool.
- Three archived research records unlock a start-room stabilization device: two keys buy two health and a full active charge, once per floor.
- One active slot: Reflector blocks projectiles for two seconds; Substitute unlocks after the first laboratory boss and redirects targeting for 2.8 seconds. Three newly cleared combat/boss rooms recharge it. Change skill only in a cleared room.
- Horizontal unlocks: first boss → Substitute, hidden dual boss → expanded resonance boss pool, three distinct records → stabilization. No permanent damage/health bonus.
- Actor motion adds restrained movement squash, flying lift, recoil and responsive shadows without moving collision geometry.

## Fusion tradeoffs
- Fire + cold: direct damage ×0.75; bank one third of actual direct damage (cap 4 per target), released once when attack is released. Nearby targets share 30% of that discharge; this does not duplicate damage.
- Water + electricity: direct damage ×0.9; chain only through wet targets, with the existing total chain budget shared over up to three targets.
- Poison + drain: direct damage ×0.9; weak initial siphon (×0.35), stronger siphon on already-poisoned targets (×1.6).
- Shadow + ricochet: direct damage ×0.85; first wall reflection adds penetration and ×1.15 damage, with less homing. Continuous paths boost only targets hit after reflection.

## Persistence and validation
Legacy checkpoints default to Reflector and full charge. New saves include active selection/charge, unlocks, and stabilization use; browser-wide unlock archive remains separate from the current run. Existing topology and room indices remain compatible.

164 automated tests pass, including room connectivity, all-door safe entry, tier preservation, reward exclusivity, legacy saves, actual-scene fusion accounting, active gating and projectile shielding. Production build succeeds; the existing bundle-size warning remains.

Targeted browser QA at 844×390 and 667×375: medical recovery, key consumption, stabilization, Reflector, fusion release, skill selection, pause layout and checkpoint reload. Reload restored health 5/6, two keys and 3/3 charge. No browser console errors during final review. This is not a complete human B6-to-ending playthrough or a physical-phone performance certification.

## 2026-11-24 mobile grip, cues, fusion ornaments and score
- Thumb pads use a 52–88px responsive inset (narrow portrait clamps to prevent overlap), 36px bottom clearance and lighter backing. Item row follows the same center; counters remain separate. Checked at 667×375, 844×390 and 320×640 browser sizes; physical handset ergonomics remain unverified.
- Telegraph opacity is 0.75 / 0.45 / 0.24 by encounter familiarity. From encounter two, remove arrowheads, destination ghosts and area hatching; preserve short path cues, charge times, phase/arrival signals and active damage-area presentation.
- Dominant fusion no longer hides later fire/ice, drain, water, shadow, star, tri-element and wave ingredients. Secondary ornaments are capped at three ingredients per sample and cycle through longer builds. No added damage carriers or stat buffs.
- Original eight-bar infiltration score, pulse-wave melody, chromatic replies, walking bass, floor tempo progression and three escalating final phases. Reference context: https://bulbapedia.bulbagarden.net/wiki/Team_Rocket_HQ . No external soundtrack recording or melody imported. Local listening preview is a normalized score render; browser synthesis/compression differs slightly.
- 177 tests and production build passed, including late-ingredient visibility, bounded rendering geometry, all floor/phase score events, music voice lifecycle and multi-touch regression coverage. Browser music toggle and attack effects ran without console errors. Dev comparison gallery is excluded from production.

## 2026-11-24 — Seeded exploration events

- Combat rooms combine the existing twelve furniture layouts with four deterministic perimeter-wall variants. These are physical structures, not new liquid-floor damage.
- About a quarter of eligible side-door combat rooms have a six-section iron-mesh partition. Each section breaks on normal weapon contact; no key or specific upgrade is required. The middle section opens a usable passage to the side door. Destroyed sections persist separately from the four original prop IDs, preserving map-cache and loot identities.
- Some combat rooms contain one marked trap crate. Open it with the nearby action button or attack it. An existing Pokémon emerges with 1.2 seconds of recovery/contact grace. The creature persists across leaving/reloading until defeated, and grants one reflector drop. Ordinary room rewards are not reset. Previously cleared rooms allow active-item use during this optional ambush; defeating its last creature clears residual enemy attacks.
- New optional annex: clear a combat room, disable its power, and investigate/break all four props, defeating any released creature. Its terminal opens a three-room branch (entry, guarded specimen room, rare reward room). The specimen roster includes existing Ditto/Spiritomb and later Sableye/Drapion/Malamar/Garbodor/Sneasel/Exeggutor. No original monster art was added.
- Entering the annex adds one persistent alert level; taking its rare reward adds another. Free return is available in cleared branch rooms. Cache/depth routing remains available via records; when both entrances qualify the player can choose, with only one secret route consumed per floor.
- Interaction reach increases from 72 to 88 world pixels; floor-item collection from 30 to 44. Solids block remote interaction/collection. Boxes get an explicit nearby Open action without requiring a tap in the center of the arena.
- Saves retain cages, ambush defeat and claimed loot. Legacy saves with already-broken trap candidates suppress retroactive ambushes and duplicate new drops.

Validation: 193 tests plus production build. Includes seeded combined-geometry reachability after breaching a cage, actor spawning, actual scene crate release/defeat, active-item availability during cleared-room ambushes, annex return/reload/alert, and legacy migration. Browser QA at 844×390 used real directional fire to cut a section and walk through, the nearby Open button to release and defeat a crate creature, and the new terminal to enter the annex and encounter Spiritomb. Browser console had no errors. Physical-device multitouch was not retested in this pass; existing pointer regression tests pass.
