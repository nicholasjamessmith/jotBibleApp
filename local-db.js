//jotBible's local database: Bible content cache + user data (notes, flashcards, verse connections)
import { getBooks, getChapters, getChapterContentRaw } from './scripture-api.js';

const DB_NAME = 'jotBibleDB';
const DB_VERSION = 2;

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
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('flashcards')) db.createObjectStore('flashcards', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('verseConnections')) {
        const store = db.createObjectStore('verseConnections', { keyPath: 'id' });
        store.createIndex('by_verseId', 'verseIds', { multiEntry: true });
      }
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

const idbGetAll = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

const idbGetAllByIndex = async (storeName, indexName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).index(indexName).getAll(key);
    req.onsuccess = () => resolve(req.result || []);
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

const idbDelete = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
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

//One-time migration of legacy localStorage data into IndexedDB, run lazily on first read
let notesMigrated = false;
const migrateLegacyNotes = async () => {
  if (notesMigrated) return;
  notesMigrated = true;
  const legacyJSON = localStorage.getItem('notes');
  if (!legacyJSON) return;
  const legacyNotes = JSON.parse(legacyJSON);
  for (const text of legacyNotes) {
    await idbPut('notes', { id: crypto.randomUUID(), text, verseIds: [], reference: '', createdAt: Date.now() });
  }
  localStorage.removeItem('notes');
}

let flashcardsMigrated = false;
const migrateLegacyFlashcards = async () => {
  if (flashcardsMigrated) return;
  flashcardsMigrated = true;
  const legacyJSON = localStorage.getItem('flashcards');
  if (!legacyJSON) return;
  const legacyCards = JSON.parse(legacyJSON);
  for (const card of legacyCards) {
    await idbPut('flashcards', { id: crypto.randomUUID(), reference: card.reference, scripture: card.scripture, verseIds: [], createdAt: Date.now() });
  }
  localStorage.removeItem('flashcards');
}

//Notes
const getAllNotes = async () => {
  await migrateLegacyNotes();
  return idbGetAll('notes');
}

const getNote = async (id) => {
  await migrateLegacyNotes();
  return idbGet('notes', id);
}

const saveNote = (note) => {
  if (!note.id) note.id = crypto.randomUUID();
  if (!note.createdAt) note.createdAt = Date.now();
  if (!note.verseIds) note.verseIds = [];
  if (!note.reference) note.reference = '';
  return idbPut('notes', note);
}

const deleteNote = (id) => idbDelete('notes', id);

//Flashcards
const getAllFlashcards = async () => {
  await migrateLegacyFlashcards();
  return idbGetAll('flashcards');
}

const getFlashcard = async (id) => {
  await migrateLegacyFlashcards();
  return idbGet('flashcards', id);
}

const saveFlashcard = (card) => {
  if (!card.id) card.id = crypto.randomUUID();
  if (!card.createdAt) card.createdAt = Date.now();
  if (!card.verseIds) card.verseIds = [];
  return idbPut('flashcards', card);
}

const deleteFlashcard = (id) => idbDelete('flashcards', id);

//Verse connections (highlights, and future note/flashcard verse-links)
const getConnectionsForVerseIds = async (verseIds) => {
  const groups = await Promise.all(verseIds.map((id) => idbGetAllByIndex('verseConnections', 'by_verseId', id)));
  const byId = new Map();
  for (const group of groups) {
    for (const connection of group) {
      byId.set(connection.id, connection);
    }
  }
  return Array.from(byId.values());
}

const saveConnection = (connection) => {
  if (!connection.id) connection.id = crypto.randomUUID();
  if (!connection.createdAt) connection.createdAt = Date.now();
  if (!connection.targetId) connection.targetId = null;
  return idbPut('verseConnections', connection);
}

const deleteConnection = (id) => idbDelete('verseConnections', id);

export {
  getBooksCached, getChaptersCached, getChapterContentCached,
  getAllNotes, getNote, saveNote, deleteNote,
  getAllFlashcards, getFlashcard, saveFlashcard, deleteFlashcard,
  getConnectionsForVerseIds, saveConnection, deleteConnection,
};
