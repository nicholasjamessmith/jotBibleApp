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
  const notesJSON = localStorage.getItem("notes");
  return notesJSON ? JSON.parse(notesJSON) : [];
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