import { getAllNotes, saveNote, deleteNote } from './local-db.js';

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

let currentNote = null;

const openModal = (note) => {
  currentNote = note;
  modalNoteText.innerText = note.text;
  modalInput.value = note.text;
  modalForm.hidden = true;
  modal.showModal();
}

const closeModal = () => {
  currentNote = null;
  modal.close();
  modalForm.hidden = true;
}

const populateNotesDiv = async () => {
  const notes = await getAllNotes();
  notesDiv.innerHTML = "";
  const template = document.querySelector("#note-template");

  for (const note of notes) {
    const noteElement = template.content.cloneNode(true);
    const noteButton = noteElement.querySelector(".note");
    const p = noteElement.querySelector("p");

    p.innerText = note.text;

    noteButton.addEventListener("click", () => {
      openModal(note);
    });

    notesDiv.append(noteElement);
  }
}

const addNote = async (text) => {
  await saveNote({ text });
  populateNotesDiv();
}

const handleSubmit = (event) => {
  event.preventDefault();
  const text = input.value;
  addNote(text);
  input.value = "";
}

form.addEventListener("submit", handleSubmit)

modalExitBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

modalDeleteBtn.addEventListener("click", async () => {
  await deleteNote(currentNote.id);
  populateNotesDiv();
  closeModal();
});

modalEditBtn.addEventListener("click", () => {
  modalInput.value = modalNoteText.innerText;
  modalForm.hidden = false;
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newText = modalInput.value;
  currentNote = { ...currentNote, text: newText };
  await saveNote(currentNote);
  populateNotesDiv();
  modalNoteText.innerText = newText;
  modalForm.hidden = true;
});

populateNotesDiv();
