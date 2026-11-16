# Staged roster and optional research branches

## Roster

32 ordinary species, 9 laboratory-only bosses, and fixed B1 Mewtwo. New boss candidates: Hypno, Magneton, Marowak, Mismagius. Main B6–B2 bosses remain a seeded no-repeat selection of five; Each B4/B3/B2 bonus arena now uses two different members of the remaining candidates together; pairs may share a member across bonus floors. Saved seeds reconstruct the same current-version roster.

| Floor | Available ordinary species | Share of the original B6 group |
| --- | ---: | ---: |
| B6 | 7 | 100% |
| B5 | 15 | 15% |
| B4 | 23 | 3% |
| B3 | 29 | 0.6% |
| B2 | 32 | 0.14% |

B6 pool: Gastly, Zubat, Grimer, Ekans, Skorupi, Stunky, Trubbish. Each species has a declared unlock tier. Tier groups are normalized before species selection: current tier 85%, previous tier 12%, all older tiers 3%; at B5 the previous tier receives the full remaining 15%. Elite branches use 95% / 4% / 1% (95% / 5% at B5). Older tiers split their group with 0.25 exponential decay; species within each tier share equal weight. Draws are deterministic for room seed and spawn index. Enemy counts remain B6 2–3, B5 3–4 and the existing later-floor counts.

Enemies reuse readable behavior families with species-specific visuals and timing: lane rush, aimed shot, fan, radial burst, poison trail, teleport ambush, cardinal/diagonal volleys, limited tracking, returning bones, and Ditto's mirrored movement. New attacks retain warnings. There are no blocking pattern tutorials. Directional wind-ups, landing cues and body poses run during live combat.

## Optional route

Read two different cleared-room terminals on one floor to unlock its cache. Re-reading one terminal does not count twice. The cache offers three distinct eligible technologies, one free selection plus a key. The normal dungeon is kept intact while visiting. Leaving consumes that floor's entrance, including when retreating before claiming everything; return interaction explicitly warns that re-entry is unavailable.

After resolving the cache reward on B4/B3/B2, a second entrance costs two keys. This small optional floor has a safe entry, an elite combat room and two simultaneous bosses. Regular enemy HP is 1.35x and movement 1.06x the main-floor setting; each boss starts at 0.85x base boss HP before persistent alert multipliers (combined 1.70x). Ordinary and boss combat rewards draw up to three eligible rare combat technologies only, excluding maps/common upgrades. If all rare combat technologies are maxed, skipping grants three keys instead. Return is free from cleared rooms; the boss's cleared central lift also returns to the main floor. Main and branch maps stay separate. B1 and its ending remain untouched.

Checkpoint extension is optional for legacy saves. Branch saves contain a bounded parent checkpoint, preserving the original rooms, map, rewards and return point. Keys, acquired moves and health carry back. The spent entrance prevents repeated farming. Ascent resets the secret opportunity for the new floor.

## Assets and verification

30 new official artwork PNGs and PokeAPI metadata are present. Source URLs, hashes and ownership notes are in public/assets/artwork-sources.json and CREDITS.txt. Runtime lossless WebP files decode to identical RGBA pixels and preserve bounds/resolution; originals remain in the repository. New image payload: 4,429,732 → 2,763,642 bytes (38% smaller). The existing offline-cache builder excludes PNG duplicates when a WebP exists.

131 tests: staged distribution over 100,000 draws, locked species exclusion, unchanged early crowd sizes, seeded boss selection, spawn/scenery clearance, warning consistency, real-scene route interactions, free reward/cost/retreat rules, duplicate entrance prevention, separate map state and nested save restoration. Production build and diff check pass.

Browser QA: inspected all 32 ordinary and 9 boss images plus Mewtwo in the development gallery; at 844×390 used real interaction controls to read the second record, discover the cache, select a three-option reward, spend two keys, reload and continue inside the closed floor, and return to the original B4 map with the acquired move and remaining keys. Verified the mobile three-card layout. Evidence: evidence/secret-reward-mobile.png (local only).

This is targeted automated/UI QA, not a full B6-to-ending human replay, physical-phone benchmark, or exhaustive balance assessment of every composition.

## Live combat, alert and map update

Entering a depth adds 2 persistent alert points; claiming each elite technology adds 1. Skipping a technology does not add a reward point. Alert persists through retreat, ascent and saves, resets for a new run, and is capped at 12. Per point: ordinary HP +6%, boss HP +5%, movement +1%, projectile speed +1.5%. Mewtwo inherits the boss, movement and projectile multipliers. A complete first branch (two rare choices) leaves alert 4: +24% ordinary HP and +20% boss HP afterward. Warnings and damage-recovery duration are unchanged.

