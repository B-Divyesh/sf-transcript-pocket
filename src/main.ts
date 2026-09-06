import './styles.css';
import { cueAtTime, decodeTranscript, formatTime, parseTranscript, readPositionFile, type Cue, type PositionFile } from './core';
import { checkoutUrl, captureReturnedLicense, getLicense, optimisticallyUnlocked, storeLicense, verifyLicense } from './license';
import { sampleEpisode } from './demo';
import { clearEpisode, deleteStorageScope, loadEpisode, saveEpisode, type SavedEpisode, type StorageScope } from './storage';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const loader = byId<HTMLElement>('loader');
let loaderTitle = byId<HTMLElement>('loader-title');
const workspace = byId<HTMLElement>('workspace');
const fileForm = byId<HTMLFormElement>('file-form');
const audioInput = byId<HTMLInputElement>('audio-file');
const transcriptInput = byId<HTMLInputElement>('transcript-file');
const rememberInput = byId<HTMLInputElement>('remember-episode');
const fileError = byId<HTMLElement>('file-error');
const restoreStatus = byId<HTMLElement>('restore-status');
const audio = byId<HTMLAudioElement>('audio-player');
let episodeTitle = byId<HTMLElement>('episode-title');
const transcriptMeta = byId<HTMLElement>('transcript-meta');
const cueList = byId<HTMLElement>('cue-list');
const searchInput = byId<HTMLInputElement>('transcript-search');
const searchCount = byId<HTMLOutputElement>('search-count');
const bookmarkList = byId<HTMLOListElement>('bookmark-list');
const bookmarkEmpty = byId<HTMLElement>('bookmark-empty');
const dataStatus = byId<HTMLElement>('data-status');
const timeReadout = byId<HTMLOutputElement>('time-readout');
const networkStatus = byId<HTMLElement>('network-status');
const textSizeValue = byId<HTMLOutputElement>('text-size-value');
const toast = byId<HTMLElement>('toast');
const toastText = byId<HTMLElement>('toast-text');
const toastAction = byId<HTMLButtonElement>('toast-action');
const licenseStatus = byId<HTMLElement>('license-status');
const themeControls = byId<HTMLFieldSetElement>('theme-controls');
const demoBanner = byId<HTMLElement>('demo-banner');
const tryDemo = byId<HTMLButtonElement>('try-demo');
const resetDemo = byId<HTMLButtonElement>('reset-demo');
const startReal = byId<HTMLButtonElement>('start-real');

const demoMode = new URL(location.href).searchParams.get('demo') === '1' || location.pathname.replace(/\/+$/, '') === '/demo';
const storageScope: StorageScope = demoMode ? 'demo' : 'real';

if (demoMode) document.title = 'Demo — Transcript Pocket';

let episode: SavedEpisode | null = null;
let audioUrl = '';
let cueElements: HTMLButtonElement[] = [];
let activeCue = -1;
let transcriptSize = Number(localStorage.getItem(`${demoMode ? 'demo:' : ''}tp:transcript-size`)) || 20;
let lastPersist = 0;
let toastTimer = 0;

function showToast(message: string, action = false): void {
  window.clearTimeout(toastTimer);
  toastText.textContent = message;
  toastAction.hidden = !action;
  toast.hidden = false;
  if (!action) toastTimer = window.setTimeout(() => { toast.hidden = true; }, 5000);
}

function updateFileWell(input: HTMLInputElement): void {
  const well = input.closest<HTMLElement>('.file-well');
  const title = well?.querySelector('strong');
  const detail = well?.querySelector('small');
  const file = input.files?.[0];
  if (!well || !title || !detail || !file) return;
  well.classList.add('has-file');
  title.textContent = file.name;
  detail.textContent = `${(file.size / 1_048_576).toFixed(file.size > 10_485_760 ? 0 : 1)} MB · ready`;
}

audioInput.addEventListener('change', () => updateFileWell(audioInput));
transcriptInput.addEventListener('change', () => updateFileWell(transcriptInput));

function cleanEpisodeName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled audio';
}

function setAudioSource(blob: Blob): void {
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(blob);
  audio.src = audioUrl;
}

