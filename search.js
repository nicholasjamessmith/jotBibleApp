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

document.addEventListener('click', (e) => {
  const searchForm = document.getElementById('search-form');
  if (!searchForm.contains(e.target)) {
    document.getElementById('search-results').innerHTML = '';
  }
});

const renderResults = (verses) => {
  const resultsList = document.getElementById('search-results');
  resultsList.innerHTML = '';
  verses.forEach(verse => {
    const chapterId = verse.chapterId ?? verse.chapterIds?.[0];
    const resultItem = document.createElement('li');
    const resultLink = document.createElement('a');
    resultLink.href = `verse.html?chapter=${chapterId}&verse=${encodeURIComponent(verse.id)}`;

    const referenceEl = document.createElement('span');
    referenceEl.className = 'search-result-reference';
    referenceEl.textContent = verse.reference ?? verse.id;

    const textEl = document.createElement('span');
    textEl.className = 'search-result-text';
    textEl.textContent = verse.text;

    resultLink.append(referenceEl, textEl);
    resultItem.appendChild(resultLink);
    resultsList.appendChild(resultItem);
  });
};
