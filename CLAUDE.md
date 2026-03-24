# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React single-page metronome app built with Vite and TypeScript.

## Branching, CI & CD

- `master` is the deploy-ready branch — it must always contain the latest tested, working code.
- All development happens in feature branches and is merged to `master` via GitHub Pull Request.
- Merging to `master` requires a passing CI run. The CI pipeline is implemented as a GitHub Actions workflow and runs the complete test suite with coverage.
- Upon each successful merge into `master` the CD pipeline runs: it runs all tests, builds the project, uploads the build artifacts to the staging S3 bucket, then generates and publishes a CloudFront Function to apply BasicAuth.

## Staging Environment

The staging environment is a private AWS S3 bucket served via a CloudFront distribution. Access is restricted with HTTP BasicAuth enforced by a CloudFront Function.

- BasicAuth credentials are stored in AWS Secrets Manager.
- The CD pipeline fetches the credentials from Secrets Manager at deploy time, generates the CloudFront Function with those credentials embedded, and publishes it so the updated build is immediately available for manual testing.

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

## Testing

**Strategy:**
- **Unit tests (Vitest)** — pure, non-UI logic (e.g. `clamp`, tempo validation). Test files live in `test/unit/`.
- **Component tests (Vitest + jsdom)** — React component behaviour (e.g. input commit/revert). Test files live in `test/component/`.
- **E2E tests (Playwright)** — user-facing flows in a real browser. Test files live in `test/e2e/`.
- **Manual system testing** — audio correctness (timing, beat accents), visual appearance, and overall usability. Not automatable.

**Running tests:**
- `npm test` — runs all test suites in order (unit → component → e2e)
- `npm run test:unit` / `test:component` / `test:e2e` — run a single suite
- `npm run test:coverage` — runs unit and component tests with v8 coverage report

**Supported browsers (E2E):**
Playwright runs E2E tests against Chrome, Firefox, Safari (WebKit), and Edge. All four must pass before merging to master. Browser binaries are managed by Playwright (`npx playwright install`).

## Design

- **Material Design** — follow Material Design principles for components, spacing, elevation, and interaction patterns.
- **Light theme** — use a light color palette as the default and only theme.
- **Minimal visual effects** — avoid heavy animations, gradients, shadows, or decorative flourishes; keep the UI clean and functional.
- **Mobile-first layout** — design for small screens first, then scale up for larger viewports.
