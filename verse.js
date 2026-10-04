import { bibleVersionID } from './scripture-api.js';
import { getChapterContentCached, getBooksCached, getConnectionsForVerseIds, saveConnection, deleteConnection, saveNote, saveFlashcard, getNotesForVerseIds, getFlashcardsForVerseIds, getBookmark, saveBookmark, deleteBookmark } from './local-db.js';
import { formatCitation, joinVerseText } from './citation.js';
import { rememberLocation } from './tab-state.js';
import { backfillVerseLinks } from './verse-links.js';
import { stripMarkdown } from './note-markdown.js';

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
const highlightFlashcardBtn = document.getElementById('highlight-flashcard-btn');
const highlightLinks = document.getElementById('highlight-links');
const highlightCloseBtn = document.getElementById('highlight-close-btn');
const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarkLabel = bookmarkBtn.querySelector('.bookmark-label');

//Same Lucide icons as the Notes / Study nav links
const ICON_ATTRS = 'class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const NOTE_ICON = `<svg ${ICON_ATTRS}><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>`;
const FLASHCARD_ICON = `<svg ${ICON_ATTRS}><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>`;
const LINKED_PREVIEW_LIMIT = 3;
const LINKED_TEXT_LENGTH = 50;

const CHAPTERSTATE = { chapterID: bibleChapterID, bookId: bibleBookID }
const CHAPTERNUMBERSTATE = { chapterNumber: "" }
const CONTENTSTATE = { verses: [] }
const NEXTSTATE = { nextChapter: "" }
const PREVSTATE = { prevChapter: "" }

let chapterConnections = []; // saved highlight/note/flashcard connections touching this chapter
let linkedVerseIds = new Set(); // verses in this chapter cited by at least one note or flashcard
let selectedVerseIds = new Set(); // verses pending a NEW highlight, order derived from CONTENTSTATE.verses at commit time
let selectedRemovalVerseIds = new Set(); // already-highlighted verses pending highlight removal
let verseElements = new Map(); // verseId -> rendered <span> element, rebuilt each render()
let linkedLookupId = 0; // bumped per lookup so a slow, stale lookup can't overwrite a newer one
let linkedExpanded = false; // whether "+ N more" has been clicked for the current selection
let bookmarkLookupId = 0; // same stale-lookup guard as linkedLookupId, for the bookmark button

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
  if (highlightFlashcardBtn) highlightFlashcardBtn.hidden = selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0;
  linkedExpanded = false;
  updateLinkedItems();
}

//Deselects every pending verse (new highlight and pending removal) and hides the popup -
//the shared "take no action" path for the close button, Escape, click-outside and Copy
const clearSelection = () => {
  for (const verseId of [...selectedVerseIds, ...selectedRemovalVerseIds]) {
    const el = verseElements.get(verseId);
    if (el) el.classList.remove('selected');
  }
  selectedVerseIds.clear();
  selectedRemovalVerseIds.clear();
  updateHighlightPopup();
}

//Notes made with "New Note" all start with the quoted verse + citation, so previewing the start
//would make every link read the same - preview the user's own words after that block instead.
const notePreviewText = (note) => {
  const ownWords = stripMarkdown(note.text.replace(/^\s*"[\s\S]*?"\s*\([^)]*\)\s*/, '')).trim();
  const text = (ownWords || note.reference || note.text).replace(/\s+/g, ' ');
  return text.length > LINKED_TEXT_LENGTH ? `${text.slice(0, LINKED_TEXT_LENGTH).trimEnd()}…` : text;
}

const buildLinkedItem = (href, icon, label) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = href;
  a.innerHTML = icon;
  const span = document.createElement('span');
  span.textContent = label;
  a.prepend(span);
  li.appendChild(a);
  return li;
}

