import { bibleVersionID, searchVerses } from './scripture-api.js';
import { getBooksCached, getAllNotes } from './local-db.js';
import { stripMarkdown } from './note-markdown.js';

////Search - Bible verses (via the API) and the user's notes (local), narrowed by the OT / NT /
////Notes filter chips at the top of the dropdown. With no filter on, everything is searched.
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-dropdown');
const resultsList = document.getElementById('search-results');
const scopeCheckboxes = searchForm.querySelectorAll('input[name="search-scope"]');
const scopeClearBtn = searchForm.querySelector('.search-scope-clear');

const OT_BOOK_COUNT = 39; // canonical order: the first 39 books are the Old Testament
const NOTE_RESULT_LIMIT = 10; // notes shown with no filter on; the Notes filter shows every match
const SNIPPET_LENGTH = 140;
let searchId = 0; // bumped per search so a slow, stale response can't overwrite a newer one

//Which result categories to show - every one while no filter is on
const getActiveScopes = () => {
  const checked = new Set([...scopeCheckboxes].filter((box) => box.checked).map((box) => box.value));
  const all = checked.size === 0;
  return { all, ot: all || checked.has('ot'), nt: all || checked.has('nt'), notes: all || checked.has('notes') };
}

//{ ot, nt } -> { range: "GEN-MAL", bookIds } from the cached book list, built once
let testamentsPromise = null;
const getTestaments = () => {
  testamentsPromise ??= getBooksCached(bibleVersionID).then((books) => {
    const span = (list) => ({ range: `${list[0].id}-${list[list.length - 1].id}`, bookIds: new Set(list.map((b) => b.id)) });
    return { ot: span(books.slice(0, OT_BOOK_COUNT)), nt: span(books.slice(OT_BOOK_COUNT)) };
  });
  return testamentsPromise;
}

//Limits the API search to the testament via its range parameter, and filters by book
//too in case the API ignores the range
const searchBible = async (query, scope) => {
  if (scope === 'all') return searchVerses(bibleVersionID, query);
  const testament = (await getTestaments())[scope];
  const verses = await searchVerses(bibleVersionID, query, testament.range);
  return verses.filter((v) => testament.bookIds.has(v.bookId ?? v.id.split('.')[0]));
}

//Notes containing every word of the query (case-insensitive), most recently active first
const searchNotes = async (query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const notes = await getAllNotes();
  return notes
    .map((note) => ({ note, plain: stripMarkdown(note.text).replace(/\s+/g, ' ').trim() }))
    .filter(({ plain }) => terms.every((term) => plain.toLowerCase().includes(term)));
}

//A window of the note's text around the first matching word
const snippetAround = (text, query) => {
  if (text.length <= SNIPPET_LENGTH) return text;
  const firstTerm = query.toLowerCase().split(/\s+/).find(Boolean) ?? '';
  const hit = Math.max(0, text.toLowerCase().indexOf(firstTerm));
  const start = Math.max(0, Math.min(hit - 40, text.length - SNIPPET_LENGTH));
  const end = start + SNIPPET_LENGTH;
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

const formatNoteDate = (timestamp) => timestamp
  ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp))
  : '';

//One result row - same reference + text layout for both kinds, with a Bible/Note badge
const buildResult = ({ href, kind, reference, text }) => {
  const resultItem = document.createElement('li');
  const resultLink = document.createElement('a');
  resultLink.href = href;

  const referenceEl = document.createElement('span');
  referenceEl.className = 'search-result-reference';
  const kindEl = document.createElement('span');
  kindEl.className = `search-result-kind search-result-kind--${kind}`;
  kindEl.textContent = kind === 'note' ? 'Note' : 'Bible';
  referenceEl.append(kindEl, reference);

  const textEl = document.createElement('span');
  textEl.className = 'search-result-text';
  textEl.textContent = text;

  resultLink.append(referenceEl, textEl);
  resultItem.appendChild(resultLink);
  return resultItem;
}

const renderResults = (noteResults, verses, query) => {
  resultsList.innerHTML = '';
  for (const { note, plain } of noteResults) {
    resultsList.appendChild(buildResult({
      href: `note-view.html?id=${encodeURIComponent(note.id)}`,
      kind: 'note',
      reference: note.reference || formatNoteDate(note.updatedAt ?? note.createdAt),
      text: snippetAround(plain, query),
    }));
  }
  for (const verse of verses) {
    const chapterId = verse.chapterId ?? verse.chapterIds?.[0];
    resultsList.appendChild(buildResult({
      href: `verse.html?chapter=${chapterId}&verse=${encodeURIComponent(verse.id)}`,
      kind: 'bible',
      reference: verse.reference ?? verse.id,
      text: verse.text,
    }));
  }
  if (noteResults.length === 0 && verses.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'search-empty';
    empty.textContent = 'No results';
    resultsList.appendChild(empty);
  }
}

const runSearch = async () => {
  const query = searchInput.value.trim();
  const id = ++searchId;
  if (!query) {
    resultsList.innerHTML = '';
    return;
  }
  const scopes = getActiveScopes();
  //Both testaments -> one unrestricted Bible search; one testament -> limited to it
  const bibleScope = scopes.ot && scopes.nt ? 'all' : scopes.ot ? 'ot' : scopes.nt ? 'nt' : null;
  const [noteResults, verses] = await Promise.all([
    scopes.notes ? searchNotes(query).catch(() => []) : [],
    bibleScope ? searchBible(query, bibleScope).catch(() => []) : [],
  ]);
  if (id !== searchId) return;
  renderResults(scopes.all ? noteResults.slice(0, NOTE_RESULT_LIMIT) : noteResults, verses, query);
}

const openDropdown = () => {
  searchDropdown.hidden = false;
}

const closeDropdown = () => {
  searchDropdown.hidden = true;
  resultsList.innerHTML = '';
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  openDropdown();
  runSearch();
});

//Showing the toggle on focus lets users pick a scope before searching
searchInput.addEventListener('focus', openDropdown);

//Toggling a filter (or clearing them all) re-runs the current search; Clear only shows
//while at least one filter is on
const onFiltersChanged = () => {
  scopeClearBtn.hidden = getActiveScopes().all;
  if (searchInput.value.trim()) runSearch();
}

for (const box of scopeCheckboxes) {
  box.addEventListener('change', onFiltersChanged);
}

scopeClearBtn.addEventListener('click', () => {
  for (const box of scopeCheckboxes) box.checked = false;
  onFiltersChanged();
  searchInput.focus();
});

searchForm.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !searchDropdown.hidden) closeDropdown();
});

document.addEventListener('click', (e) => {
  if (!searchForm.contains(e.target)) closeDropdown();
});
