import { API_key } from './env.js';

////Search
//import { fetchBibleData, getBooks, getChapters, getChapterContent } from './scripture-api.js';

const bibleVersionID = 'de4e12af7f28f599-01';
////const bibleChapterID = '';
//const books = await getBooks(bibleVersionID);
////const verses = await getChapterContent(bibleVersionID, bibleChapterID);

//const searchBible = (query, books) => {
//  console.log('Search query:', query);
//  return books.filter(result => result.name.toLowerCase().includes(query.toLowerCase()));
//}
//console.log(searchBible('genesis', books)); // Check the output of the search function
////console.log(searchBible('genesis', globalBibleDataArray)); // Check the output of the search function

//document.getElementById('submit').addEventListener('click', (event) => {
//  event.preventDefault();
//  const query = document.getElementById('search').value;
//  const results = searchBible(query, books);
//  console.log(query); // Check the output of the search function
//  console.log(results); // Check the output of the search function

//  document.getElementById('search-results').innerHTML = '';
//  results.forEach(result => {
//    const resultItem = document.createElement('li');
//    const resultLink = document.createElement('a');
//    resultLink.href = `chapter.html?book=${result.id}`;
//    resultLink.textContent = result.name;
//    resultItem.appendChild(resultLink);
//    document.getElementById('search-results').appendChild(resultItem);
//  });

//  return results;
//});

//const searchText = (query, passage) => {
//  console.log(query, passage); // Check the output of the search function
//  return passage.filter(result => result.text.toLowerCase().includes(query.toLowerCase()));
//}

document.getElementById('submit').addEventListener('click', async (e) => {
  e.preventDefault();
  const query = document.getElementById('search').value;
  const results = await search(bibleVersionID, query);
});

const search = async (bibleVersionId, query) => {
  const url =
    `https://api.scripture.api.bible/v1/bibles/${bibleVersionId}/search?query=${query}`;
  try {
    const response = await fetch(url, {
      headers: {
        "api-key": `${API_key}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
    return result;
  } catch (error) {
    console.error(error.message);
  }
};