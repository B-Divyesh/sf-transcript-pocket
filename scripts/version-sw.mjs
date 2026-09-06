import { readFile, writeFile } from 'node:fs/promises';

const serviceWorkerPath = new URL('../dist/sw.js', import.meta.url);
const serviceWorker = await readFile(serviceWorkerPath, 'utf8');
const version = Date.now().toString(36);

if (!serviceWorker.includes('__BUILD_VERSION__')) {
  throw new Error('The service-worker build version placeholder is missing.');
}

await writeFile(serviceWorkerPath, serviceWorker.replace('__BUILD_VERSION__', version));
