# Player-facing polish — 2026-11-15

This pass preserves the accepted combat damage, enemy stats, reward pools, room generation and checkpoint format from 3a70b29.

- HUD shows keys beside health and a state-dependent objective: combat, unopened/keyless treasure, remaining combat rooms, unlocked boss, boss reward, then lift.
- Pause shows the current fusion, accumulated effects, inventory ranks, resources, elapsed minutes/seconds and next objective. Starting over requires a second explicit button press; opening the panel resets this choice.
- Reward previews now depict the resulting combined attack instead of the offered move alone. Cards show rank, resulting carrier and relative expected direct damage rate. Comparison assumes every lane hits and includes expected critical damage; it excludes secondary/status damage and is not a prediction of practical DPS. Zero change reads “직접 화력 유지”.
- Opening, Mewtwo's three confrontations and ending use scene narration instead of script directions. The original misunderstanding → envy → abandonment arc is preserved. Development-phase labels were removed from player menus; help separates controls, strategy and detailed economy rules.
- Landscape reward cards keep selection, decline and title buttons visible at 844×390. Pause uses a compact landscape layout. Portrait rewards stack; panels allow touch scrolling. Story narration has larger secondary text.

Validation: 70 automated tests; production build; local IAB checks at 1280×800, 844×390 and 390×844. Checked reward selection (HP remains 4/6), existing checkpoint continuation, pause summary/reopen, help and phase-3 dialogue-to-combat transition; no browser console errors observed. UI fixtures are development-only and not shipped. Screenshots in ignored evidence/: polish-reward-mobile.png, polish-story-mobile.png, polish-hud-desktop.png.

These are viewport checks, not physical mobile device performance measurements. This pass did not repeat a full B6-to-ending balance run because combat and reward rules are unchanged.
