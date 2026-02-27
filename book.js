const versionId = 'de4e12af7f28f599-01';
const bookList = document.getElementById('book-list');

fetch(`https://api.scripture.api.bible/v1/bibles/${versionId}/books`, {
  headers: { 'api-key': API_KEY }
})
  .then(res => res.json())
  .then(res => {
    if (!res.data || !Array.isArray(res.data)) {
      console.error('Unexpected API response:', res);
      return;
    }
    const ul = document.createElement('ul');
    for (const book of res.data) {
      ul.innerHTML += `<li><a href="chapter.html?book=${book.id}">${book.name}</a></li>`;
    }
    bookList.appendChild(ul);
  });
