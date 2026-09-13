import { getAllFlashcards, saveFlashcard, deleteFlashcard } from './local-db.js';

const newCardBtn = document.querySelector("#new-card-btn");
const newCardForm = document.querySelector("#new-card-form");
const newCardSideA = document.querySelector("#new-card-side-a");
const newCardSideB = document.querySelector("#new-card-side-b");
const newCardCancelBtn = document.querySelector("#new-card-cancel-btn");
const cardListDiv = document.querySelector("#card-list");

const viewModal = document.querySelector("#view-modal");
const viewModalCloseBtn = document.querySelector("#view-modal-close-btn");
const viewModalFlip = document.querySelector("#view-modal-flip");
const viewModalReference = document.querySelector("#view-modal-reference");
const viewModalScripture = document.querySelector("#view-modal-scripture");
const viewModalEditBtn = document.querySelector("#view-modal-edit-btn");

const modal = document.querySelector("#card-modal");
const modalCloseBtn = document.querySelector("#card-modal-close-btn");
const modalForm = document.querySelector("#card-modal-form");
const modalSideAInput = document.querySelector("#card-modal-side-a");
const modalSideBInput = document.querySelector("#card-modal-side-b");
const deleteBtn = document.querySelector("#card-delete-btn");

let currentCard = null;

const showNewCardForm = () => {
  newCardBtn.hidden = true;
  newCardForm.hidden = false;
  newCardSideA.focus();
}

const hideNewCardForm = () => {
  newCardForm.hidden = true;
  newCardBtn.hidden = false;
  newCardForm.reset();
}

const openViewModal = (card) => {
  currentCard = card;
  viewModalReference.textContent = card.reference;
  viewModalScripture.textContent = card.scripture;
  viewModalFlip.classList.remove("is-flipped");
  viewModal.showModal();
}

const closeViewModal = () => {
  currentCard = null;
  viewModal.close();
}

const openEditModal = (card) => {
  currentCard = card;
  modalSideAInput.value = card.reference;
  modalSideBInput.value = card.scripture;
  modal.showModal();
}

const closeModal = () => {
  currentCard = null;
  modal.close();
}

const populateCardsDiv = async () => {
  const cards = await getAllFlashcards();
  cardListDiv.innerHTML = "";
  const template = document.querySelector("#card-template");

  for (const card of cards) {
    const cardElement = template.content.cloneNode(true);
    const cardButton = cardElement.querySelector(".card-tile--entry");
    const referenceEl = cardElement.querySelector(".flashcard-reference");

    referenceEl.textContent = card.reference;

    cardButton.addEventListener("click", () => {
      openViewModal(card);
    });

    cardListDiv.append(cardElement);
  }
}

newCardBtn.addEventListener("click", showNewCardForm);

newCardCancelBtn.addEventListener("click", hideNewCardForm);

newCardForm.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideNewCardForm();
});

newCardForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reference = newCardSideA.value.trim();
  const scripture = newCardSideB.value.trim();
  if (!reference || !scripture) return;
  await saveFlashcard({ reference, scripture });
  populateCardsDiv();
  hideNewCardForm();
});

viewModalFlip.addEventListener("click", () => {
  viewModalFlip.classList.toggle("is-flipped");
});

viewModalCloseBtn.addEventListener("click", closeViewModal);

viewModal.addEventListener("click", (e) => {
  if (e.target === viewModal) closeViewModal();
});

viewModalEditBtn.addEventListener("click", () => {
  const card = currentCard;
  closeViewModal();
  openEditModal(card);
});

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

deleteBtn.addEventListener("click", async () => {
  await deleteFlashcard(currentCard.id);
  populateCardsDiv();
  closeModal();
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newReference = modalSideAInput.value.trim();
  const newScripture = modalSideBInput.value.trim();
  currentCard = { ...currentCard, reference: newReference, scripture: newScripture };
  await saveFlashcard(currentCard);
  populateCardsDiv();
  closeModal();
});

populateCardsDiv();
