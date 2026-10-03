import { getAllFlashcards, saveFlashcard } from './local-db.js';

const newCardBtn = document.querySelector("#new-card-btn");
const newCardForm = document.querySelector("#new-card-form");
const newCardSideA = document.querySelector("#new-card-side-a");
const newCardSideB = document.querySelector("#new-card-side-b");
const newCardCancelBtn = document.querySelector("#new-card-cancel-btn");
const cardListDiv = document.querySelector("#card-list");

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

const populateCardsDiv = async () => {
  const cards = await getAllFlashcards();
  cardListDiv.innerHTML = "";
  const template = document.querySelector("#card-template");

  for (const card of cards) {
    const cardElement = template.content.cloneNode(true);
    const cardLink = cardElement.querySelector(".card-tile--entry");
    const referenceEl = cardElement.querySelector(".flashcard-reference");

    cardLink.href = `flashcard-view.html?id=${encodeURIComponent(card.id)}`;
    referenceEl.textContent = card.reference;

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

populateCardsDiv();
