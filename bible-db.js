//Local IndexedDB cache for Bible data, backed by scripture-api.js
import { getBooks, getChapters, getChapterContentRaw } from './scripture-api.js';

const DB_NAME = 'jotBibleDB';
const DB_VERSION = 1;

let dbPromise = null;

const openDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'bibleVersionID' });
      if (!db.objectStoreNames.contains('chapterLists')) db.createObjectStore('chapterLists', { keyPath: 'bookId' });
      if (!db.objectStoreNames.contains('chapterContent')) db.createObjectStore('chapterContent', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const idbGet = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

const idbPut = async (storeName, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

//Flatten the API's nested content tag-tree into an ordered list of { id, number, text } verses
const parseChapterContent = (contentNodes) => {
  const verseMap = new Map();
  const order = [];

  const sidToVerseId = (sid) => sid.replace(' ', '.').replace(':', '.');

  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'tag') {
        if (node.name === 'verse') {
          const verseId = sidToVerseId(node.attrs.sid);
          if (!verseMap.has(verseId)) {
            verseMap.set(verseId, { id: verseId, number: node.attrs.number, text: '' });
            order.push(verseId);
          }
          continue;
        }
        if (node.name === 'note') continue;
        if (node.items) walk(node.items);
      } else if (node.type === 'text') {
        const verseId = node.attrs && node.attrs.verseId;
        if (!verseId) continue;
        if (!verseMap.has(verseId)) {
          verseMap.set(verseId, { id: verseId, number: verseId.split('.').pop(), text: '' });
          order.push(verseId);
        }
        verseMap.get(verseId).text += node.text;
      }
    }
  }

  walk(contentNodes);
  return order.map((id) => {
    const verse = verseMap.get(id);
    verse.text = verse.text.trim();
    return verse;
  });
}

const getBooksCached = async (bibleVersionID) => {
  try {
    const cached = await idbGet('books', bibleVersionID);
    if (cached) return cached.data;
  } catch (error) {
    console.error('IndexedDB unavailable, falling back to network:', error);
    return getBooks(bibleVersionID);
  }
  const data = await getBooks(bibleVersionID);
  try {
    await idbPut('books', { bibleVersionID, data });
  } catch (error) {
    console.error('Failed to cache books:', error);
  }
  return data;
}

const getChaptersCached = async (bibleVersionID, bookId) => {
  try {
    const cached = await idbGet('chapterLists', bookId);
    if (cached) return cached.data;
  } catch (error) {
    console.error('IndexedDB unavailable, falling back to network:', error);
    return getChapters(bibleVersionID, bookId);
  }
  const data = await getChapters(bibleVersionID, bookId);
  try {
    await idbPut('chapterLists', { bookId, data });
  } catch (error) {
    console.error('Failed to cache chapter list:', error);
  }
  return data;
}

const getChapterContentCached = async (bibleVersionID, chapterId) => {
  try {
    const cached = await idbGet('chapterContent', chapterId);
    if (cached) return cached;
  } catch (error) {
    console.error('IndexedDB unavailable, falling back to network:', error);
    const raw = await getChapterContentRaw(bibleVersionID, chapterId);
    if (!raw) return null;
    return {
      id: raw.id,
      number: raw.number,
      bookId: raw.bookId,
      reference: raw.reference,
      verseCount: raw.verseCount,
      verses: parseChapterContent(raw.content),
      next: raw.next,
      previous: raw.previous,
    };
  }
  const raw = await getChapterContentRaw(bibleVersionID, chapterId);
  if (!raw) return null;
  const record = {
    id: raw.id,
    number: raw.number,
    bookId: raw.bookId,
    reference: raw.reference,
    verseCount: raw.verseCount,
    verses: parseChapterContent(raw.content),
    next: raw.next,
    previous: raw.previous,
  };
  try {
    await idbPut('chapterContent', record);
  } catch (error) {
    console.error('Failed to cache chapter content:', error);
  }
  return record;
}

export { getBooksCached, getChaptersCached, getChapterContentCached };
