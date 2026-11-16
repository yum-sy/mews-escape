# Mobile rendering follow-up — 2026-11-16

Original app icons are unchanged.

- Cache occupied rig cells and blurred shadow masks; crop triangle source draws; prepare rigs before the scene clock starts.
- Anchor 30 Hz mobile cadence on 60/90/120 Hz displays; skip hidden-document painting and hide the covered Phaser scene during DOM story/menu screens.
- Increase mobile rig source resolution from 240 to 320 px. Gameplay uses nine unmodified 475 px official artwork images, cropped to measured alpha bounds. Species height scaling and collision radii are unchanged.
- Browser checks: 844×390 opening capture and experiment scenes showed intact characters and props. Capture at 180 frames/5.9 seconds: CPU render median 1.1 ms, p95 1.5 ms; experiment at 195 frames/6.5 seconds: median 0.5 ms, p95 0.9 ms. These are desktop browser CPU submission samples at a mobile viewport, not physical-phone frame-rate measurements or before/after benchmarks.
- B6 artwork, touch controls and pause/resume checked at 844×390. Screenshot: evidence/mobile-artwork.png (local ignored evidence).
- Automated coverage includes pacing, transparent-cell boundaries, all artwork dimensions/bounds, and unchanged collision radii. 84 tests passed; production build passed.
- Physical iOS/Android GPU, thermal throttling and network conditions remain unmeasured.