//Lists notes/flashcards that reference any selected verse, above the popup's buttons
const updateLinkedItems = async () => {
  if (!highlightLinks) return;
  const lookupId = ++linkedLookupId;
  const verseIds = [...selectedVerseIds, ...selectedRemovalVerseIds];
  if (verseIds.length === 0) {
    highlightLinks.hidden = true;
    return;
  }

  await backfillVerseLinks(); // no-op after the first successful run
  const [notes, cards] = await Promise.all([getNotesForVerseIds(verseIds), getFlashcardsForVerseIds(verseIds)]);
  if (lookupId !== linkedLookupId) return;

  const items = [
    ...notes.map((note) => ({ createdAt: note.createdAt, el: buildLinkedItem(`note-view.html?id=${encodeURIComponent(note.id)}`, NOTE_ICON, notePreviewText(note)) })),
    ...cards.map((card) => ({ createdAt: card.createdAt, el: buildLinkedItem(`flashcard-view.html?id=${encodeURIComponent(card.id)}`, FLASHCARD_ICON, `Flashcard · ${card.reference}`) })),
  ].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  highlightLinks.innerHTML = '';
  const visible = linkedExpanded ? items : items.slice(0, LINKED_PREVIEW_LIMIT);
  for (const item of visible) highlightLinks.appendChild(item.el);

  if (items.length > visible.length) {
    const li = document.createElement('li');
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'highlight-links-more';
    moreBtn.textContent = `+ ${items.length - visible.length} more`;
    moreBtn.addEventListener('click', () => {
      linkedExpanded = true;
      updateLinkedItems();
    });
    li.appendChild(moreBtn);
    highlightLinks.appendChild(li);
  }
  highlightLinks.hidden = items.length === 0;
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
    if (linkedVerseIds.has(verse.id)) verseEl.classList.add('has-links');
    verseEl.dataset.verseId = verse.id;
    const linkedTitle = linkedVerseIds.has(verse.id) ? ' title="Has linked notes or flashcards"' : '';
    verseEl.innerHTML = `<span class="v"${linkedTitle}>${verse.number}</span>${verse.text} `;
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
  const verseIds = data.verses.map((v) => v.id);
  await backfillVerseLinks(); // no-op after the first successful run
  const [connections, notes, cards] = await Promise.all([
    getConnectionsForVerseIds(verseIds),
    getNotesForVerseIds(verseIds),
    getFlashcardsForVerseIds(verseIds),
  ]);
  chapterConnections = connections;
  //A note can cite verses in other chapters too - only mark the ones on this page
  const chapterVerseIds = new Set(verseIds);
  linkedVerseIds = new Set([...notes, ...cards].flatMap((r) => r.verseIds).filter((id) => chapterVerseIds.has(id)));
  render();
  updateBookmarkButton();
}

//One bookmark per book: "Bookmark" when the book has none, "Bookmarked" on the bookmarked
//chapter (click removes it), "Move bookmark here" when it's on another chapter of this book
const updateBookmarkButton = async () => {
  const lookupId = ++bookmarkLookupId;
  const bookmark = await getBookmark(CHAPTERSTATE.bookId);
  if (lookupId !== bookmarkLookupId) return;

  const isHere = bookmark?.chapterId === CHAPTERSTATE.chapterID;
  bookmarkBtn.setAttribute('aria-pressed', String(isHere));
  if (isHere) {
    bookmarkLabel.textContent = 'Bookmarked';
    bookmarkBtn.title = 'Remove this bookmark';
  } else if (bookmark) {
    bookmarkLabel.textContent = 'Move bookmark here';
    bookmarkBtn.title = `Currently at ${bookmark.bookName} ${bookmark.chapterNumber}`;
  } else {
    bookmarkLabel.textContent = 'Bookmark';
    bookmarkBtn.title = 'Save your place in this book';
  }
  bookmarkBtn.hidden = false;
}

bookmarkBtn.addEventListener('click', async () => {
  const bookmark = await getBookmark(CHAPTERSTATE.bookId);
  if (bookmark?.chapterId === CHAPTERSTATE.chapterID) {
    await deleteBookmark(CHAPTERSTATE.bookId);
  } else {
    const books = await getBooksCached(bibleVersionID);
    const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
    await saveBookmark({
      bookId: CHAPTERSTATE.bookId,
      bookName: book ? book.name : CHAPTERSTATE.bookId,
      chapterId: CHAPTERSTATE.chapterID,
      chapterNumber: CHAPTERNUMBERSTATE.chapterNumber,
    });
  }
  updateBookmarkButton();
});