function setHeadingLevel(element: HTMLElement, tagName: 'h1' | 'h2'): HTMLElement {
  if (element.tagName.toLowerCase() === tagName) return element;
  const replacement = document.createElement(tagName);
  for (const attribute of element.attributes) replacement.setAttribute(attribute.name, attribute.value);
  replacement.textContent = element.textContent;
  element.replaceWith(replacement);
  return replacement;
}

function validateAudioFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = document.createElement('audio');
    const probeUrl = URL.createObjectURL(file);
    const clean = () => {
      probe.removeAttribute('src');
      probe.load();
      URL.revokeObjectURL(probeUrl);
    };
    const timer = window.setTimeout(() => {
      clean();
      reject(new Error('That audio file could not be read. Choose a supported audio file such as MP3, M4A, WAV, OGG, or AAC.'));
    }, 10_000);
    probe.addEventListener('loadedmetadata', () => {
      window.clearTimeout(timer);
      clean();
      resolve();
    }, { once: true });
    probe.addEventListener('error', () => {
      window.clearTimeout(timer);
      clean();
      reject(new Error('That audio file could not be played. Choose a supported audio file such as MP3, M4A, WAV, OGG, or AAC.'));
    }, { once: true });
    probe.preload = 'metadata';
    probe.src = probeUrl;
    probe.load();
  });
}

function openWorkspace(next: SavedEpisode, announce: string): void {
  episode = next;
  activeCue = -1;
  loader.hidden = true;
  workspace.hidden = false;
  loaderTitle = setHeadingLevel(loaderTitle, 'h2');
  episodeTitle = setHeadingLevel(episodeTitle, 'h1');
  demoBanner.hidden = !demoMode;
  episodeTitle.textContent = cleanEpisodeName(next.audioName);
  transcriptMeta.textContent = `${next.transcriptName} · ${next.cues.length.toLocaleString()} timed phrases`;
  setAudioSource(next.audioBlob);
  renderCues();
  renderBookmarks();
  searchInput.value = '';
  filterCues();
  audio.addEventListener('loadedmetadata', restoreAudioPosition, { once: true });
  dataStatus.textContent = announce;
  workspace.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  episodeTitle.focus({ preventScroll: true });
}

function restoreAudioPosition(): void {
  if (!episode) return;
  const upper = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.1) : episode.position;
  audio.currentTime = Math.min(episode.position, upper);
  updatePlaybackState();
}

function renderCues(): void {
  cueList.replaceChildren();
  cueElements = episode?.cues.map((cue, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cue';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `Go to ${formatTime(cue.start)}: ${cue.text}`);
    const time = document.createElement('time');
    time.dateTime = `PT${cue.start}S`;
    time.textContent = formatTime(cue.start);
    const text = document.createElement('span');
    text.textContent = cue.text;
    button.append(time, text);
    button.addEventListener('click', () => {
      audio.currentTime = cue.start;
      updatePlaybackState();
      void audio.play();
    });
    cueList.append(button);
    return button;
  }) ?? [];
}

function filterCues(): void {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let matches = 0;
  cueElements.forEach((element, index) => {
    const match = !query || Boolean(episode?.cues[index].text.toLocaleLowerCase().includes(query));
    element.hidden = !match;
    element.classList.toggle('search-match', Boolean(query && match));
    if (match) matches += 1;
  });
  searchCount.textContent = query ? `${matches} ${matches === 1 ? 'match' : 'matches'}` : 'All phrases';
}

