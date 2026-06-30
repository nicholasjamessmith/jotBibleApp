import { getBooks, searchVerses, getPassage } from './scripture-api.js';

//Search utility methods
const search = {
  search: (query, data) => data.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),
  searchVerses: (verses) => verses,
  prioritize: (query, books, verses) => {
    const isPhrase = query.trim().split(/\s+/).length > 2;
    const taggedBooks = books.map(b => ({ ...b, _type: 'book' }));
    const taggedVerses = verses.map(v => ({ ...v, _type: 'verse' }));
    return isPhrase ? [...taggedVerses, ...taggedBooks] : [...taggedBooks, ...taggedVerses];
  },
  parseReference: (query, books) => {
    const match = query.trim().match(/^((?:\d+\s+)?[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
    if (!match) return null;
    const [, bookName, chapter, startVerse, endVerse] = match;
    const book = books.find(b => b.name.toLowerCase().startsWith(bookName.trim().toLowerCase()));
    if (!book) return null;
    const chapterId = `${book.id}.${chapter}`;
    let passageId;
    if (startVerse && endVerse) {
      passageId = `${book.id}.${chapter}.${startVerse}-${book.id}.${chapter}.${endVerse}`;
    } else if (startVerse) {
      passageId = `${book.id}.${chapter}.${startVerse}`;
    } else {
      passageId = chapterId;
    }
    return { passageId, bookId: book.id, chapterId, hasVerse: !!startVerse };
  }
};

const versionId = 'de4e12af7f28f599-02';

//Page init — bind search form and render results
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const container = document.querySelector('.container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    container.innerHTML = '<p>Searching...</p>';
    const [books, verses] = await Promise.all([getBooks(versionId), searchVerses(versionId, query)]);
    const ref = search.parseReference(query, books);
    const passage = ref ? await getPassage(versionId, ref.passageId) : null;
    const filteredBooks = search.search(query, books);
    const filteredVerses = search.searchVerses(verses);
    const results = search.prioritize(query, filteredBooks, filteredVerses);

    if (!passage && results.length === 0) {
      container.innerHTML = '<p>No results found.</p>';
      return;
    }

    const ul = document.createElement('ul');
    ul.classList.add('book-list');

    if (passage && ref) {
      const li = document.createElement('li');
      li.classList.add('book-link');
      const a = document.createElement('a');
      a.href = `verse.html?book=${ref.bookId}&chapter=${ref.chapterId}`;
      const content = passage.content.trim();
      const truncated = content.length > 200 ? content.slice(0, 200) + '…' : content;
      a.textContent = `${passage.reference} — ${truncated}`;
      li.appendChild(a);
      ul.appendChild(li);
    }

    for (const item of results) {
      const li = document.createElement('li');
      li.classList.add('book-link');
      const a = document.createElement('a');
      if (item._type === 'book') {
        a.href = `chapter.html?book=${item.id}`;
        a.textContent = item.name;
      } else {
        a.href = `verse.html?book=${item.bookId}&chapter=${item.chapterId}`;
        a.textContent = `${item.reference} — ${item.text}`;
      }
      li.appendChild(a);
      ul.appendChild(li);
    }

    container.innerHTML = '';
    container.appendChild(ul);
  });
});
