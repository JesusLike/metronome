import { test, expect, type Page } from '@playwright/test';

const DEFAULT_TEMPO = 120;

const slider = (page: Page) => page.locator('input[type="range"]');
const numberInput = (page: Page) => page.locator('input[type="number"]');
const toggleButton = (page: Page) => page.locator('button');

// ─── UI tests ────────────────────────────────────────────────────────────────

test.describe('App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the metronome card on load', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Metronome');
    await expect(numberInput(page)).toHaveValue(String(DEFAULT_TEMPO));
    await expect(slider(page)).toHaveValue(String(DEFAULT_TEMPO));
    await expect(toggleButton(page)).toHaveText('Start');
  });

  test('toggle button text changes on click', async ({ page }) => {
    const btn = toggleButton(page);
    await expect(btn).toHaveText('Start');
    await btn.click();
    await expect(btn).toHaveText('Stop');
    await btn.click();
    await expect(btn).toHaveText('Start');
  });

  test('updates tempo via number input', async ({ page }) => {
    const input = numberInput(page);
    await input.fill('140');
    await input.press('Enter');
    await expect(input).toHaveValue('140');
    await expect(slider(page)).toHaveValue('140');
  });

  test('updates tempo via slider', async ({ page }) => {
    await slider(page).fill('140');
    await slider(page).dispatchEvent('mouseup');
    await expect(numberInput(page)).toHaveValue('140');
    await expect(slider(page)).toHaveValue('140');
  });

  test('number input rejects typed non-digit characters', async ({ page }) => {
    const input = numberInput(page);
    for (const key of ['.', '-', 'e', 'E', '+']) {
      await input.press(key);
      await expect(input).toHaveValue(String(DEFAULT_TEMPO));
    }
  });

  test('number input rejects pasted non-digit characters', async ({ page }) => {
    const input = numberInput(page);
    const pasteShortcut = `${process.platform === 'darwin' ? 'Meta' : 'Control'}+V`;

    for (const value of ['1.5', '-60', '6e2', '6E2', '1e+2']) {
      await page.evaluate((val) => {
        navigator.clipboard.writeText(val);
      }, value);

      await input.click();
      await input.selectText();     
      await page.keyboard.press(pasteShortcut);

      await expect(input).toHaveValue(String(DEFAULT_TEMPO));
    }
  });

  test('number input reverts to previous value when cleared and blurred', async ({ page }) => {
    const input = numberInput(page);
    await input.selectText();
    await input.press('Backspace');
    await page.locator('h1').click(); // blur
    await expect(input).toHaveValue(String(DEFAULT_TEMPO));
  });

  test('number input reverts to non-default value when cleared and blurred', async ({ page }) => {
    const input = numberInput(page);
    await input.fill('140');
    await input.press('Enter');
    await input.selectText();
    await input.press('Backspace');
    await page.locator('h1').click(); // blur
    await expect(input).toHaveValue('140');
  });

  test('tempo clamps to maximum on out-of-range input', async ({ page }) => {
    const input = numberInput(page);
    await input.fill('9999');
    await input.press('Enter');
    await expect(input).toHaveValue('999');
  });

  test('tempo clamps to minimum on out-of-range input', async ({ page }) => {
    const input = numberInput(page);
    await input.fill('0');
    await input.press('Enter');
    await expect(input).toHaveValue('1');
  });

  test('mouse wheel up on slider increases tempo', async ({ page }) => {
    await slider(page).hover();
    await page.mouse.wheel(0, -100);
    await expect(numberInput(page)).toHaveValue(String(DEFAULT_TEMPO + 1));
    await expect(slider(page)).toHaveValue(String(DEFAULT_TEMPO + 1));
  });

  test('mouse wheel down on slider decreases tempo', async ({ page }) => {
    await slider(page).hover();
    await page.mouse.wheel(0, 100);
    await expect(numberInput(page)).toHaveValue(String(DEFAULT_TEMPO - 1));
    await expect(slider(page)).toHaveValue(String(DEFAULT_TEMPO - 1));
  });

  test('mouse wheel up on number input increases tempo', async ({ page }) => {
    await numberInput(page).hover();
    await page.mouse.wheel(0, -100);
    await expect(numberInput(page)).toHaveValue(String(DEFAULT_TEMPO + 1));
    await expect(slider(page)).toHaveValue(String(DEFAULT_TEMPO + 1));
  });

  test('mouse wheel down on number input decreases tempo', async ({ page }) => {
    await numberInput(page).hover();
    await page.mouse.wheel(0, 100);
    await expect(numberInput(page)).toHaveValue(String(DEFAULT_TEMPO - 1));
    await expect(slider(page)).toHaveValue(String(DEFAULT_TEMPO - 1));
  });
});

