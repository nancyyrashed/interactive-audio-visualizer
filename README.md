# Interactive Audio Visualizer

A browser-based, real-time 3D music visualizer built with **p5.js (WEBGL mode)** and **[Meyda](https://meyda.js.org/)** for audio feature extraction. Three different audio tracks each get their own unique visualization style, driven by a different set of extracted audio features (loudness, brightness, pitch class, noisiness, etc.) rather than just raw amplitude.

## Contents

| File | Description |
|---|---|
| `index.html` | Page shell — loads p5.js, p5.sound, and Meyda from CDNs, then `script.js`. |
| `script.js` | All visualizer logic: audio loading/playback, Meyda feature extraction, and three distinct 3D visualization modes. |
| `Ex2_sound1.wav` | Track 1 — grid-of-rectangles visualization. |
| `Ex2_sound2.wav` | Track 2 — 3D grid + exploding sphere visualization. |
| `Ex2_sound3.wav` | Track 3 — flowing lines / waves / sparkles visualization. |

## How It Works

The sketch uses **Meyda's `MeydaAnalyzer`** to extract a different set of audio features per track (chosen because each track's character suits a different feature set), then maps those features to visual parameters in real time via `drawVisualization()`.

### Track 1 — Rotating rectangles grid
- **Features used:** `rms` (loudness), `spectralCentroid` (brightness), `chroma` (pitch class distribution)
- RMS controls how many rectangles appear and how large they are, plus the size of a central pulsing ellipse.
- Spectral centroid maps to the background/fill hue.
- Chroma mean controls rectangle rotation, border opacity, and the speed of small circles orbiting each rectangle.

### Track 2 — Exploding sphere with reactive 3D grid
- **Features used:** `energy`/`rms`, `spectralFlatness` (noisiness), `chroma`
- A 3D grid of wireframe boxes ripples based on spectral flatness.
- A central sphere grows with track energy and with playback progress (a cubic "buildup" curve), surrounded by pulsing glow rings.
- All key features are exponentially smoothed (`0.9 * previous + 0.1 * current`) to avoid jittery visuals.

### Track 3 — Flowing lines, waves, and sparkles
- **Features used:** `spectralRolloff` (high-frequency energy), `zcr` (zero-crossing rate / noisiness), `amplitudeSpectrum`
- Spectral centroid and overall amplitude energy are derived manually from the raw amplitude spectrum.
- These drive a set of flowing top lines, a bottom sine wave, a dotted wave of circles, and randomly spawned sparkle particles — with hue, glow, line thickness, and wave amplitude all mapped from the smoothed features.

### Playback controls

Two on-screen buttons (created directly by the sketch, not in the HTML):
- **Play/Pause** — starts or pauses the current track and its analyzer.
- **Next Sound** — cycles to the next track in `soundFiles`, reloading it and re-configuring the Meyda analyzer with that track's feature set.

## Usage

1. Serve the folder locally, for example:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000/index.html` in your browser.
3. Click **Play/Pause** to start Track 1's visualization.
4. Click **Next Sound** to cycle through Tracks 2 and 3, each with its own distinct visual style.

## Skills Demonstrated

- Real-time audio feature extraction with Meyda (RMS, spectral centroid, spectral flatness, spectral rolloff, zero-crossing rate, chroma, amplitude spectrum)
- 3D creative coding with p5.js WEBGL mode (lighting, transforms, primitives)
- Mapping multi-dimensional audio features to visual parameters
- Signal smoothing (exponential moving average) for stable real-time visuals
- Interactive front-end development with the Web Audio API