searchInput.addEventListener('input', filterCues);

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function updatePlaybackState(): void {
  timeReadout.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  if (!episode) return;
  episode.position = audio.currentTime;
  const nextCue = cueAtTime(episode.cues, audio.currentTime);
  if (nextCue !== activeCue) {
    if (activeCue >= 0) {
      cueElements[activeCue]?.classList.remove('active');
      cueElements[activeCue]?.removeAttribute('aria-current');
    }
    activeCue = nextCue;
    if (activeCue >= 0) {
      const current = cueElements[activeCue];
      current?.classList.add('active');
      current?.setAttribute('aria-current', 'true');
      if (current && !current.hidden) current.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  if (Date.now() - lastPersist > 5000) void persistProgress();
}

audio.addEventListener('timeupdate', updatePlaybackState);
audio.addEventListener('durationchange', updatePlaybackState);
audio.addEventListener('pause', () => void persistProgress());
audio.addEventListener('ended', () => void persistProgress());

async function persistProgress(): Promise<void> {
  if (!episode || !rememberInput.checked) return;
  lastPersist = Date.now();
  episode.updatedAt = new Date().toISOString();
  try {
    await saveEpisode(episode, storageScope);
  } catch {
    dataStatus.textContent = 'Your files still work in this tab, but this browser could not save the episode for offline return.';
  }
}

fileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  fileError.textContent = '';
  const audioFile = audioInput.files?.[0];
  const transcriptFile = transcriptInput.files?.[0];
  if (!audioFile || !transcriptFile) {
    fileError.textContent = 'Choose both an audio file and its VTT or SRT transcript.';
    byId<HTMLElement>(!audioFile ? 'audio-well' : 'transcript-well').focus();
    return;
  }
  if (!/\.(vtt|srt)$/i.test(transcriptFile.name)) {
    fileError.textContent = 'That transcript is not a .vtt or .srt file. Choose a timed sidecar caption file.';
    transcriptInput.focus();
    return;
  }
  const submit = byId<HTMLButtonElement>('open-player');
  submit.disabled = true;
  submit.textContent = 'Reading time marks…';
  try {
    const source = decodeTranscript(await transcriptFile.arrayBuffer());
    const cues = parseTranscript(source);
    await validateAudioFile(audioFile);
    const next: SavedEpisode = {
      key: 'current', audioName: audioFile.name, audioType: audioFile.type,
      audioBlob: audioFile, transcriptName: transcriptFile.name, cues,
      position: 0, bookmarks: [], updatedAt: new Date().toISOString()
    };
    if (rememberInput.checked) {
      try {
        await saveEpisode(next, storageScope);
      } catch {
        fileError.textContent = 'The episode opened, but it is too large for this browser to keep offline. It will remain available in this tab.';
      }
    } else {
      await clearEpisode(storageScope).catch(() => undefined);
    }
    openWorkspace(next, rememberInput.checked ? 'Saved locally for your next visit.' : 'Open for this tab only.');
  } catch (error) {
    fileError.textContent = error instanceof Error ? error.message : 'The transcript could not be read. Try another VTT or SRT file.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Open listening sheet <span aria-hidden="true">→</span>';
  }
});

byId<HTMLButtonElement>('change-files').addEventListener('click', () => {
  audio.pause();
  workspace.hidden = true;
  episodeTitle = setHeadingLevel(episodeTitle, 'h2');
  loaderTitle = setHeadingLevel(loaderTitle, 'h1');
  loader.hidden = false;
  loader.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
});

byId<HTMLButtonElement>('back-button').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
byId<HTMLButtonElement>('forward-button').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 10); });
byId<HTMLSelectElement>('speed-select').addEventListener('change', (event) => { audio.playbackRate = Number((event.target as HTMLSelectElement).value); });

function currentCueText(cues: Cue[], time: number): string {
  const index = cueAtTime(cues, time);
  return index >= 0 ? cues[index].text : `Listening position at ${formatTime(time)}`;
}

function addBookmark(): void {
  if (!episode) return;
  const time = audio.currentTime;
  const duplicate = episode.bookmarks.find((item) => Math.abs(item.time - time) < 1);
  if (duplicate) {
    dataStatus.textContent = `A bookmark already exists at ${formatTime(duplicate.time)}.`;
    return;
  }
  episode.bookmarks.push({
    id: crypto.randomUUID(), time, text: currentCueText(episode.cues, time), createdAt: new Date().toISOString()
  });
  episode.bookmarks.sort((a, b) => a.time - b.time);
  renderBookmarks();
  dataStatus.textContent = `Bookmarked ${formatTime(time)}.`;
  void persistProgress();
}

byId<HTMLButtonElement>('bookmark-button').addEventListener('click', addBookmark);

