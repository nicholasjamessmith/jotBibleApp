import { getBooks, fetchBibleData } from './scripture-api.js';

const baseUrl = `https://api.scripture.api.bible/v1/bibles`
const versionId = 'de4e12af7f28f599-02';
const bookList = document.getElementById('book-list');

fetchBibleData().then((data) => {
}).catch((error) => {
  console.error('Error fetching Bible data:', error);
});

getBooks(versionId).then((books) => {
  const OT = [];
  const NT = [];
  for (let z = 0; z < books.length; z++) {
    if (z < 39) {
      OT.push(books[z]);
    } else {
      NT.push(books[z]);
    }
  }
  console.log('OT:', OT);
  console.log('NT:', NT);
  const OTList = document.createElement('ul')
  OTList.classList.add('OT');
  const NTList = document.createElement('ul')
  NTList.classList.add('NT');
  for (const book of OT) {
    const li = document.createElement('li');
    li.classList.add('book-link');
    li.innerHTML += `<a href="chapter.html?book=${book.id}">${book.name}</a>`
    OTList.appendChild(li);
  }
  for (const book of NT) {
    const li = document.createElement('li');
    li.classList.add('book-link');
    li.innerHTML += `<a href="chapter.html?book=${book.id}">${book.name}</a>`
    NTList.appendChild(li);
  }
  document.getElementById('OT').appendChild(OTList);
  document.getElementById('NT').appendChild(NTList);
});
