//Return a list of each book in the Bible
const baseUrl = `https://api.scripture.api.bible/v1/bibles`
const bibleVersionID = `de4e12af7f28f599-01`


//Fetch initial bible data
async function bible() {
  const response = await fetch(baseUrl + bibleVersionID, {
    method: 'GET',
    headers: {
      'api-key': `${API_key}`,
      'Content-Type': 'application/json'
    },
  })
  const bibleData = await response.json();
  const names = bibleData.data.map((x) => x.name);
  return bibleData
}
bible()

//Fetch
fetch(baseUrl, {
  method: 'GET',
  headers: {
    'api-key': `${API_key}`,
    'Content-Type': 'application/json'
  },
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.log('Error', error));

