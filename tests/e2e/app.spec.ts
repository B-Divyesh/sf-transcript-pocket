import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function silentWav(seconds = 8): Buffer {
  const sampleRate = 8000;
  const dataSize = sampleRate * seconds;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  buffer.fill(128, 44);
  return buffer;
}

const vtt = `WEBVTT

00:00.000 --> 00:02.000
Welcome to the pocket.

00:02.000 --> 00:05.000
This phrase is searchable.

00:05.000 --> 00:08.000
The final blueprint note.`;

const srt = `1
00:00:00,000 --> 00:00:02,000
A timed SRT phrase.`;

async function fixture(name: string): Promise<Buffer> {
  return readFile(new URL(`../fixtures/${name}`, import.meta.url));
}

test('loads local files, searches, bookmarks, restores, and works offline', async ({ page, context }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Transcript Pocket/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Read podcasts alongside/i })).toBeVisible();

  // Axe accepts all Playwright Page versions at runtime; the cast bridges its looser peer range.
  const accessibility = await new AxeBuilder({ page: page as never }).analyze();
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.locator('#audio-file').setInputFiles({ name: 'field-notes.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.locator('#transcript-file').setInputFiles({ name: 'field-notes.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeVisible();
  await expect(page.locator('.cue')).toHaveCount(3);

  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('searchable');
  await expect(page.locator('.cue:visible')).toHaveCount(1);
  await expect(page.locator('#search-count')).toContainText('1 match');
  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('');

  await page.evaluate(() => { (document.querySelector('#audio-player') as HTMLAudioElement).currentTime = 2.5; });
  await page.getByRole('button', { name: /Bookmark here/i }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);
  await expect(page.locator('#data-status')).toContainText('Bookmarked');

  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeVisible();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeVisible();
  await expect(page.locator('#network-status')).toContainText('Offline');
  expect(consoleErrors).toEqual([]);
});

test('@claim:sample-demo opens a seeded listening sheet without touching real storage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'city notes sample' })).toBeVisible();
  await expect(page.locator('.cue')).toHaveCount(3);
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:transcript-pocket');
  expect(databases).not.toContain('transcript-pocket');
  const localKeys = await page.evaluate(() => Object.keys(localStorage));
  expect(localKeys).not.toContain('tp:transcript-size');
  expect(localKeys).not.toContain('tp:theme');
});

test('@claim:local-files keeps audio, captions, search, bookmarks, and exports on this origin', async ({ page, context }) => {
  const requests: string[] = [];
  context.on('request', (request) => requests.push(request.url()));
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'city notes sample' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('changed her route');
  await expect(page.locator('.cue:visible')).toHaveCount(1);
  await page.evaluate(() => { (document.querySelector('#audio-player') as HTMLAudioElement).currentTime = 2.5; });
  await page.getByRole('button', { name: /Bookmark here/i }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export position' }).click();
  await (await download).path();
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:offline-reload reloads the sample sheet offline after its first visit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/?demo=1');
    await expect(page.getByRole('heading', { name: 'city notes sample' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'city notes sample' })).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'city notes sample' })).toBeVisible();
    await expect(page.locator('#network-status')).toContainText('Offline');
  } finally {
    await context.close();
  }
});

test('@claim:synchronized-reading highlights the phrase at the sample playback time', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.evaluate(() => {
    const player = document.querySelector('#audio-player') as HTMLAudioElement;
    player.currentTime = 2.5;
    player.dispatchEvent(new Event('timeupdate'));
  });
  await expect(page.locator('.cue.active')).toContainText('guest names the small sound');
});

