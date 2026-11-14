# Phase 4 verification — 2026-11-15

## Automated

33 tests plus TypeScript/Vite build. Existing map/input/combat/balance coverage retained. New tests cover deterministic six-floor checkpoint reconstruction, reward pending/taken state, no duplicate reward acquisition, saved HP/build/stat fields, B1 phase and ending persistence, invalid/corrupt/future-version saves, storage failures, save removal, sequential phase completion, distinct Mewtwo attacks, warning-before-attack, beam telegraph/active/expired intervals and beam collision geometry.

## Browser

- B2 completed-elevator fixture → normal movement into elevator → B1 confrontation → phase 1 battle.
- Damage routed through the normal hit function triggered phase 2 jealousy dialogue and phase 3 parental-projection dialogue. Full-build projectile effects stayed active.
- Phase 1 aimed/radial shots, phase 2 teleport/tracking shots, phase 3 radial bullets and actual vertical beam observed. Boss phases have independent HP bars.
- Reload during phase 2 → title shows B1 continuation → correct build/HP/phase summary → phase 2 dialogue and fight restored.
- Phase 3 defeated → ending. Reload before finishing ending → continuation restores ending without repeating boss fight.
- Three ending scenes → victory summary → title returns to New Game rather than Continue (active save removed).
- Fresh normal seed-3 run → acquire Psybeam from first reward room → reload/continue → same room and one acquired move, no duplicate reward modal.
- Ending at 844×390 landscape: text and next button visible. Temporary viewport override reset.
- Console errors absent during these checks.

## Boundaries

The final-boss transition checks used a development-only full-build setup, damage button and temporary invulnerability. These confirm state transitions/rendering/persistence, not fair difficulty or a legitimate full-run clear. Dev fixtures are excluded from the production bundle. A full six-floor manual clear and physical mobile performance/install testing remain outstanding.

Saves are local browser checkpoints, not a frame-perfect simulation snapshot or cloud account. On resume, the current room/phase restarts from the checkpoint HP; enemy HP, bullets and transient status effects reset. Saving occurs at room entry, room clear, reward choice, boss phase transition and ending entry. Dying or completing the ending removes the active save. Storage failures are surfaced in the UI without stopping gameplay.

## Final background pass

- Added two generated, character-free ink/watercolor background plates (forest and abandoned lab); original Pokémon artwork remains separate and unchanged.
- All assets are local and included in the offline cache. Code backgrounds remain a fallback while images load.
- Production offline test: after cache-ready indicator, stopped both local servers and confirmed port 4174 unreachable; reload/continue still restored the pending reward and accepted a move with no console errors. This functional test preceded the background-only pass; the final precache list is checked to contain both additional images.