//Marks the verse(s) named in ?verse= (e.g. "JHN.3.16" or "JHN.3.16,JHN.3.17", from search or a
//note's citation link) with a background spotlight and scrolls the first into view. Next/prev
//drop ?verse= from the URL, so they render a fresh, unmarked chapter.
const spotlightTargetVerses = () => {
  const targetVerseParam = new URLSearchParams(window.location.search).get('verse');
  if (!targetVerseParam) return;
  const targetEls = targetVerseParam.split(',')
    .map((id) => verseElements.get(id.trim()))
    .filter(Boolean);
  if (targetEls.length === 0) return;
  for (const el of targetEls) el.classList.add('spotlight');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  targetEls[0].scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
}

getChapterContentCached(bibleVersionID, CHAPTERSTATE.chapterID).then(async (data) => {
  if (!data) return;
  await applyChapterData(data);
  spotlightTargetVerses();
});

const updateUrl = (chapterID) => {
  const url = new URL(window.location);
  url.searchParams.set('chapter', chapterID);
  url.searchParams.delete('verse');
  window.history.pushState({}, '', url);
  rememberLocation();
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

//Back/Forward after next/prev: the URL changes (pushState) but the page doesn't reload,
//so load whichever chapter the restored URL names
window.addEventListener('popstate', () => {
  const chapterID = new URLSearchParams(window.location.search).get('chapter');
  if (!chapterID || chapterID === CHAPTERSTATE.chapterID) return;
  getChapterContentCached(bibleVersionID, chapterID).then(async (data) => {
    if (!data) return;
    await applyChapterData(data);
    spotlightTargetVerses();
    rememberLocation();
  });
});

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
  const text = `"${joinVerseText(orderedVerses)}" (${reference})`;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy verses to clipboard:', error);
    return;
  }

  clearSelection();
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
  const text = `"${joinVerseText(orderedVerses)}" (${reference})\n\n`;

  const note = { text, reference, verseIds: orderedVerses.map((v) => v.id) };
  await saveNote(note);
  window.location.href = `note-view.html?id=${encodeURIComponent(note.id)}&edit`;
});

//Creates a flashcard with the citation as its Reference side and the verse text as its
//Scripture side, then opens it in edit mode so the user can review or tweak both fields.
highlightFlashcardBtn.addEventListener("click", async () => {
  const orderedVerses = CONTENTSTATE.verses.filter(
    (v) => selectedVerseIds.has(v.id) || selectedRemovalVerseIds.has(v.id)
  );
  if (orderedVerses.length === 0) return;

  const books = await getBooksCached(bibleVersionID);
  const book = books.find((b) => b.id === CHAPTERSTATE.bookId);
  const bookName = book ? book.name : CHAPTERSTATE.bookId;
  const reference = formatCitation(bookName, orderedVerses);
  const scripture = joinVerseText(orderedVerses);

  const card = { reference, scripture, verseIds: orderedVerses.map((v) => v.id) };
  await saveFlashcard(card);
  window.location.href = `flashcard-view.html?id=${encodeURIComponent(card.id)}&edit`;
});

//Clicking anywhere outside the verse list or the popup itself cancels any pending
//selection (both a fresh highlight and a pending removal), matching the same
//"click away to dismiss" behavior already used for the search dropdown.
document.addEventListener('click', (event) => {
  if (selectedVerseIds.size === 0 && selectedRemovalVerseIds.size === 0) return;
  if (verseList.contains(event.target) || highlightPopup.contains(event.target)) return;
  clearSelection();
});

highlightCloseBtn.addEventListener('click', clearSelection);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || highlightPopup.hidden) return;
  clearSelection();
});

//When user clicks next button, next chapter loads if exists.
//API call to fetch current chapter data.
//Return current chapter ID
//Call API with next chapter ID based on current chapter data
//Return new/current chapter ID