// ─── AudioContext tests ───────────────────────────────────────────────────────

test.describe('AudioContext', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__audioMock = { contextCreated: false, calls: [] as string[] };

      class MockAudioContext {
        private _startTime: number;
        state: string;
        destination: object;

        constructor() {
          (window as any).__audioMock.contextCreated = true;
          (window as any).__audioMock.calls.push('constructor');
          this._startTime = Date.now();
          this.state = 'suspended';
          this.destination = {};
        }

        get currentTime() {
          return (Date.now() - this._startTime) / 1000;
        }

        resume() {
          this.state = 'running';
          (window as any).__audioMock.calls.push('resume');
          return Promise.resolve();
        }

        createOscillator() {
          (window as any).__audioMock.calls.push('createOscillator');
          return {
            connect() {},
            start() {},
            stop() {},
            frequency: { value: 0 },
            type: 'sine',
          };
        }

        createGain() {
          return {
            connect() {},
            gain: {
              setValueAtTime() {},
              linearRampToValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
          };
        }
      }

      (window as any).AudioContext = MockAudioContext;
    });

    await page.goto('/');
  });

  const audioCalls = (page: Page) =>
    page.evaluate(() => (window as any).__audioMock.calls as string[]);

  test('AudioContext is not created before first Start', async ({ page }) => {
    const created = await page.evaluate(() => (window as any).__audioMock.contextCreated);
    expect(created).toBe(false);
  });

  test('AudioContext is created on first Start click', async ({ page }) => {
    await toggleButton(page).click();
    const created = await page.evaluate(() => (window as any).__audioMock.contextCreated);
    expect(created).toBe(true);
  });

  test('resume() is called when AudioContext starts suspended', async ({ page }) => {
    await toggleButton(page).click();
    expect(await audioCalls(page)).toContain('resume');
  });

  test('resume() is not called when AudioContext is already running', async ({ page }) => {
    await toggleButton(page).click(); // start — resumes suspended context
    await toggleButton(page).click(); // stop
    await page.evaluate(() => { (window as any).__audioMock.calls = []; });
    await toggleButton(page).click(); // start again — context already running
    expect(await audioCalls(page)).not.toContain('resume');
  });

  test('scheduler creates oscillators after Start', async ({ page }) => {
    await toggleButton(page).click();
    await page.waitForTimeout(100);
    const calls = await audioCalls(page);
    expect(calls.filter(c => c === 'createOscillator').length).toBeGreaterThan(0);
  });

  test('scheduler stops creating oscillators after Stop', async ({ page }) => {
    await toggleButton(page).click(); // start
    await page.waitForTimeout(100);
    await toggleButton(page).click(); // stop
    const countAfterStop = (await audioCalls(page)).filter(c => c === 'createOscillator').length;
    await page.waitForTimeout(600); // longer than one beat at 120 BPM (500 ms)
    const countAfterWait = (await audioCalls(page)).filter(c => c === 'createOscillator').length;
    expect(countAfterWait).toBe(countAfterStop);
  });
});
