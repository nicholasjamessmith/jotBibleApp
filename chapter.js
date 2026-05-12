import { getChapters } from './scripture-api.js';

const getParameterByName = (name) => {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, `\\$&`);
  const regex = new RegExp(`[?&]` + name + `(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return ``;
  return decodeURIComponent(results[2].replace(/\+/g, ` `));
}

const bibleVersionID = 'de4e12af7f28f599-01';
const bibleChapterList = document.querySelector('#chapter-list');
const bibleBookID = getParameterByName('book');
const abbreviation = getParameterByName('abbreviation');

let chapterHTML = '';

document.querySelector(`#viewing`).innerHTML = `Viewing: ${bibleBookID}`;

getChapters(bibleVersionID, bibleBookID).then(chaptersList => {
  chapterHTML += `<ol>`;
  for (let chapter of chaptersList) {
    chapterHTML += `<li><a href="verse.html?book=version=${bibleVersionID}${abbreviation}&chapter=${chapter.id}">${chapter.number}</a></li>`;
  }
  chapterHTML += `</ol>`;
  bibleChapterList.innerHTML = chapterHTML;
});