Dual boss openings are staggered. A phase change cancels the other boss's wind-up and gives both a recovery window when shared telegraphs/projectiles are cleared. The HUD aggregates both bosses' health with a stable denominator. Both must die before the room clears.

All first-pattern confirmation dialogs and runtime tutorial pausing were removed. Text attack labels were replaced by the existing ground/direction cues plus distinct rush/caster wind-up and recovery poses. First-contact exclamation marks remain. The minimap uses a monster face for uncleared combat, an empty square for cleared combat and claimed reward rooms, and retains the completed boss lift arrow.

Latest validation: 138 tests and production build pass. New tests cover group-normalized tier probabilities, safe dual spawns, both-deaths-required scene progression, rare-only ordinary/boss rewards including exhaustion and old common offers, persistent alert including Mewtwo HP, live first warnings without input locks, and consumed map markers. Browser at 844×390 verified simultaneous Weezing/Magneton attacks with no tutorial pause, ordinary elite rare choices, alert 2→3 on claim, and all map states. Local screenshots: evidence/dual-boss-live.png and evidence/map-empty-monsters.png. This is targeted QA, not a full human campaign balance replay.

## Laboratory-themed roster revision

Replaced eleven ordinary species with Skorupi, Drapion, Stunky, Skuntank, Spinarak, Ariados, Trubbish, Garbodor, Spiritomb, Inkay and Malamar. All eleven have Poison, Ghost, Dark or Psychic typing in the acquired PokeAPI metadata. This emphasizes toxic, unsettling and hostile-looking research subjects while retaining official artwork, 32 species, unlock tiers, spawn weights and existing HP/speed roles. Technique colors, projectile shapes and sound families match the replacement designs. Boss selection is unchanged.

Replaced Sandshrew, Sandslash, Slowpoke, Slowbro, Voltorb, Electrode, Wooper, Quagsire, Porygon, Baltoy and Bronzor. Their original source files and credits remain archived, but their artwork is excluded from the active manifests and offline precache. New PNG sources and pixel-identical lossless WebP runtime copies are recorded with hashes and source URLs.

Validation: 139 tests, production build and diff check pass. Browser gallery inspection verified all eleven replacement images and attack visuals load. This is an asset/roster revision, not eleven entirely new AI families or a full campaign balance replay. Local evidence: evidence/themed-roster.png.

## Research-subject behavior and fusion readability

The eleven replacement species now dispatch dedicated behaviors before the old family aliases. Skorupi aims a poison needle; Drapion alternates pincer and three-way volleys; Stunky closes to vent a short gas lane; Skuntank vents front and rear; Spinarak weaves one temporary strand; Ariados weaves two angled strands with a middle escape gap; Trubbish lobs one sludge glob; Garbodor lobs three; Spiritomb fires three briefly tracking spirits; Inkay sends paired tracking waves; Malamar fires five returning psychic cutters. Gas users approach effective range before starting their wind-up.

Wind-ups last 0.9–1.1 seconds and snapshot aim; movement remains live. Gas inflates the body, spiders crouch to weave, sludge users lean before the lob, and psychic subjects stretch/sway. Zone visuals show source-to-target movement, then a bounded cloud/net/puddle. Zones use capsule collision, expire after 2.2–3 active seconds, cap at 12, share ordinary hit immunity and recoil, and clear with room transitions/clears. Web contact also briefly slows movement; it is a traversable hazard, never a permanent collision wall. A single graphics batch draws all zones. Enemy-created zones do not replace the environment trap system.

Fusion visuals retain a single damage carrier and all existing damage budgets. Thermal fusion gains contrasting ice shards/fire fins; conductive water gains angular lightning; corrosive fire has toxic bubbles; shadow fusion has a dark core; siphon fusion has leaf/vine edges. Poison/electric/split/reflection accents remain visible on top of the winning recipe. Projectile trails, beam edges and short hit stamps use the same recipe colors and shapes. Stamps cap at 12, particles at the existing 360; no new emitters or fetched artwork. The review gallery displays recipe samples, not six simultaneously equipped attacks.

Validation: 146 automated tests cover all eleven wind-ups/recovery, gas approach range, frozen aim, zone timing/collision/expiry, Ariados escape gap, tracking/return shots, scene hit recovery and hazard cleanup, and distinct finite fusion geometry with one carrier. Production build and diff check pass. At 844×390, browser review checked gas and web silhouettes and six fusion samples; a live Garbodor fixture confirmed attack dispatch, landing effects and damage. Touch-overlay web and fusion screenshots are local in evidence/research-web-mobile.png and evidence/fusion-mobile.png. This is targeted browser/automated QA, not a physical-phone benchmark or a complete human campaign replay.
