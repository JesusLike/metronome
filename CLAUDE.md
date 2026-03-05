# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla HTML/CSS/JS single-page metronome app. No build step — open `index.html` directly in a browser.

## Development

Open `index.html` in a browser. Any HTTP server works for local serving, e.g.:

```bash
python3 -m http.server
```

## Code Organization

- All CSS must live in separate `.css` files and be linked from `index.html` via `<link rel="stylesheet">` tags. No inline `<style>` blocks.
- All JavaScript must live in separate `.js` files and be loaded from `index.html` via `<script src="...">` tags. No inline `<script>` blocks.
- Avoid inlining code in `index.html` as much as possible.

## Architecture

HTML structure is in `index.html`.

**Audio:** Uses the Web Audio API with a lookahead scheduler pattern for sample-accurate timing. A `setTimeout` loop (`LOOKAHEAD_MS = 25ms`) schedules `OscillatorNode` clicks up to `SCHEDULE_AHEAD_S = 0.1s` ahead using `AudioContext.currentTime`. This avoids the jitter of naive `setInterval`-based approaches.

**Tempo controls:** Slider and number input are kept in sync via a shared `setTempo()` function that clamps to `[20, 300]` BPM.

**State:** `running` (bool), `tempo` (number), `audioCtx` (created lazily on first Start to comply with browser autoplay policy), `nextNoteTime` (tracks when the next click should fire).

## Design

- **Material Design** — follow Material Design principles for components, spacing, elevation, and interaction patterns.
- **Light theme** — use a light color palette as the default and only theme.
- **Minimal visual effects** — avoid heavy animations, gradients, shadows, or decorative flourishes; keep the UI clean and functional.
- **Mobile-first layout** — design for small screens first, then scale up for larger viewports.
