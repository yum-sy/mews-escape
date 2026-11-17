# Effect readability audit — 2026-11-17

## Findings and fixes
The active skills were visually underspecified: Reflector was a plain circle, Substitute was a small tinted Ditto, both used the research-terminal sound and shield button icon.

Reflector now has a translucent faceted shield, a countdown arc at the actual 58-unit projectile interception boundary, an activation burst, hit sparks, and an expiry burst. Contact and floor hazards still bypass it; the effect does not imply a full-screen invulnerability flash.

Substitute now has a larger 48×42 Ditto, a grounded shadow, upward attention chevrons, a countdown arc, its own button silhouette, hit feedback and expiry burst. The lure stays at its original position while Mew moves away. Both active skills have separate start/block/end sound envelopes; block sounds are rate limited to ten per second. Existing combat duration, charge and damage balance are unchanged.

## Verification scope
- Browser visual comparison: all 16 player technique forms; 32 normal enemy and 10 boss species projectile presentations; six fusion visual families; representative poison gas zone; technique reward pickup.
- Active effects inspected at 844×390 and 667×375 with touch controls, plus desktop. Shield remains transparent enough to see Mew; Substitute and Mew separate spatially. No console errors in this inspection.
- Automated coverage: finite drawing commands for all 16 forms and four mechanical fusions under simultaneous status/impact/reward effects; countdown endpoints and zero-time cleanup; actual scene charge gating, projectile interception versus contact damage, and Substitute start/expiry cleanup. Existing tests cover hazard geometry, warning familiarity, boss patterns and effect budgets.
- This does not certify every possible stacked build, every battlefield overlap, physical-device frame rate, or subjective player recognition. Audio envelopes were checked in implementation; browser audio was not independently auditioned.

## Cost and assets
One retained graphics batch for active overlays, eight bounded particles per activation/expiry, existing Ditto artwork; no new network assets or external image dependency. Existing particle cap remains 360. Gameplay and damage numbers remain unchanged.
