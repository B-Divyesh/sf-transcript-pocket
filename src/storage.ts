import type { Bookmark, Cue } from './core';

export interface SavedEpisode {
  key: 'current';
  audioName: string;
  audioType: string;
  audioBlob: Blob;
  transcriptName: string;
  cues: Cue[];
  position: number;
  bookmarks: Bookmark[];
  updatedAt: string;
}

const DATABASE = 'transcript-pocket';
const STORE = 'episodes';
export type StorageScope = 'real' | 'demo';

function databaseName(scope: StorageScope): string {
  return scope === 'demo' ? 'demo:transcript-pocket' : DATABASE;
}

async function databaseExists(scope: StorageScope): Promise<boolean> {
  // Opening a missing IndexedDB database creates it. That is wrong for the
  // empty first-use screen: taking the demo route must not leave an empty real
  // namespace behind. Chromium and the other current target browsers expose
  // this non-mutating inventory API.
  if (typeof indexedDB.databases !== 'function') return true;
  const names = await indexedDB.databases();
  return names.some((database) => database.name === databaseName(scope));
}

function openDatabase(scope: StorageScope): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(scope), 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

async function transact<T>(scope: StorageScope, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase(scope);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Local storage transaction failed.'));
  });
}

export function saveEpisode(episode: SavedEpisode, scope: StorageScope = 'real'): Promise<IDBValidKey> {
  return transact(scope, 'readwrite', (store) => store.put(episode));
}

export function loadEpisode(scope: StorageScope = 'real'): Promise<SavedEpisode | undefined> {
  return databaseExists(scope).then((exists) => exists
    ? transact(scope, 'readonly', (store) => store.get('current'))
    : undefined
  );
}

export function clearEpisode(scope: StorageScope = 'real'): Promise<undefined> {
  return transact(scope, 'readwrite', (store) => store.delete('current'));
}

export function deleteStorageScope(scope: StorageScope): Promise<void> {
  const name = databaseName(scope);
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onblocked = () => reject(new Error('Close other Transcript Pocket tabs, then try again.'));
    request.onerror = () => reject(request.error ?? new Error('Could not discard local storage.'));
  });
}
