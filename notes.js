//Create variable 'input' representing all inputs on linked HTML file with type 'text'
const input = document.querySelector("input[type='text']");
//Create variable 'form' representing all elements on linked HTML document with ID 'form'
const form = document.querySelector("#form");
//Create variable 'notesDiv' representing all elements on linked HTML document with ID 'notes'
const notesDiv = document.querySelector("#notes");

//Loads all items in 'notes' item in localStorage
const loadNotes = () => {
  const notesJSON = localStorage.getItem("notes")
  if (notesJSON) {
    return JSON.parse(notesJSON);
  }
}

const notes = loadNotes();

const saveNotes = () => {
  const notesJSON = JSON.stringify(notes);
  localStorage.setItem("notes", notesJSON);
}

const populateNotesDiv = () => {
  notesDiv.innerHTML = "";

  for (const note of notes) {
    const p = document.createElement("p")
    const e = document.createElement("button")
    const x = document.createElement("button")
    p.classList.add("note")
    p.innerText = note;
    e.textContent = "Edit"
    x.textContent = "[X] Delete";
    notesDiv.append(p);
    notesDiv.append(e);
    notesDiv.append(x);

    //Delete note
    const index = notes.indexOf(note);
    const deleteNote = () => {
      x.addEventListener("click", (event) => {
        console.log("x clicked");
        notes.splice(index, 1);
        populateNotesDiv();
      });
    }
    deleteNote();

    //Update note
    //When user clicks 'Edit' button on existing note
    const updateNote = () => {
      e.addEventListener("click", (event) => {
        input.value = note;
        console.log("notes", note);
        notes.with(index, note);
        notes.splice(index, 1);
      });

    }
    updateNote();
    //Note text appears in input
    //Set value of p to input.value
    //Remove target note
    //Run delete function for that index
    //Note text updates when user presses submit
    //Run handleSubmit with current value of input (p) as parameter of addNote function
  }
  saveNotes();
}

const addNote = (newNote) => {
  notes.push(newNote);
  populateNotesDiv();
}

//const updateNote = (index) => {
//  const p = document.createElement("p")


//}

const handleSubmit = (event) => {
  event.preventDefault();
  const text = input.value;
  addNote(text);
}

form.addEventListener("submit", handleSubmit)

populateNotesDiv();


//document.querySelector('.submit-btn').addEventListener('click', () => {
//  const content = document.querySelector('.note-text').value;
//  console.log("Submit button clicked");
//  console.log(content);

//  const noteHTML = `<p>${content}</p>`;
//  document.getElementById('note').innerHTML = noteHTML;
//  console.log(noteHTML);
//  console.log("endOfTheRoad");
//});

//let noteHTML = '';

//document.querySelector('.submit-btn').addEventListener('click', () => {
//  let noteHTML = '<p>';
//  const content = document.querySelector('.note-text').value;
//  noteHTML += `<p>${content}</p>`;
//  document.getElementById('note-list').innerHTML = noteHTML;
//});