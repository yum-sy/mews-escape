# Unified fusion and reward economy — 2026-11-15

## Reason for the revision

The preceding build added independently targeting weapon families and offered a permanent upgrade plus HP after virtually every combat. A normal run could reach 34 upgrades, combining DOT, splitting, chaining and healing. Dividing direct damage alone did not constrain that growth or visual noise.

## One carrier, fused appearance

There is now one resolved attack carrier, one aim and one damage/collision path per intentional Tri Attack lane. No offset auxiliary weapons are added. Channels take consistent precedence (ice beam, flamethrower, water, drain, pulse, lightning), and all other acquired modifiers fuse into that carrier. Fire + ice produces a cold core with a moving fire edge; water + electricity makes conductive water; poison + fire makes corrosive flame. Shadow and drain have additional mixed signatures. These appearances share the actual hit path. They do not inflict hidden bonus recipe damage. Tri Attack still creates deliberate 3/5-way coverage.

Projectile badges for every acquired status were removed. Two-tone cores/edges carry the combination instead, while the HUD names the recipe. The sound uses the single carrier plus its existing quiet status accents.

## Reward economy

- Normal combat: 55% nothing, 25% key, 20% HP-one recovery. No permanent upgrades. Supplies can be picked up by approaching them or using E. Full-health recovery stays for later.
- Start: one key. Each floor still has two optional treasure rooms.
- Treasure: one key opens the seal. 85% show one item, 15% offer a choice of two. No free reroll; first revealed offers and spent keys persist across room changes and saves. Declining does not refund the key.
- Boss: two modest utility/stat candidates; choose one or decline. Either way, receive one key exactly once before using the lift. There is no boss reward in the final Mewtwo arena.
- No HP recovery on acquiring a technique. Old saves retain their acquired items; their stats use the new caps. Missing key fields default to one.
- Item weights are specific to this game: common 1.0, special 0.6, rare transforms 0.22 on B6/B5 and 0.4 later. These are per-item weights, not guaranteed category percentages.

The structural inspiration is the separation of [normal room-clear awards](https://bindingofisaacrebirth.wiki.gg/wiki/Room_Clear_Awards), [treasure rooms](https://bindingofisaacrebirth.wiki.gg/wiki/Treasure_Room) and [item pools](https://bindingofisaacrebirth.wiki.gg/wiki/Item_Pool). We do not claim Isaac uses our probabilities or that item quality itself is a universal spawn-weight rule.

## Growth bounds

Damage bonuses use `1 + bonus / (1 + 0.65 × bonus)`. Fire-rate improvement also diminishes, with a minimum interval of 0.155 seconds. Every individual first pickup is tested to remain at or below 1.30× baseline expected direct DPS. Burn plus poison caps at 0.9 DPS; max lifesteal is one HP per 220 direct damage (first rank 240). Splits deal 20% each, chain 18%, splash 15%, later piercing hits retain 65%, max two pierces/two chains. Existing severe Tri/Swift direct-damage multipliers remain unchanged.

Enemies and boss HP were not reduced in this revision.

## Repeatable economy audit

`node --import tsx scripts/balance-audit.ts` runs 300 seeds for each of focused and coverage reward policies. It optimistically collects combat supplies before treasure, then boss rewards. This measures the economy and ideal stationary DPS, not route accessibility, actual combat time or win rate. It excludes additional targets and assumes full DOT uptime.

| Focused policy median | B6 | B5 | B4 | B3 | B2 / final build |
| --- | ---: | ---: | ---: | ---: | ---: |
| Acquired upgrades | 3 | 5 | 8 | 11 | 13 |
| Direct expected DPS + DOT | 6.14 | 6.80 | 7.53 | 8.37 | 9.12 |
| Stationary Gengar seconds | 29.3 | 39.7 | 50.5 | 62.2 | 74.5 |

The comparable preceding arithmetic model reached about 27 DPS late. The new focused median is about 9.1. A coverage-first policy finishes at median 15 upgrades and 4.42 ideal DPS; its single-target cost remains substantial. Do not read these projections as measured Mewtwo completion times.

## Verification

68 tests cover reward distribution over 10,000 seeds, pool weights, maximum early-item growth, complete-build bounds, frozen offers, key consumption, old-save compatibility, boss rewards exactly once, fused path conservation, geometry, input, audio and progression. TypeScript/Vite production build also passes. Browser observations for the current build are recorded below after the checks; previous full-run measurements in PLAYTEST-QA.md belong to the preceding economy, not this revision.

### Current runtime observations

A normal-rules automated seed-3 run cleared B6 and B5 without restarting, reaching B4. B6 Gengar room took 34.2 game seconds, B5 49.6 (including boss reward and elevator approach). It left B6 with two upgrades and B5 with five. At 292.8 seconds, B4 room 4, it had six upgrades, HP 4/6 and six recorded hits; the test was stopped for UI checks. Previous economy observations were 13.4 / 15.4 seconds for those boss rooms. This is a different reward/build trajectory, not a controlled same-build DPS comparison. The controller sees enemy positions; it does not estimate human win rates. The new economy has not been rerun through the ending.

In browser QA, opening a treasure consumed its only key. Reload/Continue preserved HP 4, key 0 and the same two revealed candidates. Taking Poison Sting retained HP 4, added only that move and removed the reward. Unit tests also cover the case where another room caps an already-revealed item: no over-cap acquisition and no reroll occur.

The latest 844x390 desktop viewport stress test used all legal upgrades and reported one carrier (five intentional Tri lanes), 3,589 frames: median 16.7 ms, p95 17.4 ms, p99 17.8 ms, no observed console errors. This is not physical-phone performance. The thermal preview visibly shares a blue core and orange moving edge along one trajectory.
