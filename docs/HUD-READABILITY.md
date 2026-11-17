# HUD readability and aiming — 2026-11-17

- Grouped objective and current attack build with the health bar at the top. Bottom now keeps only thumb controls and actions. Boss health uses a separate right-side area in landscape; portrait uses separate rows.
- Important HUD labels use 13–16 screen pixels; reward comparison text and expandable explanations are enlarged. Notifications have a dark backing and 4–7 seconds based on length. Rewards name their attack form; clear-room notices explicitly say doors opened.
- Functional world labels compensate for camera zoom. Decorative laboratory signage stays subdued.
- The attack pad says “밀어서 조준”, has four outward direction ticks and a rotating selected-direction arrow. Mew displays a short arrow in the actual firing direction while aiming. First-use swipe cue is nonblocking, stops after learning a real drag, and respects reduced motion. No automatic firing is added for a center tap.
- The top build shows its main technique, four recent supporting icons and +N for remaining effects; hold +N to read the remainder. All existing effects remain applied.
- Browser QA: 667×375 and 844×390 landscape, 390×844 portrait; six-technique build, hold tooltip, actual attack-pad drag/release, boss HUD, medical rewards. Fixed a portrait health/objective overlap and inherited CSS that hid technique images. No physical-phone performance claim.
- Input regression tests exercise separate pointers, arbitrary angles, visual aim state, learned drag, cancellation and resize reset. Existing gameplay balance is unchanged.
