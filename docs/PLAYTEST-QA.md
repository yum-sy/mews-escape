# Runtime balance, interaction and mobile pass — 2026-11-15

## Method and boundaries

`?campaign&seed=3` in the local development build exposes an automated controller. It uses production movement, aiming, interaction, reward and save APIs; it does not grant HP, invulnerability, damage or room completion. It sees enemy and projectile coordinates and the dungeon graph, so these are expert automated runtime observations, not human difficulty or physical-phone tests. Development controllers are excluded from production.

A focused run covered B6 through all three Mewtwo phases and the ending. At B4 the first controller became stuck aiming through a desk; its navigation was fixed, and the normal saved B4 entry checkpoint was resumed. The replayed room and discarded 58 seconds are not an uninterrupted run. Save restoration preserved the 15 acquired upgrades and HP 6. No later checkpoint rewind was used.

## Focused run

Seed 3, 34 normally acquired upgrades, 168 enemies defeated, final game clock 567.8 seconds. Two hits were recorded across the two test segments; reward/drain recovery produced HP 6 at the end. This single omniscient-controller result is not a completion-rate estimate.

| Encounter | Observed game seconds |
| --- | ---: |
| B6 Gengar room | 13.4 |
| B5 Gengar room | 15.4 |
| B4 Gengar room | 16.1 |
| B3 Gengar room | 21.3 |
| B2 Gengar room | 26.9 |
| Mewtwo phase 1 | 15.1 |
| Mewtwo phase 2 | 20.1 |
| Mewtwo phase 3 | 24.1 |

Gengar measurements include room positioning and elevator approach. Mewtwo measurements use the active game clock; dialogue time is excluded. The gradual rise avoids the previous late-floor HP cliff. The focused policy skipped Tri/Swift when only undesirable choices remained. Every acquired family remained present, ending in seven simultaneous families. Formula-only 30-seed coverage comparisons and their limitations are in BALANCE.md.

## Coverage comparison

The same seed's coverage-first policy reached B5, five of six combat rooms cleared, before the comparison was stopped at 200.8 game seconds. It had 14 acquired upgrades and five recorded hits. Its B6 Gengar room took 38.4 seconds versus 13.4 for the focused policy. This is an observed tradeoff, not a controlled single-variable comparison: reward choices change the primary body, statuses and later options as well as multishot/homing. Coverage was not run through Mewtwo; the 30-seed later-floor numbers are arithmetic projections only.

## Performance and controls

The old RAF limiter measured median 17.8 ms / p95 26.6 ms on this 120 Hz Mac browser. After switching to Phaser's 60 Hz timer scheduler, the B4-through-ending segment recorded 23,276 active frames: median 16.7 ms, p95 18.1 ms, p99 19.2 ms, none above 33.34 ms. Hidden time and intervals above 500 ms are excluded. This includes controller overhead and is not a phone benchmark.

Maximum-build stress (seven families, sound enabled, stationary player, invulnerability and very high enemy HP strictly for performance) measured 2,327 desktop frames at median 16.7 / p95 17.8 / p99 18.4 ms. At 844×390 on the same Mac, 3,137 frames measured 16.7 / 17.9 / 18.4 ms. These viewport measurements do not emulate a phone CPU or GPU.

A live resize regression was found: `refresh()` reused old parent bounds, leaving a 1152×720 canvas cropped inside an 844×390 viewport. Reading parent bounds before refresh plus observing container/visual-viewport resize fixes it. Measured final canvas bounds: 624×390 at (110,0) for 844×390, 390×243.75 at (0,300) for portrait 390×844, and 1024×640 at (0,64) for tablet 1024×768. The 100×100 landscape sticks sit outside the playfield. Reward cards and skip remain visible; skipping removes the pending capsule without adding a move. Small-screen counters no longer overlap door hints. Split projectile decorations are dimmed to preserve enemy-bullet visibility.

Movement sticks now provide proportional speed; aiming retains arbitrary angles. Reset releases pointer ownership so returning from pause/blur accepts a new finger. Tests cover independent pointers, wrong-pointer events, cancellation, capture loss, re-entry and keyboard diagonals. A touch event reveals controls on hybrid devices.

## Visual and interaction changes

Crates/canisters are now roughly 50–60 game pixels with distinct silhouettes, shadows and real collision. Breaking one removes its collision and preserves debris in saves. Door frames show corridors, sliding panels, locks, direction and destination labels. The breaker and reward capsule are larger. Door landings and central reward access are tested across 250 generated floors. Record hints no longer advertise an interaction while combat blocks it.

## Release checks

61 unit/property tests pass, covering retained Tri/Swift damage penalties, bounded fusion lanes and conserved damage budgets, geometry, audio voice cleanup, saves, doors and input. TypeScript and production build pass. Production exclusion of both development fixtures and deployed artifact verification are checked before release.

Physical iOS/Android sustained performance, native multitouch feel and installation cannot be certified from a desktop viewport. Additional human runs across seeds are needed to estimate difficulty and win rates; this pass establishes functioning full progression and measured regressions rather than claiming universal balance.
