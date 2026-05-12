import { getChapterContent } from './scripture-api.js';
import { getChapters } from './scripture-api.js';

const getParameterByName = (name) => {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, `\\$&`);
  const regex = new RegExp(`[?&]` + name + `(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return ``;
  return decodeURIComponent(results[2].replace(/\+/g, ` `));
};

const bibleVersionID = 'de4e12af7f28f599-01';
const bibleBookID = getParameterByName('book');
const bibleChapterID = getParameterByName('chapter'); // Get chapter ID from URL
const bibleChapterList = document.querySelector('#chapter-list');
const verseList = document.getElementById('verse-list'); // Target the correct element

let verseHTML = '';


getChapterContent(bibleVersionID, bibleChapterID).then((data) => {
  console.log(data);
  if (!data) return;
  const content = data.content;
  const el = document.getElementById('verse-list');
  if (el) el.innerHTML = content;
});


const nextButtonClick = () => {
  console.log("Next button clicked");
}

document.getElementById("next-btn").addEventListener("click", nextButtonClick);

const prevButtonClick = () => {
  console.log("Prev. button clicked");
}

document.getElementById("prev-btn").addEventListener("click", prevButtonClick);