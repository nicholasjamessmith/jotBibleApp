import { getAllNotes, saveNote, deleteNote } from './local-db.js';

const newNoteBtn = document.querySelector("#new-note-btn");
const newNoteForm = document.querySelector("#new-note-form");
const newNoteInput = document.querySelector("#new-note-input");
const newNoteCancelBtn = document.querySelector("#new-note-cancel-btn");
const noteListDiv = document.querySelector("#note-list");

const viewModal = document.querySelector("#view-modal");
const viewModalCloseBtn = document.querySelector("#view-modal-close-btn");
const viewModalText = document.querySelector("#view-modal-text");
const viewModalEditBtn = document.querySelector("#view-modal-edit-btn");

const modal = document.querySelector("#modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalForm = document.querySelector("#modal-form");
const modalInput = document.querySelector("#modal-input");
const modalDeleteBtn = document.querySelector("#modal-delete-btn");

let currentNote = null;

const formatNoteDate = (timestamp) => {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

const showNewNoteForm = () => {
  newNoteBtn.hidden = true;
  newNoteForm.hidden = false;
  newNoteInput.focus();
}

const hideNewNoteForm = () => {
  newNoteForm.hidden = true;
  newNoteBtn.hidden = false;
  newNoteForm.reset();
}

const openViewModal = (note) => {
  currentNote = note;
  viewModalText.innerText = note.text;
  viewModal.showModal();
}

const closeViewModal = () => {
  currentNote = null;
  viewModal.close();
}

const openEditModal = (note) => {
  currentNote = note;
  modalInput.value = note.text;
  modal.showModal();
}

const closeModal = () => {
  currentNote = null;
  modal.close();
}

const populateNotesDiv = async () => {
  const notes = await getAllNotes();
  noteListDiv.innerHTML = "";
  const template = document.querySelector("#note-template");

  for (const note of notes) {
    const noteElement = template.content.cloneNode(true);
    const noteButton = noteElement.querySelector(".card-tile--entry");
    const p = noteElement.querySelector(".card-preview-text");
    const dateEl = noteElement.querySelector(".card-date");

    p.innerText = note.text;
    dateEl.textContent = formatNoteDate(note.createdAt);

    noteButton.addEventListener("click", () => {
      openViewModal(note);
    });

    noteListDiv.append(noteElement);
  }
}

newNoteBtn.addEventListener("click", showNewNoteForm);

newNoteCancelBtn.addEventListener("click", hideNewNoteForm);

newNoteForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideNewNoteForm();
});

newNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = newNoteInput.value.trim();
  if (!text) return;
  await saveNote({ text });
  populateNotesDiv();
  hideNewNoteForm();
});

viewModalCloseBtn.addEventListener("click", closeViewModal);

viewModal.addEventListener("click", (e) => {
  if (e.target === viewModal) closeViewModal();
});

viewModalEditBtn.addEventListener("click", () => {
  const note = currentNote;
  closeViewModal();
  openEditModal(note);
});

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

modalDeleteBtn.addEventListener("click", async () => {
  await deleteNote(currentNote.id);
  populateNotesDiv();
  closeModal();
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newText = modalInput.value.trim();
  if (!newText) return;
  currentNote = { ...currentNote, text: newText };
  await saveNote(currentNote);
  populateNotesDiv();
  closeModal();
});

populateNotesDiv();