function renderBookmarks(): void {
  bookmarkList.replaceChildren();
  const bookmarks = episode?.bookmarks ?? [];
  bookmarkEmpty.hidden = bookmarks.length > 0;
  bookmarks.forEach((bookmark) => {
    const item = document.createElement('li');
    item.className = 'bookmark-item';
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'bookmark-jump';
    const time = document.createElement('time');
    time.textContent = formatTime(bookmark.time);
    const text = document.createElement('span');
    text.textContent = bookmark.text;
    jump.append(time, text);
    jump.addEventListener('click', () => { audio.currentTime = bookmark.time; updatePlaybackState(); });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'bookmark-remove';
    remove.setAttribute('aria-label', `Remove bookmark at ${formatTime(bookmark.time)}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      if (!episode) return;
      episode.bookmarks = episode.bookmarks.filter((item) => item.id !== bookmark.id);
      renderBookmarks();
      dataStatus.textContent = `Removed bookmark at ${formatTime(bookmark.time)}.`;
      void persistProgress();
    });
    item.append(jump, remove);
    bookmarkList.append(item);
  });
}

function positionData(): PositionFile | null {
  if (!episode) return null;
  return {
    kind: 'transcript-pocket-position', version: 1, audioName: episode.audioName,
    transcriptName: episode.transcriptName, position: audio.currentTime,
    bookmarks: episode.bookmarks, exportedAt: new Date().toISOString()
  };
}

byId<HTMLButtonElement>('export-position').addEventListener('click', () => {
  const data = positionData();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${cleanEpisodeName(data.audioName).replace(/\s+/g, '-').toLowerCase()}-position.json`;
  link.click();
  URL.revokeObjectURL(url);
  dataStatus.textContent = 'Position and bookmarks exported. Your audio was not included.';
});

byId<HTMLInputElement>('import-position').addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !episode) return;
  try {
    const imported = readPositionFile(await file.text());
    episode.position = imported.position;
    episode.bookmarks = imported.bookmarks;
    audio.currentTime = imported.position;
    renderBookmarks();
    updatePlaybackState();
    const sameEpisode = imported.audioName === episode.audioName;
    dataStatus.textContent = sameEpisode ? 'Position and bookmarks restored.' : 'Position restored. The exported audio name differs, so confirm this is the same episode.';
    void persistProgress();
  } catch (error) {
    dataStatus.textContent = error instanceof Error ? error.message : 'That position file could not be imported.';
  } finally {
    input.value = '';
  }
});

byId<HTMLButtonElement>('remove-saved').addEventListener('click', async () => {
  if (!confirm('Remove the saved audio, transcript, position, and bookmarks from this browser? The episode will keep playing until this tab closes.')) return;
  try {
    await clearEpisode(storageScope);
    rememberInput.checked = false;
    dataStatus.textContent = 'Offline copy removed. The open player is unchanged until this tab closes.';
  } catch {
    dataStatus.textContent = 'The offline copy could not be removed. Use your browser’s site-data controls instead.';
  }
});

function applyTranscriptSize(persist = true): void {
  transcriptSize = Math.min(30, Math.max(18, transcriptSize));
  document.documentElement.style.setProperty('--transcript-size', `${transcriptSize}px`);
  textSizeValue.textContent = `${transcriptSize} px`;
  if (persist) localStorage.setItem(`${demoMode ? 'demo:' : ''}tp:transcript-size`, String(transcriptSize));
}
byId<HTMLButtonElement>('text-smaller').addEventListener('click', () => { transcriptSize -= 2; applyTranscriptSize(); });
byId<HTMLButtonElement>('text-larger').addEventListener('click', () => { transcriptSize += 2; applyTranscriptSize(); });
applyTranscriptSize(false);

document.addEventListener('keydown', (event) => {
  if (workspace.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement;
  if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName) || target.isContentEditable) return;
  if (event.key === ' ') {
    event.preventDefault();
    audio.paused ? void audio.play() : audio.pause();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 5);
  } else if (event.key.toLowerCase() === 'b') {
    addBookmark();
  }
});

function updateNetworkStatus(): void {
  const offline = !navigator.onLine;
  networkStatus.textContent = offline ? 'Offline · player ready' : 'Local by design';
  networkStatus.classList.toggle('offline', offline);
  if (offline) showToast('You are offline. Saved listening sheets still work.');
}
addEventListener('online', updateNetworkStatus);
addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

