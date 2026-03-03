# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla HTML/CSS/JS single-page metronome app. No build step — open `index.html` directly in a browser. All code lives in `index.html`.

## Development

Open `index.html` in a browser. Any HTTP server works for local serving, e.g.:

```bash
python3 -m http.server
```

## Architecture

Everything is in `index.html` (inline `<style>` and `<script>`).

**Audio:** Uses the Web Audio API with a lookahead scheduler pattern for sample-accurate timing. A `setTimeout` loop (`LOOKAHEAD_MS = 25ms`) schedules `OscillatorNode` clicks up to `SCHEDULE_AHEAD_S = 0.1s` ahead using `AudioContext.currentTime`. This avoids the jitter of naive `setInterval`-based approaches.

**Tempo controls:** Slider and number input are kept in sync via a shared `setTempo()` function that clamps to `[20, 300]` BPM.

**State:** `running` (bool), `tempo` (number), `audioCtx` (created lazily on first Start to comply with browser autoplay policy), `nextNoteTime` (tracks when the next click should fire).
