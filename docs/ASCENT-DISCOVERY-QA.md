# Ascent, discovery and reward review — 2026-11-16

## Encounter curve

Combat counts are B6 2–3, B5 3–4, B4 4, B3 4–5 and B2 4–6. A second laboratory hazard begins at B3. Enemy HP and boss HP remain the prior curve (Gengar 90/180/300/440/580; Mewtwo 420/520/640).

Gengar's phase-one/phase-two lanes are 6/8, 7/9, 8/10, 9/11 and 10/12 from B6 through B2, with shot speed 175/185/195/205/215. Warnings last at least one second. It now flanks the last observed player position at 150–190 world units, instead of alternating between two fixed points. The destination and radial aim lock when the warning starts, remain inside the arena and preserve a minimum initial separation. Phase-change recovery and projectile clearing remain in place.

Mewtwo retains its three phases. Projectile previews last 1.05 seconds, tracking shots are purple, and tracking ends after 0.9 seconds. Beams have a separate one-second lane warning. Poison pools are hatched with an X and a short label for a full second before activation. Gastly/Houndour now hold still and show locked firing directions for 0.6 seconds; Shuppet previews its destination and outgoing shot for 0.8 seconds.

Screen-scaled cue strokes remain at least 2.5 px and labels at least 13 px for 667×375, 844×390 and 932×430. Actual 844×390 browser screenshots cover Gengar, Mewtwo tracking/beam warnings, first-pattern hints and two-choice rewards. This is viewport testing, not physical-phone performance testing.

## Persistent first-pattern help

A short, right-side tutorial pauses simulation when a mechanic first appears. Confirmation is stored separately from the run in `mews-escape.pattern-hints.v1`; normal restart/death does not erase it. Repeat attacks keep their spatial warning but do not repeat the instructional card. If storage is unavailable, the in-memory set still prevents repetition during the session.

## Floor maps

Every exploration floor B6–B2 has one deterministic map cache in an existing breakable object, independent of drop rolls and keys. B1 is one already-visible final arena. Picking up the cache reveals all room types and connections on that floor. Map acquisition is saved and resets on ascent. A map can also appear as a reward; it is a floor item, not a permanent combat upgrade. Old `survey` inventories migrate to a current-floor flag and no longer reveal later floors. Icons distinguish combat, rewards, props/cleared rooms and bosses. Hold-help explains the symbols.

## Traps and rewards

Laboratory laser/gas/electric hazards damage and recoil both the player and enemies. Enemies lose 18% max HP (minimum 4) per hit and receive 1.35 seconds of trap recovery. Recoil follows collision geometry. Powered-off/cleared rooms do no trap damage. Enemy-created poison pools and Mewtwo beams remain attacks, not friendly-fire laboratory traps.

Treasure/boss offers have two distinct choices when the pool permits. Normal combat-room drops are 8% technique capsule, 47% none, 25% key and 20% recovery. Capsules retain the one-key cost; a picked technique does not heal. Rare weights are 0.4 early / 0.65 later versus ordinary 1; special damage items are 0.75. Over 10,000 seeds with an empty inventory, at least one rare option appears in 28.72% of B6/B5 treasure offers and 41.27% of B4–B2 offers. These are empirical offer rates, not a guarantee for a particular run.

First Shadow Ball/Psybeam/Agility and damage-over-time upgrades are modestly stronger. Single-item expected direct DPS stays within +30%; all previous coverage penalties, diminishing returns, status caps and healing budgets remain. Utility rewards show their effect instead of misleadingly reporting only unchanged direct damage.

## Validation and evidence

114 automated tests pass, including map cache guarantees over 2,500 floors, current-floor save/migration, hint persistence/storage failure, player/enemy trap recoil and recovery, locked projectile previews, Gengar destination bounds/variety, minimum mobile cue sizes, reward distribution and DPS ceilings.

An initial normal-rules automated run reached B4 and failed there. This identified the abrupt combination of higher enemy count and two hazards, which was softened as described above. Further results below distinguish normal campaigns from explicitly configured solo-boss scenarios. Controllers can inspect actor/projectile positions; they are not human win-rate measurements.

Final browser evidence (local files under `evidence/`):

- B5 isolated boss: 20.3 s, 4 starting upgrades, 1 hits, 5 HP remaining.
- B4 isolated boss: 29.9 s, 7 starting upgrades, 0 hits, 6 HP remaining.
- B3 isolated boss: 40.8 s, 10 starting upgrades, 0 hits, 6 HP remaining.
- B2 isolated boss: 49.2 s, 13 starting upgrades, 0 hits, 6 HP remaining.
- Mewtwo isolated scenario: 16 starting upgrades, all three phases and ending completed; phase durations 31.9 s, 40.4 s, 48.9 s.
- Revised normal campaign: B6 → B5 → B4 bosses cleared, reached B3 and stopped manually at 433.2 s with 3/6 HP and 10 earned upgrades. This was not a full normal campaign ending clear.
- Solo scenarios configure starting HP/build and pre-clear other rooms; combat itself uses normal damage, invulnerability and enemy AI. Their results must not be represented as organically obtained builds or human difficulty measurements.

Final 667×375 UI check: both reward cards fit; expanding details scrolls within the panel and the skip button remains reachable. A 700 ms press on the minimap displayed its room-type legend. Local proof images: `evidence/rewards-mobile-final.png`, `evidence/map-legend-mobile-final.png`, `evidence/mew-ascent-mewtwo-beam.png`. Final production build succeeded; development fixtures are absent from the generated production bundle.
