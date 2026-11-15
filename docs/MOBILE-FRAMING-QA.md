# Mobile framing and opening preparation — 2026-11-15

The game now resizes its canvas to the available viewport and fits the complete laboratory bounds (1060×560 world units in landscape) instead of fitting the old 1120×700 outer frame. All four door thresholds remain visible. Linear scale rises 25% at 844×390 and approximately 17.5% at 667×375. HUD overlays the fitted room rather than occupying the outside margins. Collision, enemy size ratios, movement speed and dungeon geometry are unchanged.

Landscape sticks grow from 100px to 132px, with a 52px thumb knob and 36px inset from the fitted arena edge (plus safe-area protection). At 667×375 their rectangles are (36,219,132,132) and (499,219,132,132). This moves their centers inward and gives a larger analog range. Portrait keeps the whole world visible; sticks also grow to 132px.

Opening illustrations previously totaled roughly 17MiB for seven PNG backgrounds/props. WebP delivery copies total 2,568,490 bytes, quality 90. Original PNG artwork and source/license records remain unchanged; the offline cache excludes originals when a WebP counterpart exists. Official Pokémon PNGs are unchanged. Reproduce delivery files with `scripts/build-cinematic-webp.py` (Pillow).

A shared decoded image cache replaces per-scene Image construction. The first opening waits for decoding with an immediate route to the title screen; load failure falls back to title. Scene animation starts after image readiness. On coarse-pointer/short-screen devices the opening caps its canvas DPR at 1 and rendering at about 30Hz; the deformation mesh uses fewer triangles while retaining articulated motion. Audio time remains wall-clock based. These are bounded rendering-cost changes, not a claim of a measured phone frame-rate improvement.

Validation: 77 tests pass, including complete-door framing at four landscape sizes and portrait bounds. Production build passes. Browser screenshots at 844×390 and 667×375 show enlarged room, overlaid HUD and inset sticks; pointer press/release was exercised, no console errors observed. Opening loading screen transitioned to fully illustrated first scene. Evidence: `evidence/mobile-grip-844.png`, `evidence/mobile-grip-667.png`.

Physical-device cold-network timings, sustained opening FPS and ergonomic comfort still require testing on the user's phone.
