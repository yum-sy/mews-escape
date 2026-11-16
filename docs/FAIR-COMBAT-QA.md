# Early-floor encounter fairness — 2026-11-16

- B6 combat rooms: 2–3 enemies; B5: 3–4. Later floors retain their existing enemy counts.
- Gengar HP by B6–B2: 90 / 180 / 300 / 440 / 580. Mewtwo's three HP pools remain unchanged.
- B6 Gengar: 6 then 8 radial shots, speed 175, 1.05 s warning; no phase-two pool. A phase change cancels charging, clears hostile shots/pools, and grants a 1.2 s boss recovery before the next warning.
- Arrival: 0.65 s mutual freeze, facing/recognition nod and !. Player movement, firing, interactions, enemies and hazards remain inactive together. Cleared rooms do not freeze. Spawn relocation excludes the landing, actual doorways, solids and other enemies.
- Post-hit: 1.35 s immunity, character pulse, brief red edge flash and camera shake; reduced-motion preference suppresses shake.
- Props: deterministic 6% one-heart recovery / 2% key drop. Pickups hop out and collect by proximity; full-health recovery stays on the floor. Destruction and consumption are checkpointed, including in uncleared rooms. Old saves without the optional loot field remain compatible.
- Attack cues: destination Pokémon silhouette plus actual projectile-direction arrows; Mewtwo aim is locked when the cue begins. Koffing stops during its charge and fires along the displayed eight directions.

Validation: 102 automated tests passed; production build passed. Coverage includes early caps, all floors and five entry positions over 100 seeds, phase cancellation, exact warning/projectile direction agreement, repeated-hit immunity, arrival freeze, 40,000 drop rolls and save/reload consumption. Browser visual QA confirmed Gengar's destination silhouette and outgoing arrows. Browser fixtures are development-only.

Limitations: automated play uses a controller that sees actor/projectile positions; it does not establish a human win rate or physical-phone performance.

Normal-rules browser campaign (seed 151, focused policy) reached B5, then was stopped manually. B6 boss-room dwell was 14.4 seconds including reward/exit; B6 had one selected technique before the boss (the controller skipped Tri Attack). 0 hits in this automated run. Evidence: `evidence/fair-combat-campaign.json`, `evidence/fair-combat-telegraph.png`. No claim of physical mobile-device testing.
