import { bibleVersionID, searchVerses } from './scripture-api.js';

////Search
document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  const resultsList = document.getElementById('search-results');
  if (!query) {
    resultsList.innerHTML = '';
    return;
  }
  const verses = await searchVerses(bibleVersionID, query);
  renderResults(verses);
});

const renderResults = (verses) => {
  const resultsList = document.getElementById('search-results');
  resultsList.innerHTML = '';
  verses.forEach(verse => {
    const chapterId = verse.chapterId ?? verse.chapterIds?.[0];
    const resultItem = document.createElement('li');
    const resultLink = document.createElement('a');
    resultLink.href = `verse.html?chapter=${chapterId}`;
    resultLink.textContent = verse.text;
    resultItem.appendChild(resultLink);
    resultsList.appendChild(resultItem);
  });
};
