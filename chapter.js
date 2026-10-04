import { bibleVersionID } from './scripture-api.js';
import { getChaptersCached, getBooksCached } from './local-db.js';
import { renderBreadcrumbs } from './breadcrumbs.js';

const getParameterByName = (name) => {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, `\\$&`);
  const regex = new RegExp(`[?&]` + name + `(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return ``;
  return decodeURIComponent(results[2].replace(/\+/g, ` `));
}

const bibleChapterList = document.querySelector('#chapter-list');
const bibleChapterCircle = document.querySelector('.circle');
const bibleBookID = getParameterByName('book');
const breadcrumbs = document.querySelector('.breadcrumbs');

let chapterHTML = '';

//Book's full name as the page heading (falls back to its id, e.g. "GEN", if the list can't load)
getBooksCached(bibleVersionID).then((books) => {
  const book = books?.find((b) => b.id === bibleBookID);
  const title = book ? book.name : bibleBookID;
  document.querySelector('#book-title').textContent = title;
  document.title = `${title} | jotBible`;
  renderBreadcrumbs(breadcrumbs, [{ label: 'Books', href: 'book.html' }, { label: title }]);
}).catch(() => {
  document.querySelector('#book-title').textContent = bibleBookID;
  renderBreadcrumbs(breadcrumbs, [{ label: 'Books', href: 'book.html' }, { label: bibleBookID }]);
});

getChaptersCached(bibleVersionID, bibleBookID).then(chaptersList => {
  chapterHTML += `<ol>`;
  for (let chapter of chaptersList) {
    chapterHTML += `<div><li><a href="verse.html?chapter=${chapter.id}">${chapter.number}</a></li></div>`;
  }
  chapterHTML += `</ol>`;
  bibleChapterCircle.innerHTML = chapterHTML;
});