# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React single-page metronome app built with Vite and TypeScript.

## Development

```bash
npm install
npm run dev
```

## Code Organization

- Components live in `src/components/`.
- CSS modules live alongside their components (e.g. `Foo.module.css` next to `Foo.tsx`).
- Audio/scheduler logic lives in `src/audio.ts`, separate from UI.
- No inline `style` props or `<style>` tags — use CSS modules.
- All code must be TypeScript — no plain `.js` or `.jsx` files.

## Architecture

**Audio:** Uses the Web Audio API with a lookahead scheduler pattern for sample-accurate timing. A `setTimeout` loop (`LOOKAHEAD_MS = 25ms`) schedules `OscillatorNode` clicks up to `SCHEDULE_AHEAD_S = 0.1s` ahead using `AudioContext.currentTime`. This avoids the jitter of naive `setInterval`-based approaches.

**Tempo controls:** Slider and number input are kept in sync via a shared `setTempo()` function that clamps to `[1, 999]` BPM.

**State:** `running` (bool), `tempo` (number), `audioCtx` (created lazily on first Start to comply with browser autoplay policy), `nextNoteTime` (tracks when the next click should fire), `currentBeat` (0–3, resets on start and tempo change).

## Design

- **Material Design** — follow Material Design principles for components, spacing, elevation, and interaction patterns.
- **Light theme** — use a light color palette as the default and only theme.
- **Minimal visual effects** — avoid heavy animations, gradients, shadows, or decorative flourishes; keep the UI clean and functional.
- **Mobile-first layout** — design for small screens first, then scale up for larger viewports.
