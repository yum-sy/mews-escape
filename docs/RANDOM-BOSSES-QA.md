# Random laboratory bosses

B6–B2 use a seed-based permutation of Gengar, Weezing, Muk, Houndoom and Banette. No repeats within a run; saved games regenerate the same roster. B1 retains the existing three-stage Mewtwo encounter. Existing saves use their original seed to assign the new roster.

All laboratory bosses use the existing floor HP curve and normalized half-health transition, with a recovery pause. They share at least 1.05 seconds of attack warning. Gengar retains flanking teleport/radial attacks; Weezing uses radial volleys; Muk places warned poison pools and fans; Houndoom alternates fans with a locked-direction dash; Banette teleports and uses fans with limited tracking in phase two. Official artwork files and metadata sources are recorded in public/assets.

Validation: 119 automated tests passed, including 1,000 seeded rosters, save restoration, all-floor candidate spawn checks, locked warning/shot directions, phase cancellation, distinct mechanics and asset hashes. Production build passed. Browser review at 844×390 confirmed all four new images, actual boss names, directional warnings, teleport ghosts and poison-pool warnings. Screenshot: evidence/random-boss-mobile.png (local only). Browser checks used the development preview fixture; this is not a complete manual campaign or a physical-phone performance test.
