# Full run and mobile QA — 2026-11-15

## Method

Real-time Phaser runtime in the local in-app browser. The development controller supplies movement, aiming, interaction and reward selection through normal game rules. It reads enemy/projectile positions, so this is an expert automated input test, not a human difficulty benchmark. No damage, health, invulnerability, enemy health, room-clear or starting-build overrides in campaign runs. Separate `?qa` fixtures exercise UI and specific collision cases; their results are not campaign completion or balance evidence.

## Reproduced problems and fixes

- Damage recoil bypassed solid furniture collision. During seed 3's B6 room 8, a hit pushed Mew into the crate at (950,480); the room cleared, but normal movement could not escape. Recoil now uses the same collision geometry as movement. Browser regression: a rightward hit from (906,480) remains outside the crate; a 0.5-second stick input then moves Mew left to approximately (782,480).
- Ordinary door travel reset both virtual sticks. A held 1.2-second upward input stopped at the next room's entry y=542. Door travel now retains input; the same test reaches y≈259. Release stops movement. Pause, reward, story, lift and new-run transitions still reset input. Holding attack across a door still cancels entry grace normally.
- Game keyboard handling intercepted Space/arrows in menus. Gameplay keys are now gated by playing state, preserving native button activation and scrolling. Space selected a reward in the browser; key count and health updated correctly.
- Entry protection now explicitly states that attacking cancels it, so the brief safe repositioning window is discoverable. Its duration and combat behavior are unchanged.
- HUD and pause fusion labels include the actual carrier (for example, “냉동빔 · 독성 흡수”), avoiding the impression that the newly learned beam is still only a drain attack.
- Opening a capsule changed the key count without refreshing the HUD until the modal closed. Reward opening now refreshes resource/objective state immediately.
- Portrait keys overlapped pause; build information and timer overlapped thumb controls. Portrait rows are separated, the redundant timer hidden, and the boss bar placed beside the minimap.
- Many learned moves pushed the resume button off a 667×375 landscape panel. Inventories over six distinct moves now have an expandable list.
- The short-viewport generic modal had a fixed 400px width, wider than a 320px portrait viewport. Width is constrained to the viewport. Pause/sound and touch interaction targets have a 44px minimum height.

## Validation

- Automated tests: 73 passing, including damage recoil near furniture and inactive-menu input handling.
- Browser sizes: 1280×800, 844×390, 667×375, 390×844, 320×568. Checked actual pointer input on virtual sticks, door travel, reward selection, research record, expanded/compact inventory and boss HUD/dialogue. Physical phones and simultaneous native multi-touch were not tested; independent pointer behavior has unit coverage.
- Seed 3 attempt 1: normal-rule death on B5 at 160.5 game seconds. Preserved as `evidence/full-run-attempt1.json`.
- Seed 3 attempt 2: reproduced B6 crate softlock. Saved report in `evidence/full-run-blocked-crate.json`. After the fix, normal checkpoint continuation restored HP 5 and 59 game seconds; continued to B4, then died at 357.7 seconds. Preserved as `evidence/full-run-attempt2-resumed.json`. The failed controller's collision prediction and close-range projectile avoidance were then improved without changing game balance.

Seed 7 also reached B3, then ended in a normal-rule death at 474.4 seconds (11 hits); report: `evidence/full-run-seed7.json`. The controller now uses the existing entry grace to reposition before firing and avoids standing against arena walls. These diagnostic failures are not estimates of human difficulty or clear rate.

## Completed campaign

Seed 3 completed B6 through B1 and the ending in 1,416.5 game seconds (23m 36.5s): 168 enemies defeated, 14 upgrade acquisitions, 19 hits across the two report segments, final HP 6/6. All five normal floors and all three Mewtwo phases completed under normal combat/reward rules. Accepted damage values, reward probabilities and growth curves were preserved.

A deliberate reload after clearing B2 room 2 restored HP 4/6, two keys, 11 acquisitions, two of nine cleared combat rooms and 1,001 elapsed seconds without free healing. Evidence: `evidence/full-run-final-part1.json`, `evidence/full-run-final-part2.json`, `evidence/full-run-checkpoint-resume.png`.

Observed story order: 문 앞에서 기다리던 존재 → 나를 봐 → 원본의 그림자 → 혼자 두지 마 → 처음 찾아온 고요 → 버리고 가는 게 아니야 → 세상은 아직, 끝나지 않았다. The ending displayed the completed-run totals. Returning to title showed 게임 시작 rather than 이어하기, confirming completed-run cleanup. No browser console errors were captured in the final run. Evidence: `evidence/full-run-mewtwo-phase3.png`, `evidence/full-run-ending.png`.

Production build passed. This verifies campaign progression and responsive browser layouts; it does not establish physical-device frame rates, human difficulty, every random seed or every optional room.
