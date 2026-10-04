import { getAllNotes, saveNote } from './local-db.js';
import { verseIdsCitedIn } from './verse-links.js';
import { stripMarkdown, enhanceNoteEditor } from './note-markdown.js';
import { rememberLocation } from './tab-state.js';

const newNoteBtn = document.querySelector("#new-note-btn");
const newNoteForm = document.querySelector("#new-note-form");
const newNoteInput = document.querySelector("#new-note-input");
const newNoteCancelBtn = document.querySelector("#new-note-cancel-btn");
const noteListDiv = document.querySelector("#note-list");
const pager = document.querySelector(".note-pager");
const prevBtn = document.querySelector(".pager-prev");
const nextBtn = document.querySelector(".pager-next");
const pagerStatus = document.querySelector(".pager-status");

//Carousel paging - notes are split into slides of NOTES_PER_PAGE stacked vertically, and
//#note-list slides between them. The page lives in the URL (?page=2) so returning from a
//note, or via the Notes tab, lands on the same page.
const NOTES_PER_PAGE = 5;
let currentPage = 0;
let pageCount = 1;

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

const pageFromUrl = () => {
  const page = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
}

const goToPage = (page) => {
  currentPage = Math.min(Math.max(page, 0), pageCount - 1);
  noteListDiv.style.transform = `translateX(-${currentPage * 100}%)`;

  //Off-screen slides are inert so Tab never lands on a note you can't see
  [...noteListDiv.children].forEach((slide, i) => {
    slide.inert = i !== currentPage;
  });

  const paged = pageCount > 1;
  prevBtn.hidden = !paged;
  nextBtn.hidden = !paged;
  pagerStatus.hidden = !paged;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage === pageCount - 1;
  pagerStatus.textContent = `Page ${currentPage + 1} of ${pageCount}`;

  const url = new URL(window.location);
  if (currentPage === 0) {
    url.searchParams.delete('page');
  } else {
    url.searchParams.set('page', currentPage + 1);
  }
  window.history.replaceState({}, '', url);
  rememberLocation();
}

const populateNotesDiv = async (page = currentPage) => {
  const notes = await getAllNotes();
  noteListDiv.innerHTML = "";
  const template = document.querySelector("#note-template");
  pageCount = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));

  let slide = null;
  for (const [i, note] of notes.entries()) {
    if (i % NOTES_PER_PAGE === 0) {
      slide = document.createElement("div");
      slide.className = "note-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `Page ${i / NOTES_PER_PAGE + 1} of ${pageCount}`);
      noteListDiv.append(slide);
    }
    const noteElement = template.content.cloneNode(true);
    const noteLink = noteElement.querySelector(".card-tile--entry");
    const p = noteElement.querySelector(".card-preview-text");
    const dateEl = noteElement.querySelector(".card-date");

    noteLink.href = `note-view.html?id=${encodeURIComponent(note.id)}`;
    p.innerText = stripMarkdown(note.text);
    dateEl.textContent = formatNoteDate(note.createdAt);

    slide.append(noteElement);
  }
  goToPage(page);
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
  populateNotesDiv(0); // the new note is the most recent, so it's first on page 1
  hideNewNoteForm();
});

prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
nextBtn.addEventListener("click", () => goToPage(currentPage + 1));

//Left/Right arrow keys page while focus is in the list (not while typing elsewhere)
pager.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") goToPage(currentPage - 1);
  if (e.key === "ArrowRight") goToPage(currentPage + 1);
});

//Swipe left/right on touch screens - only clearly horizontal swipes, so vertical scrolling is untouched
let touchStart = null;
pager.addEventListener("touchstart", (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
pager.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  goToPage(currentPage + (dx < 0 ? 1 : -1));
});

populateNotesDiv(pageFromUrl());
