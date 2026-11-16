# Illustrated laboratory art — 2026-11-16

Replaced abstract technique diagrams with 21 distinct colored attack illustrations; the active carrier also displays its Korean name. Reward cards use a large picture and existing move description instead of the multi-icon equation. Long-press help and stable HUD markup remain.

Nine matching illustrated props share outlines, ivory/teal materials and cel shading: breaker, laser emitter, gas vent, electrical plate, TM case, healing spray, keycard, crate and specimen canister. Original generated transparent PNG atlases are retained. Sprite frames use the exact 418 px grid of the 1254 px prop sheet. CSS icons use the exact 5×5 atlas grid. These are generated fan-game art, not official assets; Pokemon character source images and the selected icon were unchanged.

Danger hardware remains visible between cycles. Warning borders, active beam/vapor/arcs and dimmed shutdown hardware follow the existing hazard state and damage geometry. No difficulty, collision, rewards, map generation or input rules changed. Emitter placement was adjusted to avoid door occlusion.

Verification:
- 93 tests passed and production build passed.
- 844×390 browser: electrical plate warning/active display, visible laser emitters, gas vent, breaker interaction and disabled devices checked.
- Reward choice applied flame to an icebeam build, retaining both effects and visible artwork.
- B2 cleared boss room displays a TM case; maximum build HUD has distinct icons and fits the screen.
- No browser errors captured in the breaker test.
- Local screenshots: evidence/painted-lab.png, evidence/painted-rewards.png, evidence/painted-tm.png.
- WebP delivery copies total about 1 MB (PNG originals about 3.7 MB); existing offline-cache filtering excludes PNGs with WebP counterparts. No physical-device performance benchmark was performed.

Reproduction: built-in image_gen prompts in art-v3-prompts.json; lossily encoded delivery copies generated with scripts/build-game-art-webp.py, preserving transparency and original source files. Asset credits in public/assets/CREDITS.txt.
