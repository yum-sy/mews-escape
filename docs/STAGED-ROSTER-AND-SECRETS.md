# Staged roster and optional research branches

## Roster

32 ordinary species, 9 laboratory-only bosses, and fixed B1 Mewtwo. New boss candidates: Hypno, Magneton, Marowak, Mismagius. Main B6–B2 bosses remain a seeded no-repeat selection of five; B4/B3/B2 bonus bosses use three different members of the four remaining candidates. Saved seeds reconstruct the same current-version roster.

| Floor | Available ordinary species | Share of the original B6 group |
| --- | ---: | ---: |
| B6 | 7 | 100% |
| B5 | 15 | 34% |
| B4 | 23 | 16% |
| B3 | 29 | 9% |
| B2 | 32 | 7% |

B6 pool: Gastly, Zubat, Grimer, Ekans, Sandshrew, Slowpoke, Wooper. Each species has a declared unlock tier. Older tiers retain weight 0.58^age, with a 0.12 minimum per species. Elite branches use 0.36^age and boost newly unlocked species by 1.5. Draws are deterministic for room seed and spawn index. Enemy counts remain B6 2–3, B5 3–4 and the existing later-floor counts.

Enemies reuse readable behavior families with species-specific visuals and timing: lane rush, aimed shot, fan, radial burst, poison trail, teleport ambush, cardinal/diagonal volleys, limited tracking, returning bones, and Ditto's mirrored movement. New attacks retain warnings. The new returning-bone pattern has its own one-time hint.

## Optional route

Read two different cleared-room terminals on one floor to unlock its cache. Re-reading one terminal does not count twice. The cache offers three distinct eligible technologies, one free selection plus a key. The normal dungeon is kept intact while visiting. Leaving consumes that floor's entrance, including when retreating before claiming everything; return interaction explicitly warns that re-entry is unavailable.

After resolving the cache reward on B4/B3/B2, a second entrance costs two keys. This small optional floor has a safe entry, an elite combat room and a boss. Regular enemy HP is 1.35x and movement 1.06x the main-floor setting; boss HP is 1.30x. Bonus boss rewards draw three options from the full technology pool, rather than two from the restricted normal boss pool. Return is free from cleared rooms; the boss's cleared central lift also returns to the main floor. Main and branch maps stay separate. B1 and its ending remain untouched.

Checkpoint extension is optional for legacy saves. Branch saves contain a bounded parent checkpoint, preserving the original rooms, map, rewards and return point. Keys, acquired moves and health carry back. The spent entrance prevents repeated farming. Ascent resets the secret opportunity for the new floor.

## Assets and verification

30 new official artwork PNGs and PokeAPI metadata are present. Source URLs, hashes and ownership notes are in public/assets/artwork-sources.json and CREDITS.txt. Runtime lossless WebP files decode to identical RGBA pixels and preserve bounds/resolution; originals remain in the repository. New image payload: 4,429,732 → 2,763,642 bytes (38% smaller). The existing offline-cache builder excludes PNG duplicates when a WebP exists.

131 tests: staged distribution over 100,000 draws, locked species exclusion, unchanged early crowd sizes, seeded boss selection, spawn/scenery clearance, warning consistency, real-scene route interactions, free reward/cost/retreat rules, duplicate entrance prevention, separate map state and nested save restoration. Production build and diff check pass.

Browser QA: inspected all 32 ordinary and 9 boss images plus Mewtwo in the development gallery; at 844×390 used real interaction controls to read the second record, discover the cache, select a three-option reward, spend two keys, reload and continue inside the closed floor, and return to the original B4 map with the acquired move and remaining keys. Verified the mobile three-card layout. Evidence: evidence/secret-reward-mobile.png (local only).

This is targeted automated/UI QA, not a full B6-to-ending human replay, physical-phone benchmark, or exhaustive balance assessment of every composition.
