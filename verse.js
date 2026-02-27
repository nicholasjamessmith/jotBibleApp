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
const bibleChapterID = getParameterByName('chapter'); // Get chapter ID from URL
const verseList = document.getElementById('verse-list'); // Target the correct element

let verseHTML = '';

//document.querySelector(`#viewing`).innerHTML = `Viewing: ${bibleChapterID}`;

const getVerses = (bibleVersionID, bibleChapterID) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/chapters/${bibleChapterID}/verses`, {
    headers: { 'api-key': API_KEY }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.data || !Array.isArray(res.data)) {
        console.error('Unexpected API response:', res);
        return [];
      }
      return res.data;
    });
};

getVerses(bibleVersionID, bibleChapterID).then(async verseList => {
  let verseHTML = '<ol>';
  for (let verse of verseList) {
    // Fetch verse content
    const res = await fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/verses/${verse.id}`, {
      headers: { 'api-key': API_KEY }
    });
    const verseData = await res.json();
    const verseText = verseData.data && verseData.data.content ? verseData.data.content : '';
    verseHTML += `<li>${verseText}</li>`;
  }
  verseHTML += '</ol>';
  document.getElementById('verse-list').innerHTML = verseHTML;
});