function applyTheme(theme: string): void {
  document.documentElement.dataset.theme = theme === 'light' || theme === 'dark' ? theme : '';
  const color = theme === 'dark' ? '#071b24' : '#dceff0';
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', color);
}

function unlockTheme(unlocked: boolean): void {
  themeControls.disabled = !unlocked;
  if (!unlocked) applyTheme('system');
  const saved = unlocked ? localStorage.getItem('tp:theme') ?? 'system' : 'system';
  const control = themeControls.querySelector<HTMLInputElement>(`input[value="${saved}"]`);
  if (control) control.checked = true;
  applyTheme(saved);
}

themeControls.addEventListener('change', (event) => {
  const value = (event.target as HTMLInputElement).value;
  localStorage.setItem('tp:theme', value);
  applyTheme(value);
});

async function refreshLicense(force = false): Promise<void> {
  const hasToken = Boolean(getLicense());
  unlockTheme(optimisticallyUnlocked());
  if (!hasToken) {
    licenseStatus.textContent = 'The free player is ready. Add a license whenever you want appearance controls.';
    return;
  }
  licenseStatus.textContent = navigator.onLine ? 'Checking your license…' : 'Offline. Using the last verified license state.';
  const verdict = await verifyLicense(force);
  if (!verdict) {
    licenseStatus.textContent = 'License verification is unavailable. Try again when you are online.';
    return;
  }
  unlockTheme(verdict.valid);
  licenseStatus.textContent = verdict.valid ? 'Pocket Plus is active on this device.' : 'This license is no longer active. You can keep using every free listening feature.';
}

captureReturnedLicense();
byId<HTMLAnchorElement>('buy-link').href = checkoutUrl;
byId<HTMLInputElement>('license-token').value = getLicense();
byId<HTMLFormElement>('license-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = byId<HTMLInputElement>('license-token').value.trim();
  if (!token) {
    licenseStatus.textContent = 'Paste the license token from your purchase email.';
    return;
  }
  storeLicense(token);
  await refreshLicense(true);
});
void refreshLicense();

async function restoreSavedEpisode(): Promise<void> {
  try {
    if (demoMode) {
      await openDemo();
      return;
    }
    const saved = await loadEpisode(storageScope);
    if (!saved?.audioBlob || !saved.cues?.length) {
      restoreStatus.textContent = 'No saved episode yet. Choose two files to begin.';
      return;
    }
    rememberInput.checked = true;
    openWorkspace(saved, `Restored from this device · last used ${new Date(saved.updatedAt).toLocaleDateString()}.`);
  } catch {
    restoreStatus.textContent = 'Local storage is unavailable here. You can still use the player in this tab.';
  }
}
void restoreSavedEpisode();

async function openDemo(): Promise<void> {
  const next = await sampleEpisode();
  await saveEpisode(next, 'demo');
  rememberInput.checked = true;
  openWorkspace(next, 'Demo sample ready. Nothing here is saved with your files.');
}

async function discardDemoData(): Promise<void> {
  await deleteStorageScope('demo');
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('demo:')) localStorage.removeItem(key);
  }
}

tryDemo.addEventListener('click', () => {
  location.assign('/?demo=1');
});

resetDemo.addEventListener('click', async () => {
  await discardDemoData();
  transcriptSize = 20;
  applyTranscriptSize(false);
  await openDemo();
  dataStatus.textContent = 'Demo reset to the sample listening sheet.';
});

startReal.addEventListener('click', async () => {
  await discardDemoData();
  location.assign('/');
});

if ('serviceWorker' in navigator) {
  const hadServiceWorker = Boolean(navigator.serviceWorker.controller);
  addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('A new offline sheet is ready.', true);
        });
      });
    }).catch(() => showToast('Offline installation is unavailable in this browser.'));
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_UPDATED') {
      showToast(hadServiceWorker ? 'Transcript Pocket was updated for offline use.' : 'Ready for offline listening.', hadServiceWorker);
    }
  });
}
toastAction.addEventListener('click', () => location.reload());
