import { getNote, saveNote, deleteNote } from './local-db.js';
import { confirmDialog } from './confirm-dialog.js';
import { rememberLocation, getDraft, setDraft, clearDraft } from './tab-state.js';

const notFound = document.querySelector("#note-not-found");
const noteView = document.querySelector("#note-view");
const noteText = document.querySelector("#note-text");
const noteDate = document.querySelector("#note-date");
const editBtn = document.querySelector("#note-edit-btn");

const editForm = document.querySelector("#note-edit-form");
const editInput = document.querySelector("#note-edit-input");
const deleteBtn = document.querySelector("#note-delete-btn");
const cancelBtn = document.querySelector("#note-cancel-btn");
const deleteDialog = document.querySelector("#delete-dialog");

const params = new URLSearchParams(window.location.search);
const noteId = params.get('id');
const startInEditMode = params.has('edit');
let currentNote = null;

const formatNoteDate = (timestamp) => {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
}

//Mirrors edit mode in the URL (?edit) so the Notes tab can return the user to it
const setEditParam = (editing) => {
  const url = new URL(window.location);
  if (editing) {
    url.searchParams.set('edit', '');
  } else {
    url.searchParams.delete('edit');
  }
  window.history.replaceState({}, '', url);
  rememberLocation();
}

const showView = () => {
  noteText.innerText = currentNote.text;
  noteDate.textContent = formatNoteDate(currentNote.createdAt);
  editForm.hidden = true;
  noteView.hidden = false;
  setEditParam(false);
}

const showEdit = () => {
  editInput.value = getDraft('note', currentNote.id) ?? currentNote.text;
  noteView.hidden = true;
  editForm.hidden = false;
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  setEditParam(true);
}

//Leaving edit mode without saving discards the draft
const cancelEdit = () => {
  clearDraft('note', currentNote.id);
  showView();
}

editBtn.addEventListener("click", showEdit);

cancelBtn.addEventListener("click", cancelEdit);

editForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cancelEdit();
});

editInput.addEventListener("input", () => {
  setDraft('note', currentNote.id, editInput.value);
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newText = editInput.value.trim();
  if (!newText) return;
  currentNote = { ...currentNote, text: newText };
  await saveNote(currentNote);
  clearDraft('note', currentNote.id);
  showView();
});

deleteBtn.addEventListener("click", async () => {
  if (!(await confirmDialog(deleteDialog))) return;
  await deleteNote(currentNote.id);
  clearDraft('note', currentNote.id);
  window.location.href = "notes.html";
});

const loadNote = async () => {
  currentNote = noteId ? await getNote(noteId) : null;
  if (!currentNote) {
    notFound.hidden = false;
    return;
  }
  if (startInEditMode) {
    showEdit();
  } else {
    showView();
  }
}

loadNote();
