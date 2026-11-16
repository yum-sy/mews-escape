# App icon artwork

App icon / favicon artwork: @hitofutarai (artist credit stated in the linked Facebook post).
Source: https://www.facebook.com/official.tajiri/posts/mew-taking-on-the-role-of-a-parent-to-mewtwo-artist-hitofutarai/519856910993612/
User supplied the image and requested reuse on 2026-11-15.
Adaptation: square crop, dark background, resizing; no generative redraw.
No reuse license or artist permission was verified. Not covered by this project's code or Kenney licenses. Pokémon is third-party intellectual property.

Original supplied PNG preserved in this directory; reproduce exports with `python3 scripts/build-icons.py` (Pillow).

2026-11-16: `mew-mewtwo-hitofutarai-clean.png` is a deterministic alpha-only edge cleanup. `scripts/clean-icon-matte.py` removes light neutral matte connected to transparent pixels within a three-pixel boundary band. RGB and pixels outside that band are unchanged; the original PNG is preserved. Run cleanup before build-icons.py. No generative redraw.
