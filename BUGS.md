# Bug Reports

---

## BUG-001 — Tempo number input too narrow for 3-digit values

**Status:** Fixed (`ccdbfc5` - "fixed input layout issue")

**Description:**
The tempo number input was clipped when displaying values with 3 digits (100–999), making the text overflow or get cut off.

**Root cause:**
The input had a fixed `width: 100px`, which was not wide enough to accommodate 3-digit numbers at the large `4rem` font size.

**Fix:**
Changed the width to `3.5ch`, a font-relative unit that scales with the current font size and reliably fits up to 3 digits with breathing room.

---

## BUG-002 — Slider lag: stops following cursor after 2–3 steps

**Status:** Closed / not reproducible

**Description:**
When dragging the tempo slider, it would move a few steps and then stop tracking the cursor.

**Root cause:**
Could not be reproduced in a reliable environment. The issue was attributed to an unreliable WSL GUI testing setup rather than a defect in the application itself.

---

## BUG-003 — Number input rejects values outside BPM range during typing

**Status:** Fixed (`1c9476f` - "fixed tempo typing issues")

**Description:**
It was impossible to clear the input and type a new value if any intermediate state (e.g. an empty field, or a partially typed number like "1") fell outside the allowed BPM range. The field would immediately snap back, preventing the user from completing their input.

**Root cause:**
The `input` event handler called `setTempo()` on every keystroke, which clamped and overwrote the field value before the user could finish typing.

**Fix:**
Removed the `input` event handler entirely. Replaced the `blur` event handler with a single `change` event listener, which only fires when the user commits the value (via Enter or focus loss). Invalid or out-of-range values are clamped on commit; an unparseable value reverts to the previous tempo.

---

## BUG-004 — Tempo change doesn't affect click schedule until the next beat

**Status:** Fixed (`2371540` - "change click tempo immediately after receiving new input")

**Description:**
After changing the tempo while the metronome was running, the new tempo only took effect after the already-scheduled next click fired. There was an audible delay before the rhythm adjusted.

**Root cause:**
The scheduler pre-schedules clicks ahead of time using `nextNoteTime`, computed from the old tempo. When tempo changed, `nextNoteTime` still pointed to a future time calculated at the old rate, so the scheduler continued with the old interval for one more beat.

**Fix:**
Added a reset of `nextNoteTime` to `audioCtx.currentTime + 0.05` inside `setTempo()` when the metronome is running, causing the scheduler to immediately recalculate the next click at the new tempo.

---

## BUG-005 — Accented beat counter not reset on tempo change

**Status:** Fixed (`8cfbeef` - "distinct upbeat sound")

**Description:**
When the tempo was changed while the metronome was running, the accented beat (beat 1) did not reset. The accent could land on beats 2, 3, or 4 instead of starting a fresh bar from beat 1.

**Root cause:**
`setTempo()` reset `nextNoteTime` (BUG-004 fix) but did not reset `currentBeat`, so the bar position was preserved across the tempo change.

**Fix:**
Added `currentBeat = 0` alongside the `nextNoteTime` reset in `setTempo()`.

---

## BUG-006 — Card shrinks after React refactor

**Status:** Fixed (`36f9eb7` - "global refactoring - migrate to React")

**Description:**
After migrating to React, the main card element was much narrower than expected, appearing shrunken in the center of the page.

**Root cause:**
The `body` element uses `display: flex` for centering. In the vanilla version, `.card` was a direct flex child of `body`, so `width: 100%` on the card referred to the full viewport width. After the React refactor, an intermediate `#root` div was inserted between `body` and the card. As a flex child, `#root` shrank to fit its content, making the card's `width: 100%` resolve to a much smaller value.

**Fix:**
Added `width: 100%` and `display: flex; justify-content: center` to `#root`, restoring the intended layout without changing the card's own styles.

---

## BUG-007 — Toggle button stops working after repeated interactions

**Status:** Fixed (`d51d53d` - "bugfix - toggle button double fire")

**Description:**
After several interactions with the tempo controls and toggle button, the Stop button would change the UI state (text and color) correctly but fail to actually stop the metronome audio.

**Root cause:**
The `toggle` function placed side effects (`start()` / `stop()`) inside a React `setState` updater function. React 18 Strict Mode deliberately double-invokes state updater functions to detect impurity. This caused `start()` to be called twice per click, spawning two concurrent scheduler loops. The module-level `timerId` variable only stored the ID of the most recently created timer, so `stop()` could only cancel one loop — the other continued running indefinitely and could not be stopped.

**Fix:**
Moved `start()` / `stop()` calls out of the state updater and into the `toggle` callback body, using a `runningRef` to track the current state without a stale closure. As a secondary defensive measure, `start()` in `audio.ts` now calls `stop()` first to guarantee only one scheduler loop runs at a time.

---

## BUG-008 — Number input accepts non-digit characters

**Status:** Fixed (`075ccf6` - "bugfix - number input must allow digits only")

**Description:**
The tempo number input (`type="number"`) allowed typing delimiter and special characters: `.`, `-`, `e`, `E`, `+`. These characters are natively permitted by the browser in number inputs (to support floats, negative numbers, and scientific notation), but are meaningless for a BPM value that must be a positive integer.

**Root cause:**
`<input type="number">` accepts any character that could form a valid floating-point number. No filtering was applied at the component level.

**Fix:**
Two complementary layers of prevention added to `TempoControl`:
1. `onKeyDown` — calls `e.preventDefault()` for `.`, `-`, `e`, `E`, `+`, blocking the character before it is inserted (also prevents the cursor-jump-to-end side effect that the `onChange`-only approach causes).
2. `onChange` filter — rejects any value that doesn't match `/^\d*$/`, guarding against paste and any other non-keyboard input path.

---

## BUG-009 — Clearing the number input and blurring leaves it empty instead of reverting

**Status:** Fixed (`0901092` - "bugfix - number input doesn't revert cleaning the default value on commit")

**Description:**
When the user cleared the number input and clicked away without pressing Enter, the input remained empty instead of reverting to the previous valid tempo value.

**Root cause:**
`commit()` called `onChange(tempo)` when the input was empty (NaN path), but since `tempo` had not actually changed, the `useEffect([tempo])` in `TempoControl` that syncs `inputValue` from the prop did not re-run. The `inputValue` state was left as `""` with no code to reset it.

**Fix:**
`commit()` now always calls `setInputValue(String(clamped))` after `onChange`, ensuring the displayed value is reset to the committed value regardless of whether the parent state changed.
