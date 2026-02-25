//Return a list of each book in the Bible
//Import API_key
API_key = 'aa59d22df4b68dde82fc124df85a0a31'
//ID variable for specific tranlsation being used
//Bible books endpoint with version ID variable name
//const endpoint = "/v1/bibles/de4e12af7f28f599-01"
const baseUrl = `https://api.scripture.api.bible/v1/bibles`
const bibleVersionID = `de4e12af7f28f599-01`
//const API_key = 'aa59d22df4b68dde82fc124df85a0a31'


//Fetch initial(?) bible data
async function bible() {
  const response = await fetch(baseUrl + bibleVersionID, {
    method: 'GET',
    headers: {
      'api-key': `${API_key}`,
      'Content-Type': 'application/json'
    },
  })
  const bibleData = await response.json();
  //console.log(bibleData.data[0]);
  //console.log(bibleData.data);
  const names = bibleData.data.map((x) => x.name);
  //const result = names.filter(nameContains);
  //function nameContains(name) {
  //  return name === "";
  //}
  //console.log(result)
  //console.log(bibleData.data.map((x) => x.name))
  return bibleData
}
bible()
//console.log(bible)

//Fetch attempt
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

//async function bibleBooks() {
//  const response = await fetch(baseUrl)
//  const books = await response.json();
//  //console.log(books)
//}
//bibleBooks()


