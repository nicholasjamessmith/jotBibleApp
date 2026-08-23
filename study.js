import { getAllFlashcards, saveFlashcard, deleteFlashcard } from './local-db.js';

const sideAInput = document.querySelector("#side-a-input");
const sideBInput = document.querySelector("#side-b-input");
const form = document.querySelector(".card-form");
const cardsDiv = document.querySelector("#flashcards");

const modal = document.querySelector("#card-modal");
const modalLabel = document.querySelector("#card-modal-label");
const modalText = document.querySelector("#card-modal-text");
const modalForm = document.querySelector("#card-modal-form");
const modalSideAInput = document.querySelector("#card-modal-side-a");
const modalSideBInput = document.querySelector("#card-modal-side-b");
const flipBtn = document.querySelector("#card-flip-btn");
const editBtn = document.querySelector("#card-edit-btn");
const deleteBtn = document.querySelector("#card-delete-btn");
const exitBtn = document.querySelector("#card-exit-btn");

let currentCard = null;
let showingSideA = true;

const renderModalSide = (card) => {
  if (showingSideA) {
    modalLabel.innerText = "Reference";
    modalText.innerText = card.reference;
  } else {
    modalLabel.innerText = "Scripture";
    modalText.innerText = card.scripture;
  }
}

const openModal = (card) => {
  currentCard = card;
  showingSideA = true;
  renderModalSide(card);
  modalForm.hidden = true;
  modal.showModal();
}

const closeModal = () => {
  currentCard = null;
  modal.close();
  modalForm.hidden = true;
}

const populateCardsDiv = async () => {
  const cards = await getAllFlashcards();
  cardsDiv.innerHTML = "";
  const template = document.querySelector("#card-template");

  for (const card of cards) {
    const cardElement = template.content.cloneNode(true);
    const cardButton = cardElement.querySelector(".flashcard");
    const p = cardElement.querySelector(".flashcard-reference");

    p.innerText = card.reference;

    cardButton.addEventListener("click", () => {
      openModal(card);
    });

    cardsDiv.append(cardElement);
  }
}

const addCard = async (reference, scripture) => {
  await saveFlashcard({ reference, scripture });
  populateCardsDiv();
}

const handleSubmit = (event) => {
  event.preventDefault();
  const reference = sideAInput.value;
  const scripture = sideBInput.value;
  addCard(reference, scripture);
  sideAInput.value = "";
  sideBInput.value = "";
}

form.addEventListener("submit", handleSubmit);

flipBtn.addEventListener("click", () => {
  showingSideA = !showingSideA;
  renderModalSide(currentCard);
});

exitBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

deleteBtn.addEventListener("click", async () => {
  await deleteFlashcard(currentCard.id);
  populateCardsDiv();
  closeModal();
});

editBtn.addEventListener("click", () => {
  modalSideAInput.value = currentCard.reference;
  modalSideBInput.value = currentCard.scripture;
  modalForm.hidden = false;
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newReference = modalSideAInput.value;
  const newScripture = modalSideBInput.value;
  currentCard = { ...currentCard, reference: newReference, scripture: newScripture };
  await saveFlashcard(currentCard);
  populateCardsDiv();
  renderModalSide(currentCard);
  modalForm.hidden = true;
});

populateCardsDiv();
