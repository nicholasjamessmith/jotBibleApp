const input = document.querySelector("textarea#note-input");
const form = document.querySelector("#form");
const notesDiv = document.querySelector("#notes");

const modal = document.querySelector("#modal");
const modalNoteText = document.querySelector("#modal-note-text");
const modalInput = document.querySelector("#modal-input");
const modalForm = document.querySelector("#modal-form");
const modalEditBtn = document.querySelector("#modal-edit-btn");
const modalDeleteBtn = document.querySelector("#modal-delete-btn");
const modalExitBtn = document.querySelector("#modal-exit-btn");

let currentNoteIndex = null;

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

const openModal = (note, index) => {
  currentNoteIndex = index;
  modalNoteText.innerText = note;
  modalInput.value = note;
  modalForm.hidden = true;
  modal.showModal();
}

const closeModal = () => {
  currentNoteIndex = null;
  modal.close();
  modalForm.hidden = true;
}

const populateNotesDiv = () => {
  notesDiv.innerHTML = "";
  const template = document.querySelector("#note-template");

  for (const note of notes) {
    const noteElement = template.content.cloneNode(true);
    const noteButton = noteElement.querySelector(".note");
    const p = noteElement.querySelector("p");

    p.innerText = note;

    const index = notes.indexOf(note);

    noteButton.addEventListener("click", () => {
      openModal(note, index);
    });

    notesDiv.append(noteElement);
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

modalExitBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

modalDeleteBtn.addEventListener("click", () => {
  notes.splice(currentNoteIndex, 1);
  saveNotes();
  populateNotesDiv();
  closeModal();
});

modalEditBtn.addEventListener("click", () => {
  modalInput.value = modalNoteText.innerText;
  modalForm.hidden = false;
});

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newText = modalInput.value;
  notes[currentNoteIndex] = newText;
  saveNotes();
  populateNotesDiv();
  modalNoteText.innerText = newText;
  modalForm.hidden = true;
});

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