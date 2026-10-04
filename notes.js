import { getAllNotes, saveNote } from './local-db.js';
import { verseIdsCitedIn } from './verse-links.js';
import { stripMarkdown, enhanceNoteEditor } from './note-markdown.js';

const newNoteBtn = document.querySelector("#new-note-btn");
const newNoteForm = document.querySelector("#new-note-form");
const newNoteInput = document.querySelector("#new-note-input");
const newNoteCancelBtn = document.querySelector("#new-note-cancel-btn");
const noteListDiv = document.querySelector("#note-list");

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

const populateNotesDiv = async () => {
  const notes = await getAllNotes();
  noteListDiv.innerHTML = "";
  const template = document.querySelector("#note-template");

  for (const note of notes) {
    const noteElement = template.content.cloneNode(true);
    const noteLink = noteElement.querySelector(".card-tile--entry");
    const p = noteElement.querySelector(".card-preview-text");
    const dateEl = noteElement.querySelector(".card-date");

    noteLink.href = `note-view.html?id=${encodeURIComponent(note.id)}`;
    p.innerText = stripMarkdown(note.text);
    dateEl.textContent = formatNoteDate(note.createdAt);

    noteListDiv.append(noteElement);
  }
}

enhanceNoteEditor(newNoteInput);

newNoteBtn.addEventListener("click", showNewNoteForm);

newNoteCancelBtn.addEventListener("click", hideNewNoteForm);

newNoteForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideNewNoteForm();
});

newNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = newNoteInput.value.trim();
  if (!text) return;
  await saveNote({ text, verseIds: (await verseIdsCitedIn(text)) ?? [] });
  populateNotesDiv();
  hideNewNoteForm();
});

populateNotesDiv();
