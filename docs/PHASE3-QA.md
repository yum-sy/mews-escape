# Phase 3 verification

## Automated

- 23 tests: input normalization/8-way keyboard/free touch aim, damage invulnerability, connected/reciprocal layouts over 1,000 seeds, 5- and 9-combat-room boss leaves, early boss gate, five-floor ascent with build preservation, reset, reward exhaustion fallback, modifier composition/caps, 6 normal enemy brains, 2-phase Gengar, obstacle corridors, hazard warning/active/idle timing, real-height scaling, enemy projectile reservation.
- TypeScript and Vite production build passed.
- Offline precache generator includes all built JS/CSS, local Pokémon/environment textures, manifest/icon and index.
- Development-only boss fixture is guarded by import.meta.env.DEV; its text/module is absent from the production build.

## Browser checks

- Intro animation, skip and transition to the three-button menu.
- Installation instructions, unsupported-browser fallback and visible offline-cache completion state.
- Menu at 844×390 and install instructions at 390×844. Viewport override reset after inspection.
- Starting the game, room transition, reward selection, 8-way continuous fire, E-key record dialog, pause, return to title.
- Koffing, Grimer, Shuppet and Gastly rendered at different Pokédex-based sizes, props and toxic facility zone present; normal enemy defeat confirmed.
- Local development-only boss fixture: Gengar phase 1 radial bullets and teleport, phase 2 transition and poison pool, combined homing/piercing/splitting/bouncing/status build. Console errors absent. Fixture intentionally grants multiple moves to isolate effect interaction; this is not evidence that a normal run was cleared.
- Production build served at localhost:4173, cache completion observed. Server stopped and independently confirmed unreachable. Browser reload, intro/menu, new game, record reading, room movement, reward selection and combat still worked from the service worker cache.

## Limits

- No physical iPhone/iPad/Android installation test or mobile FPS measurement.
- No full five-floor manual clear. Floor transitions and completion gating are covered by state-model tests; boss rendering/patterns covered by the local fixture.
- No claim of final difficulty calibration. Increasing room count, HP, speed, shot speed, environmental hazard frequency and boss health are implemented; balancing needs play feedback.
- B1 Mewtwo's three-phase fight is scripted, not yet playable.
- Run persistence across refresh/relaunch remains Phase 4 work. Offline installation does not imply save/resume support.

## Animation / effects revision

- Replaced the intro's static sprite stage with Canvas 2D articulated character animation, layered forest/lab sets, camera motion, capture/experiment/collapse/escape staging. Approximately 49 seconds; skip/manual advance and reduced-motion still supported.
- Projectile effects use one batched Graphics renderer, at most 9 trail samples per shot and 360 impact particles. Damage and status modifiers drive size, shape, multicolor trails/orbits, critical/ricochet outlines and enemy status visuals. Gameplay damage/collision rules unchanged.
- Local browser fixture verified flame, ice piercing and multi-element homing shots against Gengar; console errors absent. The fixture grants builds and temporary invulnerability only for visual checks and is excluded from production.
- This is procedural 2D animation, not frame-by-frame anime footage. Physical mobile performance remains unmeasured.
