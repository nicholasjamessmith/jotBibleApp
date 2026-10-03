import { getNote, saveNote, deleteNote } from './local-db.js';

const notFound = document.querySelector("#note-not-found");
const noteView = document.querySelector("#note-view");
const noteText = document.querySelector("#note-text");
const noteDate = document.querySelector("#note-date");
const editBtn = document.querySelector("#note-edit-btn");

const editForm = document.querySelector("#note-edit-form");
const editInput = document.querySelector("#note-edit-input");
const deleteBtn = document.querySelector("#note-delete-btn");
const cancelBtn = document.querySelector("#note-cancel-btn");

const noteId = new URLSearchParams(window.location.search).get('id');
let currentNote = null;

const formatNoteDate = (timestamp) => {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
}

const showView = () => {
  noteText.innerText = currentNote.text;
  noteDate.textContent = formatNoteDate(currentNote.createdAt);
  editForm.hidden = true;
  noteView.hidden = false;
}

const showEdit = () => {
  editInput.value = currentNote.text;
  noteView.hidden = true;
  editForm.hidden = false;
  editInput.focus();
}

editBtn.addEventListener("click", showEdit);

cancelBtn.addEventListener("click", showView);

editForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") showView();
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newText = editInput.value.trim();
  if (!newText) return;
  currentNote = { ...currentNote, text: newText };
  await saveNote(currentNote);
  showView();
});

deleteBtn.addEventListener("click", async () => {
  if (!confirm("Delete this note?")) return;
  await deleteNote(currentNote.id);
  window.location.href = "notes.html";
});

const loadNote = async () => {
  currentNote = noteId ? await getNote(noteId) : null;
  if (!currentNote) {
    notFound.hidden = false;
    return;
  }
  showView();
}

loadNote();
