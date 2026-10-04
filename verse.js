import { bibleVersionID } from './scripture-api.js';
import { getChapterContentCached, getBooksCached, getConnectionsForVerseIds, saveConnection, deleteConnection, saveNote } from './local-db.js';
import { formatCitation } from './citation.js';

const getParameterByName = (name) => {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, `\\$&`);
  const regex = new RegExp(`[?&]` + name + `(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return ``;
  return decodeURIComponent(results[2].replace(/\+/g, ` `));
};

const bibleBookID = getParameterByName('book');
const bibleChapterID = getParameterByName('chapter'); // Get chapter ID from URL
const bibleChapterList = document.querySelector('#chapter-list');
const verseList = document.getElementById('verse-list'); // Target the correct element
const highlightPopup = document.getElementById('highlight-popup');
const highlightUnderlineBtn = document.getElementById('highlight-underline-btn');
const highlightRemoveBtn = document.getElementById('highlight-remove-btn');
const highlightCopyBtn = document.getElementById('highlight-copy-btn');
const highlightNoteBtn = document.getElementById('highlight-note-btn');

const CHAPTERSTATE = { chapterID: bibleChapterID, bookId: bibleBookID }
const CHAPTERNUMBERSTATE = { chapterNumber: "" }
const CONTENTSTATE = { verses: [] }
const NEXTSTATE = { nextChapter: "" }
const PREVSTATE = { prevChapter: "" }

let chapterConnections = []; // saved highlight/note/flashcard connections touching this chapter
let selectedVerseIds = new Set(); // verses pending a NEW highlight, order derived from CONTENTSTATE.verses at commit time
let selectedRemovalVerseIds = new Set(); // already-highlighted verses pending highlight removal
let verseElements = new Map(); // verseId -> rendered <span> element, rebuilt each render()

//Click semantics depend on whether the verse is already highlighted: an unhighlighted verse
//toggles into the "new highlight" selection, an already-highlighted one toggles into "remove" -
//either way it shows the same dashed .selected preview while pending.
const handleVerseClick = (verseId, el) => {
  const set = el.classList.contains('underline') ? selectedRemovalVerseIds : selectedVerseIds;
  if (set.has(verseId)) {
    set.delete(verseId);
    el.classList.remove('selected');
  } else {
    set.add(verseId);
    el.classList.add('selected');
  }
  updateHighlightPopup();
}

const updateHighlightPopup = () => {
  if (!highlightPopup) return;
  highlightPopup.hidden = selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0;
  if (highlightUnderlineBtn) highlightUnderlineBtn.hidden = selectedVerseIds.size === 0;
  if (highlightRemoveBtn) highlightRemoveBtn.hidden = selectedRemovalVerseIds.size === 0;
  if (highlightCopyBtn) highlightCopyBtn.hidden = selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0;
  if (highlightNoteBtn) highlightNoteBtn.hidden = selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0;
}

const render = () => {
  const chapterTitleEl = document.getElementById('chapter-title');
  if (chapterTitleEl) chapterTitleEl.textContent = `${CHAPTERNUMBERSTATE.chapterNumber}`;
  const el = document.getElementById('verse-list');
  if (!el) return;
  el.innerHTML = '';
  verseElements = new Map();
  const underlinedIds = new Set(chapterConnections.flatMap((c) => c.verseIds));
  for (const verse of CONTENTSTATE.verses) {
    const verseEl = document.createElement('span');
    verseEl.className = 'verse';
    if (underlinedIds.has(verse.id)) verseEl.classList.add('underline');
    verseEl.dataset.verseId = verse.id;
    verseEl.innerHTML = `<span class="v">${verse.number}</span>${verse.text} `;
    verseEl.addEventListener('click', () => handleVerseClick(verse.id, verseEl));
    verseElements.set(verse.id, verseEl);
    el.appendChild(verseEl);
  }
}

//Applies a freshly-fetched chapter's data to page state, loads its saved highlights, and renders it
const applyChapterData = async (data) => {
  CHAPTERSTATE.chapterID = data.id;
  CHAPTERSTATE.bookId = data.bookId;
  CHAPTERNUMBERSTATE.chapterNumber = data.number;
  CONTENTSTATE.verses = data.verses;
  NEXTSTATE.nextChapter = data.next.id;
  PREVSTATE.prevChapter = data.previous.id;
  selectedVerseIds.clear();
  selectedRemovalVerseIds.clear();
  updateHighlightPopup();
  chapterConnections = await getConnectionsForVerseIds(data.verses.map((v) => v.id));
  render();
}

getChapterContentCached(bibleVersionID, CHAPTERSTATE.chapterID).then((data) => {
  if (!data) return;
  applyChapterData(data);
});

const updateUrl = (chapterID) => {
  const url = new URL(window.location);
  url.searchParams.set('chapter', chapterID);
  window.history.pushState({}, '', url);
}

const nextButtonClick = () => {
  getChapterContentCached(bibleVersionID, NEXTSTATE.nextChapter).then(async (data) => {
    if (!data) return;
    await applyChapterData(data);
    updateUrl(data.id);
  });
};

const prevButtonClick = () => {
  getChapterContentCached(bibleVersionID, PREVSTATE.prevChapter).then(async (data) => {
    if (!data) return;
    await applyChapterData(data);
    updateUrl(data.id);
  });
};

document.getElementById("next-btn").addEventListener("click", nextButtonClick);

document.getElementById("prev-btn").addEventListener("click", prevButtonClick);

highlightUnderlineBtn.addEventListener("click", async () => {
  const orderedVerses = CONTENTSTATE.verses.filter((v) => selectedVerseIds.has(v.id));
  if (orderedVerses.length === 0) return;

  const books = await getBooksCached(bibleVersionID);
  const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
  const bookName = book ? book.name : CHAPTERSTATE.bookId;
  const reference = formatCitation(bookName, orderedVerses);

  await saveConnection({
    verseIds: orderedVerses.map((v) => v.id),
    reference,
    type: 'highlight',
    color: 'blue',
  });

  for (const verse of orderedVerses) {
    const el = verseElements.get(verse.id);
    if (el) {
      el.classList.remove('selected');
      el.classList.add('underline');
    }
  }
  selectedVerseIds.clear();
  updateHighlightPopup();
});

highlightRemoveBtn.addEventListener("click", async () => {
  const idsToRemove = new Set(selectedRemovalVerseIds);
  if (idsToRemove.size === 0) return;

  //A verse can belong to more than one overlapping connection - removing it un-highlights it
  //from all of them, since the user has no way to tell them apart visually.
  const connections = await getConnectionsForVerseIds(Array.from(idsToRemove));
  const books = await getBooksCached(bibleVersionID);
  const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
  const bookName = book ? book.name : CHAPTERSTATE.bookId;

  for (const connection of connections) {
    const remainingVerseIds = connection.verseIds.filter((id) => !idsToRemove.has(id));
    if (remainingVerseIds.length === 0) {
      await deleteConnection(connection.id);
    } else {
      const reference = formatCitation(bookName, remainingVerseIds.map((id) => ({ id })));
      await saveConnection({ ...connection, verseIds: remainingVerseIds, reference });
    }
  }

  for (const verseId of idsToRemove) {
    const el = verseElements.get(verseId);
    if (el) {
      el.classList.remove('selected');
      el.classList.remove('underline');
    }
  }
  chapterConnections = await getConnectionsForVerseIds(CONTENTSTATE.verses.map((v) => v.id));
  selectedRemovalVerseIds.clear();
  updateHighlightPopup();
});

highlightCopyBtn.addEventListener("click", async () => {
  const orderedVerses = CONTENTSTATE.verses.filter(
    (v) => selectedVerseIds.has(v.id) || selectedRemovalVerseIds.has(v.id)
  );
  if (orderedVerses.length === 0) return;

  const books = await getBooksCached(bibleVersionID);
  const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
  const bookName = book ? book.name : CHAPTERSTATE.bookId;
  const reference = formatCitation(bookName, orderedVerses);
  const text = `"${orderedVerses.map((v) => v.text.trim()).join(' ')}" (${reference})`;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy verses to clipboard:', error);
    return;
  }

  for (const verse of orderedVerses) {
    const el = verseElements.get(verse.id);
    if (el) el.classList.remove('selected');
  }
  selectedVerseIds.clear();
  selectedRemovalVerseIds.clear();
  updateHighlightPopup();
});

//Creates a note that starts with the selected verses (same quote + citation format as Copy),
//then opens it in edit mode so the user can write below them.
highlightNoteBtn.addEventListener("click", async () => {
  const orderedVerses = CONTENTSTATE.verses.filter(
    (v) => selectedVerseIds.has(v.id) || selectedRemovalVerseIds.has(v.id)
  );
  if (orderedVerses.length === 0) return;

  const books = await getBooksCached(bibleVersionID);
  const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
  const bookName = book ? book.name : CHAPTERSTATE.bookId;
  const reference = formatCitation(bookName, orderedVerses);
  const text = `"${orderedVerses.map((v) => v.text.trim()).join(' ')}" (${reference})\n\n`;

  const note = { text, reference, verseIds: orderedVerses.map((v) => v.id) };
  await saveNote(note);
  window.location.href = `note-view.html?id=${encodeURIComponent(note.id)}&edit`;
});

//Clicking anywhere outside the verse list or the popup itself cancels any pending
//selection (both a fresh highlight and a pending removal), matching the same
//"click away to dismiss" behavior already used for the search dropdown.
document.addEventListener('click', (event) => {
  if (selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0) return;
  if (verseList.contains(event.target) || highlightPopup.contains(event.target)) return;

  for (const verseId of [...selectedVerseIds, ...selectedRemovalVerseIds]) {
    const el = verseElements.get(verseId);
    if (el) el.classList.remove('selected');
  }
  selectedVerseIds.clear();
  selectedRemovalVerseIds.clear();
  updateHighlightPopup();
});

//When user clicks next button, next chapter loads if exists.
//API call to fetch current chapter data.
//Return current chapter ID
//Call API with next chapter ID based on current chapter data
//Return new/current chapter ID
