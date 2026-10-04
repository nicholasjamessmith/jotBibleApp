//Per-section nav state - each nav section (Read / Study / Notes) remembers the last page the
//user was on inside it, like tabs in a mobile app. Locations persist in localStorage; the
//nav links' hardcoded hrefs remain the fallback when storage is unavailable.

const SECTIONS = {
  read: { home: '/book.html', pages: ['book.html', 'chapter.html', 'verse.html', 'contents.html'] },
  study: { home: '/study.html', pages: ['study.html', 'flashcard-view.html'] },
  notes: { home: '/notes.html', pages: ['notes.html', 'note-view.html'] },
};

const TABS_KEY = 'jotBible:tabs';

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? null;
  } catch {
    return null;
  }
}

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    //Storage unavailable (private mode, blocked site data) - state just isn't remembered
  }
}

const currentSection = () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return Object.keys(SECTIONS).find((name) => SECTIONS[name].pages.includes(page)) ?? null;
}

//Points each nav link at its section's remembered location. The section the user is
//already in links to its home instead, so re-tapping the active tab goes "back to top".
const applyNavLinks = () => {
  const tabs = readJSON(TABS_KEY) ?? {};
  const active = currentSection();
  for (const link of document.querySelectorAll('.nav a[data-tab]')) {
    const section = SECTIONS[link.dataset.tab];
    if (!section) continue;
    link.href = link.dataset.tab === active ? section.home : (tabs[link.dataset.tab] ?? section.home);
  }
}

//Saves the current URL as its section's last location. Pages that change their URL
//without reloading (pushState/replaceState) call this again afterwards.
const rememberLocation = () => {
  const section = currentSection();
  if (!section) return;
  const tabs = readJSON(TABS_KEY) ?? {};
  tabs[section] = window.location.pathname + window.location.search;
  writeJSON(TABS_KEY, tabs);
}

//Unsaved edit drafts for notes/flashcards, keyed by type + id
const draftKey = (type, id) => `jotBible:draft:${type}:${id}`;
const getDraft = (type, id) => readJSON(draftKey(type, id));
const setDraft = (type, id, value) => writeJSON(draftKey(type, id), value);
const clearDraft = (type, id) => {
  try {
    localStorage.removeItem(draftKey(type, id));
  } catch {
    //Nothing to clear if storage is unavailable
  }
}

rememberLocation();
applyNavLinks();
//Back/forward cache can restore a page with hrefs from before the user visited other sections
window.addEventListener('pageshow', (e) => {
  if (e.persisted) applyNavLinks();
});

export { rememberLocation, getDraft, setDraft, clearDraft };
