# Cinematic motion and staging revision

The existing illustrations and original Pokémon artwork are unchanged. Canvas renders a continuous textured mesh so the limbs, head, hands and tail can move without hard sprite-cut seams. This is a 2D illustration rig, not newly drawn character frames.

## Capture

- Four short strides lead into a planted aiming pose. During a foot's stance phase its local displacement cancels the actor's forward travel; its swing phase lifts and advances it.
- Torso weight transfer, a small head turn, shoulder/launcher elevation and recoil are separate from root movement. The rope originates at the deformed launcher muzzle.
- The net unfolds over a curved flight, makes contact at 3.55 seconds, and then follows Mew's struggle and sag. Its dimensions follow Mew's rendered proportions on wide screens.
- Edge foliage occludes the approaching boots. Soft contact shadows and projected silhouettes follow the forest's upper-right lighting.

## Containment and escape

- Mew startles, examines the opening, tucks its limbs, pushes forward, banks, then recovers its flying posture. The tail follows with a delayed wave.
- Mew does not leave before the rails open. Drawing order changes when it passes out through the opening.
- The heavy base stays put; the lid falls and tilts onto the floor; the rails fall around their base pivots and settle. Glass and rubble land rather than falling through the floor or respawning.
- The final movement shrinks Mew into the actual illustrated exit aperture. The shadow moves to the more distant floor plane and shrinks with it.
- Cracks and scanning effects are constrained to the glass. The corridor light stays at the doorway. Laboratory props use the room's light direction and soft ground contact.

## Rendering and validation

- Mesh poses are cached at 30 Hz; scene compositing follows requestAnimationFrame. Mobile-size images are deformed offscreen rather than repeatedly sampling the full-resolution source.
- Existing reduced-motion and hidden-tab timing remain supported. Portrait views preserve the stage aspect ratio instead of stretching the room vertically.
- Timing and normalized mesh deformation: `src/cinematic-motion.ts`; Canvas rig: `src/cinematic-rig.ts`; room landmarks and falling debris: `src/cinematic-stage.ts`.
- Four animation tests supplement the existing 33 tests: planted feet, ordered escape, continuous/unfolded meshes, and persistent landed debris with an exit-size check.
- Browser inspection used desktop, 844×390 landscape and 390×844 portrait layouts. Capture playback averaged 30.8 fps in the development browser; this is not a physical-device performance guarantee. No browser errors were recorded.
- Development-only time controls live in ignored `evidence/`; the preview callback is guarded by `import.meta.env.DEV` and the preview page is excluded from the build.
