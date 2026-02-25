const bibleVersionID = 'de4e12af7f28f599-01';
const bibleBookID = new URLSearchParams(window.location.search).get('book');
console.log('Full URL:', window.location.href);
console.log('URL search:', window.location.search);
console.log('bibleBookID:', bibleBookID);
const bibleChapterList = document.querySelector('#chapter-list');
const breadcrumbs = document.querySelector('#breadcrumbs');

if (!bibleBookID) {
  console.log('No book ID in URL — would redirect to index');
}

let chapterHTML = '';

fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/books/${bibleBookID}/chapters`, {
  headers: { 'api-key': API_KEY }
})
  .then(res => res.json())
  .then(res => {
    console.log(res);
    if (!res.data || !Array.isArray(res.data)) {
      console.error('Unexpected API response:', res);
      return;
    }
    for (let chapter of res.data) {
      chapterHTML += `<li class="grid-item"><a class="grid-link" href="verse.html?chapter=${chapter.id}">${chapter.number}</a></li>`;
    }
    bibleChapterList.innerHTML = chapterHTML;
  });

document.querySelector('#viewing').innerHTML = bibleBookID;
breadcrumbs.innerHTML = `
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="book.html">Books</a></li>
    <li>${bibleBookID}</li>
  </ul>
`;
