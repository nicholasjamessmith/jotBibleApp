import { getBooks } from './scripture-api.js';

const versionId = 'de4e12af7f28f599-01';
const bookList = document.getElementById('book-list');

getBooks(versionId).then((books) => {
  const ul = document.createElement('ul');
  for (const book of books) {
    ul.innerHTML += `<li><a href="chapter.html?book=${book.id}">${book.name}</a></li>`
  }
  bookList.appendChild(ul);
});