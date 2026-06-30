//API calls
import { API_key } from './env.js';
const baseUrl = `https://api.scripture.api.bible/v1/bibles`
const bibleVersionID = `de4e12af7f28f599-01`


//Fetch initial bible data
export async function bible() {
  const response = await fetch(baseUrl + `/` + bibleVersionID, {
    method: 'GET',
    headers: {
      'api-key': `${API_key}`,
      'Content-Type': 'application/json'
    },
  })
  const bibleData = await response.json();
  return bibleData
}

const fetchBibleData = (basUrl) => {
  return fetch(baseUrl, {
    method: 'GET',
    headers: {
      'api-key': `${API_key}`,
      'Content-Type': 'application/json'
    },
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error fetching Bible data:', error);
      return null;
    });
  console.log('Fetched Bible data:', bibleData);
}

//Return list of Bible books
const getBooks = (bibleVersionID) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/books`, {
    headers: { 'api-key': API_key }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.data || !Array.isArray(res.data)) {
        console.error('Unexpected API response:', res);
        return [];
      }
      return res.data;
    });
}

//Return Bible chapter data from a given book
const getChapters = (bibleVersionID, bibleBookID) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/books/${bibleBookID}/chapters`, {
    headers: { 'api-key': API_key }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.data || !Array.isArray(res.data)) {
        console.error('Unexpected API response:', res);
        return [];
      }
      return res.data;
    });
}

//Return verse content from a given chapter
const getChapterContent = (bibleVersionID, bibleChapterID) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/chapters/${bibleChapterID}`, {
    headers: { 'api-key': API_key }
  })
    .then((res) => res.json())
    .then((res) => {
      if (!res.data || typeof res.data.content !== 'string') {
        console.error('Unexpected API response:', res);
        return '';
      }
      return res.data;
    });
}

//Fetch a specific passage by its ID (e.g. "JHN.3.16" or "JHN.3.1-JHN.3.16")
const getPassage = (bibleVersionID, passageId) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/passages/${passageId}?content-type=text&include-verse-numbers=false`, {
    headers: { 'api-key': API_key }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.data) {
        console.error('Unexpected API response:', res);
        return null;
      }
      return res.data;
    });
}

//Search verses by keyword or phrase
const searchVerses = (bibleVersionID, query) => {
  return fetch(`https://api.scripture.api.bible/v1/bibles/${bibleVersionID}/search?query=${encodeURIComponent(query)}&limit=40`, {
    headers: { 'api-key': API_key }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.data || !Array.isArray(res.data.verses)) {
        console.error('Unexpected API response:', res);
        return [];
      }
      return res.data.verses;
    });
}

export {
  getBooks, getChapters, getChapterContent, fetchBibleData, searchVerses, getPassage
};
