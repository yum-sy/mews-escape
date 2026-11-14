# Balance pass — 2026-11-15

## Problem

Full-strength 3/5-shot volleys multiplied additive damage, faster firing, penetration, splitting, chain and splash. Children inherited chain/splash/pierce/healing, and each piercing hit triggered secondary damage again. This overwhelmed early enemy HP.

## Changes

| Mechanic | Before | Now |
| --- | --- | --- |
| Triple/five-shot direct volley | ×3 / ×5 | ×1.5 / ×1.667, divided among bolts |
| Psybeam damage per pickup | +0.7 | +0.3 before volley division |
| Shadow Ball | +0.35, +2 pierce | +0.22, +1 pierce |
| Minimum firing interval | 0.09 s | 0.13 s |
| Piercing | full damage on every hit | subsequent direct hits retain 80% each |
| Chain | 55% per target, every hit | 30%, first hit only |
| Splash | 45%, every hit | 25%, first hit only |
| Split | 2 × 55%, inherits secondary triggers | 2 × 35%, no secondary triggers/pierce/bounce/heal; DOT halved |
| Max slow | 65% | 45% |
| Crit | +20% per pickup, ×1.8 | +12% per pickup, ×1.6 |
| Drain per pickup | 1 HP / 30 direct damage | 1 HP / 90 direct damage |
| Early enemy HP | 3–8 | 5–12 |
| Enemy bullet speed | 180 | 220, then floor scaling |
| First attack cooldown after entry grace | 1.4 + 0.35 × enemy index | 0.5 + 0.15 × enemy index |
| Gengar base HP | 180 | 220 |
| Additional Gengar floor factor | 1 + 0.35 × floor index | 1 + 0.15 × floor index, to avoid a late-game HP wall after damage nerfs |

Burn, poison, homing, knockback and fire-rate pickup values are also lower; reward descriptions match the new values. Input controls, visuals, reward selection flow, clear healing and entry invulnerability are preserved.

## Quantitative guardrails

- Seven early upgrades in the direct-damage/fire-rate/crit families are enumerated in tests: peak expected direct DPS must remain below 24, but above three times baseline. This assumes every pellet hits; real spread/misses lower realized damage.
- A complete legal build stays below eight times baseline direct DPS. This excludes DOT and secondary damage; it is not a total-damage or win-rate guarantee.
- Example: two Tri-Attacks + three Psybeams + two Agilities previously gave ~129.2 direct DPS. It now gives ~21.1 direct DPS, with the same five projectiles on screen.
- Normal early-game browser combat was checked, but a full five-floor manual run has not been completed. This is an initial difficulty correction, not a claim of final calibration.
