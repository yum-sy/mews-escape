# Room progression audit — 2026-11-16

Report: a demo player said there was no onward route. Floor, seed, screenshot, last action and door appearance are unknown. The original failure has **not** been reproduced. This audit does not establish its cause or claim absence of all possible softlocks.

## Findings and changes

1. **No disconnected generated floor found.** The generator attaches every new room to an existing room with reciprocal edges, forming a tree. Its farthest room is a leaf, so locking the boss cannot cut off required combat rooms. Runtime travel, physical doorway detection and rendering were reviewed together. Map discovery only changes the minimap and labels; it never removes physical doors.
2. **An intentional boss gate can look like a dead end.** The local room may be cleared while a door stays locked until other combat rooms are cleared. Previously pushing against that door silently failed. A short, once-per-door/reason hint now states the outstanding condition. No destination type or unexplored map is revealed. Visual doors and Run.travel now share the same predicate.
3. **Ascent rejection lacked recovery.** The delayed lift callback previously left state='transition' and a black camera if Run.ascend returned false. Fault injection reproduced that state-machine gap. The normal interaction guard should prevent this condition; there is no evidence it happened in the demo. Rejection now restores play, camera and HUD. This does not bypass progression requirements.
4. **Missing reproduction evidence.** The collapsed pause-menu '문제 확인용 진행 정보' exposes a local text report (seed, floor, room, position, build, living enemies, room completion flags). It does not transmit data or alter saves. It contains no future-room types, coordinates or door connections. Seed plus floor can reconstruct topology for debugging.

## Verification

- 10,000 seeds (5,000 small integers plus 5,000 distributed uint32 values), B6–B2: **50,000 generated floors**. DFS uses production Run.travel in both directions, clears combat flags in the test, skips optional rewards with zero keys and no survey, reaches the boss, skips boss reward and ascends. This is a progression model test, not 10,000 combat playthroughs.
- Four room kinds × three obstacle templates × sixteen prop destruction masks: **192 geometry configurations**. Flood-fill using production collision/movement connects all four door thresholds, central reward/lift, record and breaker.
- 1,000 seeds × B6–B1: every generated enemy spawn is outside combined permanent and breakable scenery at its real collision radius.
- 100 seeds × B6–B2, every room: checkpoint encode/decode/restore retains doors and gate conditions, including pending/opened rewards.
- Production scene methods with graphics/audio/DOM adapters: final-enemy death, return travel, gate hints, reward skip, five lifts, all three Mewtwo phases, ending, rejected lift recovery.
- Existing suite also checks touch cancellation/resize/multitouch, entry protection, recoil, reward exhaustion, storage refusal and final-phase saves.
- Browser at 844×390: **100 directed crossings** on seed 151 across B6–B2, using actual scene doorway methods with rooms pre-cleared; success report observed. Locked-door hint, visible return door, pause diagnostics and resume checked. No browser errors captured. Local evidence: `evidence/progression-gate.png`.
- 93 tests passed. Production build passed. Development fixtures excluded from production.

## Reviewed paths / remaining uncertainty

- Door trigger coordinates remain reachable at player clamps on all four sides, including gentle analog input. Obstacles do not seal entrances or center interactions.
- Keys, optional treasures and full-health pickups do not gate travel. Exhausted boss offers retain the skip option; claiming/skipping the boss reward exposes the lift.
- Dead enemies are filtered before room-clear evaluation. Floors above B4 do not respawn reinforcements in cleared rooms. B1 uses three phases and an ending rather than ordinary room doors.
- Ground enemies can be blocked by furniture; flying enemies can pass over it. A stationary ranged flyer can temporarily shelter over a solid object and stop direct shots; repositioning changes its distance-based behavior. This is not established as a permanent blockage, and combat behavior was not changed for this report.
- The camera fits all four thresholds; door graphics are cleared/rebuilt per room. Previously visited minimap cells may form a dead end while other branches remain unexplored. Hidden future rooms remain intentional.
- Existing save schema reconstructs topology from seed rather than stored door IDs. Invalid save data is rejected; storage errors do not gate play. The service worker caches complete versioned packages; the audit did not reproduce a mixed-version runtime failure.
- No physical-phone reproduction, no original demo save and no complete normal-difficulty playthrough in this audit. If repeated, capture the pause report and screen before restarting.
