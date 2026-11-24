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

## 2026-11-24 — Live overlap and combination follow-up

Policy: occasional hard overlaps are intentional opportunities for reflector/decoy use. Do not guarantee that movement alone solves every late-game situation. Prioritize repeated early-floor lockouts, missing warning, and situations that offer neither movement nor item counterplay. Reflector blocks bullets, not beams or floor hazards; decoy changes future targeting, not attacks already locked.

Browser QA used keyboard movement + directional fire in the actual Phaser scene at 844×390. Development controls selected boss rooms, representative floor builds, two reflectors/one decoy, and the below-half-health state. Five-second live slices paused between observations; no player invulnerability or enemy damage override was used during those slices. This is targeted boss-room play, **not a continuous campaign clear**, and not a physical multitouch-device test.

| Scenario | Live checks | Result / limitation |
| --- | --- | --- |
| B6 Weezing | 20 seconds, early and late health, lateral gas plus volleys, reflector | External escape space remained; mistakes took damage. |
| B5 Muk | 15 seconds, early/late sludge lines and side pools, decoy | Returning into residual pools was costly. Did not observe full-arena lockout. |
| B4 Magneton | 10 seconds, cardinal/diagonal late volleys | Movement through diagonal gaps preserved all six hearts. |
| B3 Hypno | 10 seconds, early/late slow tracking volleys | Circling avoided tested volleys without item use. |
| B2 Marowak | 10 seconds, early/late returning bones | Return paths remained readable; one hit during late pattern. |
| Mewtwo phase 1 | 10 seconds, fans and radial overlap | Movement alone avoided tested cycles. |
| Mewtwo phase 2 | 10 seconds, flanking/old tracking bullets, decoy | Future targeting shifted; tested cycles remained navigable. |
| Mewtwo phase 3 | 15 seconds, ring shots + cross beams, reflector and decoy | High pressure, ended with two hearts. Beam strips remained escapable; preserve difficulty. |

No new production defect was reproduced in these short scenarios; this does not establish safety for every seed, location, build, or hidden double-boss encounter. Production balance unchanged.

Prop browser checks: directly fired normal controls at the same corner contact for psychic, icebeam+flame, water+thunderbolt, drain+poison, tri+swift+shadow, ricochet+shadow, flamethrower+ice, psybeam+split. Each scenario visibly reported one of four props broken. Added automated coverage for all ordered two-move builds and supported heavily stacked carriers, using traced channels or swept projectile updates with solid-block stopping. Full suite: 185 tests passing.
