/* 打卡照片素材库 · IndexedDB 本地持久化 */

export interface PhotoEntry {
  id: string;
  boothId: string;
  boothName: string;
  zoneName: string;
  createdAt: number;
  dataUrl: string;
}

const DB_NAME = 'carnival-photos-v1';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;
let memoryFallback: PhotoEntry[] = [];

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('indexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
    });
  }
  return dbPromise;
}

export async function savePhoto(entry: PhotoEntry): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    memoryFallback = [entry, ...memoryFallback.filter((p) => p.id !== entry.id)];
  }
}

export async function listPhotos(): Promise<PhotoEntry[]> {
  try {
    const db = await openDb();
    const all = await new Promise<PhotoEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as PhotoEntry[]);
      req.onerror = () => reject(req.error);
    });
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [...memoryFallback];
  }
}

export async function deletePhoto(id: string): Promise<void> {
  memoryFallback = memoryFallback.filter((p) => p.id !== id);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 忽略：内存兜底已经删除
  }
}

export async function countPhotos(): Promise<number> {
  try {
    const db = await openDb();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryFallback.length;
  }
}
