# Random laboratory bosses

B6–B2 use a seed-based permutation of Gengar, Weezing, Muk, Houndoom and Banette. No repeats within a run; saved games regenerate the same roster. B1 retains the existing three-stage Mewtwo encounter. Existing saves use their original seed to assign the new roster.

All laboratory bosses use the existing floor HP curve and normalized half-health transition, with a recovery pause. They share at least 1.05 seconds of attack warning. Gengar retains flanking teleport/radial attacks; Weezing uses radial volleys; Muk places warned poison pools and fans; Houndoom alternates fans with a locked-direction dash; Banette teleports and uses fans with limited tracking in phase two. Official artwork files and metadata sources are recorded in public/assets.

Validation: 119 automated tests passed, including 1,000 seeded rosters, save restoration, all-floor candidate spawn checks, locked warning/shot directions, phase cancellation, distinct mechanics and asset hashes. Production build passed. Browser review at 844×390 confirmed all four new images, actual boss names, directional warnings, teleport ghosts and poison-pool warnings. Screenshot: evidence/random-boss-mobile.png (local only). Browser checks used the development preview fixture; this is not a complete manual campaign or a physical-phone performance test.

## 2026-11-24 — Boss identity and prop contact audit

- Magneton: four cardinal electric lanes; below half health alternate diagonal lanes. Broad gaps stay open instead of increasing bullet count.
- Hypno: slow psychic fan; below half health alternate a split pair with a central gap, with short-lived tracking.
- Marowak: two returning bones become four separated return paths below half health.
- Weezing: alternating radial/front-back volleys; below half health adds short-lived lateral gas capsules on alternate casts. B6 uses smaller capsules.
- Muk: targeted sludge and a line of eruptions; below half health adds a side pool (smaller on B6).
- Houndoom: fire fan alternates with a locked rush; below half health the rush leaves independently warned fire pools beside its starting position.
- Banette: alternating teleport/stationary curses; below half health the stationary cast also marks the player's position with a warned curse pool.
- Mismagius: teleporting opposed fans become a rotating four-way curse with brief tracking below half health.
- Gengar: existing teleport/radial/fan pattern retained; later floors add warned pools below half health. B6 remains free of this extra hazard.
- Mewtwo: retained the existing three distinct phases, nearby flanking and warned phase-three beams.

No boss HP increase. The existing 1.2-second phase transition clears hostile bullets, zones and pools. New casts retain at least one second of warning and snapshot targeting. Small-screen browser review (667×375, touch controls shown) checked Weezing gas and Magneton lane gaps; this is viewport QA, not physical-device playtesting.

Prop bug: solid rectangles and circular break checks disagreed at corners. Channel traces also omitted their final contact segment, leaving a gap between the beam and break test. Swept rectangle contact now defines both path termination and break detection, including point-blank starts. Regressions cover six channel weapon types from 32 angles, corner projectiles, true misses, and wall occlusion. Full suite: 184 passing tests; production build passes.
