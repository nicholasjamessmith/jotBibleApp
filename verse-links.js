//Links notes/flashcards to the verses their text cites: finds citations, renders them as links
//into the reader, and keeps each record's verseIds in sync with what its text references.
import { bibleVersionID } from './scripture-api.js';
import { getBooksCached, getAllNotes, saveNote, getAllFlashcards, saveFlashcard } from './local-db.js';
import { parseCitations } from './citation.js';

//Resolves to null (never throws) when the book list can't be loaded, e.g. offline with no cache
const findCitations = async (text) => {
  try {
    const books = await getBooksCached(bibleVersionID);
    return parseCitations(text, books ?? []);
  } catch (error) {
    console.error('Failed to load books for citation links:', error);
    return null;
  }
}

//Every verse id cited in the text, or null if citations couldn't be checked (callers then
//keep the record's existing verseIds rather than wiping them)
const verseIdsCitedIn = async (text) => {
  const citations = await findCitations(text);
  if (!citations) return null;
  return [...new Set(citations.flatMap((c) => c.segments.flatMap((s) => s.verseIds)))];
}

//Opens the citation's first chapter with its verses spotlit
const citationHref = (citation) => {
  const { chapterId, verseIds } = citation.segments[0];
  return `verse.html?chapter=${encodeURIComponent(chapterId)}&verse=${encodeURIComponent(verseIds.join(','))}`;
}

//Turns each citation in el's rendered text into a reader link, in place. Walks text nodes so
//it works on rendered markdown (lists, bold, etc.); text already inside a link or code block
//is left alone. Resolves once links are in (the book list may need to load first).
const linkCitationsIn = async (el) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement.closest('a, code, pre') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const text = node.textContent;
    const citations = await findCitations(text);
    if (!citations || citations.length === 0) continue;
    if (!node.isConnected) return; // el was re-rendered while books loaded

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const citation of citations) {
      fragment.append(text.slice(cursor, citation.index));
      const link = document.createElement('a');
      link.href = citationHref(citation);
      link.className = 'citation-link';
      link.textContent = citation.text;
      fragment.append(link);
      cursor = citation.index + citation.text.length;
    }
    fragment.append(text.slice(cursor));
    node.replaceWith(fragment);
  }
}

//One-time pass giving notes/flashcards saved before citation linking existed their verseIds.
//Only fills records with none, so reader-created links are never overwritten.
const BACKFILL_KEY = 'jotBible:verseLinksBackfilled';
let backfillPromise = null;

const backfillVerseLinks = () => {
  if (backfillPromise) return backfillPromise;
  backfillPromise = (async () => {
    try {
      if (localStorage.getItem(BACKFILL_KEY)) return;
    } catch {
      //Storage unavailable - run the (idempotent) pass anyway
    }
    const fill = async (records, getText, save) => {
      for (const record of records) {
        if (record.verseIds?.length) continue;
        const verseIds = await verseIdsCitedIn(getText(record));
        if (verseIds === null) throw new Error('Book list unavailable');
        if (verseIds.length) await save({ ...record, verseIds });
      }
    }
    try {
      await fill(await getAllNotes(), (note) => note.text, (note) => saveNote(note, { touch: false }));
      await fill(await getAllFlashcards(), (card) => `${card.reference}\n${card.scripture}`, (card) => saveFlashcard(card, { touch: false }));
      try {
        localStorage.setItem(BACKFILL_KEY, '1');
      } catch {
        //Not remembered - the pass just runs again next time
      }
    } catch (error) {
      //Leave the flag unset so the pass retries on a later page load
      console.error('Verse link backfill incomplete:', error);
    }
  })();
  return backfillPromise;
}

export { findCitations, verseIdsCitedIn, citationHref, linkCitationsIn, backfillVerseLinks };
