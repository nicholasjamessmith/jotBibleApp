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

let currentCardIndex = null;
let showingSideA = true;

//Loads all items in 'flashcards' item in localStorage
const loadCards = () => {
  const cardsJSON = localStorage.getItem("flashcards");
  return cardsJSON ? JSON.parse(cardsJSON) : [];
}

const cards = loadCards();

const saveCards = () => {
  const cardsJSON = JSON.stringify(cards);
  localStorage.setItem("flashcards", cardsJSON);
}

const renderModalSide = (card) => {
  if (showingSideA) {
    modalLabel.innerText = "Reference";
    modalText.innerText = card.reference;
  } else {
    modalLabel.innerText = "Scripture";
    modalText.innerText = card.scripture;
  }
}

const openModal = (card, index) => {
  currentCardIndex = index;
  showingSideA = true;
  renderModalSide(card);
  modalForm.hidden = true;
  modal.showModal();
}

const closeModal = () => {
  currentCardIndex = null;
  modal.close();
  modalForm.hidden = true;
}

const populateCardsDiv = () => {
  cardsDiv.innerHTML = "";
  const template = document.querySelector("#card-template");

  for (const card of cards) {
    const cardElement = template.content.cloneNode(true);
    const cardButton = cardElement.querySelector(".flashcard");
    const p = cardElement.querySelector(".flashcard-reference");

    p.innerText = card.reference;

    const index = cards.indexOf(card);

    cardButton.addEventListener("click", () => {
      openModal(card, index);
    });

    cardsDiv.append(cardElement);
  }
  saveCards();
}

const addCard = (reference, scripture) => {
  cards.push({ reference, scripture });
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
  renderModalSide(cards[currentCardIndex]);
});

exitBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

deleteBtn.addEventListener("click", () => {
  cards.splice(currentCardIndex, 1);
  saveCards();
  populateCardsDiv();
  closeModal();
});

editBtn.addEventListener("click", () => {
  const card = cards[currentCardIndex];
  modalSideAInput.value = card.reference;
  modalSideBInput.value = card.scripture;
  modalForm.hidden = false;
});

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newReference = modalSideAInput.value;
  const newScripture = modalSideBInput.value;
  cards[currentCardIndex] = { reference: newReference, scripture: newScripture };
  saveCards();
  populateCardsDiv();
  renderModalSide(cards[currentCardIndex]);
  modalForm.hidden = true;
});

populateCardsDiv();