test('@claim:caption-formats opens timed VTT and SRT captions beside local audio', async ({ page }) => {
  await page.goto('/');
  await page.locator('#audio-file').setInputFiles({ name: 'notes.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.locator('#transcript-file').setInputFiles({ name: 'notes.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.getByRole('heading', { name: 'notes' })).toBeVisible();
  await expect(page.locator('.cue')).toHaveCount(3);
  await page.getByRole('button', { name: 'Change files' }).click();
  await page.locator('#audio-file').setInputFiles({ name: 'notes.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.locator('#transcript-file').setInputFiles({ name: 'notes.srt', mimeType: 'application/x-subrip', buffer: Buffer.from(srt) });
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.locator('.cue')).toHaveCount(1);
  await expect(page.locator('.cue')).toContainText('A timed SRT phrase.');
});

test('@claim:audio-formats opens each listed local audio format', async ({ page }) => {
  const formats = [
    ['wav', 'audio/wav'],
    ['mp3', 'audio/mpeg'],
    ['m4a', 'audio/mp4'],
    ['ogg', 'audio/ogg'],
    ['aac', 'audio/aac']
  ] as const;

  await page.goto('/');
  for (const [index, [extension, mimeType]] of formats.entries()) {
    if (index > 0) await page.getByRole('button', { name: 'Change files' }).click();
    await page.locator('#audio-file').setInputFiles({
      name: `spoken-${extension}.${extension}`,
      mimeType,
      buffer: await fixture(`audio-format.${extension}`)
    });
    await page.locator('#transcript-file').setInputFiles({ name: `spoken-${extension}.vtt`, mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
    await page.getByRole('button', { name: /Open listening sheet/i }).click();
    await expect(page.getByRole('heading', { name: `spoken ${extension}` })).toBeVisible();
    await expect.poll(() => page.locator('#audio-player').evaluate((player: HTMLAudioElement) => player.duration)).toBeGreaterThan(0);
  }
});

test('@claim:text-size changes the sample reading size between 18 and 30 pixels', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Make transcript text larger' }).click({ clickCount: 8 });
  await expect(page.locator('#text-size-value')).toHaveText('30 px');
  await page.getByRole('button', { name: 'Make transcript text smaller' }).click({ clickCount: 8 });
  await expect(page.locator('#text-size-value')).toHaveText('18 px');
});

test('@claim:search filters the sample transcript by phrase', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('changed her route');
  await expect(page.locator('.cue:visible')).toHaveCount(1);
});

test('@claim:bookmarks saves a sample phrase marker', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.evaluate(() => { (document.querySelector('#audio-player') as HTMLAudioElement).currentTime = 2.5; });
  await page.getByRole('button', { name: /Bookmark here/i }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);
});

test('@claim:position-export exports a position without audio bytes', async ({ page }) => {
  await page.goto('/?demo=1');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export position' }).click();
  const exported = await download;
  const stream = await exported.createReadStream();
  let contents = '';
  for await (const chunk of stream!) contents += chunk.toString();
  expect(contents).toContain('transcript-pocket-position');
  expect(contents).not.toContain('audioBlob');
  expect(contents).not.toContain('RIFF');
});

test('@claim:audio-recovery rejects corrupt audio before opening a player', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.locator('#audio-file').setInputFiles({ name: 'broken.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('not audio') });
  await page.locator('#transcript-file').setInputFiles({ name: 'broken.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.locator('#file-error')).toContainText('could not be played');
  await expect(page.locator('#workspace')).toBeHidden();
});

test('@claim:position-import explains malformed JSON', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.locator('#import-position').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('#data-status')).toContainText('not valid position JSON');
});

test('@claim:pocket-plus-price states the optional one-time price and checkout destination', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('US$12 · one-time purchase')).toBeVisible();
  await expect(page.locator('#buy-link')).toHaveAttribute('href', /api\.sociobot\.in\/api\/v1\/products\/transcript-pocket\/checkout/);
});

test('@claim:free-core keeps reading controls usable without a license', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByRole('radio', { name: 'Day sheet' })).toBeDisabled();
  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('changed her route');
  await expect(page.locator('.cue:visible')).toHaveCount(1);
  await page.evaluate(() => { (document.querySelector('#audio-player') as HTMLAudioElement).currentTime = 2.5; });
  await page.getByRole('button', { name: /Bookmark here/i }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export position' }).click();
  await expect(await download).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:transcript-pocket'))).toBeNull();
});

test('resets and exits the demo without retaining demo data', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Make transcript text larger' }).click({ clickCount: 5 });
  await page.evaluate(() => { (document.querySelector('#audio-player') as HTMLAudioElement).currentTime = 2.5; });
  await page.getByRole('button', { name: /Bookmark here/i }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.bookmark-item')).toHaveCount(0);
  await expect(page.locator('#text-size-value')).toHaveText('20 px');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  const state = await page.evaluate(async () => ({
    databases: (await indexedDB.databases()).map((database) => database.name),
    localKeys: Object.keys(localStorage)
  }));
  expect(state.databases).not.toContain('demo:transcript-pocket');
  expect(state.localKeys.some((key) => key.startsWith('demo:'))).toBe(false);
});

test('shows an in-page recovery message when required files are missing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.locator('#file-error')).toContainText('Choose both an audio file');
  await expect(page.locator('#audio-well')).toBeFocused();
});

test('uses the demo title, audible sample, and 44 pixel text-link targets', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Transcript Pocket');
  const sampleHasSound = await page.evaluate(async () => {
    const response = await fetch('/assets/city-notes-sample.mp3');
    const audioContext = new AudioContext();
    const decoded = await audioContext.decodeAudioData(await response.arrayBuffer());
    await audioContext.close();
    return decoded.getChannelData(0).some((sample) => Math.abs(sample) > 0.01);
  });
  expect(sampleHasSound).toBe(true);
  await page.goto('/');
  for (const selector of ['.text-link[href*="demo"]', '.fine-print a[href="/privacy/"]', 'footer a[href="/terms/"]']) {
    const box = await page.locator(selector).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('keeps the audience and first action visible on desktop and 390px mobile', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Read podcasts alongside/i })).toBeVisible();
    await expect(page.getByText(/Deaf and hard-of-hearing podcast listeners/i)).toBeVisible();
    const action = page.getByRole('button', { name: 'Try it with sample data' });
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
  }
});

test('moves keyboard focus to the revealed player and has no serious loaded-player axe violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#audio-file').setInputFiles({ name: 'field-notes.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.locator('#transcript-file').setInputFiles({ name: 'field-notes.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
  await page.getByRole('button', { name: /Open listening sheet/i }).click();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeFocused();
  const accessibility = await new AxeBuilder({ page: page as never }).analyze();
  expect(accessibility.violations.filter((violation) => ['serious', 'critical', 'moderate'].includes(violation.impact ?? ''))).toEqual([]);
});

test('keeps the first-use flow usable at 390px and exposes legal pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS('min-width', '320px');
  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toHaveText(/Privacy/);
  await page.goto('/terms/');
  await expect(page.locator('h1')).toHaveText(/Terms/);
});
