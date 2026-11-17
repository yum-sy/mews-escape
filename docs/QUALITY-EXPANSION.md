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
