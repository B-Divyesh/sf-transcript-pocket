import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

test('loads local files, searches, bookmarks, restores, and works offline', async ({ page, context }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Transcript Pocket/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Bring the audio/i })).toBeVisible();

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

  await page.waitForFunction(() => navigator.serviceWorker?.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeVisible();
  await expect(page.locator('.bookmark-item')).toHaveCount(1);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'field notes' })).toBeVisible();
  await expect(page.locator('#network-status')).toContainText('Offline');
  expect(consoleErrors).toEqual([]);
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
