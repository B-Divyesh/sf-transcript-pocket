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
  return transact(scope, 'readonly', (store) => store.get('current'));
}

export function clearEpisode(scope: StorageScope = 'real'): Promise<undefined> {
  return transact(scope, 'readwrite', (store) => store.delete('current'));
}
