import { getFlashcard, saveFlashcard, deleteFlashcard } from './local-db.js';

const notFound = document.querySelector("#card-not-found");
const cardView = document.querySelector("#card-view");
const cardFlip = document.querySelector("#card-flip");
const cardReference = document.querySelector("#card-reference");
const cardScripture = document.querySelector("#card-scripture");
const editBtn = document.querySelector("#card-edit-btn");

const editForm = document.querySelector("#card-edit-form");
const editSideA = document.querySelector("#card-edit-side-a");
const editSideB = document.querySelector("#card-edit-side-b");
const deleteBtn = document.querySelector("#card-delete-btn");
const cancelBtn = document.querySelector("#card-cancel-btn");

const cardId = new URLSearchParams(window.location.search).get('id');
let currentCard = null;

const showView = () => {
  cardReference.textContent = currentCard.reference;
  cardScripture.textContent = currentCard.scripture;
  cardFlip.classList.remove("is-flipped");
  editForm.hidden = true;
  cardView.hidden = false;
}

const showEdit = () => {
  editSideA.value = currentCard.reference;
  editSideB.value = currentCard.scripture;
  cardView.hidden = true;
  editForm.hidden = false;
  editSideA.focus();
}

cardFlip.addEventListener("click", () => {
  cardFlip.classList.toggle("is-flipped");
});

editBtn.addEventListener("click", showEdit);

cancelBtn.addEventListener("click", showView);

editForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") showView();
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newReference = editSideA.value.trim();
  const newScripture = editSideB.value.trim();
  if (!newReference || !newScripture) return;
  currentCard = { ...currentCard, reference: newReference, scripture: newScripture };
  await saveFlashcard(currentCard);
  showView();
});

deleteBtn.addEventListener("click", async () => {
  if (!confirm("Delete this flashcard?")) return;
  await deleteFlashcard(currentCard.id);
  window.location.href = "study.html";
});

const loadCard = async () => {
  currentCard = cardId ? await getFlashcard(cardId) : null;
  if (!currentCard) {
    notFound.hidden = false;
    return;
  }
  showView();
}

loadCard();
