# Balance pass — 2026-11-15

## Attack composition

The first acquired offensive body remains primary. Distinct mechanical families coexist: projectile, sustained flame, beam, water stream, tether, pulse and arc. Same-family moves accumulate modifiers. One family receives 100% of the direct damage budget; multiple families divide it into 55% primary and 45% shared auxiliary damage. Secondary families have one lane; the primary retains multishot. Tick rates normalize against the original shot interval, so faster beam ticks do not multiply DPS. Burn/poison use max strength with refreshed duration, not additive damage per layer.

Tri Attack still retains only 65% / 50% total volley damage at ranks 1 / 2. Swift retains 55% / 40%; together these multiply to 35.75% / 20%. These intentionally severe single-target penalties remain. Piercing retains 80% per later contact; chains deal 30%, splash 25%, splits two times 35% with no recursive procs, no healing and half DOT. Crit, rate and healing caps remain unchanged.

A player can now decline a reward without receiving its HP recovery. Previously late focused builds exhausted other upgrades and were forced to acquire Tri/Swift, sharply reducing damage. The skip is consumed and saved just like an accepted reward.

## Floor health and entry safety

Normal enemy HP multiplier is `1 + 0.4L + 0.075L²` for `L = 6 - floor`. Gengar uses explicit HP 180 / 270 / 380 / 520 / 680 for B6 through B2, instead of multiplying its base HP by two escalating factors (previous B2 about 1,957 HP). Mewtwo has 420 / 520 / 640 HP. Patterns, increasing speed, environmental hazards, enemy counts and no automatic healing between Mewtwo phases remain.

Entering a room grants the existing 1.2-second safety window. Firing ends both entry invulnerability and the enemies' waiting period immediately. Ordinary damage invulnerability remains separate.

## Repeatable arithmetic audit

Run `node --import tsx scripts/balance-audit.ts`. Thirty seeds per policy, rewards in room-number order. Median ideal stationary boss seconds:

| Policy | B6 | B5 | B4 | B3 | B2 | Mewtwo total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Focused, previous forced choices | 20.0 | 23.9 | 32.2 | 46.0 | 244.0 | 280.5 |
| Focused, current with skip | 16.4 | 15.4 | 16.2 | 19.0 | 24.9 | 57.9 |
| Coverage, previous | 48.4 | 91.3 | 124.7 | 171.7 | 244.0 | 280.5 |
| Coverage, current | 39.6 | 58.7 | 62.8 | 71.1 | 84.8 | 196.9 |

This is not a playthrough or a win-rate estimate: every direct lane hits, crit is expected value, DOT has 100% uptime, and secondary targets are excluded. Short-range layers, movement, cover and accuracy make real combat different. Runtime observations belong in PLAYTEST-QA.md. The deliberate coverage tradeoff should remain visible against a lone boss.
