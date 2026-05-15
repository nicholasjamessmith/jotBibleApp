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

const CHAPTERSTATE = { chapterID: bibleChapterID }
const CHAPTERNUMBERSTATE = { chapterNumber: "" }
const CONTENTSTATE = { chapterContent: "" }
const NEXTSTATE = { nextChapter: "" }
const PREVSTATE = { prevChapter: "" }

getChapterContent(bibleVersionID, CHAPTERSTATE.chapterID).then((data) => {
  if (!data) return;
  CHAPTERNUMBERSTATE.chapterNumber = data.number;
  CONTENTSTATE.chapterContent = data.content;
  CHAPTERSTATE.chapterID = data.id;
  NEXTSTATE.nextChapter = data.next.id;
  PREVSTATE.prevChapter = data.previous.id;
  render();
});

const render = () => {
  const chapterTitleEl = document.getElementById('chapter-title');
  if (chapterTitleEl) chapterTitleEl.textContent = `${CHAPTERNUMBERSTATE.chapterNumber}`;
  const el = document.getElementById('verse-list');
  if (el) el.innerHTML = CONTENTSTATE.chapterContent;
}

const updateUrl = (chapterID) => {
  const url = new URL(window.location);
  url.searchParams.set('chapter', chapterID);
  window.history.pushState({}, '', url);
}


const nextButtonClick = () => {
  getChapterContent(bibleVersionID, NEXTSTATE.nextChapter).then((data) => {
    console.log(data)
    if (!data) return;
    const currentChapter = data.content
    const el = document.getElementById('verse-list');
    if (el) el.innerHTML = currentChapter;
    CHAPTERSTATE.chapterID = data.id;
    CHAPTERNUMBERSTATE.chapterNumber = data.number;
    CONTENTSTATE.chapterContent = data.content;
    NEXTSTATE.nextChapter = data.next.id;
    PREVSTATE.prevChapter = data.previous.id;
    updateUrl(CHAPTERSTATE.chapterID);
    render();
  });
};

const prevButtonClick = () => {
  getChapterContent(bibleVersionID, PREVSTATE.prevChapter).then((data) => {
    console.log(data);
    if (!data) return;
    const currentChapter = data.content
    const el = document.getElementById('verse-list');
    if (el) el.innnerHTML = currentChapter;
    CHAPTERSTATE.chapterID = data.id;
    CHAPTERNUMBERSTATE.chapterNumber = data.number;
    CONTENTSTATE.chapterContent = data.content;
    NEXTSTATE.nextChapter = data.next.id;
    PREVSTATE.prevChapter = data.previous.id;
    updateUrl(CHAPTERSTATE.chapterID);
    render();
  });
};

document.getElementById("next-btn").addEventListener("click", nextButtonClick);

document.getElementById("prev-btn").addEventListener("click", prevButtonClick);

//When user clicks next button, next chapter loads if exists.
//API call to fetch current chapter data.
//Return current chapter ID
//Call API with next chapter ID based on current chapter data
//Return new/current chapter ID 