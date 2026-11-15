# Doors, exploration and mobile installation — 2026-11-15

- Replaced the redundant hidden legacy door objects with one laboratory door renderer. Recessed windows, rails, threshold markings, offset shadow, amber lock and green open indicator distinguish states. Two leaves retract over approximately 0.4 seconds. Stable door geometry is not redrawn every frame.
- Only visited rooms appear on the default minimap. Unvisited door destinations say 미탐험 rather than revealing room types. A central gate may still show that area clearance is required, because this explains why travel is blocked.
- New rare treasure reward 마음의눈 reveals room layout/types for the remainder of the run, including later floors. Maximum one acquisition; not in boss reward pool; same low early-floor weight as rare transformations. It occupies a normal paid treasure opportunity and adds no combat stats, enemy positions or reward contents. Existing saves without it retain fog of exploration.
- Added opaque 192/512 PNG manifest icons and 180px Apple touch icon, generated from the project's original icon design by `scripts/build-icons.py`. No new third-party artwork.
- Installation instructions cover home-screen launch, manual rotation, dual-stick operation and separate browser/app storage. Late install availability and successful installation update the UI. Offline failure/unsupported states no longer silently imply successful caching.
- Coarse-pointer game launch requests fullscreen and landscape where available; rejection falls back to normal responsive play. Resize clears both pointers so rotating cannot leave movement or attack stuck. Thumb controls respect safe-area insets. Short landscape installation pages start at the top and scroll, avoiding clipped headings.

## Verification

75 automated tests passed, including hidden/revealed room types, rare reward exclusion after ownership, unchanged combat stats/carrier, independent two-pointer movement/aim, cancellation/lost capture and resize reset. Production TypeScript/Vite build passed; development fixtures excluded.

Browser UI: 844×390 gameplay, 667×375 installation. Verified locked → open doors, visited-only map → full map after survey fixture, installation fallback, scrolling layout and production “오프라인 준비 완료” state. Screenshots: `evidence/door-locked-mobile.png`, `evidence/door-open-mobile.png`, `evidence/mobile-install.png`.

B2 stress fixture (all upgrades at their legal maximum, invulnerable player and high-health enemies; not a balance test): 881 frame samples, median 16.8ms, p95 18.1ms, p99 18.5ms, 11 active shots at observation, one fused weapon channel. Desktop in-app browser, not a physical mobile benchmark. Retained the existing 60Hz timer path after an experimental RAF limiter yielded worse frame pacing in this environment. No console errors observed.

Not verified: native iOS/Android installation dialogs, actual simultaneous finger touches, offline airplane-mode relaunch, sustained phone thermals/battery or real-device frame rates. Manifest and API fallbacks are implemented, but these outcomes require physical-device testing.

Implementation references: [installable manifest requirements](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest), [orientation API restrictions](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).
