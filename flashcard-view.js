import { getFlashcard, saveFlashcard, deleteFlashcard } from './local-db.js';
import { confirmDialog } from './confirm-dialog.js';
import { rememberLocation, getDraft, setDraft, clearDraft } from './tab-state.js';
import { findCitations, citationHref, verseIdsCitedIn } from './verse-links.js';

const notFound = document.querySelector("#card-not-found");
const cardView = document.querySelector("#card-view");
const cardFlip = document.querySelector("#card-flip");
const cardReference = document.querySelector("#card-reference");
const cardScripture = document.querySelector("#card-scripture");
const editBtn = document.querySelector("#card-edit-btn");
const readerLink = document.querySelector("#card-reader-link");

const editForm = document.querySelector("#card-edit-form");
const editSideA = document.querySelector("#card-edit-side-a");
const editSideB = document.querySelector("#card-edit-side-b");
const deleteBtn = document.querySelector("#card-delete-btn");
const cancelBtn = document.querySelector("#card-cancel-btn");
const deleteDialog = document.querySelector("#delete-dialog");

const params = new URLSearchParams(window.location.search);
const cardId = params.get('id');
const startInEditMode = params.has('edit');
let currentCard = null;

//Mirrors edit mode in the URL (?edit) so the Study tab can return the user to it
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

//"Open <reference> in reader" link below the card - the card itself is a flip <button>,
//which can't contain a link
const updateReaderLink = async () => {
  readerLink.hidden = true;
  const reference = currentCard.reference;
  const citations = await findCitations(reference);
  if (!citations || citations.length === 0) return;
  if (currentCard.reference !== reference) return; // card was edited while books loaded
  readerLink.href = citationHref(citations[0]);
  readerLink.textContent = `Open ${citations[0].text} in reader →`;
  readerLink.hidden = false;
}

const showView = () => {
  cardReference.textContent = currentCard.reference;
  cardScripture.textContent = currentCard.scripture;
  updateReaderLink();
  cardFlip.classList.remove("is-flipped");
  editForm.hidden = true;
  cardView.hidden = false;
  setEditParam(false);
}

const showEdit = () => {
  const draft = getDraft('flashcard', currentCard.id);
  editSideA.value = draft?.reference ?? currentCard.reference;
  editSideB.value = draft?.scripture ?? currentCard.scripture;
  cardView.hidden = true;
  editForm.hidden = false;
  editSideA.focus();
  setEditParam(true);
}

//Leaving edit mode without saving discards the draft
const cancelEdit = () => {
  clearDraft('flashcard', currentCard.id);
  showView();
}

const saveDraft = () => {
  setDraft('flashcard', currentCard.id, { reference: editSideA.value, scripture: editSideB.value });
}

cardFlip.addEventListener("click", () => {
  cardFlip.classList.toggle("is-flipped");
});

editBtn.addEventListener("click", showEdit);

cancelBtn.addEventListener("click", cancelEdit);

editForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cancelEdit();
});

editSideA.addEventListener("input", saveDraft);
editSideB.addEventListener("input", saveDraft);

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newReference = editSideA.value.trim();
  const newScripture = editSideB.value.trim();
  if (!newReference || !newScripture) return;
  //Re-link to whatever the card now cites (keeps old links if books couldn't be loaded)
  const verseIds = (await verseIdsCitedIn(`${newReference}\n${newScripture}`)) ?? currentCard.verseIds;
  currentCard = { ...currentCard, reference: newReference, scripture: newScripture, verseIds };
  await saveFlashcard(currentCard);
  clearDraft('flashcard', currentCard.id);
  showView();
});

deleteBtn.addEventListener("click", async () => {
  if (!(await confirmDialog(deleteDialog))) return;
  await deleteFlashcard(currentCard.id);
  clearDraft('flashcard', currentCard.id);
  window.location.href = "study.html";
});

const loadCard = async () => {
  currentCard = cardId ? await getFlashcard(cardId) : null;
  if (!currentCard) {
    notFound.hidden = false;
    return;
  }
  if (startInEditMode) {
    showEdit();
  } else {
    showView();
  }
}

loadCard();
