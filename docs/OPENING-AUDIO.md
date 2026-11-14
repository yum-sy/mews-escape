# Opening soundtrack

Original procedural Web Audio music and effects; no external recordings, remote requests or third-party music. The existing game AudioFX controls are separate.

- Forest: quiet sustained harmony, sparse bell-like notes and filtered wind.
- Capture: darker harmony, alternating grass footsteps derived from the illustrated walk distance, launcher release at 2.9 s, net contact at 3.55 s and rope settling. Flight sound pans toward the center.
- Experiment: low motor/power hum and scanning/monitor tones.
- Awakening: rising psychic tones and a filtered energy swell.
- Collapse: low-frequency impact at 0.9 s, glass, rumble and debris impacts derived from the falling-object clock.
- Escape: crack at 0.15 s, glass release at 1.1 s, latches and metal impacts, escape whoosh at 3.15 s, lid landing at 3.25 s and a quiet exit chime.

The opening starts silent until the user taps “소리 켜고 보기”. The AudioContext is resumed from that gesture and the opening restarts from scene one. Subsequent toggles mute/resume the current scene. If audio startup fails the control offers another attempt. Audio is not silently enabled by an unrelated gesture.

Each scene owns its sound sources. Scene changes, skipping, muting and disposal stop them with a short release; hidden-tab playback pauses with the visual clock and resumes without replaying missed cues. Cues more than 220 ms late are discarded rather than producing a burst after a stalled frame. Reduced-motion visuals retain the audio timeline. Source envelopes, conservative gains and a master compressor bound peaks.

Validation: 41 tests, including cue synchronization, stale-event suppression and source cleanup across mute/pause/disposal. Actual browser AudioContext unlock and mute were verified. An OfflineAudioContext rendered the full collapse scene to eight seconds of stereo PCM: finite output, peak 0.3751, RMS 0.0137, no clipping. The ignored development render page and WAV previews are excluded from deployment.

Additional offline PCM renders: capture peak 0.4528 / RMS 0.0072; escape peak 0.2833 / RMS 0.0074. Both were finite and unclipped. The sound control and skip button were checked at 844×390; browser console reported no audio errors. Waveform checks verify output and peak headroom, not subjective listening quality on every device.
