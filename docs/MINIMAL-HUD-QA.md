# Minimal combat UI — 2026-11-15

Health is a six-segment translucent meter: mint above 60%, yellow at or below 60%, red at or below 30%. Empty segments remain visible, so color is not the only cue. With six HP this means 4–6 mint, 2–3 yellow, 0–1 red. Accessible meter values and a numeric tooltip remain available.

Combat HUD shows floor, key icon/count, status symbols, technique glyphs and compact objective icons. Repeated room/type text, seed, timer and technique paragraphs are removed from the combat view; pause/help retain detail. Doors retain physical locks/lights with directional arrows. Interaction controls use distinct icons with accessible names. Routine clear notices are abbreviated; saving errors and meaningful failure messages remain readable.

Rewards show name, rank, a combination diagram and direct-power change. Detailed effects/tradeoffs are in separate expandable sections, which cannot accidentally select the reward. Story dialogue is retained.

79 tests pass, including exact threshold boundaries and accessible segmented-meter state. Browser: 844×390, HP 3/6 warning and 1/6 danger, reward expansion and mobile HUD inspected. Evidence: `evidence/minimal-hud.png`. Physical-phone readability remains unmeasured.
