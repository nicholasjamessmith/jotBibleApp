import { bibleVersionID } from './scripture-api.js';
import { getBooksCached, getAllBookmarks } from './local-db.js';

const bookList = document.getElementById('book-list');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const bookmarksToggleLabel = bookmarksToggle.querySelector('.bookmarks-toggle-label');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const bookmarksList = document.getElementById('bookmarks-list');
const bookmarksEmpty = document.getElementById('bookmarks-empty');

const booksPromise = getBooksCached(bibleVersionID);

booksPromise.then((books) => {
  const OT = [];
  const NT = [];
  for (let z = 0; z < books.length; z++) {
    if (z < 39) {
      OT.push(books[z]);
    } else {
      NT.push(books[z]);
    }
  }
  console.log('OT:', OT);
  console.log('NT:', NT);
  const OTList = document.createElement('ul')
  OTList.classList.add('OT');
  const NTList = document.createElement('ul')
  NTList.classList.add('NT');
  for (const book of OT) {
    const li = document.createElement('li');
    li.classList.add('book-link');
    li.innerHTML += `<a href="chapter.html?book=${book.id}">${book.name}</a>`
    OTList.appendChild(li);
  }
  for (const book of NT) {
    const li = document.createElement('li');
    li.classList.add('book-link');
    li.innerHTML += `<a href="chapter.html?book=${book.id}">${book.name}</a>`
    NTList.appendChild(li);
  }
  document.getElementById('OT').appendChild(OTList);
  document.getElementById('NT').appendChild(NTList);
});

//Bookmarks - one per book, listed in Bible order (the books list is already canonical order)
const renderBookmarks = async () => {
  const [bookmarks, books] = await Promise.all([getAllBookmarks(), booksPromise.catch(() => [])]);
  const order = new Map(books.map((book, i) => [book.id, i]));
  bookmarks.sort((a, b) => (order.get(a.bookId) ?? Infinity) - (order.get(b.bookId) ?? Infinity));

  bookmarksList.innerHTML = '';
  for (const bookmark of bookmarks) {
    const li = document.createElement('li');
    li.classList.add('book-link');
    const a = document.createElement('a');
    a.href = `verse.html?chapter=${encodeURIComponent(bookmark.chapterId)}`;
    a.textContent = `${bookmark.bookName} ${bookmark.chapterNumber}`;
    li.appendChild(a);
    bookmarksList.appendChild(li);
  }
  bookmarksList.hidden = bookmarks.length === 0;
  bookmarksEmpty.hidden = bookmarks.length > 0;
  bookmarksToggleLabel.textContent = bookmarks.length ? `Bookmarks · ${bookmarks.length}` : 'Bookmarks';
}

bookmarksToggle.addEventListener('click', () => {
  const opening = bookmarksPanel.hidden;
  bookmarksPanel.hidden = !opening;
  bookmarksToggle.setAttribute('aria-expanded', String(opening));
  if (opening) renderBookmarks();
});

//"Choose a book" in the empty state - close the panel and move focus to the book lists
document.getElementById('bookmarks-start').addEventListener('click', (e) => {
  e.preventDefault();
  bookmarksPanel.hidden = true;
  bookmarksToggle.setAttribute('aria-expanded', 'false');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bookList.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  bookList.querySelector('a')?.focus({ preventScroll: true });
});

renderBookmarks(); // fills the count on the toggle before it's opened
