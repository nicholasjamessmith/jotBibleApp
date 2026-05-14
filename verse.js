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

const CHAPTERSTATE = { chapterID: "" }
const CONTENTSTATE = { chapterContent: "" }
const NEXTSTATE = { nextChapter: "" }
const PREVSTATE = { prevChapter: "" }

getChapterContent(bibleVersionID, bibleChapterID).then((data) => {
  if (!data) return;
  CONTENTSTATE.chapterContent = data.content;
  CHAPTERSTATE.chapterID = data.id;
  NEXTSTATE.nextChapter = data.next.id;
  PREVSTATE.prevChapter = data.previous.id;
  render();
});

const render = () => {
  const el = document.getElementById('verse-list');
  if (el) el.innerHTML = CONTENTSTATE.chapterContent;
}


const nextButtonClick = () => {
  getChapterContent(bibleVersionID, NEXTSTATE.nextChapter).then((data) => {
    console.log(data)
    if (!data) return;
    const currentChapter = data.content
    const el = document.getElementById('verse-list');
    if (el) el.innerHTML = currentChapter;
    NEXTSTATE.nextChapter = data.next.id;
    CONTENTSTATE.chapterContent = data.content;
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
    PREVSTATE.prevChapter = data.previous.id
    CONTENTSTATE.chapterContent = data.content;
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